// Server-side Virtual Try-On provider — OpenAI gpt-image-1 image edit.
//
// Given the product's garment image + a style prompt, generates a photorealistic
// image of a model wearing that exact garment. Uses OpenAI's images/edits
// endpoint (multipart: the garment is uploaded as the input image). Returns the
// result as a data URI so the client can render it without CDN/remotePatterns
// config.
//
// Env (server-only; never exposed to the client):
//   OPENAI_API_KEY     — required to enable try-on
//   OPENAI_IMAGE_MODEL — default "gpt-image-1"
//   OPENAI_IMAGE_SIZE  — default "1024x1536" (portrait)

export type TryOnStatus = "ok" | "offline" | "invalid" | "error";

export interface TryOnResult {
  status: TryOnStatus;
  imageUrl?: string;
  message?: string;
}

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
export const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1536";

export function tryOnConfigured(): boolean {
  return OPENAI_API_KEY.trim().length > 0;
}

async function fetchImageBlob(
  url: string,
  fetcher: typeof fetch,
): Promise<Blob> {
  const res = await fetcher(url);
  if (!res.ok) {
    throw new Error(`Could not load garment image (${res.status})`);
  }
  const type = res.headers.get("content-type") || "image/png";
  return new Blob([await res.arrayBuffer()], { type });
}

async function callImageEdit(
  form: FormData,
  fetcher: typeof fetch,
): Promise<{ imageUrl: string }> {
  form.append("model", OPENAI_IMAGE_MODEL);
  form.append("size", OPENAI_IMAGE_SIZE);
  form.append("n", "1");

  const res = await fetcher("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI image edit failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = data.data?.[0];
  if (first?.b64_json) {
    return { imageUrl: `data:image/png;base64,${first.b64_json}` };
  }
  if (first?.url) {
    return { imageUrl: first.url };
  }
  throw new Error("OpenAI returned no image");
}

export interface RunTryOnInput {
  garmentImageUrl: string;
  stylePrompt: string;
  fetchImpl?: typeof fetch;
}

/** On-a-model: generates a model wearing the product's garment in a style. */
export async function runTryOn(input: RunTryOnInput): Promise<{ imageUrl: string }> {
  const fetcher = input.fetchImpl ?? fetch;
  const garment = await fetchImageBlob(input.garmentImageUrl, fetcher);

  const form = new FormData();
  form.append("image", garment, "garment.png");
  form.append(
    "prompt",
    `Generate a photorealistic, full-body fashion photograph of a model wearing this exact garment, ${input.stylePrompt}. ` +
      "Preserve the garment's design, colour, pattern, and proportions faithfully. " +
      "Show the whole outfit head to toe. No text or watermark.",
  );
  return callImageEdit(form, fetcher);
}

export interface RunTryOnPersonInput {
  garmentImageUrl: string;
  personBytes: ArrayBuffer;
  personType: string;
  fetchImpl?: typeof fetch;
}

/**
 * On-me: dresses the shopper (first image) in the product's garment (second
 * image). The person photo is processed in-memory only and never persisted.
 */
export async function runTryOnOnPerson(
  input: RunTryOnPersonInput,
): Promise<{ imageUrl: string }> {
  const fetcher = input.fetchImpl ?? fetch;
  const garment = await fetchImageBlob(input.garmentImageUrl, fetcher);

  const form = new FormData();
  // Order matters: the person is the image being edited; the garment is the
  // reference. gpt-image-1 accepts multiple inputs via repeated image[].
  form.append(
    "image[]",
    new Blob([input.personBytes], { type: input.personType || "image/png" }),
    "person.png",
  );
  form.append("image[]", garment, "garment.png");
  form.append(
    "prompt",
    "Edit the first image (a person) so they are wearing the exact garment shown in the second image. " +
      "Preserve the person's face, hair, skin tone, body shape, and pose; keep it photorealistic. " +
      "Reproduce the garment's design, colour, pattern, and proportions faithfully. No text or watermark.",
  );
  return callImageEdit(form, fetcher);
}

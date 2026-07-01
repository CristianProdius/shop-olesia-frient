// Server-side Virtual Try-On provider adapter.
//
// Vendor-agnostic surface (`runTryOn`) with a default implementation for a
// dedicated garment try-on API using the common async run + poll pattern
// (defaults to FASHN AI shapes). Swap the vendor by setting VTON_API_URL and,
// if the request/response shape differs, adjusting `startPrediction` /
// `pollPrediction` below — they are the only vendor-specific pieces.
//
// Required env to activate:
//   VTON_API_KEY  — the vendor API key (server-only; never exposed to client)
//   VTON_API_URL  — vendor base URL (default: https://api.fashn.ai/v1)

export type TryOnStatus = "ok" | "offline" | "invalid" | "error";

export interface TryOnResult {
  status: TryOnStatus;
  imageUrl?: string;
  message?: string;
}

export const VTON_API_KEY = process.env.VTON_API_KEY || "";
export const VTON_API_URL = process.env.VTON_API_URL || "https://api.fashn.ai/v1";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 40; // ~60s ceiling

export function tryOnConfigured(): boolean {
  return VTON_API_KEY.trim().length > 0;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RunTryOnInput {
  garmentImageUrl: string;
  modelImageUrl: string;
  fetchImpl?: typeof fetch;
}

/** Kicks off a prediction and returns its id (vendor-specific shape). */
async function startPrediction(
  input: RunTryOnInput,
  fetcher: typeof fetch,
): Promise<string> {
  const res = await fetcher(`${VTON_API_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VTON_API_KEY}`,
    },
    body: JSON.stringify({
      model_image: input.modelImageUrl,
      garment_image: input.garmentImageUrl,
      category: "auto",
    }),
  });
  if (!res.ok) {
    throw new Error(`Try-on start failed with ${res.status}`);
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Try-on start returned no prediction id");
  }
  return data.id;
}

/** Polls a prediction until it completes, returning the result image URL. */
async function pollPrediction(id: string, fetcher: typeof fetch): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const res = await fetcher(`${VTON_API_URL}/status/${id}`, {
      headers: { Authorization: `Bearer ${VTON_API_KEY}` },
    });
    if (!res.ok) {
      throw new Error(`Try-on status failed with ${res.status}`);
    }
    const data = (await res.json()) as {
      status?: string;
      output?: string[] | null;
      error?: unknown;
    };
    if (data.status === "completed") {
      const url = data.output?.[0];
      if (!url) throw new Error("Try-on completed without an output image");
      return url;
    }
    if (data.status === "failed" || data.error) {
      throw new Error("Try-on prediction failed");
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error("Try-on prediction timed out");
}

export async function runTryOn(input: RunTryOnInput): Promise<{ imageUrl: string }> {
  const fetcher = input.fetchImpl ?? fetch;
  const id = await startPrediction(input, fetcher);
  const imageUrl = await pollPrediction(id, fetcher);
  return { imageUrl };
}

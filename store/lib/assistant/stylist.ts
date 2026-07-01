import type { Product } from "@/types";

import { localizedField } from "../i18n-content";
import { getProductDetailsFromCatalog } from "./catalog";
import type {
  AssistantLocale,
  AssistantProductRecommendation,
} from "./types";

export const STYLIST_MAX_CATALOG = 48;
export const STYLIST_MAX_LOOK = 4;

function totalStock(product: Product): number {
  return (product.variants ?? []).reduce(
    (sum, variant) => sum + (variant.stockQty ?? 0),
    0,
  );
}

/**
 * Compact, model-facing catalog: one line per in-stock product, capped and with
 * excluded ids removed (used by "shuffle" to force a different look). Returns the
 * set of ids the model is allowed to pick from so we can validate its answer.
 */
export function buildCatalogDigest(
  products: Product[],
  locale: AssistantLocale,
  exclude: string[] = [],
): { digest: string; allowed: Set<string> } {
  const excluded = new Set(exclude);
  const inStock = products
    .filter((product) => totalStock(product) > 0 && !excluded.has(product.id))
    .slice(0, STYLIST_MAX_CATALOG);

  const allowed = new Set(inStock.map((product) => product.id));
  const digest = inStock
    .map((product) => {
      const name = localizedField(product.nameI18n, locale, product.name);
      const category = localizedField(
        product.category?.nameI18n,
        locale,
        product.category?.name ?? "",
      );
      return `${product.id} | ${name} | ${category || "—"} | ${product.price} MDL`;
    })
    .join("\n");

  return { digest, allowed };
}

export function buildStylistPrompt(locale: AssistantLocale): string {
  return [
    "You are the LILETTI personal stylist for a premium Moldovan womenswear house.",
    `Answer in ${locale}.`,
    "Compose ONE cohesive head-to-toe look for the shopper's occasion using ONLY items from the provided catalog.",
    "Prefer 2 to 4 pieces that span different categories (e.g. a dress or top+bottom, plus an outer layer or accessory) and work together in colour, formality, and season.",
    "Use only product ids that appear in the catalog. Never invent ids, prices, or stock.",
    "Give the look a short evocative title (max 6 words) and a 1-2 sentence rationale referencing why the pieces work together.",
    'Return only compact JSON: {"title": string, "rationale": string, "productIds": string[]}.',
  ].join("\n");
}

type StylistModelJson = {
  title?: unknown;
  rationale?: unknown;
  productIds?: unknown;
};

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export function parseStylistJson(text: string): {
  title: string;
  rationale: string;
  productIds: string[];
} {
  const parsed = JSON.parse(extractJsonText(text)) as StylistModelJson;
  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const rationale =
    typeof parsed.rationale === "string" ? parsed.rationale.trim() : "";
  const productIds = Array.isArray(parsed.productIds)
    ? parsed.productIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  return { title, rationale, productIds };
}

function responseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const content = (payload as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((block) =>
      block &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
        ? (block as { text: string }).text
        : "",
    )
    .join("");
}

export interface GenerateStylistInput {
  apiKey: string;
  model: string;
  locale: AssistantLocale;
  occasion: string;
  products: Product[];
  exclude?: string[];
  fetchImpl?: typeof fetch;
}

/**
 * Asks the model to compose a look, then validates and hydrates the chosen ids
 * against the real catalog (so only in-stock, allowed products survive).
 */
export async function generateStylistLook(
  input: GenerateStylistInput,
): Promise<{
  title: string;
  rationale: string;
  products: AssistantProductRecommendation[];
}> {
  const { digest, allowed } = buildCatalogDigest(
    input.products,
    input.locale,
    input.exclude,
  );

  if (allowed.size === 0) {
    throw new Error("Stylist has no in-stock catalog to work with");
  }

  const fetcher = input.fetchImpl ?? fetch;
  const res = await fetcher("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 600,
      system: buildStylistPrompt(input.locale),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            occasion: input.occasion || "an elevated everyday look",
            catalog: digest,
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Stylist provider failed with ${res.status}`);
  }

  const parsed = parseStylistJson(responseText(await res.json()));
  const validIds = parsed.productIds
    .filter((id) => allowed.has(id))
    .slice(0, STYLIST_MAX_LOOK);

  const products = getProductDetailsFromCatalog(
    input.products,
    validIds,
    input.locale,
  );

  if (products.length === 0) {
    throw new Error("Stylist returned no usable products");
  }

  return { title: parsed.title, rationale: parsed.rationale, products };
}

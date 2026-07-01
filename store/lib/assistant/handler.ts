import type { ContentBlock, Faq, Order, Product } from "@/types";

import {
  ASSISTANT_API_KEY,
  ASSISTANT_MODEL,
  assistantConfigured,
  fallbackMessage,
  getAssistantRuntimeConfig,
  normalizeAssistantLocale,
} from "./config";
import { searchProductsFromCatalog } from "./catalog";
import { searchStoreKnowledge } from "./content";
import {
  extractGuestLookupFields,
  fetchGuestOrder,
  shapeOrderSummaries,
  signedOutOrderMessage,
} from "./orders";
import { sanitizeMessages } from "./prompt";
import { generateAssistantText } from "./provider";
import type {
  AssistantContext,
  AssistantOrderSummary,
  AssistantRequestPayload,
  AssistantResponse,
} from "./types";

export interface AssistantDeps {
  apiKey?: string;
  model: string;
  customerId: string | null;
  loadProducts: () => Promise<Product[]>;
  loadFaqs: () => Promise<Faq[]>;
  loadContentBlocks: () => Promise<ContentBlock[]>;
  loadSignedInOrders: (customerId: string) => Promise<Order[]>;
  generate: (input: {
    apiKey: string;
    model: string;
    latestUserMessage: string;
    context: AssistantContext;
    response: Omit<AssistantResponse, "message" | "followups">;
  }) => Promise<Pick<AssistantResponse, "status" | "message" | "products" | "sources" | "orders" | "followups">>;
}

export function createDefaultAssistantDeps(input: {
  customerId: string | null;
  loadProducts: () => Promise<Product[]>;
  loadFaqs: () => Promise<Faq[]>;
  loadContentBlocks: () => Promise<ContentBlock[]>;
  loadSignedInOrders: (customerId: string) => Promise<Order[]>;
}): AssistantDeps {
  return {
    apiKey: ASSISTANT_API_KEY,
    model: ASSISTANT_MODEL,
    customerId: input.customerId,
    loadProducts: input.loadProducts,
    loadFaqs: input.loadFaqs,
    loadContentBlocks: input.loadContentBlocks,
    loadSignedInOrders: input.loadSignedInOrders,
    generate: async ({ apiKey, model, context, response }) => ({
      status: "ok",
      products: response.products,
      sources: response.sources,
      orders: response.orders,
      ...(await generateAssistantText({ apiKey, model, context, response })),
    }),
  };
}

function emptyResponse(
  status: AssistantResponse["status"],
  message: string,
): AssistantResponse {
  return { status, message, products: [], sources: [], orders: [], followups: [] };
}

function looksLikeOrderQuestion(message: string): boolean {
  return /\b(order|tracking|delivery status|where is|comand|livrare|заказ|доставк|трек)/i.test(
    message,
  );
}

type GroundedResponse = Pick<
  AssistantResponse,
  "status" | "products" | "sources" | "orders"
>;

/**
 * Result of the deterministic grounding step. `early` short-circuits generation
 * (validation, offline, or signed-out order lookups); `ready` carries the
 * grounded context that both the streaming and non-streaming paths generate from.
 */
export type AssistantGroundResult =
  | { kind: "early"; response: AssistantResponse }
  | {
      kind: "ready";
      apiKey: string;
      model: string;
      locale: AssistantContext["locale"];
      grounded: GroundedResponse;
      context: AssistantContext;
    };

export async function groundAssistantRequest(
  payload: AssistantRequestPayload,
  deps: AssistantDeps,
): Promise<AssistantGroundResult> {
  const runtimeConfig = getAssistantRuntimeConfig();
  const locale = normalizeAssistantLocale(payload.locale);
  const messages = sanitizeMessages(payload.messages, runtimeConfig.maxHistory);
  const lastMessage = messages[messages.length - 1];
  const latestUserMessage = lastMessage?.content ?? "";

  if (!latestUserMessage || lastMessage?.role !== "user") {
    return {
      kind: "early",
      response: emptyResponse("invalid", fallbackMessage("invalid", locale)),
    };
  }

  const apiKey = deps.apiKey?.trim() ?? "";

  if (!assistantConfigured(apiKey)) {
    return {
      kind: "early",
      response: emptyResponse("offline", fallbackMessage("offline", locale)),
    };
  }

  const [products, faqs, contentBlocks] = await Promise.all([
    deps.loadProducts(),
    deps.loadFaqs(),
    deps.loadContentBlocks(),
  ]);

  const productMatches = searchProductsFromCatalog(products, {
    query: latestUserMessage,
    locale,
    limit: runtimeConfig.maxProducts,
  });
  const sources = searchStoreKnowledge({
    query: latestUserMessage,
    locale,
    faqs,
    contentBlocks,
    limit: runtimeConfig.maxKnowledge,
  });

  let signedInOrders: Order[] = [];
  let orders: AssistantOrderSummary[] = [];
  const guestLookup = extractGuestLookupFields(payload.guestOrder);
  if (guestLookup) {
    const guestOrder = await fetchGuestOrder({
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      ...guestLookup,
    });
    orders = guestOrder ? shapeOrderSummaries([guestOrder], 1) : [];
  } else if (looksLikeOrderQuestion(latestUserMessage) && deps.customerId) {
    signedInOrders = await deps.loadSignedInOrders(deps.customerId);
    orders = shapeOrderSummaries(signedInOrders, runtimeConfig.maxOrders);
  }

  const grounded: GroundedResponse = {
    status: "ok",
    products: productMatches,
    sources,
    orders,
  };

  const context: AssistantContext = {
    locale,
    latestUserMessage,
    messages,
    products,
    faqs,
    contentBlocks,
    signedInOrders,
  };

  if (looksLikeOrderQuestion(latestUserMessage) && !deps.customerId && !guestLookup) {
    return {
      kind: "early",
      response: {
        ...grounded,
        message: signedOutOrderMessage(locale),
        followups: [],
      },
    };
  }

  return { kind: "ready", apiKey, model: deps.model, locale, grounded, context };
}

export async function handleAssistantRequest(
  payload: AssistantRequestPayload,
  deps: AssistantDeps,
): Promise<AssistantResponse> {
  const ground = await groundAssistantRequest(payload, deps);

  if (ground.kind === "early") {
    return ground.response;
  }

  const { apiKey, model, locale, grounded, context } = ground;

  try {
    const generated = await deps.generate({
      apiKey,
      model,
      latestUserMessage: context.latestUserMessage,
      context,
      response: grounded,
    });

    return {
      status: "ok",
      message: generated.message,
      products: grounded.products,
      sources: grounded.sources,
      orders: grounded.orders,
      followups: generated.followups,
    };
  } catch {
    return {
      ...grounded,
      message: fallbackMessage("error", locale),
      followups: [],
    };
  }
}

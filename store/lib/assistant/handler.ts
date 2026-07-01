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

export async function handleAssistantRequest(
  payload: AssistantRequestPayload,
  deps: AssistantDeps,
): Promise<AssistantResponse> {
  const runtimeConfig = getAssistantRuntimeConfig();
  const locale = normalizeAssistantLocale(payload.locale);
  const messages = sanitizeMessages(payload.messages, runtimeConfig.maxHistory);
  const lastMessage = messages[messages.length - 1];
  const latestUserMessage = lastMessage?.content ?? "";

  if (!latestUserMessage || lastMessage?.role !== "user") {
    return emptyResponse("invalid", fallbackMessage("invalid", locale));
  }

  if (!assistantConfigured(deps.apiKey)) {
    return emptyResponse("offline", fallbackMessage("offline", locale));
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

  const grounded = {
    status: "ok" as const,
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
      ...grounded,
      message: signedOutOrderMessage(locale),
      followups: [],
    };
  }

  try {
    const generated = await deps.generate({
      apiKey: deps.apiKey,
      model: deps.model,
      latestUserMessage,
      context,
      response: grounded,
    });

    return {
      status: "ok",
      message: generated.message,
      products: productMatches,
      sources,
      orders,
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

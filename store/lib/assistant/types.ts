import type { Product, ProductVariant } from "@/types";

export type AssistantRole = "user" | "assistant";
export type AssistantLocale = "en" | "ro" | "ru";
export type AssistantStatus = "ok" | "offline" | "invalid" | "rate_limited" | "error";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
}

export interface AssistantCartLine {
  productId: string;
  variantKey?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface AssistantConversationInput {
  messages: AssistantMessage[];
  locale: string;
  cart?: AssistantCartLine[];
  orderLookup?: {
    email?: string;
    orderNumber?: string;
  };
}

export interface AssistantRequestPayload {
  locale?: string;
  messages?: AssistantMessage[];
  page?: {
    path?: string;
    productId?: string;
    categoryId?: string;
  };
  guestOrder?: {
    orderId?: string;
    email?: string;
  };
}

export interface AssistantProductVariantSummary {
  id: string;
  sku?: string | null;
  size?: string;
  color?: string;
  stockQty: number;
}

export interface AssistantProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  category?: string;
  imageUrl?: string;
  description?: string;
  variants: AssistantProductVariantSummary[];
  stockQty: number;
  score?: number;
}

export type AssistantProductCartLine = Product & {
  variantId: string;
  selectedSize: ProductVariant["size"];
  selectedColor: ProductVariant["color"];
  unitPrice: string;
  quantity?: number;
};

export interface AssistantProductRecommendation {
  product: Product;
  productId: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  categoryName?: string;
  reason: string;
  stockState: "in" | "low" | "out";
  variants: Array<{
    id: string;
    size: string;
    color: string;
    colorValue: string;
    stockQty: number;
  }>;
  cartLine?: AssistantProductCartLine;
}

export interface AssistantCatalogContext {
  locale: string;
  query?: string;
  products: AssistantProductSummary[];
  totalProducts: number;
  categories: string[];
}

export interface AssistantKnowledgeEntry {
  id: string;
  type: "faq" | "content" | "blog" | "policy";
  title: string;
  body: string;
  category?: string;
  score?: number;
}

export interface AssistantKnowledgeSource {
  id: string;
  type: "faq" | "content";
  label: string;
  excerpt: string;
}

export interface AssistantOrderItemSummary {
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  unitPrice?: string;
}

export interface AssistantOrderSummary {
  id: string;
  orderNumber?: string;
  status: string;
  paymentStatus?: string;
  total: string;
  currency?: string;
  items: AssistantOrderItemSummary[];
  createdAt: string;
  tracking?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}

export interface AssistantToolContext {
  catalog?: AssistantCatalogContext;
  knowledge: AssistantKnowledgeEntry[];
  orders: AssistantOrderSummary[];
  cart: AssistantCartLine[];
}

export interface AssistantResponse {
  message: string;
  products?: AssistantProductSummary[];
  knowledge?: AssistantKnowledgeEntry[];
  orders?: AssistantOrderSummary[];
  suggestedQuestions?: string[];
}

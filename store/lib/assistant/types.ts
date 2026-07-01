export type AssistantRole = "user" | "assistant";

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

export interface AssistantOrderItemSummary {
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  unitPrice?: number;
}

export interface AssistantOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: number;
  currency: string;
  items: AssistantOrderItemSummary[];
  createdAt: string;
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

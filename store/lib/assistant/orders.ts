import type { Order } from "@/types";

import { getAssistantRuntimeConfig } from "./config";
import type { AssistantLocale, AssistantOrderSummary } from "./types";

export function shapeOrderSummaries(
  orders: Order[],
  limit = getAssistantRuntimeConfig().maxOrders,
): AssistantOrderSummary[] {
  return orders.slice(0, limit).map((order) => ({
    id: order.id,
    orderNumber: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    tracking: order.trackingNumber
      ? [order.carrier, order.trackingNumber].filter(Boolean).join(" ")
      : undefined,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    items: order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? undefined,
    })),
  }));
}

export function extractGuestLookupFields(
  input:
    | {
        orderId?: string;
        email?: string;
      }
    | undefined,
): { orderId: string; email: string } | null {
  const orderId = input?.orderId?.trim() ?? "";
  const email = input?.email?.trim() ?? "";

  if (!orderId || !email) {
    return null;
  }

  return { orderId, email };
}

export function signedOutOrderMessage(locale: AssistantLocale): string {
  switch (locale) {
    case "ro":
      return "Pentru statusul comenzilor, autentifica-te in cont sau introdu numarul comenzii si emailul folosit la checkout.";
    case "ru":
      return "Чтобы проверить статус заказа, войдите в аккаунт или укажите номер заказа и email, использованный при оформлении.";
    default:
      return "To check order status, sign in to your account or provide the order number and email used at checkout.";
  }
}

export async function fetchGuestOrder(input: {
  apiUrl: string | undefined;
  orderId: string;
  email: string;
  fetchImpl?: typeof fetch;
}): Promise<Order | null> {
  if (!input.apiUrl) {
    return null;
  }

  const fetcher = input.fetchImpl ?? fetch;
  const res = await fetcher(`${input.apiUrl}/orders/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: input.orderId, email: input.email }),
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as Order;
}

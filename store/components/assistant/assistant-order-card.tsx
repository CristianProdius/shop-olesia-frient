"use client";

import Currency from "@/components/ui/currency";
import type { AssistantOrderSummary } from "@/lib/assistant/types";

type Props = {
  order: AssistantOrderSummary;
};

const AssistantOrderCard = ({ order }: Props) => (
  <article className="border border-border p-3 text-sm text-text">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs">
          {order.orderNumber ?? order.id}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-muted-strong">
          {order.status}
        </p>
      </div>
      <Currency value={order.total} />
    </div>
    {order.tracking && (
      <p className="mt-2 truncate text-xs text-muted-strong">{order.tracking}</p>
    )}
    {order.items.length > 0 && (
      <ul className="mt-3 space-y-1">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.productId}-${item.variantId ?? "item"}`}
            className="text-xs text-text"
          >
            {item.productName} x {item.quantity}
          </li>
        ))}
      </ul>
    )}
  </article>
);

export default AssistantOrderCard;

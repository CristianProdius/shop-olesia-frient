"use client";

import { useTranslations } from "next-intl";

import type { AssistantResponse } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

import AssistantOrderCard from "./assistant-order-card";
import AssistantProductCard from "./assistant-product-card";

type Props = {
  role: "user" | "assistant";
  content: string;
  response?: AssistantResponse;
  onAddToCart?: () => void;
  onFollowup?: (value: string) => void;
};

const AssistantMessage = ({
  role,
  content,
  response,
  onAddToCart,
  onFollowup,
}: Props) => {
  const t = useTranslations("Assistant");
  const isUser = role === "user";

  return (
    <div className={cn(isUser ? "ml-auto max-w-[85%]" : "mr-auto max-w-[92%]")}>
      <div
        className={cn(
          "px-4 py-3 text-sm",
          isUser
            ? "bg-ink text-white"
            : "border border-border bg-background text-text",
        )}
      >
        <p className="whitespace-pre-line text-pretty">{content}</p>
      </div>

      {response && response.products.length > 0 && (
        <div className="mt-3 space-y-3">
          {response.products.map((product) => (
            <AssistantProductCard
              key={product.productId}
              item={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {response && response.orders.length > 0 && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
            {t("orders")}
          </p>
          {response.orders.map((order) => (
            <AssistantOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {response && response.sources.length > 0 && (
        <div className="mt-3 border-l border-border pl-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
            {t("sources")}
          </p>
          <ul className="mt-2 space-y-1">
            {response.sources.map((source) => (
              <li
                key={`${source.type}-${source.id}`}
                className="text-xs text-muted-strong"
              >
                {source.label}: {source.excerpt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response && response.followups.length > 0 && onFollowup && (
        <div className="mt-3 flex flex-wrap gap-2">
          {response.followups.map((followup) => (
            <button
              key={followup}
              type="button"
              onClick={() => onFollowup(followup)}
              className="border border-border px-3 py-2 text-left text-xs text-text transition-colors duration-200 ease-out hover:border-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
            >
              {followup}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssistantMessage;

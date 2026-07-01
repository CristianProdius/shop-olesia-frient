"use client";

import { useTranslations } from "next-intl";

import type { AssistantResponse } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

import AssistantOrderCard from "./assistant-order-card";
import AssistantProductCarousel from "./assistant-product-carousel";
import AssistantTyping from "./assistant-typing";

type Props = {
  role: "user" | "assistant";
  content: string;
  response?: Pick<AssistantResponse, "products" | "sources" | "orders">;
  followups?: string[];
  streaming?: boolean;
  onAddToCart?: () => void;
  onFollowup?: (value: string) => void;
};

const AssistantMessage = ({
  role,
  content,
  response,
  followups,
  streaming = false,
  onAddToCart,
  onFollowup,
}: Props) => {
  const t = useTranslations("Assistant");
  const isUser = role === "user";
  const showTyping = streaming && content.length === 0;

  return (
    <div
      className={cn(
        "animate-message-in motion-reduce:animate-none",
        isUser ? "ml-auto max-w-[85%]" : "mr-auto max-w-[92%]",
      )}
    >
      <div
        className={cn(
          "px-4 py-3 text-sm",
          isUser
            ? "bg-ink text-white"
            : "border border-border bg-surface text-text",
        )}
      >
        {showTyping ? (
          <AssistantTyping />
        ) : (
          <p className="whitespace-pre-line text-pretty">
            {content}
            {streaming && (
              <span
                className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current align-baseline animate-typing-dot motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
          </p>
        )}
      </div>

      {response && response.products.length > 0 && (
        <AssistantProductCarousel
          products={response.products}
          onAddToCart={onAddToCart}
        />
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
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
            {t("sources")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {response.sources.map((source) => (
              <span
                key={`${source.type}-${source.id}`}
                title={source.excerpt}
                className="max-w-full truncate border border-border px-2 py-1 text-xs text-muted-strong"
              >
                {source.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {followups && followups.length > 0 && onFollowup && (
        <div className="mt-3 flex flex-wrap gap-2">
          {followups.map((followup) => (
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

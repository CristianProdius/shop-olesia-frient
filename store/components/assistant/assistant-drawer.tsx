"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { streamAssistant } from "@/lib/assistant/client";
import type { AssistantResponse } from "@/lib/assistant/types";

import AssistantMessage from "./assistant-message";
import AssistantSuggestions from "./assistant-suggestions";

type Props = {
  open: boolean;
  onClose: () => void;
};

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: Pick<AssistantResponse, "products" | "sources" | "orders">;
  followups?: string[];
  streaming?: boolean;
};

function messageId() {
  return crypto.randomUUID();
}

const AssistantDrawer = ({ open, onClose }: Props) => {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep the newest message in view as content streams in.
  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  // Focus the composer once the drawer has opened. preventScroll stops the
  // browser scrolling the still-off-screen panel into view mid-transition.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchMessage = (id: string, patch: Partial<UiMessage>) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    );
  };

  const appendContent = (id: string, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, content: message.content + text }
          : message,
      ),
    );
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setLoading(false);
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  };

  const sendMessage = async (value: string) => {
    const text = value.trim();
    if (!text || loading) return;

    const history = messages
      .filter((message) => message.content.length > 0)
      .map((message) => ({ role: message.role, content: message.content }));

    const userMessage: UiMessage = {
      id: messageId(),
      role: "user",
      content: text,
    };
    const assistantId = messageId();
    const assistantMessage: UiMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAssistant(
        {
          locale,
          messages: [...history, { role: "user", content: text }],
          page: { path: pathname },
          signal: controller.signal,
        },
        {
          onMeta: (meta) =>
            patchMessage(assistantId, {
              response: {
                products: meta.products,
                sources: meta.sources,
                orders: meta.orders,
              },
            }),
          onDelta: (chunk) => appendContent(assistantId, chunk),
          onDone: (followups) =>
            patchMessage(assistantId, { followups, streaming: false }),
        },
      );
    } catch {
      patchMessage(assistantId, {
        content: t("error"),
        streaming: false,
      });
    } finally {
      patchMessage(assistantId, { streaming: false });
      setLoading(false);
      abortRef.current = null;
    }
  };

  const hasConversation = messages.length > 0;

  // Announce only the latest completed assistant answer to screen readers —
  // never the user's own messages, rich cards, or token-by-token streaming.
  const lastMessage = messages[messages.length - 1];
  const announcement =
    lastMessage?.role === "assistant" &&
    !lastMessage.streaming &&
    lastMessage.content.length > 0
      ? lastMessage.content
      : "";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-300 ease-out data-[closed]:opacity-0 motion-reduce:transition-none"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 flex justify-end">
          <DialogPanel
            transition
            className="flex h-dvh w-[92%] max-w-[460px] flex-col bg-background shadow-[var(--shadow-overlay)] transition duration-300 ease-out data-[closed]:translate-x-full motion-reduce:transition-none motion-reduce:data-[closed]:translate-x-0"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 items-center justify-center bg-ink text-white"
                  aria-hidden="true"
                >
                  <Sparkles className="size-[18px] stroke-[1.5]" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="heading-luxe text-sm text-ink">
                    {t("title")}
                  </DialogTitle>
                  <p className="truncate text-xs text-muted-strong">
                    {t("tagline")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasConversation && (
                  <button
                    type="button"
                    onClick={resetConversation}
                    aria-label={t("restart")}
                    title={t("restart")}
                    className="flex size-9 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
                  >
                    <RotateCcw className="size-[18px] stroke-[1.5]" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("close")}
                  className="flex size-9 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
                >
                  <X className="size-[18px] stroke-[1.5]" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </div>

            <div
              ref={listRef}
              className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
            >
              {!hasConversation && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="heading-luxe text-balance text-sm text-ink">
                      {t("emptyTitle")}
                    </p>
                    <p className="text-pretty text-sm text-muted-strong">
                      {t("intro")}
                    </p>
                  </div>
                  <AssistantSuggestions onSelect={sendMessage} />
                </div>
              )}

              {messages.map((message) => (
                <AssistantMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  response={message.response}
                  followups={message.followups}
                  streaming={message.streaming}
                  onAddToCart={onClose}
                  onFollowup={sendMessage}
                />
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(input);
              }}
              className="flex gap-2 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <label htmlFor="assistant-input" className="sr-only">
                {t("placeholder")}
              </label>
              <input
                ref={inputRef}
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("placeholder")}
                enterKeyHint="send"
                autoComplete="off"
                className="min-w-0 flex-1 border border-border bg-background px-3 py-3 text-sm text-text placeholder:text-muted-strong focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                aria-label={t("send")}
                className="flex size-12 shrink-0 items-center justify-center border border-ink bg-ink text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                <Send className="size-4 stroke-[1.5]" aria-hidden="true" />
              </button>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default AssistantDrawer;

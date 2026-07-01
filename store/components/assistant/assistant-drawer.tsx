"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Send, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { usePathname } from "@/i18n/navigation";
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
  response?: AssistantResponse;
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

  const apiMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  const sendMessage = async (value: string) => {
    const text = value.trim();
    if (!text || loading) return;

    const userMessage: UiMessage = {
      id: messageId(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: [...apiMessages, { role: "user", content: text }],
          page: { path: pathname },
        }),
      });
      const data = (await res.json()) as AssistantResponse;
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: data.message || t("error"),
          response: data,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: t("error"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 flex justify-end">
          <DialogPanel className="flex h-dvh w-[92%] max-w-[460px] flex-col bg-background shadow-[var(--shadow-overlay)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <DialogTitle className="heading-luxe text-sm text-ink">
                {t("title")}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="flex size-9 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
              >
                <X className="size-[18px] stroke-[1.5]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <p className="text-pretty text-sm text-muted-strong">
                    {t("intro")}
                  </p>
                  <AssistantSuggestions onSelect={sendMessage} />
                </div>
              )}

              {messages.map((message) => (
                <AssistantMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  response={message.response}
                  onAddToCart={onClose}
                  onFollowup={sendMessage}
                />
              ))}

              {loading && (
                <p className="text-sm text-muted-strong">{t("thinking")}</p>
              )}
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
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("placeholder")}
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

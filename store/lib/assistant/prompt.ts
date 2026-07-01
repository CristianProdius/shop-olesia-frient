import { ASSISTANT_MAX_MESSAGE_LENGTH, getAssistantRuntimeConfig } from "./config";
import type { AssistantLocale, AssistantMessage, AssistantRole } from "./types";

type MessageCandidate = {
  role?: unknown;
  content?: unknown;
  id?: unknown;
  createdAt?: unknown;
};

function supportedRole(role: unknown): role is AssistantRole {
  return role === "user" || role === "assistant";
}

export function sanitizeMessages(
  input: MessageCandidate[] | undefined,
  maxMessages = getAssistantRuntimeConfig().maxHistory,
): AssistantMessage[] {
  const safe = (input ?? [])
    .filter((message) => supportedRole(message.role))
    .filter((message) => typeof message.content === "string")
    .map((message) => ({
      role: message.role as AssistantRole,
      content: (message.content as string)
        .trim()
        .slice(0, ASSISTANT_MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0);

  return safe.slice(-maxMessages);
}

export const FOLLOWUPS_SENTINEL = "<<FOLLOWUPS>>";

function assistantGuardrails(locale: AssistantLocale): string[] {
  return [
    "You are the LILETTI shop assistant for a premium Moldovan womenswear storefront.",
    `Answer in ${locale}.`,
    "Use only the catalog, FAQ, content, and order context supplied by the server.",
    "Never invent stock, shipping promises, discounts, return policy, materials, or atelier timelines.",
    "Never use customerId from browser input. Order context is scoped server-side.",
    "Never claim an item was added to cart. The shopper must click the add-to-cart UI.",
    "Keep sizing guidance factual, optional, and respectful.",
    "If data is missing, say that the shop data does not include it and suggest FAQ, account, or made-to-measure paths.",
  ];
}

export function buildAssistantPrompt(locale: AssistantLocale): string {
  return [
    ...assistantGuardrails(locale),
    "Return only a compact JSON object with keys: message, followups.",
  ].join("\n");
}

export function buildAssistantStreamPrompt(locale: AssistantLocale): string {
  return [
    ...assistantGuardrails(locale),
    "Write a concise, warm answer as plain prose. Do not use markdown headings, code fences, or JSON.",
    `When the answer is complete, output a line containing exactly ${FOLLOWUPS_SENTINEL} and then a JSON array of up to 3 short follow-up questions the shopper might ask next.`,
    `Example: ...your answer...\n${FOLLOWUPS_SENTINEL}["What sizes are available?","How do I care for silk?"]`,
    "Never output anything after the JSON array.",
  ].join("\n");
}

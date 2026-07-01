import { buildAssistantPrompt } from "./prompt";
import type { AssistantContext, AssistantResponse } from "./types";

export type AssistantGroundedResponse = Omit<
  AssistantResponse,
  "message" | "followups"
>;

export interface GenerateAssistantInput {
  apiKey: string;
  model: string;
  context: AssistantContext;
  response: AssistantGroundedResponse;
  fetchImpl?: typeof fetch;
}

type ModelJson = {
  message?: unknown;
  followups?: unknown;
};

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export function parseModelJson(text: string): {
  message: string;
  followups: string[];
} {
  const parsed = JSON.parse(extractJsonText(text)) as ModelJson;
  const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
  const followups = Array.isArray(parsed.followups)
    ? parsed.followups
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return { message, followups };
}

function responseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const content = (payload as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (
        block &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string"
      ) {
        return (block as { text: string }).text;
      }

      return "";
    })
    .join("");
}

export async function generateAssistantText(
  input: GenerateAssistantInput,
): Promise<Pick<AssistantResponse, "message" | "followups">> {
  const fetcher = input.fetchImpl ?? fetch;
  const res = await fetcher("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 1200,
      system: buildAssistantPrompt(input.context.locale),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            userMessage: input.context.latestUserMessage,
            conversation: input.context.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            products: input.response.products.map((item) => ({
              id: item.productId,
              name: item.name,
              price: item.price,
              stockState: item.stockState,
              variants: item.variants,
            })),
            sources: input.response.sources,
            orders: input.response.orders,
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Assistant provider failed with ${res.status}`);
  }

  const parsed = parseModelJson(responseText(await res.json()));
  if (!parsed.message) {
    throw new Error("Assistant provider returned an empty message");
  }

  return parsed;
}

import {
  buildAssistantPrompt,
  buildAssistantStreamPrompt,
  FOLLOWUPS_SENTINEL,
} from "./prompt";
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

function buildUserContent(
  context: AssistantContext,
  response: AssistantGroundedResponse,
): string {
  return JSON.stringify({
    userMessage: context.latestUserMessage,
    conversation: context.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    products: response.products.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      stockState: item.stockState,
      variants: item.variants,
    })),
    sources: response.sources,
    orders: response.orders,
  });
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
        { role: "user", content: buildUserContent(input.context, input.response) },
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

/**
 * Splits a streamed answer into the visible message and the trailing
 * `<<FOLLOWUPS>>[...]` payload. Emits message text incrementally while
 * holding back just enough of the tail that a sentinel split across two
 * chunks is never leaked to the client.
 */
export function createFollowupSplitter() {
  let pending = "";
  let messageDone = false;
  let followupRaw = "";

  return {
    feed(chunk: string): string {
      if (messageDone) {
        followupRaw += chunk;
        return "";
      }
      pending += chunk;
      const idx = pending.indexOf(FOLLOWUPS_SENTINEL);
      if (idx !== -1) {
        const emit = pending.slice(0, idx);
        followupRaw = pending.slice(idx + FOLLOWUPS_SENTINEL.length);
        pending = "";
        messageDone = true;
        return emit;
      }
      // Only hold back a trailing run that could be the start of the sentinel,
      // so ordinary text streams out without an artificial delay.
      const keep = partialSentinelSuffix(pending);
      const emit = pending.slice(0, pending.length - keep);
      pending = pending.slice(pending.length - keep);
      return emit;
    },
    flush(): string {
      if (messageDone) {
        return "";
      }
      const emit = pending;
      pending = "";
      return emit;
    },
    followups(): string[] {
      return parseFollowups(followupRaw);
    },
  };
}

function partialSentinelSuffix(text: string): number {
  const max = Math.min(text.length, FOLLOWUPS_SENTINEL.length - 1);
  for (let k = max; k > 0; k -= 1) {
    if (text.endsWith(FOLLOWUPS_SENTINEL.slice(0, k))) {
      return k;
    }
  }
  return 0;
}

function parseFollowups(raw: string): string[] {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * Streams answer text deltas from the Anthropic Messages API (SSE). Yields raw
 * text fragments including the trailing `<<FOLLOWUPS>>` payload — callers split
 * it with {@link createFollowupSplitter}.
 */
export async function* streamAssistantText(
  input: GenerateAssistantInput,
): AsyncGenerator<string, void, unknown> {
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
      stream: true,
      system: buildAssistantStreamPrompt(input.context.locale),
      messages: [
        { role: "user", content: buildUserContent(input.context, input.response) },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Assistant provider failed with ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const text = extractStreamDelta(rawEvent);
      if (text) {
        yield text;
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function extractStreamDelta(rawEvent: string): string {
  for (const line of rawEvent.split("\n")) {
    if (!line.startsWith("data:")) {
      continue;
    }
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    try {
      const parsed = JSON.parse(payload) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (
        parsed.type === "content_block_delta" &&
        parsed.delta?.type === "text_delta" &&
        typeof parsed.delta.text === "string"
      ) {
        return parsed.delta.text;
      }
    } catch {
      // Ignore keep-alive/ping lines and partial JSON.
    }
  }
  return "";
}

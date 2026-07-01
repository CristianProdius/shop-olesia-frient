import type { AssistantResponse } from "./types";

export type AssistantStreamMeta = Pick<
  AssistantResponse,
  "status" | "products" | "sources" | "orders"
>;

export interface AssistantStreamHandlers {
  onMeta?: (meta: AssistantStreamMeta) => void;
  onDelta?: (text: string) => void;
  onDone?: (followups: string[]) => void;
}

export interface AssistantStreamRequest {
  locale: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  page?: { path?: string };
  signal?: AbortSignal;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: dataLines.join("\n") };
}

/**
 * Consumes the assistant SSE stream, invoking handlers as `meta`, `delta`, and
 * `done` events arrive. Throws if the request fails before any event is
 * received so the caller can fall back to the non-streaming endpoint.
 */
export async function streamAssistant(
  request: AssistantStreamRequest,
  handlers: AssistantStreamHandlers,
): Promise<void> {
  const res = await fetch("/api/assistant/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: request.locale,
      messages: request.messages,
      page: request.page,
    }),
    signal: request.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Assistant stream failed with ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleBlock = (block: string) => {
    const parsed = parseSseBlock(block);
    if (!parsed) {
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(parsed.data);
    } catch {
      return;
    }
    if (parsed.event === "meta") {
      handlers.onMeta?.(data as AssistantStreamMeta);
    } else if (parsed.event === "delta") {
      handlers.onDelta?.((data as { text?: string }).text ?? "");
    } else if (parsed.event === "done") {
      handlers.onDone?.((data as { followups?: string[] }).followups ?? []);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      handleBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }

  if (buffer.trim()) {
    handleBlock(buffer);
  }
}

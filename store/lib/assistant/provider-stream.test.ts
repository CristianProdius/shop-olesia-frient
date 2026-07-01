import { describe, expect, it, vi } from "vitest";

import { createFollowupSplitter, streamAssistantText } from "./provider";
import type { AssistantContext } from "./types";

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function textDeltaEvent(text: string): string {
  return `event: content_block_delta\ndata: ${JSON.stringify({
    type: "content_block_delta",
    delta: { type: "text_delta", text },
  })}\n\n`;
}

const context: AssistantContext = {
  locale: "en",
  latestUserMessage: "hi",
  messages: [{ role: "user", content: "hi" }],
  products: [],
  faqs: [],
  contentBlocks: [],
  signedInOrders: [],
};

describe("createFollowupSplitter", () => {
  it("separates the message from the followups payload", () => {
    const splitter = createFollowupSplitter();
    let message = "";
    message += splitter.feed("Hello there.");
    message += splitter.feed('<<FOLLOWUPS>>["One?","Two?"]');
    message += splitter.flush();

    expect(message).toBe("Hello there.");
    expect(splitter.followups()).toEqual(["One?", "Two?"]);
  });

  it("does not leak a sentinel split across chunks", () => {
    const splitter = createFollowupSplitter();
    let message = "";
    message += splitter.feed("Answer<<FOLL");
    // The partial sentinel must be held back, not emitted.
    expect(message).toBe("Answer");
    message += splitter.feed('OWUPS>>["Q?"]');
    message += splitter.flush();

    expect(message).toBe("Answer");
    expect(splitter.followups()).toEqual(["Q?"]);
  });

  it("returns no followups when the payload is absent or malformed", () => {
    const splitter = createFollowupSplitter();
    const message = splitter.feed("Just an answer.") + splitter.flush();
    expect(message).toBe("Just an answer.");
    expect(splitter.followups()).toEqual([]);
  });
});

describe("streamAssistantText", () => {
  it("yields text deltas parsed from the SSE stream", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      body: sseStream([
        textDeltaEvent("Hel"),
        textDeltaEvent("lo"),
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ]),
    });

    const chunks: string[] = [];
    for await (const chunk of streamAssistantText({
      apiKey: "key",
      model: "claude-haiku-4-5",
      context,
      response: { status: "ok", products: [], sources: [], orders: [] },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toBe("Hello");
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.stream).toBe(true);
  });

  it("throws when the provider responds with an error", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, body: null });

    await expect(async () => {
      for await (const _ of streamAssistantText({
        apiKey: "key",
        model: "claude-haiku-4-5",
        context,
        response: { status: "ok", products: [], sources: [], orders: [] },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })) {
        void _;
      }
    }).rejects.toThrow(/500/);
  });
});

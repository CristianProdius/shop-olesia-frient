import getContentBlocks from "@/actions/get-content-blocks";
import getFaqs from "@/actions/get-faqs";
import getMyOrders from "@/actions/get-my-orders";
import getProducts from "@/actions/get-products";
import {
  fallbackMessage,
  normalizeAssistantLocale,
} from "@/lib/assistant/config";
import {
  createDefaultAssistantDeps,
  groundAssistantRequest,
} from "@/lib/assistant/handler";
import {
  createFollowupSplitter,
  streamAssistantText,
} from "@/lib/assistant/provider";
import { assistantRateLimiter } from "@/lib/assistant/rate-limit";
import type {
  AssistantRequestPayload,
  AssistantResponse,
} from "@/lib/assistant/types";
import { getCustomerSession } from "@/lib/server-auth";

type MetaPayload = Pick<
  AssistantResponse,
  "status" | "products" | "sources" | "orders"
>;

function emptyMeta(status: AssistantResponse["status"]): MetaPayload {
  return { status, products: [], sources: [], orders: [] };
}

function clientRateLimitKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();

  return `assistant:${forwardedFor || realIp || "unknown"}`;
}

async function readCustomerId(): Promise<string | null> {
  try {
    const session = await getCustomerSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      const finish = (
        meta: MetaPayload,
        message: string,
        followups: string[],
      ) => {
        send("meta", meta);
        if (message) {
          send("delta", { text: message });
        }
        send("done", { followups });
        controller.close();
      };

      if (!assistantRateLimiter.check(clientRateLimitKey(req)).allowed) {
        finish(
          emptyMeta("rate_limited"),
          fallbackMessage("rate_limited", normalizeAssistantLocale(undefined)),
          [],
        );
        return;
      }

      let body: AssistantRequestPayload;
      try {
        body = (await req.json()) as AssistantRequestPayload;
      } catch {
        finish(
          emptyMeta("invalid"),
          fallbackMessage("invalid", normalizeAssistantLocale(undefined)),
          [],
        );
        return;
      }

      const locale = normalizeAssistantLocale(body.locale);
      const customerId = await readCustomerId();

      let ground;
      try {
        ground = await groundAssistantRequest(
          body,
          createDefaultAssistantDeps({
            customerId,
            loadProducts: () => getProducts({}),
            loadFaqs: () => getFaqs(),
            loadContentBlocks: () => getContentBlocks(),
            loadSignedInOrders: (id) => getMyOrders(id),
          }),
        );
      } catch {
        finish(emptyMeta("error"), fallbackMessage("error", locale), []);
        return;
      }

      if (ground.kind === "early") {
        const { status, products, sources, orders, message, followups } =
          ground.response;
        finish({ status, products, sources, orders }, message, followups);
        return;
      }

      // Stream the grounded cards first so they render before the answer.
      send("meta", ground.grounded);

      const splitter = createFollowupSplitter();
      let emittedText = false;
      try {
        for await (const chunk of streamAssistantText({
          apiKey: ground.apiKey,
          model: ground.model,
          context: ground.context,
          response: ground.grounded,
        })) {
          const text = splitter.feed(chunk);
          if (text) {
            emittedText = true;
            send("delta", { text });
          }
        }
        const tail = splitter.flush();
        if (tail) {
          emittedText = true;
          send("delta", { text: tail });
        }
        // Parity with the non-streaming path, which substitutes the error
        // fallback when the model returns an empty message.
        if (!emittedText) {
          send("delta", { text: fallbackMessage("error", locale) });
        }
        send("done", { followups: splitter.followups() });
      } catch {
        send("delta", { text: fallbackMessage("error", locale) });
        send("done", { followups: [] });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

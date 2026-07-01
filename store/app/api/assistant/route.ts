import { NextResponse } from "next/server";

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
  handleAssistantRequest,
} from "@/lib/assistant/handler";
import { assistantRateLimiter } from "@/lib/assistant/rate-limit";
import type {
  AssistantRequestPayload,
  AssistantResponse,
} from "@/lib/assistant/types";
import { getCustomerSession } from "@/lib/server-auth";

function emptyResponse(
  status: Exclude<AssistantResponse["status"], "ok">,
  locale: string | undefined,
): AssistantResponse {
  const normalizedLocale = normalizeAssistantLocale(locale);

  return {
    status,
    message: fallbackMessage(status, normalizedLocale),
    products: [],
    sources: [],
    orders: [],
    followups: [],
  };
}

function clientRateLimitKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();

  return `assistant:${forwardedFor || realIp || "unknown"}`;
}

async function readLocaleFromClone(req: Request): Promise<string | undefined> {
  try {
    const body = (await req.clone().json()) as AssistantRequestPayload;
    return body.locale;
  } catch {
    return undefined;
  }
}

async function readCustomerId(): Promise<string | null> {
  try {
    const session = await getCustomerSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const rateLimitResult = assistantRateLimiter.check(clientRateLimitKey(req));

  if (!rateLimitResult.allowed) {
    const locale = await readLocaleFromClone(req);

    return NextResponse.json(emptyResponse("rate_limited", locale), {
      status: 429,
    });
  }

  let body: AssistantRequestPayload;
  try {
    body = (await req.json()) as AssistantRequestPayload;
  } catch {
    return NextResponse.json(emptyResponse("invalid", undefined), {
      status: 400,
    });
  }

  const customerId = await readCustomerId();

  try {
    const response = await handleAssistantRequest(
      body,
      createDefaultAssistantDeps({
        customerId,
        loadProducts: () => getProducts({}),
        loadFaqs: () => getFaqs(),
        loadContentBlocks: () => getContentBlocks(),
        loadSignedInOrders: (id) => getMyOrders(id),
      }),
    );

    return NextResponse.json(response, {
      status: response.status === "invalid" ? 400 : 200,
    });
  } catch {
    return NextResponse.json(emptyResponse("error", body.locale), {
      status: 200,
    });
  }
}

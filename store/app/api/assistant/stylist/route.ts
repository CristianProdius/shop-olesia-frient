import { NextResponse } from "next/server";

import getProducts from "@/actions/get-products";
import {
  ASSISTANT_API_KEY,
  ASSISTANT_MODEL,
  assistantConfigured,
  fallbackMessage,
  normalizeAssistantLocale,
} from "@/lib/assistant/config";
import { assistantRateLimiter } from "@/lib/assistant/rate-limit";
import { generateStylistLook } from "@/lib/assistant/stylist";
import type { AssistantStylistLook } from "@/lib/assistant/types";

const MAX_OCCASION_LENGTH = 200;
const MAX_EXCLUDE = 24;

type StylistPayload = {
  locale?: string;
  occasion?: string;
  exclude?: unknown;
};

function emptyLook(
  status: Exclude<AssistantStylistLook["status"], "ok">,
  locale: string | undefined,
): AssistantStylistLook {
  const normalized = normalizeAssistantLocale(locale);
  return {
    status,
    title: "",
    rationale: fallbackMessage(status, normalized),
    products: [],
  };
}

function clientRateLimitKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return `stylist:${forwardedFor || realIp || "unknown"}`;
}

export async function POST(req: Request) {
  if (!assistantRateLimiter.check(clientRateLimitKey(req)).allowed) {
    return NextResponse.json(emptyLook("rate_limited", undefined), {
      status: 429,
    });
  }

  let body: StylistPayload;
  try {
    body = (await req.json()) as StylistPayload;
  } catch {
    return NextResponse.json(emptyLook("invalid", undefined), { status: 400 });
  }

  const locale = normalizeAssistantLocale(body.locale);
  const apiKey = ASSISTANT_API_KEY.trim();

  if (!assistantConfigured(apiKey)) {
    return NextResponse.json(emptyLook("offline", locale), { status: 200 });
  }

  const occasion =
    typeof body.occasion === "string"
      ? body.occasion.trim().slice(0, MAX_OCCASION_LENGTH)
      : "";
  const exclude = Array.isArray(body.exclude)
    ? body.exclude
        .filter((id): id is string => typeof id === "string")
        .slice(0, MAX_EXCLUDE)
    : [];

  try {
    const products = await getProducts({});
    const look = await generateStylistLook({
      apiKey,
      model: ASSISTANT_MODEL,
      locale,
      occasion,
      products,
      exclude,
    });

    return NextResponse.json(
      { status: "ok", ...look } satisfies AssistantStylistLook,
      { status: 200 },
    );
  } catch {
    return NextResponse.json(emptyLook("error", locale), { status: 200 });
  }
}

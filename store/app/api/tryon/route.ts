import { NextResponse } from "next/server";

import getProduct from "@/actions/get-product";
import { assistantRateLimiter } from "@/lib/assistant/rate-limit";
import { findPresetModel } from "@/lib/tryon/presets";
import {
  runTryOn,
  tryOnConfigured,
  type TryOnResult,
} from "@/lib/tryon/provider";

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return `tryon:${fwd || real || "unknown"}`;
}

export async function POST(req: Request) {
  if (!tryOnConfigured()) {
    return NextResponse.json({ status: "offline" } satisfies TryOnResult, {
      status: 200,
    });
  }

  // Image generation is costly — reuse the assistant rate limiter.
  if (!assistantRateLimiter.check(clientKey(req)).allowed) {
    return NextResponse.json({ status: "error" } satisfies TryOnResult, {
      status: 429,
    });
  }

  let body: { productId?: string; modelId?: string };
  try {
    body = (await req.json()) as { productId?: string; modelId?: string };
  } catch {
    return NextResponse.json({ status: "invalid" } satisfies TryOnResult, {
      status: 400,
    });
  }

  const { productId, modelId } = body;
  const model = modelId ? findPresetModel(modelId) : undefined;
  if (!productId || !model) {
    return NextResponse.json({ status: "invalid" } satisfies TryOnResult, {
      status: 400,
    });
  }

  // Re-fetch the product server-side so the garment image can't be spoofed.
  const product = await getProduct(productId);
  const garmentImageUrl = product?.images?.[0]?.url;
  if (!garmentImageUrl) {
    return NextResponse.json({ status: "invalid" } satisfies TryOnResult, {
      status: 400,
    });
  }

  try {
    const { imageUrl } = await runTryOn({
      garmentImageUrl,
      modelImageUrl: model.imageUrl,
    });
    return NextResponse.json({ status: "ok", imageUrl } satisfies TryOnResult, {
      status: 200,
    });
  } catch {
    return NextResponse.json({ status: "error" } satisfies TryOnResult, {
      status: 200,
    });
  }
}

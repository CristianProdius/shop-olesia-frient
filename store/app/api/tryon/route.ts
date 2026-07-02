import { NextResponse } from "next/server";

import getProduct from "@/actions/get-product";
import { assistantRateLimiter } from "@/lib/assistant/rate-limit";
import { findStyle } from "@/lib/tryon/presets";
import {
  runTryOn,
  runTryOnOnPerson,
  tryOnConfigured,
  type TryOnResult,
} from "@/lib/tryon/provider";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  return `tryon:${fwd || real || "unknown"}`;
}

function json(result: TryOnResult, status = 200) {
  return NextResponse.json(result, { status });
}

async function garmentUrlFor(productId: string): Promise<string | null> {
  const product = await getProduct(productId);
  return product?.images?.[0]?.url ?? null;
}

export async function POST(req: Request) {
  if (!tryOnConfigured()) return json({ status: "offline" });

  // Image generation is costly — reuse the assistant rate limiter.
  if (!assistantRateLimiter.check(clientKey(req)).allowed) {
    return json({ status: "error" }, 429);
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    // --- On-me: multipart with the shopper's photo (never stored) ----------
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const productId = String(form.get("productId") || "");
      const photo = form.get("photo");

      if (!productId || !(photo instanceof File)) return json({ status: "invalid" }, 400);
      if (!photo.type.startsWith("image/")) return json({ status: "invalid" }, 400);
      if (photo.size > MAX_PHOTO_BYTES) {
        return json({ status: "invalid", message: "too_large" }, 400);
      }

      const garmentImageUrl = await garmentUrlFor(productId);
      if (!garmentImageUrl) return json({ status: "invalid" }, 400);

      const { imageUrl } = await runTryOnOnPerson({
        garmentImageUrl,
        personBytes: await photo.arrayBuffer(),
        personType: photo.type,
      });
      return json({ status: "ok", imageUrl });
    }

    // --- On-a-model: JSON with a style preset ------------------------------
    const body = (await req.json()) as { productId?: string; styleId?: string };
    const style = body.styleId ? findStyle(body.styleId) : undefined;
    if (!body.productId || !style) return json({ status: "invalid" }, 400);

    const garmentImageUrl = await garmentUrlFor(body.productId);
    if (!garmentImageUrl) return json({ status: "invalid" }, 400);

    const { imageUrl } = await runTryOn({
      garmentImageUrl,
      stylePrompt: style.prompt,
    });
    return json({ status: "ok", imageUrl });
  } catch {
    return json({ status: "error" });
  }
}

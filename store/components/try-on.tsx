"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { TRYON_PRESET_MODELS, tryOnEnabled } from "@/lib/tryon/presets";
import type { TryOnResult } from "@/lib/tryon/provider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
};

/**
 * Virtual Try-On (preset model bodies only — no shopper photo upload). Renders
 * nothing unless try-on is enabled + configured (see lib/tryon/presets.ts).
 * The result image comes from the vendor CDN, so a plain <img> is used to avoid
 * per-vendor next/image remotePatterns config.
 */
const TryOn = ({ product }: Props) => {
  const t = useTranslations("TryOn");
  const [modelId, setModelId] = useState(TRYON_PRESET_MODELS[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);

  if (!tryOnEnabled()) {
    return null;
  }

  const generate = async () => {
    if (!modelId || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, modelId }),
      });
      setResult((await res.json()) as TryOnResult);
    } catch {
      setResult({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <details className="border border-border">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:text-muted motion-reduce:transition-none">
        {t("title")}
      </summary>
      <div className="space-y-4 px-4 pb-4">
        <p className="text-xs text-muted-strong text-pretty">{t("presetNote")}</p>

        <div
          role="radiogroup"
          aria-label={t("chooseModel")}
          className="flex flex-wrap gap-2"
        >
          {TRYON_PRESET_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              role="radio"
              aria-checked={modelId === model.id}
              aria-label={t(model.labelKey)}
              onClick={() => setModelId(model.id)}
              className={cn(
                "relative size-16 overflow-hidden border bg-placeholder focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong",
                modelId === model.id ? "border-ink" : "border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={model.imageUrl}
                alt={t(model.labelKey)}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="border border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
        >
          {loading ? t("generating") : t("generate")}
        </button>

        <div aria-live="polite">
          {loading && (
            <div
              className="aspect-[3/4] w-full max-w-[280px] bg-surface-2"
              role="status"
              aria-label={t("generating")}
            />
          )}
          {!loading && result?.status === "ok" && result.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.imageUrl}
              alt={t("resultAlt")}
              className="w-full max-w-[280px] border border-border"
            />
          )}
          {!loading && result && result.status !== "ok" && (
            <p className="text-sm text-muted-strong">{t("error")}</p>
          )}
        </div>
      </div>
    </details>
  );
};

export default TryOn;

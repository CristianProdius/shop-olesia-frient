"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { TRYON_STYLES } from "@/lib/tryon/presets";
import type { TryOnResult } from "@/lib/tryon/provider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  enabled: boolean;
};

/**
 * Virtual Try-On (preset styles — no shopper photo upload). Renders nothing
 * unless `enabled` (decided server-side by the presence of the image API key).
 * The generated result is a data URI, rendered with a plain <img>.
 */
const TryOn = ({ product, enabled }: Props) => {
  const t = useTranslations("TryOn");
  const [styleId, setStyleId] = useState(TRYON_STYLES[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);

  if (!enabled) {
    return null;
  }

  const generate = async () => {
    if (!styleId || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, styleId }),
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
          aria-label={t("chooseStyle")}
          className="flex flex-wrap gap-2"
        >
          {TRYON_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              role="radio"
              aria-checked={styleId === style.id}
              onClick={() => setStyleId(style.id)}
              className={cn(
                "border px-3 py-2 text-sm transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none",
                styleId === style.id
                  ? "border-ink text-ink"
                  : "border-border text-text hover:border-ink",
              )}
            >
              {t(style.labelKey)}
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
              className="aspect-[2/3] w-full max-w-[280px] bg-surface-2"
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

        <p className="text-[11px] text-muted-strong text-pretty">
          {t("aiNote")}
        </p>
      </div>
    </details>
  );
};

export default TryOn;

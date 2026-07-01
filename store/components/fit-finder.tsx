"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localizedField } from "@/lib/i18n-content";
import { distinctSizes } from "@/lib/variants";
import type { Product, Size, SizeGuide } from "@/types";

const CANON = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
type Fit = "fitted" | "regular" | "relaxed";
const FITS: Fit[] = ["fitted", "regular", "relaxed"];
const FIT_KEY: Record<Fit, "fitFitted" | "fitRegular" | "fitRelaxed"> = {
  fitted: "fitFitted",
  regular: "fitRegular",
  relaxed: "fitRelaxed",
};

const norm = (value: string) => value.trim().toUpperCase();

type Props = {
  product: Product;
  sizeGuides: SizeGuide[];
};

/**
 * Deterministic "find my size" helper: recommends a size from the shopper's
 * usual size + fit preference, ordered by the size-guide rows (or a canonical
 * scale), and clamped to the product's in-stock sizes.
 */
const FitFinder = ({ product, sizeGuides }: Props) => {
  const t = useTranslations("FitFinder");
  const locale = useLocale();

  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [usualId, setUsualId] = useState("");
  const [fit, setFit] = useState<Fit>("regular");

  const inStockSizeIds = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      if (v.stockQty > 0 && v.size?.id) set.add(v.size.id);
    }
    return set;
  }, [variants]);

  const guideOrder = useMemo(
    () => (sizeGuides?.[0]?.rows ?? []).map((row) => norm(row.label)),
    [sizeGuides],
  );

  const ordered = useMemo(() => {
    const orderIndex = (size: Size) => {
      const key = norm(size.value || size.name);
      if (guideOrder.length > 0) {
        const gi = guideOrder.indexOf(key);
        if (gi >= 0) return gi;
      }
      const ci = CANON.indexOf(key);
      return ci >= 0 ? ci : 500 + key.charCodeAt(0);
    };
    return [...distinctSizes(variants)].sort(
      (a, b) => orderIndex(a) - orderIndex(b),
    );
  }, [variants, guideOrder]);

  const recommendation = useMemo(() => {
    if (!usualId) return null;
    const usualIdx = ordered.findIndex((s) => s.id === usualId);
    if (usualIdx < 0) return null;

    const delta = fit === "relaxed" ? 1 : fit === "fitted" ? -1 : 0;
    const targetIdx = Math.max(0, Math.min(ordered.length - 1, usualIdx + delta));
    const target = ordered[targetIdx];

    if (inStockSizeIds.has(target.id)) {
      return { size: target, target, substituted: false };
    }
    // Nearest in-stock size, searching outward from the target.
    for (let d = 1; d < ordered.length; d += 1) {
      const lo = targetIdx - d;
      const hi = targetIdx + d;
      if (lo >= 0 && inStockSizeIds.has(ordered[lo].id)) {
        return { size: ordered[lo], target, substituted: true };
      }
      if (hi < ordered.length && inStockSizeIds.has(ordered[hi].id)) {
        return { size: ordered[hi], target, substituted: true };
      }
    }
    return null;
  }, [usualId, fit, ordered, inStockSizeIds]);

  const label = (size: Size) =>
    localizedField(size.nameI18n, locale, size.value || size.name);

  // Nothing to recommend from if the product has no in-stock sizes.
  if (ordered.length === 0 || inStockSizeIds.size === 0) {
    return null;
  }

  return (
    <details className="border border-border">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:text-muted motion-reduce:transition-none">
        {t("title")}
      </summary>
      <div className="space-y-5 px-4 pb-4">
        <div>
          <label
            htmlFor="fit-usual"
            className="block text-xs font-bold uppercase tracking-[0.1em] text-muted-strong"
          >
            {t("usualSizeLabel")}
          </label>
          <select
            id="fit-usual"
            value={usualId}
            onChange={(event) => setUsualId(event.target.value)}
            className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-text focus:border-ink focus:outline-none"
          >
            <option value="">{t("choose")}</option>
            {ordered.map((size) => (
              <option key={size.id} value={size.id}>
                {label(size)}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
            {t("fitLabel")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {FITS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-sm text-text has-[:checked]:border-ink has-[:checked]:text-ink"
              >
                <input
                  type="radio"
                  name="fit-preference"
                  value={option}
                  checked={fit === option}
                  onChange={() => setFit(option)}
                  className="accent-ink"
                />
                {t(FIT_KEY[option])}
              </label>
            ))}
          </div>
        </fieldset>

        {recommendation && (
          <div aria-live="polite">
            <p className="text-sm text-text">
              {t("resultPrefix")}{" "}
              <strong className="text-ink">{label(recommendation.size)}</strong>
            </p>
            <p className="mt-1 text-xs text-muted-strong text-pretty">
              {t("rationale", {
                usual: label(ordered.find((s) => s.id === usualId) as Size),
                fit: t(FIT_KEY[fit]).toLowerCase(),
                size: label(recommendation.size),
              })}
            </p>
            {recommendation.substituted && (
              <p className="mt-1 text-xs text-sale">
                {t("outOfStockNote", { size: label(recommendation.target) })}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
};

export default FitFinder;

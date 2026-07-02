"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { TRYON_STYLES } from "@/lib/tryon/presets";
import type { TryOnResult } from "@/lib/tryon/provider";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Mode = "me" | "model";

type Props = {
  product: Product;
  enabled: boolean;
};

const TryOn = ({ product, enabled }: Props) => {
  const t = useTranslations("TryOn");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("me");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleId, setStyleId] = useState(TRYON_STYLES[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!enabled) return null;

  const resetPreview = (next: File | null) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
    setFile(next);
    setResult(null);
  };

  const onClose = () => {
    setOpen(false);
    setLoading(false);
    resetPreview(null);
  };

  const generate = async () => {
    if (loading) return;
    if (mode === "me" && !file) return;
    setLoading(true);
    setResult(null);
    try {
      let res: Response;
      if (mode === "me" && file) {
        const fd = new FormData();
        fd.append("productId", product.id);
        fd.append("photo", file);
        res = await fetch("/api/tryon", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, styleId }),
        });
      }
      setResult((await res.json()) as TryOnResult);
    } catch {
      setResult({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = mode === "model" || !!file;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 border border-border-strong px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
      >
        <Sparkles className="size-4 stroke-[1.5]" aria-hidden="true" />
        {t("title")}
      </button>

      <Dialog open={open} onClose={onClose} className="relative z-[100]">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 transition duration-300 ease-out data-[closed]:opacity-0 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <DialogPanel
            transition
            className="flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-hidden bg-background shadow-[var(--shadow-overlay)] transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-2 motion-reduce:transition-none motion-reduce:data-[closed]:translate-y-0"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <DialogTitle className="heading-luxe text-sm text-ink">
                {t("title")}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="flex size-9 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
              >
                <X className="size-[18px] stroke-[1.5]" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Mode toggle */}
              <div role="tablist" className="flex border border-border">
                {(["me", "model"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m);
                      setResult(null);
                    }}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors duration-200 ease-out motion-reduce:transition-none",
                      mode === m
                        ? "bg-ink text-white"
                        : "text-text hover:text-ink",
                    )}
                  >
                    {m === "me" ? t("modeMe") : t("modeModel")}
                  </button>
                ))}
              </div>

              {mode === "me" ? (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => resetPreview(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden border border-dashed border-border-strong bg-surface text-muted-strong transition-colors duration-200 ease-out hover:border-ink motion-reduce:transition-none"
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={t("photoPreviewAlt")}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-2 px-4 text-center text-xs">
                        <Upload className="size-5 stroke-[1.5]" aria-hidden="true" />
                        {t("uploadHint")}
                      </span>
                    )}
                  </button>
                  <p className="text-[11px] text-muted-strong text-pretty">
                    {t("consent")}
                  </p>
                </div>
              ) : (
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
                      onClick={() => {
                        setStyleId(style.id);
                        setResult(null);
                      }}
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
              )}

              <button
                type="button"
                onClick={generate}
                disabled={loading || !canGenerate}
                className="w-full border border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                {loading ? t("generating") : t("generate")}
              </button>

              <div aria-live="polite">
                {loading && (
                  <div
                    className="aspect-[2/3] w-full bg-surface-2"
                    role="status"
                    aria-label={t("generating")}
                  />
                )}
                {!loading && result?.status === "ok" && result.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.imageUrl}
                    alt={t("resultAlt")}
                    className="w-full border border-border"
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
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default TryOn;

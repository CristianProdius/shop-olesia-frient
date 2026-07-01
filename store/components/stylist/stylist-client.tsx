"use client";

import { Bookmark, Send, Shuffle, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

import AssistantProductCard from "@/components/assistant/assistant-product-card";
import useCart from "@/hooks/use-cart";
import type { AssistantStylistLook } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

const SAVED_KEY = "liletti_saved_looks";

const StylistClient = () => {
  const t = useTranslations("Stylist");
  const locale = useLocale();
  const cart = useCart();

  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [look, setLook] = useState<AssistantStylistLook | null>(null);

  const occasions = [
    t("occasionEvening"),
    t("occasionOffice"),
    t("occasionWeekend"),
    t("occasionWedding"),
    t("occasionTravel"),
  ];

  const requestLook = async (value: string, exclude: string[] = []) => {
    const text = value.trim();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, occasion: text, exclude }),
      });
      const data = (await res.json()) as AssistantStylistLook;
      setLook(data);
    } catch {
      setLook({
        status: "error",
        title: "",
        rationale: t("error"),
        products: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (value: string) => {
    setOccasion(value);
    void requestLook(value);
  };

  const shuffle = () => {
    const exclude = look?.products.map((p) => p.productId) ?? [];
    void requestLook(occasion, exclude);
  };

  const addAll = () => {
    const lines = look?.products.filter((p) => p.cartLine) ?? [];
    if (lines.length === 0) return;
    lines.forEach((p) => p.cartLine && cart.addItem(p.cartLine));
    toast.success(t("added"));
  };

  const saveLook = () => {
    if (!look || look.products.length === 0) return;
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify(
          [
            {
              title: look.title,
              rationale: look.rationale,
              productIds: look.products.map((p) => p.productId),
            },
            ...existing,
          ].slice(0, 12),
        ),
      );
      toast.success(t("saved"));
    } catch {
      // Best-effort; storage may be unavailable.
    }
  };

  const hasLook = look?.status === "ok" && look.products.length > 0;

  // Announce only a short status string — never the whole product grid.
  const statusMessage = loading
    ? t("thinking")
    : look && look.status !== "ok"
      ? look.status === "offline"
        ? t("offline")
        : t("error")
      : hasLook && look
        ? t("announceReady", { count: look.products.length })
        : "";

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-[640px]">
        <span
          className="flex size-11 items-center justify-center bg-ink text-white"
          aria-hidden="true"
        >
          <Sparkles className="size-5 stroke-[1.5]" />
        </span>
        <h1 className="heading-luxe mt-5 text-balance text-2xl text-ink">
          {t("title")}
        </h1>
        <p className="mt-3 text-pretty text-sm text-muted-strong">{t("intro")}</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(occasion);
        }}
        className="mt-8 flex max-w-[640px] gap-2"
      >
        <label htmlFor="stylist-occasion" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="stylist-occasion"
          value={occasion}
          onChange={(event) => setOccasion(event.target.value)}
          placeholder={t("placeholder")}
          enterKeyHint="send"
          autoComplete="off"
          className="min-w-0 flex-1 border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-muted-strong focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label={t("cta")}
          className="flex items-center gap-2 border border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
        >
          <Send className="size-4 stroke-[1.5]" aria-hidden="true" />
          <span className="hidden sm:inline">{t("cta")}</span>
        </button>
      </form>

      <div className="mt-4 flex max-w-[640px] flex-wrap gap-2">
        {occasions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSubmit(item)}
            disabled={loading}
            className="border border-border px-3 py-2 text-xs text-text transition-colors duration-200 ease-out hover:border-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong disabled:opacity-40 motion-reduce:transition-none"
          >
            {item}
          </button>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <div className="mt-14">
        {loading && <StylistSkeleton />}

        {!loading && look && look.status !== "ok" && (
          <p className="text-sm text-muted-strong">
            {look.status === "offline" ? t("offline") : t("error")}
          </p>
        )}

        {!loading && look?.status === "ok" && !hasLook && (
          <p className="text-sm text-muted-strong">{t("noLook")}</p>
        )}

        {!loading && hasLook && look && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-[560px]">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                  {t("theLook")}
                </p>
                {look.title && (
                  <h2 className="heading-luxe mt-2 text-balance text-xl text-ink">
                    {look.title}
                  </h2>
                )}
                {look.rationale && (
                  <p className="mt-3 text-pretty text-sm text-text">
                    {look.rationale}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={shuffle} icon={<Shuffle className="size-4 stroke-[1.5]" aria-hidden="true" />}>
                  {t("shuffle")}
                </ActionButton>
                <ActionButton onClick={saveLook} icon={<Bookmark className="size-4 stroke-[1.5]" aria-hidden="true" />}>
                  {t("save")}
                </ActionButton>
              </div>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {look.products.map((product) => (
                <li key={product.productId} className="flex">
                  <AssistantProductCard item={product} layout="tile" />
                </li>
              ))}
            </ul>

            {look.products.some((p) => p.cartLine) && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={addAll}
                  className="border border-ink bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
                >
                  {t("addAll")}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !look && (
          <p className="text-sm text-muted-strong">{t("empty")}</p>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 border border-border-strong px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
  >
    {icon}
    {children}
  </button>
);

const StylistSkeleton = () => (
  <div aria-hidden="true">
    <div className="h-4 w-24 bg-surface-2" />
    <div className="mt-3 h-6 w-56 bg-surface-2" aria-hidden="true" />
    <ul
      className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className={cn("aspect-[3/4] w-full bg-surface-2")} />
          <div className="mt-3 h-3 w-3/4 bg-surface-2" />
          <div className="mt-2 h-3 w-1/3 bg-surface-2" />
        </li>
      ))}
    </ul>
  </div>
);

export default StylistClient;

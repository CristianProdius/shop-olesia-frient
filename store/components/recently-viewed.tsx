"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import ProductList from "@/components/product-list";
import type { Product } from "@/types";

const STORAGE_KEY = "liletti_recently_viewed";
const MAX_STORED = 8;
const MAX_SHOWN = 4;

function readStored(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Product =>
        !!item && typeof (item as Product).id === "string",
    );
  } catch {
    return [];
  }
}

type Props = {
  product: Product;
};

/**
 * Records the current product to localStorage on view and renders a strip of
 * previously viewed products (excluding the current one). Client-only: renders
 * nothing on the server / before hydration to avoid mismatches.
 */
const RecentlyViewed = ({ product }: Props) => {
  const t = useTranslations("Product");
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    const stored = readStored();
    // Show what was viewed before this visit (excluding the current product).
    setItems(stored.filter((item) => item.id !== product.id).slice(0, MAX_SHOWN));

    // Record the current product at the front, de-duplicated and capped.
    const next = [
      product,
      ...stored.filter((item) => item.id !== product.id),
    ].slice(0, MAX_STORED);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or unavailable — recording is best-effort.
    }
  }, [product]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <>
      <hr className="my-16 border-border" />
      <ProductList title={t("recentlyViewed")} items={items} cols="wide" />
    </>
  );
};

export default RecentlyViewed;

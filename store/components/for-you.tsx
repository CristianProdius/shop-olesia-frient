"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Container from "@/components/ui/container";
import ProductList from "@/components/product-list";
import type { Product } from "@/types";

const RECENTLY_VIEWED_KEY = "liletti_recently_viewed";
const MAX_SHOWN = 4;

function readRecentlyViewed(): Product[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
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

/**
 * Ranks the catalog pool against the shopper's recently-viewed signal: products
 * in the same categories rank first, then by price proximity to what they
 * browsed. Excludes already-viewed items so the edit stays fresh.
 */
function personalize(pool: Product[], viewed: Product[]): Product[] {
  const viewedIds = new Set(viewed.map((p) => p.id));
  const viewedCategories = new Set(
    viewed.map((p) => p.category?.id).filter(Boolean) as string[],
  );
  const prices = viewed
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n));
  const avgPrice =
    prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return pool
    .filter((p) => !viewedIds.has(p.id))
    .map((p) => {
      const categoryMatch = viewedCategories.has(p.category?.id ?? "") ? 1 : 0;
      const priceDistance = avgPrice
        ? Math.abs(Number(p.price) - avgPrice)
        : 0;
      return { product: p, categoryMatch, priceDistance };
    })
    .sort((a, b) => {
      if (b.categoryMatch !== a.categoryMatch) {
        return b.categoryMatch - a.categoryMatch;
      }
      return a.priceDistance - b.priceDistance;
    })
    .slice(0, MAX_SHOWN)
    .map((entry) => entry.product);
}

type Props = {
  pool: Product[];
};

const ForYou = ({ pool }: Props) => {
  const t = useTranslations("Home");
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    const viewed = readRecentlyViewed();
    if (viewed.length === 0) {
      setItems([]);
      return;
    }
    setItems(personalize(pool, viewed));
  }, [pool]);

  // Render nothing until we know there is a personalized edit to show — avoids
  // an SSR/client mismatch and a redundant generic strip for first-time visitors.
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Container>
      <section className="py-20 md:py-24">
        <ProductList title={t("forYou")} items={items} cols="wide" />
      </section>
    </Container>
  );
};

export default ForYou;

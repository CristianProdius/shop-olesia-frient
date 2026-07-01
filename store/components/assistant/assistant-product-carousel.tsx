"use client";

import { useTranslations } from "next-intl";

import type { AssistantProductRecommendation } from "@/lib/assistant/types";

import AssistantProductCard from "./assistant-product-card";

type Props = {
  products: AssistantProductRecommendation[];
  onAddToCart?: () => void;
};

const AssistantProductCarousel = ({ products, onAddToCart }: Props) => {
  const t = useTranslations("Assistant");

  if (products.length === 0) {
    return null;
  }

  if (products.length === 1) {
    return (
      <div className="mt-3">
        <AssistantProductCard item={products[0]} onAddToCart={onAddToCart} />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
        {t("products")}
      </p>
      <ul
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t("products")}
      >
        {products.map((product) => (
          <li key={product.productId} className="flex">
            <AssistantProductCard
              item={product}
              layout="tile"
              onAddToCart={onAddToCart}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssistantProductCarousel;

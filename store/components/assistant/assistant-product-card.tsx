"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import Currency from "@/components/ui/currency";
import useCart from "@/hooks/use-cart";
import { Link } from "@/i18n/navigation";
import type { AssistantProductRecommendation } from "@/lib/assistant/types";

type Props = {
  item: AssistantProductRecommendation;
  onAddToCart?: () => void;
};

const AssistantProductCard = ({ item, onAddToCart }: Props) => {
  const t = useTranslations("Assistant");
  const cart = useCart();

  const stockLabel =
    item.stockState === "out"
      ? t("soldOut")
      : item.stockState === "low"
        ? t("lowStock")
        : t("inStock");

  const addToCart = () => {
    if (!item.cartLine) return;
    cart.addItem(item.cartLine);
    onAddToCart?.();
  };

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border border-border p-3">
      <div className="relative aspect-[3/4] overflow-hidden bg-placeholder">
        {item.imageUrl && (
          <Image
            fill
            src={item.imageUrl}
            alt={item.name}
            sizes="72px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-text">{item.name}</p>
        {item.categoryName && (
          <p className="mt-1 truncate text-xs text-muted-strong">
            {item.categoryName}
          </p>
        )}
        <div className="mt-2 text-sm text-text">
          <Currency value={item.price} />
        </div>
        <p className="mt-2 text-xs text-muted-strong">{stockLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/product/${item.productId}`}
            className="border border-border-strong px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
          >
            {t("viewProduct")}
          </Link>
          {item.cartLine && (
            <button
              type="button"
              onClick={addToCart}
              className="border border-ink bg-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
            >
              {t("addToCart")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default AssistantProductCard;

import type { Product, ProductVariant } from "@/types";
import { localizedField } from "../i18n-content";
import { stockState, totalStock } from "../variants";

import { getAssistantRuntimeConfig } from "./config";
import type {
  AssistantLocale,
  AssistantProductCartLine,
  AssistantProductRecommendation,
} from "./types";

export interface CatalogSearchInput {
  query: string;
  locale: AssistantLocale;
  category?: string;
  size?: string;
  color?: string;
  material?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
  limit?: number;
}

function clean(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function includesText(haystack: string, needle: string | undefined): boolean {
  if (!needle || !needle.trim()) {
    return true;
  }

  return haystack.includes(clean(needle));
}

function localizedProductText(product: Product, locale: AssistantLocale): string {
  const variantText = (product.variants ?? [])
    .map((variant) =>
      [
        variant.sku ?? "",
        variant.size?.name ?? "",
        variant.size?.value ?? "",
        localizedField(
          variant.size?.nameI18n,
          locale,
          variant.size?.name ?? "",
        ),
        variant.color?.name ?? "",
        variant.color?.value ?? "",
        localizedField(
          variant.color?.nameI18n,
          locale,
          variant.color?.name ?? "",
        ),
      ].join(" "),
    )
    .join(" ");

  return [
    product.name,
    localizedField(product.nameI18n, locale, product.name),
    product.description ?? "",
    localizedField(product.descriptionI18n, locale, product.description ?? ""),
    product.material ?? "",
    localizedField(product.materialI18n, locale, product.material ?? ""),
    product.sku ?? "",
    product.category?.name ?? "",
    localizedField(
      product.category?.nameI18n,
      locale,
      product.category?.name ?? "",
    ),
    variantText,
  ]
    .join(" ")
    .toLowerCase();
}

function variantMatches(
  variant: ProductVariant,
  input: Pick<CatalogSearchInput, "size" | "color">,
  locale: AssistantLocale,
): boolean {
  const size = clean(input.size);
  const color = clean(input.color);
  const variantSize = clean(
    [
      variant.size?.name,
      variant.size?.value,
      localizedField(variant.size?.nameI18n, locale, variant.size?.name ?? ""),
    ].join(" "),
  );
  const variantColor = clean(
    [
      variant.color?.name,
      variant.color?.value,
      localizedField(
        variant.color?.nameI18n,
        locale,
        variant.color?.name ?? "",
      ),
    ].join(" "),
  );

  return (
    (!size || variantSize.includes(size)) &&
    (!color || variantColor.includes(color))
  );
}

function selectedInStockVariant(
  product: Product,
  input: Pick<CatalogSearchInput, "size" | "color">,
  locale: AssistantLocale,
): ProductVariant | undefined {
  const matches = (product.variants ?? []).filter(
    (variant) => variant.stockQty > 0 && variantMatches(variant, input, locale),
  );

  return matches.length === 1 ? matches[0] : undefined;
}

function toCartLine(
  product: Product,
  variant: ProductVariant,
): AssistantProductCartLine {
  return {
    ...product,
    variantId: variant.id,
    selectedSize: variant.size,
    selectedColor: variant.color,
    unitPrice: product.price,
    quantity: 1,
  };
}

function summarizeVariants(product: Product, locale: AssistantLocale) {
  return (product.variants ?? []).map((variant) => ({
    id: variant.id,
    size:
      variant.size?.value ||
      localizedField(variant.size?.nameI18n, locale, variant.size?.name ?? ""),
    color: localizedField(
      variant.color?.nameI18n,
      locale,
      variant.color?.name ?? "",
    ),
    colorValue: variant.color?.value ?? "",
    stockQty: variant.stockQty,
  }));
}

function toRecommendation(
  product: Product,
  input: Pick<CatalogSearchInput, "locale" | "size" | "color">,
): AssistantProductRecommendation {
  const stock = totalStock(product.variants ?? []);
  const selected = selectedInStockVariant(product, input, input.locale);
  const state = stockState(stock);
  const name = localizedField(product.nameI18n, input.locale, product.name);
  const categoryName = localizedField(
    product.category?.nameI18n,
    input.locale,
    product.category?.name ?? "",
  );

  return {
    product,
    productId: product.id,
    name,
    description: localizedField(
      product.descriptionI18n,
      input.locale,
      product.description ?? "",
    ),
    price: product.price,
    imageUrl: product.images?.[0]?.url,
    categoryName,
    reason:
      state === "out"
        ? "Matches the request but is currently sold out."
        : "Matches the request and has available stock.",
    stockState: state,
    variants: summarizeVariants(product, input.locale),
    cartLine: selected ? toCartLine(product, selected) : undefined,
  };
}

export function searchProductsFromCatalog(
  products: Product[],
  input: CatalogSearchInput,
): AssistantProductRecommendation[] {
  const query = clean(input.query);
  const limit = input.limit ?? getAssistantRuntimeConfig().maxProducts;

  return products
    .filter((product) => {
      const haystack = localizedProductText(product, input.locale);
      const price = Number(product.price);
      const stock = totalStock(product.variants ?? []);

      if (
        query &&
        !query.split(/\s+/).every((part) => includesText(haystack, part))
      ) {
        return false;
      }
      if (!includesText(haystack, input.category)) {
        return false;
      }
      if (!includesText(haystack, input.material)) {
        return false;
      }
      if (
        input.maxPrice !== undefined &&
        Number.isFinite(price) &&
        price > input.maxPrice
      ) {
        return false;
      }
      if (input.inStockOnly && stock <= 0) {
        return false;
      }
      if (
        (input.size || input.color) &&
        !(product.variants ?? []).some((variant) =>
          variantMatches(variant, input, input.locale),
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const stockDiff = totalStock(b.variants ?? []) - totalStock(a.variants ?? []);
      if (stockDiff !== 0) {
        return stockDiff;
      }

      return Number(a.price) - Number(b.price);
    })
    .slice(0, limit)
    .map((product) => toRecommendation(product, input));
}

export function getProductDetailsFromCatalog(
  products: Product[],
  productIds: string[],
  locale: AssistantLocale,
): AssistantProductRecommendation[] {
  const wanted = new Set(productIds);

  return products
    .filter((product) => wanted.has(product.id))
    .map((product) => toRecommendation(product, { locale }));
}

export function buildCartSuggestion(
  products: Product[],
  input: { productId: string; variantId: string; locale: AssistantLocale },
): AssistantProductRecommendation | undefined {
  const product = products.find((item) => item.id === input.productId);
  const variant = product?.variants?.find((item) => item.id === input.variantId);

  if (!product || !variant || variant.stockQty <= 0) {
    return undefined;
  }

  return {
    ...toRecommendation(product, { locale: input.locale }),
    cartLine: toCartLine(product, variant),
  };
}

import { describe, expect, it } from "vitest";
import type { Category, Color, Product, ProductVariant, Size } from "@/types";

import {
  buildCartSuggestion,
  getProductDetailsFromCatalog,
  searchProductsFromCatalog,
} from "./catalog";

const sizeS: Size = {
  id: "size-s",
  name: "Small",
  nameI18n: { ro: "Mic" },
  value: "S",
};
const sizeM: Size = {
  id: "size-m",
  name: "Medium",
  nameI18n: { ro: "Mediu" },
  value: "M",
};
const black: Color = {
  id: "black",
  name: "Black",
  nameI18n: { ro: "Negru" },
  value: "#000000",
};
const red: Color = {
  id: "red",
  name: "Red",
  nameI18n: { ro: "Rosu" },
  value: "#ff0000",
};
const category: Category = {
  id: "cat-dresses",
  name: "Dresses",
  nameI18n: { ro: "Rochii" },
};

function variant(
  id: string,
  size: Size,
  color: Color,
  stockQty: number,
): ProductVariant {
  return {
    id,
    sku: id.toUpperCase(),
    sizeId: size.id,
    colorId: color.id,
    size,
    color,
    stockQty,
  };
}

function product(overrides: Partial<Product>): Product {
  return {
    id: "p-1",
    category,
    name: "Evening Silk Dress",
    nameI18n: { ro: "Rochie de seara din matase" },
    sku: "DRESS-1",
    description: "A black silk dress for evening events.",
    descriptionI18n: { ro: "Rochie neagra din matase pentru evenimente." },
    material: "100% silk",
    materialI18n: { ro: "100% matase" },
    care: "Dry clean only",
    careI18n: null,
    price: "1200",
    isFeatured: false,
    size: sizeS,
    color: black,
    images: [{ id: "img-1", url: "https://example.test/dress.jpg" }],
    variants: [
      variant("v-out", sizeS, black, 0),
      variant("v-low", sizeM, black, 2),
      variant("v-red", sizeM, red, 5),
    ],
    ...overrides,
  };
}

describe("searchProductsFromCatalog", () => {
  it("matches localized product and material text", () => {
    const results = searchProductsFromCatalog([product({})], {
      query: "matase seara",
      locale: "ro",
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Rochie de seara din matase");
    expect(results[0].categoryName).toBe("Rochii");
  });

  it("filters by max price and selected color", () => {
    const results = searchProductsFromCatalog(
      [
        product({ id: "p-1", price: "1200" }),
        product({ id: "p-2", price: "2200" }),
      ],
      { query: "dress", locale: "en", maxPrice: 1500, color: "black" },
    );

    expect(results.map((result) => result.productId)).toEqual(["p-1"]);
  });

  it("ranks in-stock products before sold-out products", () => {
    const inStock = product({ id: "p-in" });
    const soldOut = product({
      id: "p-out",
      variants: [variant("sold", sizeS, black, 0)],
    });

    const results = searchProductsFromCatalog([soldOut, inStock], {
      query: "dress",
      locale: "en",
    });

    expect(results.map((result) => result.productId)).toEqual(["p-in", "p-out"]);
    expect(results[0].stockState).toBe("in");
    expect(results[1].stockState).toBe("out");
  });

  it("returns a cart line only for a single concrete in-stock selected variant", () => {
    const results = searchProductsFromCatalog([product({})], {
      query: "dress",
      locale: "en",
      size: "M",
      color: "black",
    });

    expect(results[0].cartLine?.variantId).toBe("v-low");
    expect(results[0].cartLine?.selectedSize.value).toBe("M");
  });

  it("honors an explicit limit", () => {
    const results = searchProductsFromCatalog(
      [
        product({ id: "p-1", price: "1200" }),
        product({ id: "p-2", price: "1300" }),
      ],
      { query: "dress", locale: "en", limit: 1 },
    );

    expect(results).toHaveLength(1);
  });
});

describe("getProductDetailsFromCatalog", () => {
  it("returns only requested products", () => {
    const results = getProductDetailsFromCatalog(
      [product({ id: "p-1" }), product({ id: "p-2" })],
      ["p-2"],
      "en",
    );

    expect(results.map((result) => result.productId)).toEqual(["p-2"]);
  });
});

describe("buildCartSuggestion", () => {
  it("returns undefined for sold-out variants", () => {
    const suggestion = buildCartSuggestion([product({})], {
      productId: "p-1",
      variantId: "v-out",
      locale: "en",
    });

    expect(suggestion).toBeUndefined();
  });

  it("returns a cart line for an in-stock variant", () => {
    const suggestion = buildCartSuggestion([product({})], {
      productId: "p-1",
      variantId: "v-low",
      locale: "en",
    });

    expect(suggestion?.cartLine?.variantId).toBe("v-low");
  });
});

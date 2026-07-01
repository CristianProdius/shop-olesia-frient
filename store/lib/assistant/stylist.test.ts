import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/types";

import {
  buildCatalogDigest,
  generateStylistLook,
  parseStylistJson,
} from "./stylist";

function makeProduct(id: string, stockQty: number): Product {
  return {
    id,
    name: `Product ${id}`,
    nameI18n: null,
    price: "1000",
    description: null,
    descriptionI18n: null,
    isFeatured: false,
    category: { id: "c1", name: "Dresses", nameI18n: null },
    images: [{ id: `${id}-img`, url: `https://cdn/${id}.jpg` }],
    variants: [
      {
        id: `${id}-v1`,
        stockQty,
        size: { id: "s1", name: "M", value: "M" },
        color: { id: "co1", name: "Black", value: "#000000" },
      },
    ],
  } as unknown as Product;
}

function anthropicResponse(json: object) {
  return {
    ok: true,
    json: async () => ({
      content: [{ type: "text", text: JSON.stringify(json) }],
    }),
  };
}

describe("parseStylistJson", () => {
  it("parses title, rationale, and productIds", () => {
    const parsed = parseStylistJson(
      '{"title":" Evening Grace ","rationale":" Pairs well. ","productIds":["a"," b ","",5]}',
    );
    expect(parsed.title).toBe("Evening Grace");
    expect(parsed.rationale).toBe("Pairs well.");
    expect(parsed.productIds).toEqual(["a", "b"]);
  });

  it("tolerates a fenced code block", () => {
    const parsed = parseStylistJson(
      '```json\n{"title":"X","rationale":"Y","productIds":["p1"]}\n```',
    );
    expect(parsed.productIds).toEqual(["p1"]);
  });
});

describe("buildCatalogDigest", () => {
  it("keeps only in-stock, non-excluded products", () => {
    const products = [
      makeProduct("p1", 5),
      makeProduct("p2", 0), // out of stock
      makeProduct("p3", 2),
    ];
    const { allowed } = buildCatalogDigest(products, "en", ["p3"]);
    expect(Array.from(allowed).sort()).toEqual(["p1"]);
  });
});

describe("generateStylistLook", () => {
  const products = [makeProduct("p1", 5), makeProduct("p2", 3), makeProduct("p3", 0)];

  it("hydrates only valid, in-stock ids the model returned", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      anthropicResponse({
        title: "Evening Grace",
        rationale: "These pieces share a palette.",
        productIds: ["p1", "p2", "p3", "bogus"],
      }),
    );

    const look = await generateStylistLook({
      apiKey: "key",
      model: "claude-haiku-4-5",
      locale: "en",
      occasion: "a winter wedding",
      products,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(look.title).toBe("Evening Grace");
    expect(look.products.map((p) => p.productId)).toEqual(["p1", "p2"]);
    // Non-streaming JSON request.
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.stream).toBeUndefined();
  });

  it("throws when the provider fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      generateStylistLook({
        apiKey: "key",
        model: "claude-haiku-4-5",
        locale: "en",
        occasion: "x",
        products,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/500/);
  });

  it("throws when the catalog has no in-stock items", async () => {
    const fetchImpl = vi.fn();
    await expect(
      generateStylistLook({
        apiKey: "key",
        model: "claude-haiku-4-5",
        locale: "en",
        occasion: "x",
        products: [makeProduct("p3", 0)],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import type { Order } from "@/types";

import {
  extractGuestLookupFields,
  shapeOrderSummaries,
  signedOutOrderMessage,
} from "./orders";

const order = (overrides: Partial<Order>): Order => ({
  id: "order-1",
  status: "shipped",
  carrier: "DHL",
  trackingNumber: "TRACK123",
  createdAt: "2026-07-01T10:00:00.000Z",
  total: "2400",
  items: [
    {
      id: "line-1",
      productId: "product-1",
      variantId: "variant-1",
      quantity: 2,
      unitPrice: "1200",
      productName: "Evening Silk Dress",
    },
  ],
  ...overrides,
});

describe("shapeOrderSummaries", () => {
  it("shapes compact order summaries", () => {
    const summaries = shapeOrderSummaries([order({})]);

    expect(summaries[0]).toMatchObject({
      id: "order-1",
      orderNumber: "order-1",
      status: "shipped",
      tracking: "DHL TRACK123",
      total: "2400",
    });
    expect(summaries[0].items[0].quantity).toBe(2);
  });

  it("respects limit", () => {
    const summaries = shapeOrderSummaries(
      [order({ id: "a" }), order({ id: "b" })],
      1,
    );

    expect(summaries.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("extractGuestLookupFields", () => {
  it("requires both order id and email", () => {
    expect(extractGuestLookupFields({ orderId: "abc", email: "" })).toBeNull();
    expect(
      extractGuestLookupFields({ orderId: "", email: "a@b.test" }),
    ).toBeNull();
  });

  it("trims valid order lookup fields", () => {
    expect(
      extractGuestLookupFields({
        orderId: " order-1 ",
        email: " shopper@example.test ",
      }),
    ).toEqual({
      orderId: "order-1",
      email: "shopper@example.test",
    });
  });
});

describe("signedOutOrderMessage", () => {
  it("returns localized guidance", () => {
    expect(signedOutOrderMessage("en")).toContain("sign in");
    expect(signedOutOrderMessage("ro")).toContain("autentifica");
    expect(signedOutOrderMessage("ru")).toContain("войдите");
  });
});

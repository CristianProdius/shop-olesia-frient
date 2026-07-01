import { describe, it, expect, vi } from "vitest";
import {
  buildAlternates,
  productJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
  faqPageJsonLd,
  aggregateRatingJsonLd,
} from "./seo";

describe("buildAlternates", () => {
  const r = buildAlternates("https://liletti.delice.my", "ro", "/product/123");
  it("sets the canonical to the current locale", () => {
    expect(r.canonical).toBe("https://liletti.delice.my/ro/product/123");
  });
  it("emits reciprocal hreflang for every locale + x-default", () => {
    expect(r.languages["en"]).toBe("https://liletti.delice.my/en/product/123");
    expect(r.languages["ru"]).toBe("https://liletti.delice.my/ru/product/123");
    expect(r.languages["ro"]).toBe("https://liletti.delice.my/ro/product/123");
    expect(r.languages["x-default"]).toBe("https://liletti.delice.my/en/product/123");
  });
});

describe("SITE_URL", () => {
  it("falls back when NEXT_PUBLIC_SITE_URL is blank", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();

    const seo = await import("./seo");

    expect(seo.SITE_URL).toBe("https://liletti.delice.my");
    vi.unstubAllEnvs();
  });
});

describe("productJsonLd", () => {
  const ld = productJsonLd({
    name: "Silk Dress", description: "Hand-made", images: ["https://x/img.jpg"],
    price: 1200, currency: "MDL", url: "https://liletti.delice.my/en/product/1",
  });
  it("is a schema.org Product", () => {
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.priceCurrency).toBe("MDL");
    expect(ld.offers.price).toBe("1200");
  });
});

describe("aggregateRatingJsonLd", () => {
  it("returns null when there are no reviews", () => {
    expect(aggregateRatingJsonLd([])).toBeNull();
  });
  it("averages the ratings and counts the reviews", () => {
    const agg = aggregateRatingJsonLd([{ rating: 5 }, { rating: 4 }, { rating: 3 }]);
    expect(agg).toEqual({ ratingValue: 4, reviewCount: 3 });
  });
  it("rounds the average to one decimal place", () => {
    const agg = aggregateRatingJsonLd([{ rating: 5 }, { rating: 4 }]);
    expect(agg).toEqual({ ratingValue: 4.5, reviewCount: 2 });
    const agg2 = aggregateRatingJsonLd([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    expect(agg2?.ratingValue).toBe(4.3);
  });
  it("feeds the productJsonLd AggregateRating", () => {
    const agg = aggregateRatingJsonLd([{ rating: 5 }, { rating: 5 }]);
    const ld = productJsonLd({
      name: "Silk Dress", description: "x", images: [], price: 10, currency: "MDL",
      url: "u", aggregateRating: agg ?? undefined,
    });
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating", ratingValue: 5, reviewCount: 2,
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("orders items by position", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", url: "u1" }, { name: "Dresses", url: "u2" }]);
    expect(ld.itemListElement[1].position).toBe(2);
  });
});

describe("organizationJsonLd", () => {
  it("names LILETTI", () => {
    expect(organizationJsonLd("https://liletti.delice.my").name).toBe("LILETTI");
  });
});

describe("faqPageJsonLd", () => {
  const ld = faqPageJsonLd([{ question: "Shipping?", answer: "Worldwide." }, { question: "Returns?", answer: "14 days." }]);
  it("is a schema.org FAQPage", () => expect(ld["@type"]).toBe("FAQPage"));
  it("maps each item to a Question with an acceptedAnswer", () => {
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]["@type"]).toBe("Question");
    expect(ld.mainEntity[0].name).toBe("Shipping?");
    expect(ld.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe("Worldwide.");
  });
});

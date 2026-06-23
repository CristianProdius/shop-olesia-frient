import { describe, it, expect } from "vitest";
import {
  buildAlternates,
  productJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
  faqPageJsonLd,
} from "./seo";

describe("buildAlternates", () => {
  const r = buildAlternates("https://liletti.md", "ro", "/product/123");
  it("sets the canonical to the current locale", () => {
    expect(r.canonical).toBe("https://liletti.md/ro/product/123");
  });
  it("emits reciprocal hreflang for every locale + x-default", () => {
    expect(r.languages["en"]).toBe("https://liletti.md/en/product/123");
    expect(r.languages["ru"]).toBe("https://liletti.md/ru/product/123");
    expect(r.languages["ro"]).toBe("https://liletti.md/ro/product/123");
    expect(r.languages["x-default"]).toBe("https://liletti.md/en/product/123");
  });
});

describe("productJsonLd", () => {
  const ld = productJsonLd({
    name: "Silk Dress", description: "Hand-made", images: ["https://x/img.jpg"],
    price: 1200, currency: "MDL", url: "https://liletti.md/en/product/1",
  });
  it("is a schema.org Product", () => {
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.priceCurrency).toBe("MDL");
    expect(ld.offers.price).toBe("1200");
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
    expect(organizationJsonLd("https://liletti.md").name).toBe("LILETTI");
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

import { describe, expect, it } from "vitest";
import type { ContentBlock, Faq } from "@/types";

import { searchStoreKnowledge } from "./content";

const faq = (overrides: Partial<Faq>): Faq => ({
  id: "faq-1",
  category: "Delivery",
  categoryI18n: { ro: "Livrare" },
  question: "How long does delivery take?",
  questionI18n: { ro: "Cat dureaza livrarea?" },
  answer: "Delivery usually takes 2 to 5 business days.",
  answerI18n: { ro: "Livrarea dureaza de obicei 2-5 zile lucratoare." },
  order: 0,
  isPublished: true,
  ...overrides,
});

const block = (overrides: Partial<ContentBlock>): ContentBlock => ({
  id: "content-1",
  type: "brand-story",
  heading: "Made in our atelier",
  headingI18n: { ro: "Creat in atelierul nostru" },
  body: "Every piece is made in-house.",
  bodyI18n: { ro: "Fiecare piesa este creata intern." },
  mediaUrl: null,
  order: 0,
  isPublished: true,
  ...overrides,
});

describe("searchStoreKnowledge", () => {
  it("searches localized FAQ text", () => {
    const results = searchStoreKnowledge({
      query: "livrare",
      locale: "ro",
      faqs: [faq({})],
      contentBlocks: [],
    });

    expect(results[0].label).toBe("Livrare");
    expect(results[0].excerpt).toContain("2-5 zile");
  });

  it("searches published content blocks", () => {
    const results = searchStoreKnowledge({
      query: "atelier",
      locale: "en",
      faqs: [],
      contentBlocks: [block({})],
    });

    expect(results[0].type).toBe("content");
    expect(results[0].excerpt).toContain("Every piece");
  });

  it("does not expose unpublished content", () => {
    const results = searchStoreKnowledge({
      query: "secret",
      locale: "en",
      faqs: [faq({ isPublished: false, answer: "secret answer" })],
      contentBlocks: [block({ isPublished: false, body: "secret body" })],
    });

    expect(results).toEqual([]);
  });

  it("respects the result limit", () => {
    const results = searchStoreKnowledge({
      query: "delivery",
      locale: "en",
      faqs: [faq({ id: "faq-1" }), faq({ id: "faq-2" })],
      contentBlocks: [],
      limit: 1,
    });

    expect(results.map((result) => result.id)).toEqual(["faq-1"]);
  });
});

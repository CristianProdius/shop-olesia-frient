import { describe, it, expect } from "vitest";
import { publishedSorted } from "./content";
import type { ContentBlock } from "@/types";

const block = (over: Partial<ContentBlock>): ContentBlock => ({
  id: "1",
  type: "brand-story",
  heading: "h",
  headingI18n: null,
  body: "b",
  bodyI18n: null,
  mediaUrl: null,
  order: 0,
  isPublished: true,
  ...over,
});

describe("publishedSorted", () => {
  it("drops unpublished blocks", () => {
    const out = publishedSorted([
      block({ id: "a", isPublished: false }),
      block({ id: "b", isPublished: true }),
    ]);
    expect(out.map((b) => b.id)).toEqual(["b"]);
  });

  it("sorts by ascending order", () => {
    const out = publishedSorted([
      block({ id: "a", order: 2 }),
      block({ id: "b", order: 0 }),
      block({ id: "c", order: 1 }),
    ]);
    expect(out.map((b) => b.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [block({ id: "a", order: 2 }), block({ id: "b", order: 1 })];
    const before = input.map((b) => b.id);
    publishedSorted(input);
    expect(input.map((b) => b.id)).toEqual(before);
  });
});

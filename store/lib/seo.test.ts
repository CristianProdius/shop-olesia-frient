import { describe, it, expect } from "vitest";
import { buildAlternates } from "./seo";

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

import { describe, it, expect } from "vitest";
import { localeTag, formatCurrency } from "./format";

describe("localeTag", () => {
  it("maps ro to ro-MD", () => expect(localeTag("ro")).toBe("ro-MD"));
  it("maps ru to ru-RU", () => expect(localeTag("ru")).toBe("ru-RU"));
  it("defaults unknown to en-US", () => expect(localeTag("xx")).toBe("en-US"));
});

describe("formatCurrency", () => {
  it("formats MDL (not USD)", () => {
    const out = formatCurrency(1200, "en");
    expect(out).toMatch(/MDL|L/);
    expect(out).not.toMatch(/\$/);
  });
  it("uses locale grouping for ru", () => {
    expect(formatCurrency(1200, "ru")).toMatch(/1[\s  ]?200/);
  });
});

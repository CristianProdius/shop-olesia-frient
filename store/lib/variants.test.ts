import { describe, it, expect } from "vitest";
import {
    distinctSizes,
    distinctColors,
    resolveVariant,
    isCombinationAvailable,
} from "./variants";
import { ProductVariant, Size, Color } from "@/types";

const sizeS: Size = { id: "s", name: "Small", value: "S" };
const sizeM: Size = { id: "m", name: "Medium", value: "M" };
const red: Color = { id: "red", name: "Red", value: "#ff0000" };
const blue: Color = { id: "blue", name: "Blue", value: "#0000ff" };

const v = (
    id: string,
    size: Size,
    color: Color,
    stockQty: number,
): ProductVariant => ({
    id,
    sizeId: size.id,
    colorId: color.id,
    size,
    color,
    stockQty,
});

const variants: ProductVariant[] = [
    v("1", sizeS, red, 5),
    v("2", sizeS, blue, 0),
    v("3", sizeM, red, 2),
    // note: M/blue intentionally missing
];

describe("distinctSizes", () => {
    it("dedupes by size id preserving order", () => {
        expect(distinctSizes(variants).map((s) => s.id)).toEqual(["s", "m"]);
    });
    it("returns empty for no variants", () => {
        expect(distinctSizes([])).toEqual([]);
    });
});

describe("distinctColors", () => {
    it("dedupes by color id preserving order", () => {
        expect(distinctColors(variants).map((c) => c.id)).toEqual(["red", "blue"]);
    });
});

describe("resolveVariant", () => {
    it("finds the matching variant", () => {
        expect(resolveVariant(variants, "s", "red")?.id).toBe("1");
        expect(resolveVariant(variants, "m", "red")?.id).toBe("3");
    });
    it("returns undefined for missing combination", () => {
        expect(resolveVariant(variants, "m", "blue")).toBeUndefined();
    });
    it("returns undefined when size or color is missing", () => {
        expect(resolveVariant(variants, undefined, "red")).toBeUndefined();
        expect(resolveVariant(variants, "s", undefined)).toBeUndefined();
    });
});

describe("isCombinationAvailable", () => {
    it("is true only for an in-stock resolvable variant", () => {
        expect(isCombinationAvailable(variants, "s", "red")).toBe(true);
    });
    it("is false for a sold-out (stockQty 0) variant", () => {
        expect(isCombinationAvailable(variants, "s", "blue")).toBe(false);
    });
    it("is false for a non-existent combination", () => {
        expect(isCombinationAvailable(variants, "m", "blue")).toBe(false);
    });
});

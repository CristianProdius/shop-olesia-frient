import { describe, it, expect } from "vitest";
import {
    distinctSizes,
    distinctColors,
    hasRealVariants,
    resolveVariant,
    isCombinationAvailable,
    stockState,
    totalStock,
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

describe("stockState", () => {
    it("is 'out' when stock is zero or negative", () => {
        expect(stockState(0)).toBe("out");
        expect(stockState(-1)).toBe("out");
    });
    it("is 'low' from 1 up to the threshold (inclusive)", () => {
        expect(stockState(1)).toBe("low");
        expect(stockState(3)).toBe("low");
    });
    it("is 'in' above the threshold", () => {
        expect(stockState(4)).toBe("in");
        expect(stockState(100)).toBe("in");
    });
    it("respects a custom low threshold", () => {
        expect(stockState(5, 5)).toBe("low");
        expect(stockState(6, 5)).toBe("in");
    });
});

describe("totalStock", () => {
    it("sums stockQty across variants", () => {
        expect(totalStock(variants)).toBe(7);
    });
    it("is zero for no variants", () => {
        expect(totalStock([])).toBe(0);
    });
    it("is zero when every variant is sold out", () => {
        expect(totalStock([v("a", sizeS, red, 0), v("b", sizeM, blue, 0)])).toBe(0);
    });
});

describe("hasRealVariants", () => {
    it("is true when the product has >=1 variant", () => {
        expect(hasRealVariants({ variants })).toBe(true);
    });
    it("is false for an empty variants array", () => {
        expect(hasRealVariants({ variants: [] })).toBe(false);
    });
    it("is false when variants is missing", () => {
        // variant-less product (only scalar size/color)
        expect(hasRealVariants({ variants: undefined as unknown as ProductVariant[] })).toBe(false);
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

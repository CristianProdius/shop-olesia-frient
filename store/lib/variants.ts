import { Color, ProductVariant, Size } from "@/types";

// Pure helpers for deriving variant-selector state from a product's variants.
// Kept framework-free so they can be unit tested without React.

// Distinct sizes across the given variants, de-duplicated by size id,
// preserving first-seen order.
export const distinctSizes = (variants: ProductVariant[]): Size[] => {
    const seen = new Map<string, Size>();
    for (const v of variants) {
        if (v.size && !seen.has(v.size.id)) {
            seen.set(v.size.id, v.size);
        }
    }
    return Array.from(seen.values());
};

// Distinct colors across the given variants, de-duplicated by color id,
// preserving first-seen order.
export const distinctColors = (variants: ProductVariant[]): Color[] => {
    const seen = new Map<string, Color>();
    for (const v of variants) {
        if (v.color && !seen.has(v.color.id)) {
            seen.set(v.color.id, v.color);
        }
    }
    return Array.from(seen.values());
};

// Resolve the single variant matching the given size + color ids.
// Returns undefined when no such combination exists.
export const resolveVariant = (
    variants: ProductVariant[],
    sizeId: string | undefined,
    colorId: string | undefined,
): ProductVariant | undefined => {
    if (!sizeId || !colorId) return undefined;
    return variants.find(
        (v) => v.sizeId === sizeId && v.colorId === colorId,
    );
};

// True when the size+color combination resolves to a variant that is in stock.
export const isCombinationAvailable = (
    variants: ProductVariant[],
    sizeId: string | undefined,
    colorId: string | undefined,
): boolean => {
    const variant = resolveVariant(variants, sizeId, colorId);
    return !!variant && variant.stockQty > 0;
};

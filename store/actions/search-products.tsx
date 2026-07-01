import { Product } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/products`;

// Collects every searchable string for a product: the default name plus all
// locale variants (nameI18n / descriptionI18n), the base description and sku.
// This lets a query match regardless of the shopper's active locale.
const haystack = (product: Product): string => {
    const parts: (string | null | undefined)[] = [
        product.name,
        product.description,
        product.sku,
    ];

    for (const i18n of [product.nameI18n, product.descriptionI18n]) {
        if (i18n && typeof i18n === "object") {
            for (const value of Object.values(i18n)) {
                if (typeof value === "string") parts.push(value);
            }
        }
    }

    return parts.filter(Boolean).join(" ").toLowerCase();
};

// Fetches the product catalogue from the existing /products endpoint and filters
// client-side by a case-insensitive substring match against each product's
// localized name, description and sku. Mirrors get-products' hardening: returns
// [] on a non-ok response or any network/parse error.
const searchProducts = async (query: string): Promise<Product[]> => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        const products: Product[] = await res.json();
        return products.filter((product) => haystack(product).includes(term));
    } catch {
        return [];
    }
};

export default searchProducts;

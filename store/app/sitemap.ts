import { MetadataRoute } from "next";
import { SITE_URL, LOCALES, DEFAULT_LOCALE } from "@/lib/seo";

export const revalidate = 3600;

// Build per-locale alternates the same way seo.ts alternates() does, so the
// sitemap stays in sync with the canonical/hreflang strategy on each page.
function languagesFor(path: string): Record<string, string> {
    const languages: Record<string, string> = {};
    for (const locale of LOCALES) {
        languages[locale] = `${SITE_URL}/${locale}${path}`;
    }
    languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;
    return languages;
}

// Resilient fetch: any failure (network, non-OK, non-JSON) yields [].
async function fetchList(endpoint: string): Promise<any[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function entry(path: string, lastModified: Date): MetadataRoute.Sitemap[number] {
    return {
        url: `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
        lastModified,
        alternates: { languages: languagesFor(path) },
    };
}

function toDate(value?: string | null): Date {
    if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [categories, products, blog] = await Promise.all([
        fetchList("/categories"),
        fetchList("/products"),
        fetchList("/blog"),
    ]);

    const now = new Date();

    const entries: MetadataRoute.Sitemap = [
        // Home and blog index (cart/checkout/sign-in/sign-up are excluded).
        entry("", now),
        entry("/blog", now),
    ];

    for (const category of categories) {
        if (!category?.id) continue;
        entries.push(entry(`/category/${category.id}`, toDate(category.updatedAt)));
    }

    for (const product of products) {
        if (!product?.id || product.isArchived) continue;
        entries.push(entry(`/product/${product.id}`, toDate(product.updatedAt)));
    }

    for (const post of blog) {
        if (!post?.slug || post.isPublished === false) continue;
        entries.push(entry(`/blog/${post.slug}`, toDate(post.publishedAt ?? post.updatedAt)));
    }

    return entries;
}

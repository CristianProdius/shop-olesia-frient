// Shared SEO helpers used across all store pages.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.delice.my";

export const LOCALES = ["en", "ru", "ro"] as const;
export const DEFAULT_LOCALE = "en";

export const ORG_NAME = "LILETTI";

/**
 * Build canonical + hreflang alternates for an explicit base URL, locale and
 * locale-agnostic path (e.g. "/product/ID"). Used by pages that pass their own
 * base URL.
 */
export function buildAlternates(baseUrl: string, locale: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${baseUrl}/${l}${clean}`;
  languages["x-default"] = `${baseUrl}/${DEFAULT_LOCALE}${clean}`;
  return { canonical: `${baseUrl}/${locale}${clean}`, languages };
}

/**
 * Build canonical + hreflang alternates for a given locale and locale-agnostic
 * path (e.g. "" for home, "/blog", "/product/ID"), using the shared SITE_URL.
 */
export function alternates(locale: string, path: string) {
  return buildAlternates(SITE_URL, locale, path);
}

export function productJsonLd(p: {
  name: string; description: string; images: string[];
  price: number; currency: string; url: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  return {
    "@context": "https://schema.org", "@type": "Product",
    name: p.name, description: p.description, image: p.images,
    offers: { "@type": "Offer", price: String(p.price), priceCurrency: p.currency, url: p.url, availability: "https://schema.org/InStock" },
    ...(p.aggregateRating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.aggregateRating.ratingValue, reviewCount: p.aggregateRating.reviewCount } } : {}),
  };
}

// Computes the AggregateRating payload (ratingValue rounded to one decimal +
// reviewCount) from a list of approved reviews, or null when there are none so
// callers can omit the field entirely (Google rejects an empty AggregateRating).
export function aggregateRatingJsonLd(
  reviews: { rating: number }[]
): { ratingValue: number; reviewCount: number } | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const ratingValue = Math.round((sum / reviews.length) * 10) / 10;
  return { ratingValue, reviewCount: reviews.length };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question", name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

export function organizationJsonLd(baseUrl: string = SITE_URL) {
  return { "@context": "https://schema.org", "@type": "Organization", name: ORG_NAME, url: baseUrl };
}

const LOCALES = ["en", "ru", "ro"] as const;
const DEFAULT_LOCALE = "en";

export function buildAlternates(baseUrl: string, locale: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${baseUrl}/${l}${clean}`;
  languages["x-default"] = `${baseUrl}/${DEFAULT_LOCALE}${clean}`;
  return { canonical: `${baseUrl}/${locale}${clean}`, languages };
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

export function organizationJsonLd(baseUrl: string) {
  return { "@context": "https://schema.org", "@type": "Organization", name: "LILETTI", url: baseUrl };
}

export { LOCALES, DEFAULT_LOCALE };

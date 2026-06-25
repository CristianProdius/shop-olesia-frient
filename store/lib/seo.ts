// Shared SEO helpers used across all store pages.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://liletti.delice.my";

export const LOCALES = ["en", "ru", "ro"] as const;
export const DEFAULT_LOCALE = "en";

export const ORG_NAME = "LILETTI";

/**
 * Build canonical + hreflang alternates for a given locale and locale-agnostic
 * path (e.g. "" for home, "/blog", "/product/ID").
 */
export function alternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${path}`;

  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  };
}

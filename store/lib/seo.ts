const LOCALES = ["en", "ru", "ro"] as const;
const DEFAULT_LOCALE = "en";

export function buildAlternates(baseUrl: string, locale: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${baseUrl}/${l}${clean}`;
  languages["x-default"] = `${baseUrl}/${DEFAULT_LOCALE}${clean}`;
  return { canonical: `${baseUrl}/${locale}${clean}`, languages };
}

export { LOCALES, DEFAULT_LOCALE };

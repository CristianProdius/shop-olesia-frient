export type AppLocale = "en" | "ru" | "ro";

// Maps an app locale to a BCP-47 tag for Intl. ro→ro-MD per the LILETTI design system.
export function localeTag(locale: string): string {
  switch (locale) {
    case "ru": return "ru-RU";
    case "ro": return "ro-MD";
    default: return "en-US";
  }
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: "MDL",
  }).format(value);
}

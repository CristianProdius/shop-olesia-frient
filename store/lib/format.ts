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

export function formatCompareAt(value: number, compareAt: number | undefined, locale: string) {
  // Guard non-numeric inputs so callers never render "NaN MDL". When `value`
  // isn't a finite number there's nothing to show; `valid` lets the UI bail.
  const hasValue = typeof value === "number" && Number.isFinite(value);
  // Only treat `compareAt` as a sale price when it's a valid, higher number.
  const onSale =
    hasValue &&
    typeof compareAt === "number" &&
    Number.isFinite(compareAt) &&
    compareAt > value;
  return {
    valid: hasValue,
    current: hasValue ? formatCurrency(value, locale) : undefined,
    compareAt: onSale ? formatCurrency(compareAt as number, locale) : undefined,
    onSale,
  };
}

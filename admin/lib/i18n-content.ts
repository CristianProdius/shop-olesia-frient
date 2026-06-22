// Resolves a translated value from a JSON i18n field (e.g. Product.nameI18n,
// shaped like { en, ru, ro }), falling back to the default column value when a
// translation is missing or the field is null. Shared helper used by the admin
// (e.g. previews) and mirrored in the store app.
export function localizedField(
    i18n: unknown,
    locale: string,
    fallback: string
): string {
    if (i18n && typeof i18n === "object") {
        const value = (i18n as Record<string, unknown>)[locale];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    return fallback;
}

// Builds an i18n JSON object from per-locale form inputs, dropping blanks so the
// store falls back to the default column value for missing translations.
export function buildI18nField(values: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [locale, value] of Object.entries(values)) {
        if (value && value.trim().length > 0) {
            result[locale] = value.trim();
        }
    }
    return result;
}

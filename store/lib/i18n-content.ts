// Resolves a translated value from a JSON i18n field (e.g. Product.nameI18n,
// shaped like { en, ru, ro }), falling back to the default column value when a
// translation is missing or the field is null.
export function localizedField(
    i18n: unknown,
    locale: string,
    fallback: string | undefined
): string {
    if (i18n && typeof i18n === "object") {
        const value = (i18n as Record<string, unknown>)[locale];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    return fallback ?? "";
}

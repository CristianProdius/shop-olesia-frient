// i18n maps are { en, ru, ro } translation objects returned by the admin API.
// Resolve with localizedField(field, locale, fallback) — see lib/i18n-content.
export type I18nField = Partial<Record<string, string>>;

export interface Billboard {
    id: string;
    label: string;
    labelI18n?: I18nField | null;
    imageUrl: string;
}

export interface Category {
    id: string;
    name: string;
    nameI18n?: I18nField | null;
    billboard: Billboard;
}

export interface Product {
    id: string;
    category: Category;
    name: string;
    nameI18n?: I18nField | null;
    price: string;
    isFeatured: boolean;
    size: Size;
    color: Color;
    images: Image[]
}

export interface Image {
    id: string;
    url: string;
}

export interface Size {
    id: string;
    name: string;
    nameI18n?: I18nField | null;
    value: string;
}
export interface Color {
    id: string;
    name: string;
    nameI18n?: I18nField | null;
    value: string;
}

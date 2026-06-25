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
    // The list endpoint returns billboardId; getCategory(id) also nests billboard.
    billboardId?: string;
    billboard: Billboard;
}

export interface Product {
    id: string;
    category: Category;
    name: string;
    nameI18n?: I18nField | null;
    description?: string | null;
    descriptionI18n?: I18nField | null;
    material?: string | null;
    materialI18n?: I18nField | null;
    care?: string | null;
    careI18n?: I18nField | null;
    sku?: string | null;
    price: string;
    isFeatured: boolean;
    size: Size;
    color: Color;
    images: Image[]
}

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    titleI18n?: I18nField | null;
    excerpt?: string | null;
    excerptI18n?: I18nField | null;
    content: string;
    contentI18n?: I18nField | null;
    coverImage?: string | null;
    isPublished: boolean;
    publishedAt?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
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

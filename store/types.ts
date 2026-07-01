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
    // The list endpoint (/categories) returns only billboardId; getCategory(id)
    // additionally nests the full billboard. Hence billboard is optional.
    billboardId?: string;
    billboard?: Billboard;
}

export interface Product {
    id: string;
    category: Category;
    name: string;
    nameI18n?: I18nField | null;
    sku?: string | null;
    description?: string | null;
    descriptionI18n?: I18nField | null;
    material?: string | null;
    materialI18n?: I18nField | null;
    care?: string | null;
    careI18n?: I18nField | null;
    price: string;
    isFeatured: boolean;
    size: Size;
    color: Color;
    variants: ProductVariant[];
    images: Image[]
}

export interface ProductVariant {
    id: string;
    sku?: string | null;
    stockQty: number;
    sizeId: string;
    colorId: string;
    size: Size;
    color: Color;
}

export type ContentBlockType =
    | "brand-story"
    | "behind-the-scenes"
    | "why-choose-us"
    | "social-proof";

export interface ContentBlock {
    id: string;
    type: ContentBlockType;
    heading?: string | null;
    headingI18n?: I18nField | null;
    body?: string | null;
    bodyI18n?: I18nField | null;
    mediaUrl?: string | null;
    order: number;
    isPublished: boolean;
}

export interface Faq {
    id: string;
    category?: string | null;
    categoryI18n?: I18nField | null;
    question: string;
    questionI18n?: I18nField | null;
    answer: string;
    answerI18n?: I18nField | null;
    order: number;
    isPublished: boolean;
}

export interface Stat {
    id: string;
    key: string;
    label: string;
    labelI18n?: I18nField | null;
    value: string;
    order: number;
    isPublished: boolean;
}

export interface Image {
    id: string;
    url: string;
}

export interface ReviewImage {
    id: string;
    url: string;
}

export interface Review {
    id: string;
    productId: string;
    customerName: string;
    rating: number;
    body?: string | null;
    bodyI18n?: I18nField | null;
    status: string;
    source: string;
    fitVote?: string | null;
    verified: boolean;
    createdAt: string;
    images: ReviewImage[];
}

// A single line of a customer's order, as returned by the account hub API
// (admin orders?customerId=). Prices are strings (Decimal serialized).
export interface OrderItem {
    id: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice?: string | null;
    productName: string;
}

// A customer's order, shaped for the account hub.
export interface Order {
    id: string;
    status: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    createdAt: string;
    total: string;
    items: OrderItem[];
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
    createdAt?: string | null;
    updatedAt?: string | null;
}

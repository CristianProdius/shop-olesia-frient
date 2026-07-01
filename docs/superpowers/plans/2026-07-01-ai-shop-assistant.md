# AI Shop Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native LILETTI storefront AI assistant for product recommendations, support answers, and order-help flows.

**Architecture:** The assistant lives in `store/` as a server-only `/api/assistant` route plus pure service modules under `store/lib/assistant/` and a client drawer under `store/components/assistant/`. The server gathers product, FAQ/content, and scoped order context through narrow helpers, then calls Anthropic only when `ANTHROPIC_API_KEY` is configured; cart mutation remains client-only through `use-cart`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Tailwind v4, next-intl, Zustand cart, `@anthropic-ai/sdk` lazy-loaded server-side.

---

## File Structure

- Create `store/lib/assistant/types.ts`: shared assistant request/response, recommendation, source, order, and cart-suggestion types.
- Create `store/lib/assistant/config.ts`: locale normalization, provider configuration, localized offline/invalid/rate-limit messages.
- Create `store/lib/assistant/rate-limit.ts`: fixed-window in-memory limiter copied in style from `admin/lib/rate-limit.ts`.
- Create `store/lib/assistant/catalog.ts`: pure product search/ranking/detail/cart-suggestion helpers.
- Create `store/lib/assistant/content.ts`: pure FAQ/content search helpers.
- Create `store/lib/assistant/orders.ts`: pure order shaping plus fetch-backed signed-in and guest lookup helpers.
- Create `store/lib/assistant/prompt.ts`: system prompt, history sanitizer, JSON response schema prompt.
- Create `store/lib/assistant/provider.ts`: lazy Anthropic call that returns structured assistant JSON.
- Create `store/lib/assistant/handler.ts`: orchestrates validation, context gathering, offline behavior, and provider call.
- Create tests under `store/lib/assistant/*.test.ts`: core logic coverage within the existing Vitest include pattern.
- Create `store/app/api/assistant/route.ts`: public POST endpoint with validation, session scoping, rate limit, and safe response statuses.
- Create `store/components/assistant/*`: launcher, drawer, message, product card, order card, suggestions.
- Modify `store/app/[locale]/layout.tsx`: mount the assistant launcher inside `NextIntlClientProvider`.
- Modify `store/messages/en.json`, `store/messages/ro.json`, `store/messages/ru.json`: add `Assistant` copy.
- Modify `store/.env.example`: document optional `ANTHROPIC_API_KEY` and `ANTHROPIC_ASSISTANT_MODEL`.
- Modify `store/package.json` and `store/package-lock.json`: add `@anthropic-ai/sdk`.

---

### Task 1: Assistant Types, Config, And Rate Limit

**Files:**
- Create: `store/lib/assistant/types.ts`
- Create: `store/lib/assistant/config.ts`
- Create: `store/lib/assistant/rate-limit.ts`
- Test: `store/lib/assistant/config.test.ts`
- Test: `store/lib/assistant/rate-limit.test.ts`
- Modify: `store/.env.example`

- [ ] **Step 1: Write config tests**

Create `store/lib/assistant/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    assistantConfigured,
    fallbackMessage,
    normalizeAssistantLocale,
} from "./config";

describe("normalizeAssistantLocale", () => {
    it("keeps supported locales", () => {
        expect(normalizeAssistantLocale("en")).toBe("en");
        expect(normalizeAssistantLocale("ro")).toBe("ro");
        expect(normalizeAssistantLocale("ru")).toBe("ru");
    });

    it("falls back to English for unknown locales", () => {
        expect(normalizeAssistantLocale("fr")).toBe("en");
        expect(normalizeAssistantLocale(undefined)).toBe("en");
    });
});

describe("assistantConfigured", () => {
    it("is false for empty keys", () => {
        expect(assistantConfigured(undefined)).toBe(false);
        expect(assistantConfigured("")).toBe(false);
        expect(assistantConfigured("   ")).toBe(false);
    });

    it("is true for non-empty keys", () => {
        expect(assistantConfigured("sk-test")).toBe(true);
    });
});

describe("fallbackMessage", () => {
    it("returns localized offline text", () => {
        expect(fallbackMessage("offline", "en")).toContain("assistant is unavailable");
        expect(fallbackMessage("offline", "ro")).toContain("asistentul");
        expect(fallbackMessage("offline", "ru")).toContain("ассистент");
    });

    it("returns localized invalid request text", () => {
        expect(fallbackMessage("invalid", "en")).toContain("could not read");
        expect(fallbackMessage("invalid", "ro")).toContain("nu am putut");
        expect(fallbackMessage("invalid", "ru")).toContain("не удалось");
    });
});
```

- [ ] **Step 2: Run config tests to verify they fail**

Run:

```bash
cd store
npm test -- lib/assistant/config.test.ts
```

Expected: FAIL because `store/lib/assistant/config.ts` does not exist.

- [ ] **Step 3: Write rate-limit tests**

Create `store/lib/assistant/rate-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
    it("allows requests up to the fixed-window limit", () => {
        let now = 1000;
        const limiter = createRateLimiter(() => now);

        expect(limiter("assistant:ip", 2, 1000)).toBe(true);
        expect(limiter("assistant:ip", 2, 1000)).toBe(true);
        expect(limiter("assistant:ip", 2, 1000)).toBe(false);
    });

    it("resets after the window expires", () => {
        let now = 1000;
        const limiter = createRateLimiter(() => now);

        expect(limiter("assistant:ip", 1, 1000)).toBe(true);
        expect(limiter("assistant:ip", 1, 1000)).toBe(false);
        now = 2001;
        expect(limiter("assistant:ip", 1, 1000)).toBe(true);
    });
});
```

- [ ] **Step 4: Run rate-limit tests to verify they fail**

Run:

```bash
cd store
npm test -- lib/assistant/rate-limit.test.ts
```

Expected: FAIL because `store/lib/assistant/rate-limit.ts` does not exist.

- [ ] **Step 5: Implement assistant shared types**

Create `store/lib/assistant/types.ts`:

```ts
import type { ContentBlock, Faq, Order, Product, ProductVariant } from "@/types";

export type AssistantLocale = "en" | "ro" | "ru";

export type AssistantMessage = {
    role: "user" | "assistant";
    content: string;
};

export type AssistantRequestPayload = {
    locale?: string;
    messages?: AssistantMessage[];
    page?: {
        path?: string;
        productId?: string;
        categoryId?: string;
    };
    guestOrder?: {
        orderId?: string;
        email?: string;
    };
};

export type AssistantStatus = "ok" | "offline" | "invalid" | "rate_limited" | "error";

export type AssistantCartLine = Product & {
    variantId: string;
    selectedSize: ProductVariant["size"];
    selectedColor: ProductVariant["color"];
    unitPrice: string;
    quantity?: number;
};

export type AssistantProductRecommendation = {
    product: Product;
    productId: string;
    name: string;
    description?: string;
    price: string;
    imageUrl?: string;
    categoryName?: string;
    reason: string;
    stockState: "in" | "low" | "out";
    variants: Array<{
        id: string;
        size: string;
        color: string;
        colorValue: string;
        stockQty: number;
    }>;
    cartLine?: AssistantCartLine;
};

export type AssistantKnowledgeSource = {
    id: string;
    type: "faq" | "content";
    label: string;
    excerpt: string;
};

export type AssistantOrderSummary = {
    id: string;
    status: string;
    total: string;
    createdAt: string;
    tracking?: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
    }>;
};

export type AssistantResponse = {
    status: AssistantStatus;
    message: string;
    products: AssistantProductRecommendation[];
    sources: AssistantKnowledgeSource[];
    orders: AssistantOrderSummary[];
    followups: string[];
};

export type AssistantContext = {
    locale: AssistantLocale;
    latestUserMessage: string;
    messages: AssistantMessage[];
    products: Product[];
    faqs: Faq[];
    contentBlocks: ContentBlock[];
    signedInOrders: Order[];
    guestOrder?: Order | null;
};
```

- [ ] **Step 6: Implement config helpers**

Create `store/lib/assistant/config.ts`:

```ts
import type { AssistantLocale } from "./types";

export const ASSISTANT_DEFAULT_MODEL = "claude-opus-4-8";

export function normalizeAssistantLocale(locale: string | undefined): AssistantLocale {
    if (locale === "ro" || locale === "ru" || locale === "en") return locale;
    return "en";
}

export function assistantConfigured(apiKey: string | undefined): boolean {
    return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const fallbackCopy = {
    offline: {
        en: "The assistant is unavailable right now. You can still use search, FAQ, or your account page.",
        ro: "Asistentul este indisponibil momentan. Poți folosi în continuare căutarea, FAQ sau pagina contului.",
        ru: "AI-ассистент сейчас недоступен. Вы можете использовать поиск, FAQ или страницу аккаунта.",
    },
    invalid: {
        en: "I could not read that request. Please try again with a shorter message.",
        ro: "Nu am putut citi cererea. Te rugăm să încerci din nou cu un mesaj mai scurt.",
        ru: "Не удалось прочитать запрос. Пожалуйста, попробуйте ещё раз с более коротким сообщением.",
    },
    rate_limited: {
        en: "Please wait a moment before sending another assistant message.",
        ro: "Te rugăm să aștepți puțin înainte de a trimite un alt mesaj.",
        ru: "Пожалуйста, подождите немного перед отправкой нового сообщения.",
    },
    error: {
        en: "Something went wrong while preparing the assistant response.",
        ro: "A apărut o eroare la pregătirea răspunsului.",
        ru: "Во время подготовки ответа произошла ошибка.",
    },
} satisfies Record<string, Record<AssistantLocale, string>>;

export function fallbackMessage(
    kind: keyof typeof fallbackCopy,
    locale: AssistantLocale,
): string {
    return fallbackCopy[kind][locale];
}
```

- [ ] **Step 7: Implement rate limiter**

Create `store/lib/assistant/rate-limit.ts`:

```ts
type WindowEntry = { count: number; resetAt: number };

export function createRateLimiter(nowMs: () => number = () => Date.now()) {
    const buckets = new Map<string, WindowEntry>();

    return function rateLimit(key: string, limit: number, windowMs: number): boolean {
        const now = nowMs();
        const entry = buckets.get(key);

        if (!entry || now >= entry.resetAt) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return true;
        }

        if (entry.count >= limit) return false;

        entry.count += 1;
        return true;
    };
}

export const rateLimit = createRateLimiter();
```

- [ ] **Step 8: Document store AI env**

Modify `store/.env.example` by adding after `NEXT_PUBLIC_API_URL`:

```bash
# AI Shop Assistant (optional). If unset, the assistant renders an offline state
# and the storefront still builds and runs.
ANTHROPIC_API_KEY=
ANTHROPIC_ASSISTANT_MODEL="claude-opus-4-8"
```

- [ ] **Step 9: Run tests for Task 1**

Run:

```bash
cd store
npm test -- lib/assistant/config.test.ts lib/assistant/rate-limit.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

```bash
git add store/.env.example store/lib/assistant/types.ts store/lib/assistant/config.ts store/lib/assistant/rate-limit.ts store/lib/assistant/config.test.ts store/lib/assistant/rate-limit.test.ts
git commit -m "feat(store): add assistant core config"
```

---

### Task 2: Catalog Tooling

**Files:**
- Create: `store/lib/assistant/catalog.ts`
- Test: `store/lib/assistant/catalog.test.ts`
- Modify: `store/lib/assistant/types.ts` if type refinements are needed

- [ ] **Step 1: Write catalog tests**

Create `store/lib/assistant/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Category, Color, Product, ProductVariant, Size } from "@/types";
import {
    buildCartSuggestion,
    getProductDetailsFromCatalog,
    searchProductsFromCatalog,
} from "./catalog";

const sizeS: Size = { id: "size-s", name: "Small", nameI18n: { ro: "Mic" }, value: "S" };
const sizeM: Size = { id: "size-m", name: "Medium", nameI18n: { ro: "Mediu" }, value: "M" };
const black: Color = { id: "black", name: "Black", nameI18n: { ro: "Negru" }, value: "#000000" };
const red: Color = { id: "red", name: "Red", nameI18n: { ro: "Roșu" }, value: "#ff0000" };
const category: Category = { id: "cat-dresses", name: "Dresses", nameI18n: { ro: "Rochii" } };

function variant(
    id: string,
    size: Size,
    color: Color,
    stockQty: number,
): ProductVariant {
    return {
        id,
        sku: id.toUpperCase(),
        sizeId: size.id,
        colorId: color.id,
        size,
        color,
        stockQty,
    };
}

function product(overrides: Partial<Product>): Product {
    return {
        id: "p-1",
        category,
        name: "Evening Silk Dress",
        nameI18n: { ro: "Rochie de seară din mătase" },
        sku: "DRESS-1",
        description: "A black silk dress for evening events.",
        descriptionI18n: { ro: "Rochie neagră din mătase pentru evenimente." },
        material: "100% silk",
        materialI18n: { ro: "100% mătase" },
        care: "Dry clean only",
        careI18n: null,
        price: "1200",
        isFeatured: false,
        size: sizeS,
        color: black,
        images: [{ id: "img-1", url: "https://example.test/dress.jpg" }],
        variants: [
            variant("v-out", sizeS, black, 0),
            variant("v-low", sizeM, black, 2),
            variant("v-red", sizeM, red, 5),
        ],
        ...overrides,
    };
}

describe("searchProductsFromCatalog", () => {
    it("matches localized product and material text", () => {
        const results = searchProductsFromCatalog([product({})], {
            query: "mătase seară",
            locale: "ro",
        });

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe("Rochie de seară din mătase");
        expect(results[0].categoryName).toBe("Rochii");
    });

    it("filters by max price and selected color", () => {
        const results = searchProductsFromCatalog(
            [product({ id: "p-1", price: "1200" }), product({ id: "p-2", price: "2200" })],
            { query: "dress", locale: "en", maxPrice: 1500, color: "black" },
        );

        expect(results.map((r) => r.productId)).toEqual(["p-1"]);
    });

    it("ranks in-stock products before sold-out products", () => {
        const inStock = product({ id: "p-in" });
        const soldOut = product({
            id: "p-out",
            variants: [variant("sold", sizeS, black, 0)],
        });

        const results = searchProductsFromCatalog([soldOut, inStock], {
            query: "dress",
            locale: "en",
        });

        expect(results.map((r) => r.productId)).toEqual(["p-in", "p-out"]);
        expect(results[0].stockState).toBe("in");
        expect(results[1].stockState).toBe("out");
    });

    it("returns a cart line only for a single concrete in-stock selected variant", () => {
        const results = searchProductsFromCatalog([product({})], {
            query: "dress",
            locale: "en",
            size: "M",
            color: "black",
        });

        expect(results[0].cartLine?.variantId).toBe("v-low");
        expect(results[0].cartLine?.selectedSize.value).toBe("M");
    });
});

describe("getProductDetailsFromCatalog", () => {
    it("returns only requested products", () => {
        const results = getProductDetailsFromCatalog(
            [product({ id: "p-1" }), product({ id: "p-2" })],
            ["p-2"],
            "en",
        );

        expect(results.map((r) => r.productId)).toEqual(["p-2"]);
    });
});

describe("buildCartSuggestion", () => {
    it("returns undefined for sold-out variants", () => {
        const suggestion = buildCartSuggestion([product({})], {
            productId: "p-1",
            variantId: "v-out",
            locale: "en",
        });

        expect(suggestion).toBeUndefined();
    });

    it("returns a cart line for an in-stock variant", () => {
        const suggestion = buildCartSuggestion([product({})], {
            productId: "p-1",
            variantId: "v-low",
            locale: "en",
        });

        expect(suggestion?.cartLine?.variantId).toBe("v-low");
    });
});
```

- [ ] **Step 2: Run catalog tests to verify they fail**

Run:

```bash
cd store
npm test -- lib/assistant/catalog.test.ts
```

Expected: FAIL because `store/lib/assistant/catalog.ts` does not exist.

- [ ] **Step 3: Implement catalog helpers**

Create `store/lib/assistant/catalog.ts`:

```ts
import type { Product, ProductVariant } from "@/types";
import { localizedField } from "@/lib/i18n-content";
import { stockState, totalStock } from "@/lib/variants";
import type {
    AssistantCartLine,
    AssistantLocale,
    AssistantProductRecommendation,
} from "./types";

export type CatalogSearchInput = {
    query: string;
    locale: AssistantLocale;
    category?: string;
    size?: string;
    color?: string;
    material?: string;
    maxPrice?: number;
    inStockOnly?: boolean;
    limit?: number;
};

function clean(value: string | null | undefined): string {
    return (value ?? "").toLowerCase().trim();
}

function includesText(haystack: string, needle: string | undefined): boolean {
    if (!needle || !needle.trim()) return true;
    return haystack.includes(clean(needle));
}

function localizedProductText(product: Product, locale: AssistantLocale): string {
    const parts = [
        product.name,
        localizedField(product.nameI18n, locale, product.name),
        product.description ?? "",
        localizedField(product.descriptionI18n, locale, product.description ?? ""),
        product.material ?? "",
        localizedField(product.materialI18n, locale, product.material ?? ""),
        product.sku ?? "",
        product.category?.name ?? "",
        localizedField(product.category?.nameI18n, locale, product.category?.name ?? ""),
        product.variants?.map((variant) => [
            variant.sku ?? "",
            variant.size?.name ?? "",
            variant.size?.value ?? "",
            localizedField(variant.size?.nameI18n, locale, variant.size?.name ?? ""),
            variant.color?.name ?? "",
            localizedField(variant.color?.nameI18n, locale, variant.color?.name ?? ""),
        ].join(" ")).join(" ") ?? "",
    ];

    return parts.join(" ").toLowerCase();
}

function variantMatches(
    variant: ProductVariant,
    input: Pick<CatalogSearchInput, "size" | "color">,
    locale: AssistantLocale,
): boolean {
    const size = clean(input.size);
    const color = clean(input.color);
    const variantSize = clean([
        variant.size?.name,
        variant.size?.value,
        localizedField(variant.size?.nameI18n, locale, variant.size?.name ?? ""),
    ].join(" "));
    const variantColor = clean([
        variant.color?.name,
        variant.color?.value,
        localizedField(variant.color?.nameI18n, locale, variant.color?.name ?? ""),
    ].join(" "));

    return (!size || variantSize.includes(size)) && (!color || variantColor.includes(color));
}

function selectedInStockVariant(
    product: Product,
    input: Pick<CatalogSearchInput, "size" | "color">,
    locale: AssistantLocale,
): ProductVariant | undefined {
    const matches = (product.variants ?? []).filter(
        (variant) => variant.stockQty > 0 && variantMatches(variant, input, locale),
    );
    return matches.length === 1 ? matches[0] : undefined;
}

function toCartLine(product: Product, variant: ProductVariant): AssistantCartLine {
    return {
        ...product,
        variantId: variant.id,
        selectedSize: variant.size,
        selectedColor: variant.color,
        unitPrice: product.price,
        quantity: 1,
    };
}

function summarizeVariants(product: Product, locale: AssistantLocale) {
    return (product.variants ?? []).map((variant) => ({
        id: variant.id,
        size: variant.size?.value || localizedField(variant.size?.nameI18n, locale, variant.size?.name ?? ""),
        color: localizedField(variant.color?.nameI18n, locale, variant.color?.name ?? ""),
        colorValue: variant.color?.value ?? "",
        stockQty: variant.stockQty,
    }));
}

function toRecommendation(
    product: Product,
    input: Pick<CatalogSearchInput, "locale" | "size" | "color">,
): AssistantProductRecommendation {
    const stock = totalStock(product.variants ?? []);
    const selected = selectedInStockVariant(product, input, input.locale);
    const state = stockState(stock);
    const name = localizedField(product.nameI18n, input.locale, product.name);
    const categoryName = localizedField(
        product.category?.nameI18n,
        input.locale,
        product.category?.name ?? "",
    );

    return {
        product,
        productId: product.id,
        name,
        description: localizedField(product.descriptionI18n, input.locale, product.description ?? ""),
        price: product.price,
        imageUrl: product.images?.[0]?.url,
        categoryName,
        reason: state === "out"
            ? "Matches the request but is currently sold out."
            : "Matches the request and has available stock.",
        stockState: state,
        variants: summarizeVariants(product, input.locale),
        cartLine: selected ? toCartLine(product, selected) : undefined,
    };
}

export function searchProductsFromCatalog(
    products: Product[],
    input: CatalogSearchInput,
): AssistantProductRecommendation[] {
    const query = clean(input.query);
    const limit = input.limit ?? 3;

    return products
        .filter((product) => {
            const haystack = localizedProductText(product, input.locale);
            const price = Number(product.price);
            const stock = totalStock(product.variants ?? []);

            if (query && !query.split(/\s+/).every((part) => includesText(haystack, part))) {
                return false;
            }
            if (!includesText(haystack, input.category)) return false;
            if (!includesText(haystack, input.material)) return false;
            if (input.maxPrice !== undefined && Number.isFinite(price) && price > input.maxPrice) {
                return false;
            }
            if (input.inStockOnly && stock <= 0) return false;
            if ((input.size || input.color) && !(product.variants ?? []).some((variant) =>
                variantMatches(variant, input, input.locale))) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            const stockDiff = totalStock(b.variants ?? []) - totalStock(a.variants ?? []);
            if (stockDiff !== 0) return stockDiff;
            return Number(a.price) - Number(b.price);
        })
        .slice(0, limit)
        .map((product) => toRecommendation(product, input));
}

export function getProductDetailsFromCatalog(
    products: Product[],
    productIds: string[],
    locale: AssistantLocale,
): AssistantProductRecommendation[] {
    const wanted = new Set(productIds);
    return products
        .filter((product) => wanted.has(product.id))
        .map((product) => toRecommendation(product, { locale }));
}

export function buildCartSuggestion(
    products: Product[],
    input: { productId: string; variantId: string; locale: AssistantLocale },
): AssistantProductRecommendation | undefined {
    const product = products.find((item) => item.id === input.productId);
    const variant = product?.variants?.find((item) => item.id === input.variantId);
    if (!product || !variant || variant.stockQty <= 0) return undefined;

    return {
        ...toRecommendation(product, { locale: input.locale }),
        cartLine: toCartLine(product, variant),
    };
}
```

- [ ] **Step 4: Run catalog tests**

Run:

```bash
cd store
npm test -- lib/assistant/catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add store/lib/assistant/types.ts store/lib/assistant/catalog.ts store/lib/assistant/catalog.test.ts
git commit -m "feat(store): add assistant catalog tools"
```

---

### Task 3: Knowledge And Order Tools

**Files:**
- Create: `store/lib/assistant/content.ts`
- Create: `store/lib/assistant/orders.ts`
- Test: `store/lib/assistant/content.test.ts`
- Test: `store/lib/assistant/orders.test.ts`

- [ ] **Step 1: Write content tests**

Create `store/lib/assistant/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ContentBlock, Faq } from "@/types";
import { searchStoreKnowledge } from "./content";

const faq = (overrides: Partial<Faq>): Faq => ({
    id: "faq-1",
    category: "Delivery",
    categoryI18n: { ro: "Livrare" },
    question: "How long does delivery take?",
    questionI18n: { ro: "Cât durează livrarea?" },
    answer: "Delivery usually takes 2 to 5 business days.",
    answerI18n: { ro: "Livrarea durează de obicei 2-5 zile lucrătoare." },
    order: 0,
    isPublished: true,
    ...overrides,
});

const block = (overrides: Partial<ContentBlock>): ContentBlock => ({
    id: "content-1",
    type: "brand-story",
    heading: "Made in our atelier",
    headingI18n: { ro: "Creat în atelierul nostru" },
    body: "Every piece is made in-house.",
    bodyI18n: { ro: "Fiecare piesă este creată intern." },
    mediaUrl: null,
    order: 0,
    isPublished: true,
    ...overrides,
});

describe("searchStoreKnowledge", () => {
    it("searches localized FAQ text", () => {
        const results = searchStoreKnowledge({
            query: "livrare",
            locale: "ro",
            faqs: [faq({})],
            contentBlocks: [],
        });

        expect(results[0].label).toBe("Livrare");
        expect(results[0].excerpt).toContain("2-5 zile");
    });

    it("searches published content blocks", () => {
        const results = searchStoreKnowledge({
            query: "atelier",
            locale: "en",
            faqs: [],
            contentBlocks: [block({})],
        });

        expect(results[0].type).toBe("content");
        expect(results[0].excerpt).toContain("Every piece");
    });

    it("does not expose unpublished content", () => {
        const results = searchStoreKnowledge({
            query: "secret",
            locale: "en",
            faqs: [faq({ isPublished: false, answer: "secret answer" })],
            contentBlocks: [block({ isPublished: false, body: "secret body" })],
        });

        expect(results).toEqual([]);
    });
});
```

- [ ] **Step 2: Write order tests**

Create `store/lib/assistant/orders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Order } from "@/types";
import {
    extractGuestLookupFields,
    shapeOrderSummaries,
    signedOutOrderMessage,
} from "./orders";

const order = (overrides: Partial<Order>): Order => ({
    id: "order-1",
    status: "shipped",
    carrier: "DHL",
    trackingNumber: "TRACK123",
    createdAt: "2026-07-01T10:00:00.000Z",
    total: "2400",
    items: [
        {
            id: "line-1",
            productId: "product-1",
            variantId: "variant-1",
            quantity: 2,
            unitPrice: "1200",
            productName: "Evening Silk Dress",
        },
    ],
    ...overrides,
});

describe("shapeOrderSummaries", () => {
    it("shapes compact order summaries", () => {
        const summaries = shapeOrderSummaries([order({})]);

        expect(summaries[0]).toMatchObject({
            id: "order-1",
            status: "shipped",
            tracking: "DHL TRACK123",
            total: "2400",
        });
        expect(summaries[0].items[0].quantity).toBe(2);
    });

    it("respects limit", () => {
        const summaries = shapeOrderSummaries([
            order({ id: "a" }),
            order({ id: "b" }),
        ], 1);

        expect(summaries.map((item) => item.id)).toEqual(["a"]);
    });
});

describe("extractGuestLookupFields", () => {
    it("requires both order id and email", () => {
        expect(extractGuestLookupFields({ orderId: "abc", email: "" })).toBeNull();
        expect(extractGuestLookupFields({ orderId: "", email: "a@b.test" })).toBeNull();
    });

    it("trims valid order lookup fields", () => {
        expect(extractGuestLookupFields({
            orderId: " order-1 ",
            email: " shopper@example.test ",
        })).toEqual({
            orderId: "order-1",
            email: "shopper@example.test",
        });
    });
});

describe("signedOutOrderMessage", () => {
    it("returns localized guidance", () => {
        expect(signedOutOrderMessage("en")).toContain("sign in");
        expect(signedOutOrderMessage("ro")).toContain("autentifică");
        expect(signedOutOrderMessage("ru")).toContain("войдите");
    });
});
```

- [ ] **Step 3: Run content/order tests to verify they fail**

Run:

```bash
cd store
npm test -- lib/assistant/content.test.ts lib/assistant/orders.test.ts
```

Expected: FAIL because `content.ts` and `orders.ts` do not exist.

- [ ] **Step 4: Implement content search**

Create `store/lib/assistant/content.ts`:

```ts
import type { ContentBlock, Faq } from "@/types";
import { localizedField } from "@/lib/i18n-content";
import type { AssistantKnowledgeSource, AssistantLocale } from "./types";

function clean(value: string | undefined | null): string {
    return (value ?? "").toLowerCase().trim();
}

function includesAll(text: string, query: string): boolean {
    const words = clean(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    return words.every((word) => text.includes(word));
}

function excerpt(value: string): string {
    return value.length > 220 ? `${value.slice(0, 217).trim()}...` : value;
}

export function searchStoreKnowledge(input: {
    query: string;
    locale: AssistantLocale;
    faqs: Faq[];
    contentBlocks: ContentBlock[];
    limit?: number;
}): AssistantKnowledgeSource[] {
    const results: AssistantKnowledgeSource[] = [];

    for (const item of input.faqs) {
        if (!item.isPublished) continue;
        const category = localizedField(item.categoryI18n, input.locale, item.category ?? "FAQ");
        const question = localizedField(item.questionI18n, input.locale, item.question);
        const answer = localizedField(item.answerI18n, input.locale, item.answer);
        const haystack = clean(`${category} ${question} ${answer}`);
        if (!includesAll(haystack, input.query)) continue;

        results.push({
            id: item.id,
            type: "faq",
            label: category || "FAQ",
            excerpt: excerpt(answer || question),
        });
    }

    for (const item of input.contentBlocks) {
        if (!item.isPublished) continue;
        const heading = localizedField(item.headingI18n, input.locale, item.heading ?? "");
        const body = localizedField(item.bodyI18n, input.locale, item.body ?? "");
        const haystack = clean(`${item.type} ${heading} ${body}`);
        if (!includesAll(haystack, input.query)) continue;

        results.push({
            id: item.id,
            type: "content",
            label: heading || item.type,
            excerpt: excerpt(body || heading),
        });
    }

    return results.slice(0, input.limit ?? 4);
}
```

- [ ] **Step 5: Implement order helpers**

Create `store/lib/assistant/orders.ts`:

```ts
import type { Order } from "@/types";
import type { AssistantLocale, AssistantOrderSummary } from "./types";

export function shapeOrderSummaries(
    orders: Order[],
    limit = 3,
): AssistantOrderSummary[] {
    return orders.slice(0, limit).map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        tracking: order.trackingNumber
            ? [order.carrier, order.trackingNumber].filter(Boolean).join(" ")
            : undefined,
        items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
        })),
    }));
}

export function extractGuestLookupFields(input: {
    orderId?: string;
    email?: string;
} | undefined): { orderId: string; email: string } | null {
    const orderId = input?.orderId?.trim() ?? "";
    const email = input?.email?.trim() ?? "";
    if (!orderId || !email) return null;
    return { orderId, email };
}

export function signedOutOrderMessage(locale: AssistantLocale): string {
    switch (locale) {
        case "ro":
            return "Pentru statusul comenzilor, autentifică-te în cont sau introdu numărul comenzii și emailul folosit la checkout.";
        case "ru":
            return "Чтобы проверить статус заказа, войдите в аккаунт или укажите номер заказа и email, использованный при оформлении.";
        default:
            return "To check order status, sign in to your account or provide the order number and email used at checkout.";
    }
}

export async function fetchGuestOrder(input: {
    apiUrl: string | undefined;
    orderId: string;
    email: string;
    fetchImpl?: typeof fetch;
}): Promise<Order | null> {
    if (!input.apiUrl) return null;
    const fetcher = input.fetchImpl ?? fetch;
    const res = await fetcher(`${input.apiUrl}/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: input.orderId, email: input.email }),
        cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Order;
}
```

- [ ] **Step 6: Run content/order tests**

Run:

```bash
cd store
npm test -- lib/assistant/content.test.ts lib/assistant/orders.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add store/lib/assistant/content.ts store/lib/assistant/orders.ts store/lib/assistant/content.test.ts store/lib/assistant/orders.test.ts
git commit -m "feat(store): add assistant knowledge and order tools"
```

---

### Task 4: Prompt, Provider, And Handler

**Files:**
- Create: `store/lib/assistant/prompt.ts`
- Create: `store/lib/assistant/provider.ts`
- Create: `store/lib/assistant/handler.ts`
- Test: `store/lib/assistant/prompt.test.ts`
- Test: `store/lib/assistant/handler.test.ts`
- Modify: `store/package.json`
- Modify: `store/package-lock.json`

- [ ] **Step 1: Install Anthropic SDK in the store app**

Run:

```bash
cd store
npm install @anthropic-ai/sdk@^0.105.0
```

Expected: `store/package.json` includes `@anthropic-ai/sdk` and `store/package-lock.json` updates.

- [ ] **Step 2: Write prompt tests**

Create `store/lib/assistant/prompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAssistantPrompt, sanitizeMessages } from "./prompt";

describe("sanitizeMessages", () => {
    it("keeps only supported roles and trimmed content", () => {
        const messages = sanitizeMessages([
            { role: "user", content: " hello " },
            { role: "assistant", content: " hi " },
            { role: "user", content: "   " },
            { role: "system" as "user", content: "secret" },
        ]);

        expect(messages).toEqual([
            { role: "user", content: "hello" },
            { role: "assistant", content: "hi" },
        ]);
    });

    it("keeps only the latest messages", () => {
        const messages = sanitizeMessages(
            Array.from({ length: 12 }, (_, index) => ({
                role: "user" as const,
                content: `message ${index}`,
            })),
            4,
        );

        expect(messages).toHaveLength(4);
        expect(messages[0].content).toBe("message 8");
    });
});

describe("buildAssistantPrompt", () => {
    it("includes locale and guardrails", () => {
        const prompt = buildAssistantPrompt("ro");

        expect(prompt).toContain("Answer in ro");
        expect(prompt).toContain("Never invent stock");
        expect(prompt).toContain("Never use customerId");
    });
});
```

- [ ] **Step 3: Write handler tests**

Create `store/lib/assistant/handler.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { handleAssistantRequest } from "./handler";

describe("handleAssistantRequest", () => {
    it("returns invalid for empty messages", async () => {
        const response = await handleAssistantRequest(
            { locale: "en", messages: [] },
            {
                apiKey: undefined,
                model: "test-model",
                customerId: null,
                loadProducts: async () => [],
                loadFaqs: async () => [],
                loadContentBlocks: async () => [],
                loadSignedInOrders: async () => [],
                generate: async () => {
                    throw new Error("should not call provider");
                },
            },
        );

        expect(response.status).toBe("invalid");
    });

    it("returns offline when the key is missing", async () => {
        const response = await handleAssistantRequest(
            { locale: "en", messages: [{ role: "user", content: "Help me choose a dress" }] },
            {
                apiKey: undefined,
                model: "test-model",
                customerId: null,
                loadProducts: async () => [],
                loadFaqs: async () => [],
                loadContentBlocks: async () => [],
                loadSignedInOrders: async () => [],
                generate: async () => {
                    throw new Error("should not call provider");
                },
            },
        );

        expect(response.status).toBe("offline");
        expect(response.products).toEqual([]);
    });

    it("grounds configured responses with products and knowledge", async () => {
        const response = await handleAssistantRequest(
            { locale: "en", messages: [{ role: "user", content: "silk delivery" }] },
            {
                apiKey: "sk-test",
                model: "test-model",
                customerId: null,
                loadProducts: async () => [],
                loadFaqs: async () => [],
                loadContentBlocks: async () => [],
                loadSignedInOrders: async () => [],
                generate: async ({ latestUserMessage }) => ({
                    status: "ok",
                    message: `Grounded response for ${latestUserMessage}`,
                    products: [],
                    sources: [],
                    orders: [],
                    followups: ["Show evening dresses"],
                }),
            },
        );

        expect(response.status).toBe("ok");
        expect(response.message).toContain("silk delivery");
    });
});
```

- [ ] **Step 4: Run prompt/handler tests to verify they fail**

Run:

```bash
cd store
npm test -- lib/assistant/prompt.test.ts lib/assistant/handler.test.ts
```

Expected: FAIL because `prompt.ts` and `handler.ts` do not exist.

- [ ] **Step 5: Implement prompt helpers**

Create `store/lib/assistant/prompt.ts`:

```ts
import type { AssistantLocale, AssistantMessage } from "./types";

export function sanitizeMessages(
    input: AssistantMessage[] | undefined,
    maxMessages = 8,
): AssistantMessage[] {
    const safe = (input ?? [])
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
            role: message.role,
            content: message.content.trim().slice(0, 1200),
        }))
        .filter((message) => message.content.length > 0);

    return safe.slice(-maxMessages);
}

export function buildAssistantPrompt(locale: AssistantLocale): string {
    return [
        "You are the LILETTI shop assistant for a premium Moldovan womenswear storefront.",
        `Answer in ${locale}.`,
        "Use only the catalog, FAQ, content, and order context supplied by the server.",
        "Never invent stock, shipping promises, discounts, return policy, materials, or atelier timelines.",
        "Never use customerId from browser input. Order context is scoped server-side.",
        "Never claim an item was added to cart. The shopper must click the add-to-cart UI.",
        "Keep sizing guidance factual, optional, and respectful.",
        "If data is missing, say that the shop data does not include it and suggest FAQ, account, or made-to-measure paths.",
        "Return a compact JSON object with keys: message, followups.",
    ].join("\n");
}
```

- [ ] **Step 6: Implement provider adapter**

Create `store/lib/assistant/provider.ts`:

```ts
import type { AssistantContext, AssistantResponse } from "./types";
import { buildAssistantPrompt } from "./prompt";

export type GenerateAssistantInput = {
    apiKey: string;
    model: string;
    context: AssistantContext;
    response: Omit<AssistantResponse, "message" | "followups">;
};

type ModelJson = {
    message?: unknown;
    followups?: unknown;
};

function parseModelJson(text: string): { message: string; followups: string[] } {
    const parsed = JSON.parse(text) as ModelJson;
    const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
    const followups = Array.isArray(parsed.followups)
        ? parsed.followups.filter((item): item is string => typeof item === "string").slice(0, 3)
        : [];

    return { message, followups };
}

export async function generateAssistantText(
    input: GenerateAssistantInput,
): Promise<{ message: string; followups: string[] }> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: input.apiKey });

    const response = await client.messages.create({
        model: input.model,
        max_tokens: 1200,
        system: buildAssistantPrompt(input.context.locale),
        messages: [
            {
                role: "user",
                content: JSON.stringify({
                    userMessage: input.context.latestUserMessage,
                    products: input.response.products.map((item) => ({
                        id: item.productId,
                        name: item.name,
                        price: item.price,
                        stockState: item.stockState,
                        variants: item.variants,
                    })),
                    sources: input.response.sources,
                    orders: input.response.orders,
                }),
            },
        ],
        output_config: {
            format: {
                type: "json_schema",
                schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        followups: {
                            type: "array",
                            items: { type: "string" },
                            maxItems: 3,
                        },
                    },
                    required: ["message", "followups"],
                    additionalProperties: false,
                },
            },
        },
    });

    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

    return parseModelJson(text);
}
```

- [ ] **Step 7: Implement handler orchestration**

Create `store/lib/assistant/handler.ts`:

```ts
import type { ContentBlock, Faq, Order, Product } from "@/types";
import {
    assistantConfigured,
    fallbackMessage,
    normalizeAssistantLocale,
} from "./config";
import { searchProductsFromCatalog } from "./catalog";
import { searchStoreKnowledge } from "./content";
import {
    extractGuestLookupFields,
    fetchGuestOrder,
    shapeOrderSummaries,
    signedOutOrderMessage,
} from "./orders";
import { sanitizeMessages } from "./prompt";
import type {
    AssistantRequestPayload,
    AssistantResponse,
    AssistantOrderSummary,
} from "./types";

export type AssistantDeps = {
    apiKey: string | undefined;
    model: string;
    customerId: string | null;
    loadProducts: () => Promise<Product[]>;
    loadFaqs: () => Promise<Faq[]>;
    loadContentBlocks: () => Promise<ContentBlock[]>;
    loadSignedInOrders: (customerId: string) => Promise<Order[]>;
    generate: (input: {
        latestUserMessage: string;
        response: Omit<AssistantResponse, "message" | "followups">;
    }) => Promise<Pick<AssistantResponse, "status" | "message" | "products" | "sources" | "orders" | "followups">>;
};

function emptyResponse(status: AssistantResponse["status"], message: string): AssistantResponse {
    return { status, message, products: [], sources: [], orders: [], followups: [] };
}

function looksLikeOrderQuestion(message: string): boolean {
    return /\b(order|tracking|delivery status|where is|comand|livrare|заказ|доставк|трек)/i.test(message);
}

export async function handleAssistantRequest(
    payload: AssistantRequestPayload,
    deps: AssistantDeps,
): Promise<AssistantResponse> {
    const locale = normalizeAssistantLocale(payload.locale);
    const messages = sanitizeMessages(payload.messages);
    const latestUserMessage = messages[messages.length - 1]?.content ?? "";

    if (!latestUserMessage || messages[messages.length - 1]?.role !== "user") {
        return emptyResponse("invalid", fallbackMessage("invalid", locale));
    }

    if (!assistantConfigured(deps.apiKey)) {
        return emptyResponse("offline", fallbackMessage("offline", locale));
    }

    const [products, faqs, contentBlocks] = await Promise.all([
        deps.loadProducts(),
        deps.loadFaqs(),
        deps.loadContentBlocks(),
    ]);

    const productMatches = searchProductsFromCatalog(products, {
        query: latestUserMessage,
        locale,
        limit: 3,
    });
    const sources = searchStoreKnowledge({
        query: latestUserMessage,
        locale,
        faqs,
        contentBlocks,
    });

    let orders: AssistantOrderSummary[] = [];
    const guestLookup = extractGuestLookupFields(payload.guestOrder);
    if (guestLookup) {
        const guestOrder = await fetchGuestOrder({
            apiUrl: process.env.NEXT_PUBLIC_API_URL,
            ...guestLookup,
        });
        orders = guestOrder ? shapeOrderSummaries([guestOrder]) : [];
    } else if (looksLikeOrderQuestion(latestUserMessage) && deps.customerId) {
        orders = shapeOrderSummaries(await deps.loadSignedInOrders(deps.customerId));
    }

    const grounded = {
        status: "ok" as const,
        products: productMatches,
        sources,
        orders,
    };

    if (looksLikeOrderQuestion(latestUserMessage) && !deps.customerId && !guestLookup) {
        return {
            ...grounded,
            message: signedOutOrderMessage(locale),
            followups: [],
        };
    }

    try {
        const generated = await deps.generate({
            latestUserMessage,
            response: grounded,
        });
        return {
            status: "ok",
            message: generated.message,
            products: productMatches,
            sources,
            orders,
            followups: generated.followups,
        };
    } catch {
        return {
            ...grounded,
            message: fallbackMessage("error", locale),
            followups: [],
        };
    }
}
```

- [ ] **Step 8: Run prompt/handler tests**

Run:

```bash
cd store
npm test -- lib/assistant/prompt.test.ts lib/assistant/handler.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 4**

```bash
git add store/package.json store/package-lock.json store/lib/assistant/prompt.ts store/lib/assistant/provider.ts store/lib/assistant/handler.ts store/lib/assistant/prompt.test.ts store/lib/assistant/handler.test.ts
git commit -m "feat(store): add assistant response handler"
```

---

### Task 5: Assistant API Route

**Files:**
- Create: `store/app/api/assistant/route.ts`

- [ ] **Step 1: Create the assistant API route**

Create `store/app/api/assistant/route.ts`:

```ts
import { NextResponse } from "next/server";
import getProducts from "@/actions/get-products";
import getFaqs from "@/actions/get-faqs";
import getContentBlocks from "@/actions/get-content-blocks";
import getMyOrders from "@/actions/get-my-orders";
import { getCustomerSession } from "@/lib/server-auth";
import {
    ASSISTANT_DEFAULT_MODEL,
    fallbackMessage,
    normalizeAssistantLocale,
} from "@/lib/assistant/config";
import { handleAssistantRequest } from "@/lib/assistant/handler";
import { generateAssistantText } from "@/lib/assistant/provider";
import { rateLimit } from "@/lib/assistant/rate-limit";
import type { AssistantRequestPayload } from "@/lib/assistant/types";

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`assistant:${ip}`, 20, 60_000)) {
        let locale = normalizeAssistantLocale(undefined);
        try {
            const body = (await req.clone().json()) as AssistantRequestPayload;
            locale = normalizeAssistantLocale(body.locale);
        } catch {
        }

        return NextResponse.json(
            {
                status: "rate_limited",
                message: fallbackMessage("rate_limited", locale),
                products: [],
                sources: [],
                orders: [],
                followups: [],
            },
            { status: 429 },
        );
    }

    let body: AssistantRequestPayload;
    try {
        body = (await req.json()) as AssistantRequestPayload;
    } catch {
        const locale = normalizeAssistantLocale(undefined);
        return NextResponse.json(
            {
                status: "invalid",
                message: fallbackMessage("invalid", locale),
                products: [],
                sources: [],
                orders: [],
                followups: [],
            },
            { status: 400 },
        );
    }

    const session = await getCustomerSession();
    const customerId = session?.user?.id ?? null;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_ASSISTANT_MODEL || ASSISTANT_DEFAULT_MODEL;

    const response = await handleAssistantRequest(body, {
        apiKey,
        model,
        customerId,
        loadProducts: () => getProducts({}),
        loadFaqs: () => getFaqs(),
        loadContentBlocks: () => getContentBlocks(),
        loadSignedInOrders: (id) => getMyOrders(id),
        generate: async ({ latestUserMessage, response: grounded }) => {
            const generated = await generateAssistantText({
                apiKey: apiKey ?? "",
                model,
                context: {
                    locale: normalizeAssistantLocale(body.locale),
                    latestUserMessage,
                    messages: body.messages ?? [],
                    products: [],
                    faqs: [],
                    contentBlocks: [],
                    signedInOrders: [],
                },
                response: grounded,
            });

            return {
                status: "ok",
                message: generated.message,
                products: grounded.products,
                sources: grounded.sources,
                orders: grounded.orders,
                followups: generated.followups,
            };
        },
    });

    const status = response.status === "invalid" ? 400 : 200;
    return NextResponse.json(response, { status });
}
```

- [ ] **Step 2: Run assistant tests after route creation**

Run:

```bash
cd store
npm test -- lib/assistant/config.test.ts lib/assistant/rate-limit.test.ts lib/assistant/catalog.test.ts lib/assistant/content.test.ts lib/assistant/orders.test.ts lib/assistant/prompt.test.ts lib/assistant/handler.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd store
npx tsc --noEmit
```

Expected: PASS. If `@anthropic-ai/sdk` types reject `output_config`, match the admin route's SDK version and API shape already used in `admin/app/api/ai/generate/route.ts`.

- [ ] **Step 4: Commit Task 5**

```bash
git add store/app/api/assistant/route.ts
git commit -m "feat(store): add assistant api route"
```

---

### Task 6: Assistant UI Components

**Files:**
- Create: `store/components/assistant/assistant-launcher.tsx`
- Create: `store/components/assistant/assistant-drawer.tsx`
- Create: `store/components/assistant/assistant-message.tsx`
- Create: `store/components/assistant/assistant-product-card.tsx`
- Create: `store/components/assistant/assistant-order-card.tsx`
- Create: `store/components/assistant/assistant-suggestions.tsx`
- Create: `store/components/assistant/index.ts`
- Modify: `store/app/[locale]/layout.tsx`
- Modify: `store/messages/en.json`
- Modify: `store/messages/ro.json`
- Modify: `store/messages/ru.json`

- [ ] **Step 1: Add Assistant translations**

Add this `Assistant` block to `store/messages/en.json` before the closing brace:

```json
"Assistant": {
  "open": "Open assistant",
  "close": "Close assistant",
  "title": "LILETTI Assistant",
  "intro": "Ask about products, sizing, care, delivery, or your order.",
  "placeholder": "Ask the assistant",
  "send": "Send",
  "thinking": "Preparing your answer...",
  "error": "Something went wrong. Please try again.",
  "offline": "The assistant is unavailable right now.",
  "viewProduct": "View product",
  "addToCart": "Add to bag",
  "inStock": "In stock",
  "lowStock": "Low stock",
  "soldOut": "Sold out",
  "sources": "Sources",
  "orders": "Orders",
  "suggestDress": "Help me choose a dress for an evening event",
  "suggestSizes": "What sizes are available?",
  "suggestCare": "How do I care for silk pieces?",
  "suggestOrder": "Where is my order?",
  "suggestCustom": "Can I request made-to-measure?"
}
```

Add equivalent keys to `store/messages/ro.json` and `store/messages/ru.json` with localized values. Keep key names identical.

- [ ] **Step 2: Create assistant exports**

Create `store/components/assistant/index.ts`:

```ts
export { default as AssistantLauncher } from "./assistant-launcher";
```

- [ ] **Step 3: Create assistant launcher**

Create `store/components/assistant/assistant-launcher.tsx`:

```tsx
"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AssistantDrawer from "./assistant-drawer";

const AssistantLauncher = () => {
    const t = useTranslations("Assistant");
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t("open")}
                className="fixed bottom-5 right-5 z-[60] flex size-12 items-center justify-center border border-ink bg-ink text-white transition-colors duration-200 hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-border-strong motion-reduce:transition-none"
            >
                <MessageCircle className="size-5 stroke-[1.5]" />
            </button>
            <AssistantDrawer open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default AssistantLauncher;
```

- [ ] **Step 4: Create suggestions component**

Create `store/components/assistant/assistant-suggestions.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";

type Props = {
    onSelect: (value: string) => void;
};

const AssistantSuggestions = ({ onSelect }: Props) => {
    const t = useTranslations("Assistant");
    const suggestions = [
        t("suggestDress"),
        t("suggestSizes"),
        t("suggestCare"),
        t("suggestOrder"),
        t("suggestCustom"),
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSelect(suggestion)}
                    className="border border-border px-3 py-2 text-left text-xs text-text transition-colors duration-200 hover:border-ink motion-reduce:transition-none"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};

export default AssistantSuggestions;
```

- [ ] **Step 5: Create product card**

Create `store/components/assistant/assistant-product-card.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Currency from "@/components/ui/currency";
import { Link } from "@/i18n/navigation";
import useCart from "@/hooks/use-cart";
import useCartDrawer from "@/hooks/use-cart-drawer";
import type { AssistantProductRecommendation } from "@/lib/assistant/types";

type Props = {
    item: AssistantProductRecommendation;
};

const AssistantProductCard = ({ item }: Props) => {
    const t = useTranslations("Assistant");
    const locale = useLocale();
    const cart = useCart();
    const drawer = useCartDrawer();

    const stockLabel =
        item.stockState === "out"
            ? t("soldOut")
            : item.stockState === "low"
              ? t("lowStock")
              : t("inStock");

    const addToCart = () => {
        if (!item.cartLine) return;
        cart.addItem(item.cartLine);
        drawer.onOpen();
    };

    return (
        <article className="grid grid-cols-[72px_1fr] gap-3 border border-border p-3">
            <div className="relative aspect-[3/4] overflow-hidden bg-placeholder">
                {item.imageUrl && (
                    <Image
                        fill
                        src={item.imageUrl}
                        alt={item.name}
                        sizes="72px"
                        className="object-cover"
                    />
                )}
            </div>
            <div className="min-w-0">
                <p className="text-sm text-text">{item.name}</p>
                {item.categoryName && (
                    <p className="mt-1 text-xs text-muted-strong">{item.categoryName}</p>
                )}
                <div className="mt-2 text-sm text-text">
                    <Currency value={item.price} />
                </div>
                <p className="mt-2 text-xs text-muted-strong">{stockLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                        href={`/product/${item.productId}`}
                        className="border border-border-strong px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 hover:bg-ink hover:text-white"
                    >
                        {t("viewProduct")}
                    </Link>
                    {item.cartLine && (
                        <button
                            type="button"
                            onClick={addToCart}
                            className="border border-ink bg-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-white hover:text-ink"
                        >
                            {t("addToCart")}
                        </button>
                    )}
                </div>
                <p className="sr-only">{locale}</p>
            </div>
        </article>
    );
};

export default AssistantProductCard;
```

- [ ] **Step 6: Create order card**

Create `store/components/assistant/assistant-order-card.tsx`:

```tsx
"use client";

import Currency from "@/components/ui/currency";
import type { AssistantOrderSummary } from "@/lib/assistant/types";

type Props = {
    order: AssistantOrderSummary;
};

const AssistantOrderCard = ({ order }: Props) => (
    <article className="border border-border p-3 text-sm text-text">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="font-mono text-xs">{order.id}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.1em] text-muted-strong">
                    {order.status}
                </p>
            </div>
            <Currency value={order.total} />
        </div>
        {order.tracking && (
            <p className="mt-2 text-xs text-muted-strong">{order.tracking}</p>
        )}
        <ul className="mt-3 space-y-1">
            {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}`} className="text-xs text-text">
                    {item.productName} x {item.quantity}
                </li>
            ))}
        </ul>
    </article>
);

export default AssistantOrderCard;
```

- [ ] **Step 7: Create message component**

Create `store/components/assistant/assistant-message.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import type { AssistantResponse } from "@/lib/assistant/types";
import AssistantOrderCard from "./assistant-order-card";
import AssistantProductCard from "./assistant-product-card";

type Props = {
    role: "user" | "assistant";
    content: string;
    response?: AssistantResponse;
};

const AssistantMessage = ({ role, content, response }: Props) => {
    const t = useTranslations("Assistant");
    const isUser = role === "user";

    return (
        <div className={isUser ? "ml-auto max-w-[85%]" : "mr-auto max-w-[92%]"}>
            <div
                className={
                    isUser
                        ? "bg-ink px-4 py-3 text-sm text-white"
                        : "border border-border bg-background px-4 py-3 text-sm text-text"
                }
            >
                <p className="whitespace-pre-line">{content}</p>
            </div>
            {response && response.products.length > 0 && (
                <div className="mt-3 space-y-3">
                    {response.products.map((product) => (
                        <AssistantProductCard key={product.productId} item={product} />
                    ))}
                </div>
            )}
            {response && response.orders.length > 0 && (
                <div className="mt-3 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                        {t("orders")}
                    </p>
                    {response.orders.map((order) => (
                        <AssistantOrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
            {response && response.sources.length > 0 && (
                <div className="mt-3 border-l border-border pl-3">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                        {t("sources")}
                    </p>
                    <ul className="mt-2 space-y-1">
                        {response.sources.map((source) => (
                            <li key={`${source.type}-${source.id}`} className="text-xs text-muted-strong">
                                {source.label}: {source.excerpt}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AssistantMessage;
```

- [ ] **Step 8: Create drawer component**

Create `store/components/assistant/assistant-drawer.tsx`:

```tsx
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Send, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AssistantResponse } from "@/lib/assistant/types";
import AssistantMessage from "./assistant-message";
import AssistantSuggestions from "./assistant-suggestions";

type Props = {
    open: boolean;
    onClose: () => void;
};

type UiMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    response?: AssistantResponse;
};

const AssistantDrawer = ({ open, onClose }: Props) => {
    const t = useTranslations("Assistant");
    const locale = useLocale();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<UiMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const apiMessages = useMemo(
        () => messages.map((message) => ({
            role: message.role,
            content: message.content,
        })),
        [messages],
    );

    const sendMessage = async (value: string) => {
        const text = value.trim();
        if (!text || loading) return;

        const userMessage: UiMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
        };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locale,
                    messages: [...apiMessages, { role: "user", content: text }],
                }),
            });
            const data = (await res.json()) as AssistantResponse;
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.message,
                    response: data,
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: t("error"),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[90]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 flex justify-end">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <Dialog.Panel className="flex h-full w-[92%] max-w-[460px] flex-col bg-background shadow-[var(--shadow-overlay)]">
                                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                    <Dialog.Title className="heading-luxe text-sm text-ink">
                                        {t("title")}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label={t("close")}
                                        className="flex size-9 items-center justify-center text-text transition-colors duration-200 hover:text-muted"
                                    >
                                        <X size={18} strokeWidth={1.5} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                                    {messages.length === 0 && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-strong">{t("intro")}</p>
                                            <AssistantSuggestions onSelect={sendMessage} />
                                        </div>
                                    )}
                                    {messages.map((message) => (
                                        <AssistantMessage
                                            key={message.id}
                                            role={message.role}
                                            content={message.content}
                                            response={message.response}
                                        />
                                    ))}
                                    {loading && (
                                        <p className="text-sm text-muted-strong">{t("thinking")}</p>
                                    )}
                                </div>

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void sendMessage(input);
                                    }}
                                    className="flex gap-2 border-t border-border p-4"
                                >
                                    <label htmlFor="assistant-input" className="sr-only">
                                        {t("placeholder")}
                                    </label>
                                    <input
                                        id="assistant-input"
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        placeholder={t("placeholder")}
                                        className="min-w-0 flex-1 border border-border bg-background px-3 py-3 text-sm text-text placeholder:text-muted-strong focus:border-ink focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || input.trim().length === 0}
                                        aria-label={t("send")}
                                        className="flex size-12 items-center justify-center border border-ink bg-ink text-white transition-colors duration-200 hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Send className="size-4 stroke-[1.5]" />
                                    </button>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AssistantDrawer;
```

- [ ] **Step 9: Mount launcher in locale layout**

Modify `store/app/[locale]/layout.tsx`:

```tsx
import { AssistantLauncher } from '@/components/assistant'
```

Inside `<NextIntlClientProvider>`, after `<CartDrawer />`, add:

```tsx
<AssistantLauncher />
```

- [ ] **Step 10: Run typecheck**

Run:

```bash
cd store
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 11: Commit Task 6**

```bash
git add store/app/[locale]/layout.tsx store/components/assistant store/messages/en.json store/messages/ro.json store/messages/ru.json
git commit -m "feat(store): add assistant drawer"
```

---

### Task 7: Build, Smoke Test, And Polish

**Files:**
- Modify only files required by failing verification from earlier tasks.

- [ ] **Step 1: Run full store tests**

Run:

```bash
cd store
npm test
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```bash
cd store
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run production build without AI key**

Run:

```bash
cd store
npm run build
```

Expected: PASS with no `ANTHROPIC_API_KEY` required.

- [ ] **Step 4: Start the storefront for manual smoke testing**

Run:

```bash
cd store
npm run dev
```

Expected: dev server starts on `http://localhost:3002`.

- [ ] **Step 5: Manual smoke test**

Open `http://localhost:3002/en` and verify:

- Assistant launcher appears bottom-right.
- Drawer opens and closes.
- Quick prompts fit on mobile and desktop.
- With no `ANTHROPIC_API_KEY`, submitting a prompt shows the localized offline message.
- With `ANTHROPIC_API_KEY` configured, asking "Help me choose a dress for an evening event" returns product cards from the real catalog.
- Clicking "View product" navigates to the product page.
- Clicking "Add to bag" on a concrete in-stock recommendation opens the cart drawer and adds one line.
- Asking "Where is my order?" while signed out gives sign-in or guest lookup guidance.

- [ ] **Step 6: Commit verification polish**

If any fixes were required:

```bash
git add store
git commit -m "fix(store): polish assistant verification"
```

If no fixes were required, skip this commit.

---

## Self-Review Checklist

- Spec coverage:
  - Sales assistant: Tasks 2, 4, 5, 6.
  - Support assistant: Tasks 3, 4, 5, 6.
  - Order assistant: Tasks 3, 4, 5, 6.
  - Env-gated AI: Tasks 1, 4, 5, 7.
  - Explicit cart clicks: Task 6.
  - No new database tables: all tasks stay in `store/` code and env/package files.

- Placeholder scan:
  - This plan intentionally avoids unresolved placeholders and names every file.

- Type consistency:
  - `AssistantResponse`, `AssistantProductRecommendation`, `AssistantOrderSummary`, and `AssistantCartLine` are defined in Task 1 and reused consistently in Tasks 2, 4, 5, and 6.

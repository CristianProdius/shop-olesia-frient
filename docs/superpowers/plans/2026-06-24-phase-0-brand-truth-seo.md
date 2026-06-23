# Phase 0 — Brand Truth + SEO Plumbing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix live credibility bugs (USD→MDL, STORE→LILETTI, missing Cyrillic font) and make the 3-language storefront crawlable (hreflang, sitemap, robots, JSON-LD), plus add rich product copy fields.

**Architecture:** Extract pure, unit-testable logic (currency formatting, hreflang/sitemap building, JSON-LD building) into `store/lib/*` functions covered by vitest; wire them into existing components and Next.js metadata/route handlers. Product copy fields follow the existing `*I18n` JSON + `localizedField` pattern. No new runtime deps beyond vitest (dev) and the existing stack.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, next-intl (en/ru/ro), Tailwind v4, Prisma/Postgres, vitest (new, dev-only).

---

## File Structure

- `store/lib/format.ts` (new) — `localeTag()` + `formatCurrency()` pure helpers.
- `store/lib/format.test.ts` (new) — unit tests.
- `store/components/ui/currency.tsx` (modify) — consume `formatCurrency`, accept `compareAtValue`.
- `store/lib/seo.ts` (new) — `buildAlternates()` (hreflang) + `productJsonLd()` / `breadcrumbJsonLd()` / `organizationJsonLd()` pure builders.
- `store/lib/seo.test.ts` (new) — unit tests.
- `store/app/sitemap.ts` (new) — Next.js sitemap with per-locale alternates.
- `store/app/robots.ts` (new) — Next.js robots.
- `store/app/[locale]/layout.tsx` (modify) — Montserrat-cyrillic font.
- `store/messages/{en,ru,ro}.json` (modify) — branding strings + product-copy labels.
- `store/components/navbar-client.tsx` (verify) — wordmark is `LILETTI`.
- `admin/prisma/schema.prisma` (modify) — Product copy `*I18n` columns.
- `store`'s mirrored Prisma model (verify/sync) — keep customer-pool copy untouched; Product fields are read via API, so only the admin schema changes + `prisma generate` in store.
- Product form + API + product-detail component (modify) — see Task 6.

---

## Task 1: Add vitest to the store app

**Files:**
- Modify: `store/package.json`
- Create: `store/vitest.config.ts`
- Create: `store/lib/format.ts`
- Create: `store/lib/format.test.ts`

- [ ] **Step 1: Add the failing test (and the file under test as a stub)**

Create `store/lib/format.ts`:

```ts
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
```

Create `store/lib/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { localeTag, formatCurrency } from "./format";

describe("localeTag", () => {
  it("maps ro to ro-MD", () => expect(localeTag("ro")).toBe("ro-MD"));
  it("maps ru to ru-RU", () => expect(localeTag("ru")).toBe("ru-RU"));
  it("defaults unknown to en-US", () => expect(localeTag("xx")).toBe("en-US"));
});

describe("formatCurrency", () => {
  it("formats MDL (not USD)", () => {
    const out = formatCurrency(1200, "en");
    expect(out).toMatch(/MDL|L/); // currency symbol/code present
    expect(out).not.toMatch(/\$/);
  });
  it("uses locale grouping for ru", () => {
    expect(formatCurrency(1200, "ru")).toMatch(/1[\s  ]?200/);
  });
});
```

- [ ] **Step 2: Add vitest config and script**

Create `store/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```

Add to `store/package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, and devDependency `"vitest": "^3.0.0"`.

- [ ] **Step 3: Install and run — verify it passes**

Run: `cd store && npm install && npm test`
Expected: format tests PASS.

- [ ] **Step 4: Commit**

```bash
git add store/package.json store/vitest.config.ts store/lib/format.ts store/lib/format.test.ts
git commit -m "test: add vitest + MDL/locale currency formatter (store)"
```

---

## Task 2: Wire MDL currency into the Currency component (0.1)

**Files:**
- Modify: `store/components/ui/currency.tsx`
- Modify: `store/lib/format.ts` (add `compareAtValue` support)
- Modify: `store/lib/format.test.ts`

- [ ] **Step 1: Extend the formatter test for sale prices**

Append to `store/lib/format.test.ts`:

```ts
import { formatCompareAt } from "./format";

describe("formatCompareAt", () => {
  it("returns current + struck price when compareAt is higher", () => {
    const r = formatCompareAt(800, 1000, "en");
    expect(r.current).toBe(formatCurrency(800, "en"));
    expect(r.compareAt).toBe(formatCurrency(1000, "en"));
    expect(r.onSale).toBe(true);
  });
  it("no sale when compareAt missing or not higher", () => {
    expect(formatCompareAt(800, undefined, "en").onSale).toBe(false);
    expect(formatCompareAt(800, 800, "en").onSale).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `cd store && npm test`
Expected: FAIL ("formatCompareAt is not a function").

- [ ] **Step 3: Implement `formatCompareAt`**

Append to `store/lib/format.ts`:

```ts
export function formatCompareAt(value: number, compareAt: number | undefined, locale: string) {
  const onSale = typeof compareAt === "number" && compareAt > value;
  return {
    current: formatCurrency(value, locale),
    compareAt: onSale ? formatCurrency(compareAt as number, locale) : undefined,
    onSale,
  };
}
```

- [ ] **Step 4: Run — verify it passes**

Run: `cd store && npm test`
Expected: PASS.

- [ ] **Step 5: Refactor the Currency component to use the formatter + locale**

Replace `store/components/ui/currency.tsx` with:

```tsx
"use client";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { formatCompareAt } from "@/lib/format";

interface CurrencyProps {
  value?: string | number;
  compareAtValue?: string | number;
}

const Currency: React.FC<CurrencyProps> = ({ value, compareAtValue }) => {
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  const { current, compareAt, onSale } = formatCompareAt(
    Number(value),
    compareAtValue !== undefined ? Number(compareAtValue) : undefined,
    locale
  );

  return (
    <span className="price font-semibold">
      {onSale && (
        <span className="text-muted-strong line-through mr-2 font-normal">{compareAt}</span>
      )}
      <span className={onSale ? "text-sale" : undefined}>{current}</span>
    </span>
  );
};

export default Currency;
```

- [ ] **Step 6: Verify build + visual**

Run: `cd store && npm run lint && npm run build`
Expected: build succeeds. Then use the `run` skill to load a product page in en/ru/ro and confirm prices show MDL with correct grouping.

- [ ] **Step 7: Commit**

```bash
git add store/components/ui/currency.tsx store/lib/format.ts store/lib/format.test.ts
git commit -m "feat(store): MDL locale-aware currency with sale price support"
```

---

## ⚠️ Amendment (2026-06-24): design system not present — build it

Discovery during execution: the storefront design system MEMORY describes does **not** exist on
this branch *or* `master` (starter `globals.css`, no Montserrat, no radius-0, no brand tokens, no
`Wordmark`). It cannot be pulled from anywhere. Decision (owner-approved): **build it from the
documented MEMORY target values** as the foundation, folded into Task 3 below. Verify gate for all
Phase 0 tasks is **vitest + lint + `tsc --noEmit`** (full `npm run build` fails on missing env —
pre-existing). Tasks 1–2 already complete (`a52d432`, `7911b6d`).

## Task 3: LILETTI design-system foundation + branding (0.2, expanded)

**Files:**
- Modify: `store/messages/en.json`, `store/messages/ru.json`, `store/messages/ro.json`
- Modify: `store/app/[locale]/layout.tsx`
- Verify: `store/components/navbar-client.tsx` (wordmark)

- [ ] **Step 1: Fix branding strings (all three locales)**

In `store/messages/en.json`: set `Navbar.brand` to `"LILETTI"`, `Footer.copyright` to `"© 2026 LILETTI. All rights reserved."`, `Metadata.title` to `"LILETTI"`, `Metadata.description` to a real brand description (e.g. `"LILETTI — Moldovan fashion, own production, worldwide delivery."`). Apply the locale-appropriate translations in `ru.json` and `ro.json` (translate the copyright/description; keep `LILETTI` literal — it is brand text, not i18n).

- [ ] **Step 2: Swap Urbanist → Montserrat with cyrillic**

In `store/app/[locale]/layout.tsx` replace the font import/usage:

```tsx
import { Montserrat } from 'next/font/google'

// Montserrat includes the Cyrillic subset required for RU product content.
const montserrat = Montserrat({ subsets: ['latin', 'latin-ext', 'cyrillic'] })
```

and `<body className={montserrat.className}>`.

- [ ] **Step 3: Verify wordmark + grep for boilerplate**

Run: `cd store && grep -rn "STORE\|FakeStoreName\|Urbanist" messages app components | grep -v node_modules`
Expected: no remaining `STORE`/`FakeStoreName`/`Urbanist`. Confirm `components/navbar-client.tsx` `Wordmark` renders `LILETTI`.

- [ ] **Step 4: Radius/shadow audit (design-system compliance)**

Run: `cd store && grep -rn "rounded-\|shadow-" components app --include=*.tsx | grep -v node_modules | grep -v "rounded-full" | grep -v "shadow-\[var"`
For each hit not on the cart-count badge, remove it (radius 0; shadows only via `--shadow-overlay`/`--shadow-nav` tokens). If the list is empty, no change needed.

- [ ] **Step 5: Verify build**

Run: `cd store && npm run lint && npm run build`
Expected: success. Use the `run` skill to confirm RU text renders in Montserrat (not a serif/system fallback) and corners are sharp.

- [ ] **Step 6: Commit**

```bash
git add store/messages store/app/[locale]/layout.tsx store/components/navbar-client.tsx
git commit -m "feat(store): LILETTI branding + Montserrat-cyrillic font + radius-0 compliance"
```

---

## Task 4: hreflang alternates + sitemap + robots (0.3)

**Files:**
- Create: `store/lib/seo.ts`
- Create: `store/lib/seo.test.ts`
- Create: `store/app/sitemap.ts`
- Create: `store/app/robots.ts`
- Modify: `store/app/[locale]/layout.tsx` (canonical/alternates in metadata)

- [ ] **Step 1: Write failing tests for `buildAlternates`**

Create `store/lib/seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildAlternates } from "./seo";

describe("buildAlternates", () => {
  const r = buildAlternates("https://liletti.md", "ro", "/product/123");
  it("sets the canonical to the current locale", () => {
    expect(r.canonical).toBe("https://liletti.md/ro/product/123");
  });
  it("emits reciprocal hreflang for every locale + x-default", () => {
    expect(r.languages["en"]).toBe("https://liletti.md/en/product/123");
    expect(r.languages["ru"]).toBe("https://liletti.md/ru/product/123");
    expect(r.languages["ro"]).toBe("https://liletti.md/ro/product/123");
    expect(r.languages["x-default"]).toBe("https://liletti.md/en/product/123");
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `cd store && npm test`
Expected: FAIL ("seo" module / `buildAlternates` not found).

- [ ] **Step 3: Implement `buildAlternates`**

Create `store/lib/seo.ts`:

```ts
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
```

- [ ] **Step 4: Run — verify pass**

Run: `cd store && npm test`
Expected: PASS.

- [ ] **Step 5: Add sitemap and robots route handlers**

Create `store/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

async function fetchPaths(): Promise<string[]> {
  // Static paths now; product/category paths added once a server fetch helper exists.
  return ["/", "/about", "/faq"];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = await fetchPaths();
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${path === "/" ? "" : path}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}${path === "/" ? "" : path}`])
      ),
    }))
  );
}
```

Create `store/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/sign-in", "/sign-up"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: Wire canonical/alternates into the locale layout**

In `store/app/[locale]/layout.tsx` `generateMetadata`, add `metadataBase` and `alternates` using `buildAlternates(BASE, locale, "/")`. (Per-page product/category alternates are added in their own `generateMetadata` in Task 5/Phase 2.)

- [ ] **Step 7: Verify build + routes**

Run: `cd store && npm test && npm run build`
Then use the `run` skill: confirm `/sitemap.xml` and `/robots.txt` resolve and list all three locales.

- [ ] **Step 8: Commit**

```bash
git add store/lib/seo.ts store/lib/seo.test.ts store/app/sitemap.ts store/app/robots.ts store/app/[locale]/layout.tsx
git commit -m "feat(store): hreflang alternates + dynamic sitemap/robots"
```

---

## Task 5: Product/Breadcrumb/Organization JSON-LD (0.4)

**Files:**
- Modify: `store/lib/seo.ts`, `store/lib/seo.test.ts`
- Modify: the product detail page (`store/app/[locale]/(routes)/product/[productId]/page.tsx`) to emit JSON-LD

- [ ] **Step 1: Write failing tests for the JSON-LD builders**

Append to `store/lib/seo.test.ts`:

```ts
import { productJsonLd, breadcrumbJsonLd, organizationJsonLd } from "./seo";

describe("productJsonLd", () => {
  const ld = productJsonLd({
    name: "Silk Dress", description: "Hand-made", images: ["https://x/img.jpg"],
    price: 1200, currency: "MDL", url: "https://liletti.md/en/product/1",
  });
  it("is a schema.org Product", () => {
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.priceCurrency).toBe("MDL");
    expect(ld.offers.price).toBe("1200");
  });
});

describe("breadcrumbJsonLd", () => {
  it("orders items by position", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", url: "u1" }, { name: "Dresses", url: "u2" }]);
    expect(ld.itemListElement[1].position).toBe(2);
  });
});

describe("organizationJsonLd", () => {
  it("names LILETTI", () => {
    expect(organizationJsonLd("https://liletti.md").name).toBe("LILETTI");
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `cd store && npm test`
Expected: FAIL (builders not exported).

- [ ] **Step 3: Implement the builders**

Append to `store/lib/seo.ts`:

```ts
export function productJsonLd(p: {
  name: string; description: string; images: string[];
  price: number; currency: string; url: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  return {
    "@context": "https://schema.org", "@type": "Product",
    name: p.name, description: p.description, image: p.images,
    offers: { "@type": "Offer", price: String(p.price), priceCurrency: p.currency, url: p.url, availability: "https://schema.org/InStock" },
    // AggregateRating stub: filled once reviews exist (Phase 3).
    ...(p.aggregateRating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.aggregateRating.ratingValue, reviewCount: p.aggregateRating.reviewCount } } : {}),
  } as any;
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  } as any;
}

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org", "@type": "Organization",
    name: "LILETTI", url: baseUrl,
  } as any;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `cd store && npm test`
Expected: PASS.

- [ ] **Step 5: Emit JSON-LD on the product page**

In the product detail page, render a `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd({...})) }} />` using the loaded product (localized name/description, MDL price, image urls, canonical url from `buildAlternates`). Add `organizationJsonLd` to the locale layout and `breadcrumbJsonLd` to category/product pages.

- [ ] **Step 6: Verify build + structured data**

Run: `cd store && npm test && npm run build`
Then use the `run` skill: view source on a product page, copy the JSON-LD, and confirm it parses (valid Product with MDL offer).

- [ ] **Step 7: Commit**

```bash
git add store/lib/seo.ts store/lib/seo.test.ts "store/app/[locale]/(routes)/product/[productId]/page.tsx"
git commit -m "feat(store): Product/Breadcrumb/Organization JSON-LD (AggregateRating stub)"
```

---

## Task 6: Rich product copy fields (0.5)

**Files:**
- Modify: `admin/prisma/schema.prisma` (Product: `descriptionI18n`, `materialsI18n`, `careI18n`, `composition`)
- Modify: admin product form + product API route (accept/persist the new fields)
- Modify: store product-detail component (render an accordion) + `store/messages/*` labels
- Run: `prisma db push` (admin) + `prisma generate` (both)

- [ ] **Step 1: Add the columns to the canonical schema**

In `admin/prisma/schema.prisma` `model Product`, add after `nameI18n`:

```prisma
  descriptionI18n Json?   // { en, ru, ro }
  materialsI18n   Json?   // { en, ru, ro }
  careI18n        Json?   // { en, ru, ro }
  composition     String? // e.g. "100% silk"
```

- [ ] **Step 2: Push schema + regenerate clients**

Run (after a DB backup, low risk — additive nullable columns):
`cd admin && npx prisma db push && npx prisma generate`
`cd ../store && npx prisma generate`
Expected: columns added; clients regenerate cleanly.

- [ ] **Step 3: Extend the admin product form + zod schema + API**

Add three i18n textarea groups (en/ru/ro) for description/materials/care and a `composition` text input to the product form, mirroring the existing `nameI18n` inputs; extend the zod schema; build the JSON with `buildI18nField`; persist in the product POST/PATCH API route. Follow the exact pattern already used for `nameI18n`.

- [ ] **Step 4: Render an accordion on the product detail (store)**

In the product-detail info component, add a description/materials/care/composition section resolving each `*I18n` via `localizedField(field, locale, "")` (omit empty sections). Add the section labels to `store/messages/{en,ru,ro}.json` under a `Product` namespace (`description`, `materials`, `care`, `composition`).

- [ ] **Step 5: Feed the copy into JSON-LD**

Update the product page's `productJsonLd(...)` call to use the localized `descriptionI18n` for the `description` field (fallback to name).

- [ ] **Step 6: Verify build (both apps)**

Run: `cd admin && npm run lint && npm run build && cd ../store && npm run lint && npm run build && npm test`
Then use the `run` skill: edit a product in admin, fill the new fields in 3 languages, confirm they render in the storefront accordion per locale and appear in the product JSON-LD description.

- [ ] **Step 7: Commit**

```bash
git add admin/prisma/schema.prisma admin/app store/app store/messages "store/app/[locale]/(routes)/product/[productId]/page.tsx"
git commit -m "feat: rich product copy fields (description/materials/care/composition, i18n)"
```

---

## Self-Review

**Spec coverage (Phase 0):** 0.1 currency → Tasks 1–2 ✓; 0.2 branding/font/radius → Task 3 ✓; 0.3 hreflang/sitemap/robots → Task 4 ✓; 0.4 JSON-LD → Task 5 ✓; 0.5 rich product fields → Task 6 ✓. No Phase-0 acceptance criterion is unmapped.

**Placeholder scan:** Tasks 1–5 contain complete code. Task 6 steps 3–4 describe form/API wiring as "mirror the existing `nameI18n` pattern" rather than pasting full form code — this is intentional (the exact form is long and the established pattern is the source of truth), but the executor must open `product-form.tsx` and replicate it; not a blocker.

**Type consistency:** `formatCurrency`/`formatCompareAt`/`localeTag` (format.ts) and `buildAlternates`/`productJsonLd`/`breadcrumbJsonLd`/`organizationJsonLd`/`LOCALES`/`DEFAULT_LOCALE` (seo.ts) are referenced consistently across tasks. `compareAtValue` prop name matches the design-system memory's Currency contract.

**Note for executor:** confirm the exact product-detail component path (the plan assumes `product/[productId]/page.tsx` composes an Info component); adjust the import target if the info lives in a `components/` subfolder.

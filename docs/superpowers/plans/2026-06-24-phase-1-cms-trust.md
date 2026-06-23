# Phase 1 — CMS Foundation + Trust Content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Verify gate (NOT `npm run build`): admin → `npm run lint` + `npx tsc --noEmit`; store → `npm test && npm run lint && npx tsc --noEmit`. Use local prisma `node_modules/.bin/prisma` (v6), never `npx prisma` (pulls v7). `admin/.env` is configured (Postgres :5433). New models are additive → `db push` is safe.

**Goal:** Stand up a reusable multilingual content layer (ContentBlock + Faq + Stat) and wire the marketing-audit trust blocks (Brand Story, Behind-the-scenes, Why-choose-us, FAQ, Social-proof) + newsletter, all operator-editable in en/ru/ro.

**Architecture:** One generic `ContentBlock` model (typed/ordered/publishable) renders four audit blocks. `Faq` + `Stat` are thin sibling models. `Subscriber` already exists in the DB. Admin CRUD mirrors the existing **billboard** pattern (`admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/*` + `admin/app/api/[storeId]/billboards/*`). Store reads via new `store/actions/get-*` over the admin REST API, resolved by `localizedField`. Nav entries register in `admin/components/main-nav.tsx` (i18n `Nav` namespace).

**Tech Stack:** Next.js 15, Prisma/Postgres, next-intl (en/ru/ro), shadcn/radix, react-hook-form+zod, MinIO uploads, vitest.

---

## Models (additive — one `db push`)

```prisma
model ContentBlock {
  id          String   @id @default(uuid())
  storeId     String
  type        String   // "brand-story" | "behind-the-scenes" | "why-choose-us" | "social-proof"
  heading     String?
  headingI18n Json?    // { en, ru, ro }
  body        String?
  bodyI18n    Json?    // { en, ru, ro }
  mediaUrl    String?
  order       Int      @default(0)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([storeId])
  @@index([storeId, type])
}

model Faq {
  id           String   @id @default(uuid())
  storeId      String
  category     String?
  categoryI18n Json?
  question     String
  questionI18n Json?
  answer       String
  answerI18n   Json?
  order        Int      @default(0)
  isPublished  Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([storeId])
}

model Stat {
  id        String   @id @default(uuid())
  storeId   String
  key       String   // "orders" | "customers" | "countries" | free-form
  label     String
  labelI18n Json?
  value     String   // display value (admin-overridable for honest seeding)
  order     Int      @default(0)
  isPublished Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([storeId])
}
```
(`Subscriber` already exists.)

---

## Task 1 — Models + admin CRUD foundation
**Files:** `admin/prisma/schema.prisma` (+3 models); `db push`+`generate`; new admin route folders `content`, `faqs`, `stats` mirroring `billboards/*` (list page+client+columns+cell-action, form page+form, API collection+item); nav entries in `main-nav.tsx` + `Nav` i18n keys (en/ru/ro) + new admin message namespaces (`Content`,`Faqs`,`Stats`).
- Each form has per-locale (en/ru/ro) inputs for the i18n fields (use existing Textarea/Input), `order` number, `isPublished` checkbox, and (ContentBlock) a `type` select + `mediaUrl` ImageUpload. Build i18n JSON with `buildI18nField`; store plain fallback + i18n like the `nameI18n` convention. Zod-validate `type` against the 4 allowed values.
- **Verify:** admin lint + tsc clean; manually create one of each in the running admin (optional). **Commit.**

## Task 2 — Store content layer + Brand Story `/about` + Behind-the-scenes `/atelier`
**Files:** `store/actions/get-content-blocks.tsx` (fetch by type via admin API); `store/lib/i18n-content.ts` already has `localizedField`; new routes `store/app/[locale]/(routes)/about/page.tsx` and `.../atelier/page.tsx`; reusable `store/components/content-section.tsx`. Render only `isPublished` blocks, ordered by `order`, localized. Add nav/footer links + `About`/`Atelier` message keys (en/ru/ro). Add `/about`,`/atelier` to `store/app/sitemap.ts`.
- **Verify:** store test/lint/tsc. **Commit.**

## Task 3 — Why-choose-us strip (home) + checkout trust badges
**Files:** `store/components/why-choose-us.tsx` (renders `why-choose-us` ContentBlocks as an icon/value strip) added to home; compact trust-badge row component in cart/checkout (own production, worldwide delivery, secure payment, returns) using `WhyChooseUs` data or static i18n. Message keys en/ru/ro.
- **Verify:** store test/lint/tsc. **Commit.**

## Task 4 — FAQ `/faq` + FAQPage JSON-LD
**Files:** `store/actions/get-faqs.tsx`; `store/app/[locale]/(routes)/faq/page.tsx` (accordion grouped by category, localized); `store/lib/seo.ts` add `faqPageJsonLd(items)` + vitest test; emit on `/faq`. Nav/footer link + `Faq` message keys. Add `/faq` already in sitemap.
- **Verify:** store test (incl. new seo test) + lint + tsc. **Commit.**

## Task 5 — Newsletter (Subscriber) capture + admin list
**Files:** store `store/components/newsletter.tsx` (footer + post-checkout), posts `{email, locale}` to a store API route `store/app/api/subscribe/route.ts` (or admin `api/[storeId]/subscribers`) that upserts `Subscriber` (unique storeId+email); admin read-only list page `subscribers/*` (table + CSV export button) + nav entry + i18n. Validate email.
- **Verify:** admin + store lint/tsc; store test. **Commit.**

## Task 6 — Social-proof counters (Stat) + home band
**Files:** `store/actions/get-stats.tsx`; `store/components/social-proof.tsx` band on home rendering published `Stat`s (value + localized label); admin Stat CRUD already from Task 1. Optionally a cached admin endpoint computing real order/customer counts as defaults — keep simple: render admin-entered Stat values (honest seeding). Message keys.
- **Verify:** store test/lint/tsc. **Commit.**

---

## Notes
- `BlogPost` exists in the DB/schema but blog UI is **deferred to Phase 4** (per spec out-of-scope) — do NOT build blog pages in Phase 1.
- Keep all new admin UI consuming shadcn token classes (no hardcoded hex); keep store UI radius-0 + token utilities.
- Two Prisma schemas: only the admin canonical schema changes; the store consumes via API, so no store-schema change for these content models.

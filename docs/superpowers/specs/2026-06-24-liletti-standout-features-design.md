# LILETTI Standout Features — Master Design

**Date:** 2026-06-24
**Status:** Approved for autonomous (full-auto) execution, owner reviews at the end
**Scope:** Storefront marketing audit + standout admin features, sequenced in 4 phases (0→1→2→3)

---

## 1. Context

LILETTI is a Moldovan premium fashion brand (own production, offline store, international
delivery). The repo holds two Next.js 15 apps:

- `admin/` (port 3001) — dashboard/CMS + REST API. **Canonical** Prisma schema lives here
  (`admin/prisma/schema.prisma`) and owns `prisma db push`. Better Auth (staff pool), MinIO
  presigned uploads, shadcn/radix, recharts, react-hook-form + zod, @tanstack/react-table.
- `store/` (port 3002) — storefront. next-intl locales **en/ru/ro**, zustand cart, payments
  **simulated**. Only runs `prisma generate` against a mirrored copy of the customer-pool models.

A marketing audit flagged: weak selling homepage, thin brand story, no trust triggers
(reviews/ratings/social proof), weak SEO content, no emotional engagement. Requested blocks:
Why-choose-us, Brand story, Reviews, Behind-the-scenes, FAQ, Social proof.

### Design-system constraints (hard)
- Storefront **radius 0** (only the cart-count badge is rounded). **No shadows** except overlays.
- Chrome/nav/brand = **UPPERCASE + 700 + wide tracking**; **never** uppercase product names/prices.
- Currency is **MDL**, locale-aware (ro-MD / ru-RU / en-US). Brand wordmark is **LILETTI** (the
  `olesia-frient` dir name is legacy — never shown in UI).
- Montserrat **with cyrillic subset** (required for RU). Admin retheme = **CSS-var values + markup
  only**; never change shadcn class contracts.
- Tokens are source of truth (`store/app/globals.css`, `admin/app/globals.css`) — never hardcode hex.

### Known current-state facts (verified against code, 2026-06-24)
- `store/components/ui/currency.tsx` hardcodes `Intl.NumberFormat('en-US', { currency: 'USD' })`
  — **live bug** (no MDL, no locale, no compareAt). *(The design-system memory describing it as
  already locale-aware is stale for this branch.)*
- `OrderItem` has **no `quantity`** and no `unitPrice` — revenue math assumes 1 unit/line.
- `Order` folds the customer name into the `address` string; has no `status`, no email, no tracking.
- `Product` has **scalar** `sizeId`/`colorId` (one size + one color per product) — a multi-size/
  multi-color garment must today be modeled as many fake products. No description/materials/SEO fields.
- `Image` is product-only (`productId` FK, cascade). No general media/asset model.
- Checkout (`admin/app/api/[storeId]/checkout/route.ts`) trusts `customerId` from the body and
  **auto-archives** purchased products instead of decrementing stock.
- i18n content pattern already exists: `*I18n` JSON columns + `localizedField`/`buildI18nField`
  (`admin/lib/i18n-content.ts`, mirrored in `store/lib/i18n-content.ts`).

---

## 2. Architecture principles (reuse, don't reinvent)

1. **i18n via JSON columns.** Every new translatable field is a `Json?` `*I18n` column resolved by
   `localizedField`. Forms build them with `buildI18nField`. No new i18n infra.
2. **One generic content model, not one-per-block.** A single `ContentBlock` (typed, ordered,
   publishable, with media) renders Brand Story, Behind-the-scenes, Why-choose-us, and Social-proof.
3. **Galleries reuse the `Image` shape** (parent FK + url + cascade). New galleries (review photos,
   content media) follow the same pattern.
4. **Store reads admin data over the existing REST API** (`/api/[storeId]/...`), resolved through
   `localizedField`. Static chrome copy stays in `messages/{en,ru,ro}.json`.
5. **Two Prisma schemas stay in sync.** Admin schema is canonical and owns `db push`; the store's
   customer-pool copy is updated in lockstep. Any new customer-facing model the store reads is
   exposed via API, not a second client — only the auth customer pool is duplicated.
6. **AI is server-side only.** A shared `admin /api/ai/generate` proxy holds the Claude API key;
   the browser never sees it. Uses the latest Claude model (see `claude-api` skill at build time).
7. **Payment-agnostic by default.** Everything is designed to ship under simulated payments. Only the
   real-provider integration is gated on real payments; reviews/custom-orders/gift flows are not.

---

## 3. Phase specs

Impact 1–5 (5 highest), Effort S/M/L. Surfaces: storefront / admin / both.

### Phase 0 — Brand truth + SEO plumbing
*Goal: fix live credibility bugs and make the 3-language routing crawlable & on-brand. Minimal
schema risk; ships in days; de-risks everything after.*

| # | Feature | Surface | I | E | Notes |
|---|---|---|---|---|---|
| 0.1 | **MDL + locale-aware currency** | store | 5 | S | Rewrite `currency.tsx` to read active locale → `Intl.NumberFormat(ro-MD/ru-RU/en-US, {currency:'MDL'})`; add optional `compareAtValue` sale prop. |
| 0.2 | **LILETTI brand + design-system compliance** | store | 4 | S | Replace `STORE`/`FakeStoreName`/`title:'Store'` in `messages/*.json`; load Montserrat **cyrillic**; kill stray `rounded-*`. |
| 0.3 | **Trilingual hreflang + sitemap/robots** | store | 5 | S | `app/sitemap.ts` + `app/robots.ts` enumerating products/categories × en/ru/ro; metadata helper emitting canonical + reciprocal hreflang + x-default. |
| 0.4 | **Product/Breadcrumb/Organization JSON-LD** | store | 4 | S | Emit schema.org in `generateMetadata`. Stub `AggregateRating` so Phase 3 only fills values. |
| 0.5 | **Rich product fields** (description/materials/care/composition i18n) | both | 4 | M | New `*I18n` columns; product-form inputs; product-detail accordion. Feeds SEO + premium positioning. |

**Acceptance:** prices render as MDL in all 3 locales; no `STORE`/`FakeStoreName` strings remain;
RU renders in Montserrat (no system-font fallback); `/sitemap.xml` + `/robots.txt` resolve with all
locales; product pages emit valid Product/Breadcrumb/Organization JSON-LD; product detail shows
description/materials/care/composition when present.

### Phase 1 — CMS foundation + trust content
*Goal: stand up the reusable multilingual content layer so audit blocks are operator-editable in
en/ru/ro. One CMS investment covers four of six audit blocks.*

| # | Feature | Surface | I | E | Notes |
|---|---|---|---|---|---|
| 1.1 | **Storefront Content Studio** (`ContentBlock` + `Faq` + `Stat`) | both | 5 | L | Admin CRUD + ordering + draft/publish + MinIO media. Foundation for 1.2–1.7. |
| 1.2 | Brand Story `/about` | both | 4 | M | Renders founder/philosophy/made-in-Moldova/materials blocks. |
| 1.3 | Behind-the-scenes `/atelier` + home gallery | both | 3 | S | A `behind-the-scenes` category of ContentBlocks. |
| 1.4 | Why-choose-us strip + checkout trust badges | both | 4 | S | Homepage strip + compact trust row in cart/checkout. |
| 1.5 | FAQ accordion `/faq` + FAQPage JSON-LD | both | 4 | M | `Faq` model (category/question/answer i18n, order, publish) + contextual snippets. |
| 1.6 | Newsletter / `Subscriber` capture (locale-stored) | both | 3 | S | Footer + post-checkout; admin list/export. No provider commitment yet. |
| 1.7 | Social-proof counters (orders/customers/countries) | both | 3 | M | Cached endpoint over real data + admin-overridable display values for honest seeding. |

**Acceptance:** owner can create/order/publish content blocks and FAQs in 3 languages from admin and
see them live; `/about`, `/atelier`, `/faq` render localized; why-choose-us + trust badges visible;
newsletter stores email+locale; FAQPage JSON-LD validates.

### Phase 2 — Catalog + order data spine
*Goal: fix structural data-model flaws blocking credible commerce, analytics, and lifecycle. These
migrations unblock reviews-verification, restock, scarcity, real reporting. **Highest-risk phase.***

| # | Feature | Surface | I | E | Notes |
|---|---|---|---|---|---|
| 2.1 | **Real `ProductVariant`** (size×color×SKU×stockQty) | both | 5 | L | Replace scalar `sizeId`/`colorId`; product-form variant editor; store variant selector; cart carries `variantId`. |
| 2.2 | **Order fulfillment pipeline** (status + tracking + `OrderItem.quantity`/`unitPrice` + customer name/email + locale) | admin | 5 | M | Order detail page; checkout stops folding name into address. Spine for analytics/email/CRM. |
| 2.3 | Checkout stock decrement + sold-out states | both | 4 | M | Replace blanket auto-archive with per-variant decrement; disable sold-out combos; verify `customerId` (close the trust-the-body gap). |
| 2.4 | Honest low-stock / limited-edition cues | store | 3 | S | "Only 2 left in M" + toggleable badge from real stock. |
| 2.5 | Real analytics dashboard (AOV, top sellers, category mix, MDL, date range) | admin | 4 | M | Replace hardcoded Jan–Dec recharts in `get-graph-revenue.ts`. |

**Acceptance:** a product offers multiple size/color variants with independent stock; checkout
decrements the right variant and blocks oversells; orders have a working status lifecycle with
tracking and correct line quantities; analytics reflect real units/AOV in MDL over a chosen range.
**Migration safety:** existing fake-variant products migrated via a data script; `prisma db push`
run only after a DB backup; both Prisma schemas updated together.

### Phase 3 — Trust engine, lifecycle + AI leverage
*Goal: land the audit's #1 ask (reviews), the customer lifecycle loop, and AI tooling that makes
3-language operation sustainable. Depends on the Phase 2 spine.*

| # | Feature | Surface | I | E | Notes |
|---|---|---|---|---|---|
| 3.1 | **Verified-purchase Reviews** + moderation queue + buyer photos + fit-vote + ratings | both | 5 | L | `Review` model gated on a delivered Order; fills the Phase-0 AggregateRating stub. |
| 3.2 | Customer account + order-history hub | store | 4 | M | Session-gated area; makes reviews/returns discoverable. |
| 3.3 | Multilingual transactional emails | both | 5 | M | Order/shipping/delivered in purchase locale. **EXTERNAL: Resend/SES + `customerEmail`.** |
| 3.4 | **Trilingual AI Copy Studio** + brand-voice guardrail | admin | 5 | M | One-click Claude draft/translate for en/ru/ro on Product/Story/FAQ `*I18n`. **EXTERNAL: Claude API key.** Review-and-approve; human in control. |
| 3.5 | Back-in-stock waitlist + restock notify | both | 3 | S | Notify-me on sold-out variants; admin triggers email. Depends on 2.1 + 3.3. |
| 3.6 | Made-to-measure / custom order requests | both | 4 | M | `CustomOrderRequest` + measurement guide + admin quote queue. Payment-agnostic. |

**Acceptance:** delivered-order customers can leave a photo review that, once approved, shows on the
product with star ratings + valid AggregateRating JSON-LD; customers see order history; order events
send localized email (when provider configured); admin can one-click generate/translate copy across
3 languages with editable preview; sold-out variants offer notify-me; custom-order requests reach an
admin quote queue.

---

## 4. CMS / data-model foundations (cumulative)

New models (all `storeId`-scoped, i18n via JSON):
- `ContentBlock` — `type` enum (`brand-story | behind-the-scenes | why-choose-us | social-proof`),
  `headingI18n`, `bodyI18n`, `mediaUrl`/gallery, `order Int`, `isPublished Bool`.
- `Faq` — `categoryI18n`, `questionI18n`, `answerI18n`, `order`, `isPublished`.
- `Stat` — overridable social-proof numbers for honest launch seeding.
- `Subscriber` — `email`, `locale`, `source`.
- `Review` — `productId`, `customerId`, `rating`, `bodyI18n`, `status` enum, `source`, `fitVote`,
  `ReviewImage[]` (mirrors `Image`).
- `ProductVariant` — `productId`, `sizeId`, `colorId`, `sku`, `stockQty` (replaces scalar FKs).
- `CustomOrderRequest` — measurements + status + quote.

Field additions:
- `Product`: `descriptionI18n`, `materialsI18n`, `careI18n`, `composition`, `slug`/`slugI18n`, SEO meta.
- `Order`: `status` enum, `carrier`, `trackingNumber`, `customerName`, `customerEmail`, `locale`.
- `OrderItem`: `quantity`, `unitPrice` (snapshot).

---

## 5. External dependencies & risks

- **Claude API key** — all AI features (3.4). Server-side proxy route only; never client-exposed.
- **Email provider** (Resend or SES) + templates — emails (3.3) and anything that emails (3.5).
  Requires `customerEmail` captured at checkout (2.2).
- **Real payments** — only blocks the real-provider integration; everything else ships simulated.
  Note the existing checkout security gap (trusts body `customerId`, marks `isPaid` immediately).
- **Phase 2 migration risk** — irreversible-ish schema surgery; back up DB, migrate fake-variants
  with a data script, update both Prisma schemas together, run `db push` from admin only.
- **OG image font** — `@vercel/og` needs Montserrat-cyrillic loaded into the renderer (nice-to-have).

---

## 6. Out of scope (deferred — real but second-order)

Promotions/discount engine, roles/permissions + audit log, CSV import/export, RMA/returns portal,
GDPR toolkit, abandoned-cart recovery, lookbooks, blog/journal, AI stylist / visual search,
AI background-removal, homepage section composer, multi-currency beyond MDL display. Best Phase-4
organic-growth bets: lookbooks + journal.

---

## 7. Execution strategy (full-auto, review at end)

- Work on an isolated branch/worktree off `master`; commit per feature with clear messages.
- Order is strict: 0 → 1 → 2 → 3. A phase may parallelize independent features internally.
- Phase 2 schema changes are the one place to pause for a DB backup before `db push`.
- AI/email features (3.3, 3.4) ship behind env-var checks: if no key/provider configured, the UI
  degrades gracefully (feature disabled with a clear admin notice) rather than crashing.
- At the end: run lint/build for both apps, summarize what shipped vs. what needs owner-provided
  secrets (Claude key, email provider), and present the diff for review.

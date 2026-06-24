# Phase 3 — Trust Engine, Lifecycle + AI Leverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Verify gate (NOT `npm run build`): admin → `npm run lint` + `npx tsc --noEmit`; store → `npm test && npm run lint && npx tsc --noEmit`. Local prisma `node_modules/.bin/prisma` (v6). `admin/.env` configured. All schema additive → `db push` must stay non-destructive (STOP if `--accept-data-loss`). **Read the `claude-api` skill before writing any Anthropic SDK code (Task 4).**

**Goal:** Land the audit's #1 ask (verified reviews), the customer lifecycle loop (account/order history, emails), AI tooling for 3-language ops, restock waitlist, and made-to-measure requests.

**Architecture:** New models reuse the i18n-JSON + Image-gallery patterns. External integrations (Claude API, email provider) are **env-gated**: when the key is absent the feature degrades gracefully (disabled UI + notice, or log-and-skip) and NEVER crashes. AI runs only through a server-side admin proxy (`/api/ai/generate`) holding `ANTHROPIC_API_KEY`.

---

## Models (additive)

```prisma
model Review {
  id         String   @id @default(uuid())
  storeId    String
  productId  String
  customerId String?
  customerName String @default("")
  rating     Int      // 1..5
  body       String?
  bodyI18n   Json?
  status     String   @default("pending") // pending | approved | rejected
  source     String   @default("web")     // web | instagram | import
  fitVote    String?  // "small" | "true" | "large"
  verified   Boolean  @default(false)     // true when tied to a delivered Order
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  images     ReviewImage[]
  @@index([storeId]) @@index([productId]) @@index([status])
}
model ReviewImage { id String @id @default(uuid()) reviewId String url String createdAt DateTime @default(now()) @@index([reviewId]) }
model StockNotification { id String @id @default(uuid()) storeId String variantId String email String locale String @default("en") notified Boolean @default(false) createdAt DateTime @default(now()) @@unique([variantId, email]) @@index([storeId]) }
model CustomOrderRequest {
  id String @id @default(uuid()) storeId String
  name String email String phone String @default("")
  message String measurements String? // free-form or JSON
  status String @default("new") // new | quoted | accepted | declined
  locale String @default("en")
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  @@index([storeId]) @@index([status])
}
```

---

## Task 1 — Reviews: model + admin moderation + store display + JSON-LD
**Files:** schema (Review, ReviewImage); admin reviews route folder (list with status filter + approve/reject cell-action; API GET/PATCH status) + nav + i18n; store: `get-reviews` action (approved only), star-rating display + buyer-photo wall on product detail (`info.tsx`/product page), aggregate rating; `store/lib/seo.ts` add `aggregateRatingJsonLd` + vitest, and pass `aggregateRating` into `productJsonLd` on the product page (fills the Phase-0 stub). Verified badge when `verified`. (Review submission UI lives in Task 2's order-history.)
- **Verify + commit.**

## Task 2 — Customer account + order history + review submission
**Files:** store session-gated `account/` route (uses the store customer Better Auth session) listing the logged-in customer's orders (fetch from admin API by customerId) with status/tracking; a "Leave a review" form on delivered orders that POSTs to an admin reviews API (sets `verified: true`, `status: pending`). Admin reviews API public-POST (CORS like checkout) for verified submissions. i18n.
- **Verify + commit.**

## Task 3 — Transactional emails (env-gated)
**Files:** `admin/lib/email.ts` — a `sendEmail()` that uses Resend if `RESEND_API_KEY` is set, else logs + no-ops (never throws). Order-confirmation email on checkout + shipped email when status→shipped (in `Order.locale`). Localized templates (simple HTML, 3 languages). Wire into checkout route + order PATCH.
- **Verify + commit.** (No real send without key; gracefully skipped.)

## Task 4 — Trilingual AI Copy Studio (env-gated, server-side proxy)
**READ the `claude-api` skill first for the current model id + SDK usage.**
**Files:** `admin/app/api/ai/generate/route.ts` — server-only proxy holding `ANTHROPIC_API_KEY`; accepts `{ kind: "draft"|"translate", field, sourceText?, targetLocales }` and returns generated en/ru/ro strings using the latest Claude model + a brand-voice system prompt. If `ANTHROPIC_API_KEY` unset → 503 with a clear message. Add a "✨ Generate / Translate" button to the product, ContentBlock, and Faq forms that calls the proxy and fills the per-locale inputs (editable preview; human clicks Save to persist — never auto-saves). Add `@anthropic-ai/sdk` to admin deps. i18n for the UI; graceful disabled state when the key is missing (probe via a small `/api/ai/status` or env-public flag).
- **Verify + commit.**

## Task 5 — Back-in-stock waitlist (env-gated email)
**Files:** schema (StockNotification); store "Notify me" on sold-out variants → store/admin API upsert; admin trigger (button on product/variant) that emails the waitlist for now-in-stock variants via `sendEmail` (degrade gracefully) and marks `notified`. i18n.
- **Verify + commit.**

## Task 6 — Made-to-measure / custom order requests
**Files:** schema (CustomOrderRequest); store `/custom-order` page with a request form (name/email/phone/message/measurements) + a localized measurement guide (ContentBlock or static i18n) → admin API public-POST (CORS); admin queue list + status management. Payment-agnostic. i18n.
- **Verify + commit.**

---

## Notes
- Env-gated features must build + typecheck + run with NO keys present (degrade gracefully). Document required env in `admin/.env.example`.
- Reviews "verified" requires a delivered Order for that customer+product; admin can also create non-verified reviews (e.g. Instagram import).
- Keep store radius-0 + tokens; admin shadcn class contracts.

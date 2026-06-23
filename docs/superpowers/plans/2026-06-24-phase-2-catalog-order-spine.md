# Phase 2 — Catalog + Order Data Spine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Verify gate (NOT `npm run build`): admin → `npm run lint` + `npx tsc --noEmit`; store → `npm test && npm run lint && npx tsc --noEmit`. Local prisma `node_modules/.bin/prisma` (v6). `admin/.env` configured (Postgres :5433). **DB backup taken: `/tmp/shop-backup-*.sql`.**

**Goal:** Add real product variants (size×color×SKU×stock), an order fulfillment lifecycle, accurate order lines, stock-aware checkout, scarcity cues, and real analytics — the spine every Phase 3 feature depends on.

**Architecture (low-risk migration):** `ProductVariant` is added **additively**; the existing scalar `Product.sizeId/colorId` are **kept** (they still drive category filtering and act as the product's primary size/color). Each of the 113 existing products is migrated to **one** variant (its current size+color, a generated SKU, a default stock). Cart carries `variantId`; checkout decrements `ProductVariant.stockQty` instead of blanket-archiving. Order/OrderItem gain fulfillment + line fields — **all additive/defaulted, so NO destructive `db push`** (`--accept-data-loss` must NOT be needed; if Prisma reports data loss, STOP).

**Tech Stack:** Next.js 15, Prisma/Postgres, next-intl, shadcn/radix, recharts, vitest.

---

## Models / fields (all additive)

```prisma
model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  sizeId    String
  colorId   String
  sku       String?
  stockQty  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([productId, sizeId, colorId])
  @@index([productId])
}
// Product: add `variants ProductVariant[]` relation (keep scalar sizeId/colorId).
// Order: add `status String @default("pending")`, `carrier String?`, `trackingNumber String?`,
//        `customerName String @default("")`, `locale String @default("en")`.
// OrderItem: add `quantity Int @default(1)`, `unitPrice Decimal?`, `variantId String?`.
```
Status values: `pending | paid | packed | shipped | delivered | cancelled` (validate in zod; plain String to avoid enum-migration complexity, consistent with ContentBlock.type).

---

## Task 1 — ProductVariant schema + data migration (additive, non-destructive)
**Files:** `admin/prisma/schema.prisma`; a one-off migration script `admin/scripts/migrate-variants.ts` (or `.mjs`).
- Add `ProductVariant` + the `Product.variants` relation. `db push` (additive → "in sync", no data loss). If Prisma reports ANY drop, STOP and report.
- Migration script: for every Product with no variants, create one `ProductVariant { productId, sizeId: product.sizeId, colorId: product.colorId, sku: product.sku ?? generated, stockQty: 10 }`. Idempotent (skip if a variant already exists). Run it; report rows created.
- **Verify:** `node_modules/.bin/prisma db push` non-destructive; script ran; admin tsc clean. **Commit.**

## Task 2 — Admin variant editor
**Files:** product form (`admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/[productId]/components/product-form.tsx`) + products API (`route.ts`, `[productId]/route.ts`).
- Add a variants sub-editor: rows of {size select, color select, sku, stockQty}; add/remove rows. Persist via nested create/deleteMany+create on PATCH (within the existing product update). Keep the scalar size/color selects as the product's primary (or derive primary from first variant — keep scalar for now).
- Zod: variants array validated; `stockQty` int ≥ 0.
- **Verify:** admin lint + tsc. **Commit.**

## Task 3 — Store variant selector + cart variantId
**Files:** `store/types.ts` (add `ProductVariant`, `variants` on Product); product detail (`store/components/info.tsx`) variant selection; cart store (`store/hooks/use-cart.ts` or zustand store) + `cart-item.tsx`.
- Product detail: select size/color → resolve the matching variant; disable size/color combos with no variant or `stockQty===0` (sold-out). Add-to-cart stores `variantId` (+ size/color labels) in the cart.
- Cart line keys by `variantId` (so the same product in two sizes are two lines).
- **Verify:** store test/lint/tsc. **Commit.**

## Task 4 — Order fulfillment fields + checkout rework + stock decrement
**Files:** schema (Order/OrderItem additive fields); checkout route (`admin/app/api/[storeId]/checkout/route.ts`); store checkout page.
- `db push` (additive). Checkout: accept `customerName`, `email`, `locale`, and per-line `{ variantId, quantity }`; **stop folding name into address**; set `OrderItem.quantity` + `unitPrice` snapshot; **decrement `ProductVariant.stockQty`** transactionally (no oversell — clamp/refuse if insufficient) instead of blanket `isArchived`. **Verify `customerId`** is a real customer (close the trust-the-body gap) or, if not verifiable cross-schema, at least validate it's present + well-formed and document the residual gap.
- **Verify:** admin + store lint/tsc; store test. **Commit.**

## Task 5 — Admin order detail + status management
**Files:** new `orders/[orderId]/page.tsx` + a status/tracking update form; orders list columns (show status badge, customer name); orders API item route (PATCH status/carrier/tracking).
- Status dropdown (the 6 values) + carrier/tracking inputs; PATCH persists. Orders list shows status badge + real customer name (from `Order.customerName`, not parsed address) + correct totals using `OrderItem.quantity*unitPrice`.
- **Verify:** admin lint + tsc. **Commit.**

## Task 6 — Honest scarcity cues (store)
**Files:** product detail / product card.
- "Only N left" when a selected variant's `stockQty` is low (e.g. ≤3 and >0); "Sold out" when 0. Optional limited-edition badge driven by total stock. From real `stockQty` only — no fake urgency. Message keys en/ru/ro.
- **Verify:** store test/lint/tsc. **Commit.**

## Task 7 — Real analytics dashboard
**Files:** `admin/actions/get-graph-revenue.ts` (replace hardcoded Jan–Dec), `get-total-revenue.ts`, `get-sales-count.ts`, new `get-top-products.ts`/`get-aov.ts`; dashboard page + a date-range control; recharts.
- Compute revenue/orders/AOV/units over a selectable range using `OrderItem.quantity*unitPrice` (fallback to product price when unitPrice null for legacy rows), top sellers, category mix, in MDL. Keep existing recharts components; just fix the data.
- **Verify:** admin lint + tsc. **Commit.**

---

## Risk notes
- Backup at `/tmp/shop-backup-*.sql`. All Phase 2 schema changes are additive → `db push` must stay non-destructive. If Prisma EVER asks for `--accept-data-loss`, STOP and escalate.
- Scalar `Product.sizeId/colorId` are intentionally retained (filters + primary). A future phase can fully retire them once filtering is migrated to variants.
- Legacy orders have no `quantity`/`unitPrice` → analytics must handle nulls (treat quantity as 1, unitPrice as product price).

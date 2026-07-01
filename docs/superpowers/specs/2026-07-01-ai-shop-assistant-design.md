# AI Shop Assistant Design

**Date:** 2026-07-01
**Status:** Approved direction, pending written-spec review
**Scope:** Native LILETTI storefront AI assistant for sales, support, and order-help flows.

---

## 1. Context

The repo has two Next.js 15 apps:

- `admin/` owns the canonical Prisma schema and REST APIs for catalog, content, FAQs, reviews, orders, checkout, stock notifications, and custom orders.
- `store/` is the customer storefront. It already has localized catalog pages, product variants, stock-aware cart lines, customer auth, an account order hub, product search, FAQs, content blocks, and checkout.

The admin app already contains an env-gated Anthropic proxy for the trilingual AI copy studio. The customer assistant must not reuse that admin-only route directly. It needs its own storefront-safe server route with narrow tool access and customer-order scoping.

External/open-source options considered:

- Vercel AI SDK: TypeScript/Next.js AI application toolkit with chat, streaming, and tool calling.
- assistant-ui: open-source React chat UI primitives that can connect to AI SDK runtimes.
- CopilotKit: React agent UI framework for richer in-app agent workflows.
- Dify and Flowise: open-source visual LLM app/workflow platforms with RAG and embedded chatbot support.
- Chatwoot: open-source support desk with AI support automation and human handoff.
- Retail-GPT: open-source RAG e-commerce assistant reference pattern for product recommendations, availability checks, and cart operations.

Decision: build a native storefront assistant first. It fits this repo better than a separate chatbot platform because recommendations, stock awareness, cart actions, account order data, locale, and brand UI all already live in `store/`.

---

## 2. Goals

V1 provides three jobs:

1. **Sales assistant**
   - Help shoppers find products by occasion, category, color, size, material, budget, availability, and style intent.
   - Recommend real, non-archived products and in-stock variants.
   - Show localized product cards with price, image, available options, and links.
   - Offer explicit shopper-click cart actions for concrete in-stock variants.

2. **Support assistant**
   - Answer questions about shipping, returns, care, sizing, made-to-measure, atelier, brand story, and FAQs using existing store data.
   - Ground answers in published FAQs/content blocks/product fields.
   - Admit uncertainty when data is missing.

3. **Order assistant**
   - For signed-in customers, summarize their own recent orders using the current customer session.
   - For guest orders, guide the shopper to provide order id plus email and use the existing guest lookup path.
   - Never accept or trust an arbitrary `customerId` from the browser.

---

## 3. Non-Goals

V1 will not include:

- A separate Dify, Flowise, Chatwoot, or Botpress deployment.
- Human agent inbox or live handoff.
- Long-term conversation persistence.
- New admin UI for assistant analytics.
- Visual search or image-upload styling.
- Automatic checkout, payment, discount creation, or order modification.
- Silent cart mutation by the model.

These can be added after the native assistant proves useful.

---

## 4. Architecture

Add a native assistant layer inside `store/`.

### Server Route

Create `store/app/api/assistant/route.ts`.

Responsibilities:

- Validate request payload.
- Read current locale and optional page context from the request.
- Read the signed-in customer session server-side when order tools are needed.
- Rate-limit calls per IP/session.
- Check `ANTHROPIC_API_KEY` before loading or calling any provider SDK.
- Build a LILETTI-specific system prompt.
- Expose narrow read-only tools to the model.
- Stream or return structured assistant responses.
- Return clean fallback responses when the model key is missing or a tool fails.

### Assistant Services

Create focused modules under `store/lib/assistant/`:

- `config.ts`: env and feature-state helpers.
- `types.ts`: request, response, recommendation, order summary, and tool-result types.
- `catalog.ts`: product search, product detail shaping, stock-aware ranking.
- `content.ts`: FAQ/content lookup and localized text extraction.
- `orders.ts`: signed-in order summaries and guest order lookup helper.
- `prompt.ts`: system prompt and message/context builder.
- `guardrails.ts`: safety rules and response constraints.
- `rate-limit.ts`: small in-memory guard similar to the admin limiter, acceptable for local/single-instance MVP.

### Storefront UI

Create `store/components/assistant/`:

- `assistant-launcher.tsx`: fixed assistant button.
- `assistant-drawer.tsx`: drawer shell, composer, message list, loading/error/offline states.
- `assistant-message.tsx`: text and structured content rendering.
- `assistant-product-card.tsx`: recommendation card with product link and variant selector when needed.
- `assistant-order-card.tsx`: compact order summary.
- `assistant-suggestions.tsx`: starter prompts.

Wire the launcher into `store/app/[locale]/layout.tsx` so it is available across the storefront.

Use current store design rules: radius 0, no decorative gradients, no nested card surfaces, restrained typography, and real product imagery only.

---

## 5. Tool Contract

The model can ask the server to run these tools. Each tool returns structured JSON; the UI renders the final assistant message and any structured parts.

### `searchProducts`

Inputs:

- `query`
- `locale`
- optional filters: `category`, `size`, `color`, `material`, `maxPrice`, `inStockOnly`

Behavior:

- Search non-archived products only.
- Include localized name/description/material/category text.
- Consider variants and stock.
- Return a small ranked list with product id, name, price, image, category, candidate variants, and stock state.

### `getProductDetails`

Inputs:

- `productIds`
- `locale`

Behavior:

- Return localized product detail fields, care/material text, variants, and stock status.
- Do not include archived products.

### `getStoreKnowledge`

Inputs:

- `query`
- `locale`

Behavior:

- Search published FAQs and content blocks.
- Return concise excerpts and source labels.
- Do not expose unpublished content.

### `getSignedInOrders`

Inputs:

- none from the model except optional `limit`

Behavior:

- Read customer id from `getCustomerSession()` on the server.
- Return only the signed-in customer's order summaries.
- Return a sign-in guidance state when unauthenticated.

### `lookupGuestOrder`

Inputs:

- `orderId`
- `email`

Behavior:

- Use existing `/orders/lookup` behavior or equivalent server-side fetch.
- Require both fields.
- Return not-found without revealing which field was wrong.

### `buildCartSuggestion`

Inputs:

- `productId`
- `variantId`

Behavior:

- Validate product and variant are visible and in stock.
- Return a UI instruction for an explicit shopper-click add-to-cart action.
- Never mutate server state or browser cart directly.

---

## 6. Guardrails

The assistant must:

- Answer in the shopper's current locale (`en`, `ro`, or `ru`).
- Use only current catalog, FAQ, content, and order data available through tools.
- Never invent stock, shipping promises, discounts, policies, or atelier timelines.
- State uncertainty when shop data is missing.
- Never expose admin-only data.
- Never use or trust `customerId` from the request body.
- Never mutate cart or order data from the server route.
- Require explicit shopper action for add-to-cart.
- Keep sizing guidance factual and optional.
- Avoid medical, body-shaming, or sensitive body inference language.
- Degrade gracefully when AI is not configured.

---

## 7. UX Flow

Initial drawer:

- Shows localized welcome copy.
- Shows quick prompts:
  - "Help me choose a dress for an evening event"
  - "What sizes are available?"
  - "How do I care for silk pieces?"
  - "Where is my order?"
  - "Can I request made-to-measure?"

Sales result:

- Assistant gives a short explanation.
- Shows up to 3 product cards.
- Each card links to the product page.
- If a single in-stock variant is clearly selected, show an add-to-cart button.
- If multiple variants match, ask the shopper to pick size/color first.

Support result:

- Assistant answers from FAQ/content/product fields.
- It may show source snippets such as "FAQ: Delivery" or "Product care".
- Missing policy details route to contact/custom-order guidance.

Order result:

- Signed-in customer: show recent order summaries with status and tracking when present.
- Guest: ask for order id and email, then lookup.
- Failed lookup: neutral not-found state.

Offline result:

- If `ANTHROPIC_API_KEY` is absent, the launcher can remain visible but the drawer shows a concise "assistant unavailable" state and links to FAQ/search/contact paths.

---

## 8. Error Handling And Privacy

- Provider failures return a localized fallback, not a stack trace.
- Tool failures are logged server-side with safe details only.
- Product/content tools return empty lists rather than crashing the drawer.
- Order lookup never says whether the order id or email was the mismatched field.
- The assistant route strips excessive conversation history before calling the provider.
- No API keys are exposed to the browser.
- V1 does not persist conversations, reducing privacy surface.

---

## 9. Testing Strategy

Unit tests:

- `store/lib/assistant/catalog.test.ts`
  - filters archived products
  - ranks in-stock variants higher
  - localizes product/category/material text
  - respects max price and size/color filters

- `store/lib/assistant/content.test.ts`
  - returns only published FAQs/content
  - localizes excerpts
  - returns empty results for no match

- `store/lib/assistant/orders.test.ts`
  - rejects browser-supplied customer ids
  - returns unauthenticated state without session
  - shapes signed-in order summaries

- `store/lib/assistant/prompt.test.ts`
  - includes locale and guardrails
  - omits secrets and raw customer identifiers

API tests:

- missing `ANTHROPIC_API_KEY` returns configured offline response
- invalid request body returns 400
- rate-limited requests return 429
- guest order lookup requires both order id and email

UI/manual smoke:

- Open assistant drawer from desktop and mobile.
- Ask for a dress recommendation and see real product cards.
- Select/add an in-stock variant and verify cart drawer updates.
- Ask a care/FAQ question and see grounded answer.
- Ask order status while signed out and see sign-in/guest lookup guidance.
- Ask order status while signed in and see only that customer's orders.

Verification commands:

```bash
cd store
npm test
npx tsc --noEmit
npm run build
```

---

## 10. Implementation Notes

- Prefer native UI for V1. `assistant-ui` can be reconsidered if the manual chat drawer grows too complex.
- Use the existing `localizedField` helper everywhere localized DB content is rendered.
- Keep cart mutation on the client through `use-cart`.
- Keep all AI calls server-side and env-gated, matching the existing admin AI degradation pattern.
- Avoid adding new database tables for V1.
- Keep future Chatwoot/human handoff as an integration point, not part of this implementation.

---

## 11. Acceptance Criteria

- The assistant is available across the storefront.
- It answers in the active locale.
- It recommends only visible catalog products.
- It displays stock-aware product recommendations.
- It can guide add-to-cart through explicit shopper clicks.
- It answers support questions from FAQ/content/product data and admits missing data.
- It handles signed-in and guest order-help flows without trusting browser-supplied customer ids.
- The storefront builds and runs with no AI key configured.
- Tests cover catalog ranking, content grounding, order scoping, prompt guardrails, and offline behavior.

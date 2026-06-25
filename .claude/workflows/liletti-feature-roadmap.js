export const meta = {
  name: 'liletti-feature-roadmap',
  description: 'Brainstorm a prioritized, codebase-grounded standout-feature roadmap (storefront + admin) for the LILETTI fashion e-commerce',
  phases: [
    { title: 'Scout', detail: 'map current admin + store capabilities and the data model' },
    { title: 'Ideate', detail: '6 parallel lenses generate scored feature ideas' },
    { title: 'Synthesize', detail: 'merge, dedup, score, phase into a roadmap' },
  ],
}

const SCOUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['area', 'currentCapabilities', 'gaps', 'dataModelNotes', 'relevantFiles'],
  properties: {
    area: { type: 'string' },
    currentCapabilities: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
    dataModelNotes: { type: 'string' },
    relevantFiles: { type: 'array', items: { type: 'string' } },
  },
}

const IDEA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lens', 'ideas'],
  properties: {
    lens: { type: 'string' },
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'what', 'whyItStandsOut', 'audience', 'surface', 'impact', 'effort', 'dependencies', 'fitNote'],
        properties: {
          name: { type: 'string' },
          what: { type: 'string' },
          whyItStandsOut: { type: 'string' },
          audience: { type: 'string', enum: ['customer', 'operator', 'both'] },
          surface: { type: 'string', enum: ['storefront', 'admin', 'both'] },
          impact: { type: 'integer', minimum: 1, maximum: 5 },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
          dependencies: { type: 'array', items: { type: 'string' } },
          fitNote: { type: 'string' },
        },
      },
    },
  },
}

const ROADMAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['quickWins', 'bigBets', 'phases', 'cmsFoundations', 'externalDependencies', 'notes'],
  properties: {
    quickWins: { type: 'array', items: { type: 'string' } },
    bigBets: { type: 'array', items: { type: 'string' } },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'goal', 'items'],
        properties: {
          name: { type: 'string' },
          goal: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'surface', 'impact', 'effort', 'rationale'],
              properties: {
                name: { type: 'string' },
                surface: { type: 'string' },
                impact: { type: 'integer', minimum: 1, maximum: 5 },
                effort: { type: 'string' },
                rationale: { type: 'string' },
              },
            },
          },
        },
      },
    },
    cmsFoundations: { type: 'array', items: { type: 'string' } },
    externalDependencies: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const CTX = `
PROJECT: A custom Next.js 15 (App Router, React 19, TS, Tailwind v4) e-commerce for a Moldovan fashion brand "LILETTI" (own production, offline store, international delivery).
Two apps in this repo:
- admin/ (port 3001): dashboard/CMS + backend API. Prisma/Postgres canonical schema lives here (admin/prisma/schema.prisma). Better Auth (staff pool). MinIO presigned image uploads. shadcn/radix UI, recharts, react-hook-form+zod, @tanstack/react-table.
- store/ (port 3002): storefront. next-intl locales en/ru/ro. zustand cart. Payments are SIMULATED (no real provider).
ADMIN currently manages: stores, billboards, categories, colors, sizes, products, orders/checkout. (bare CRUD)
STORE currently has: home (billboard), category listing, product detail, cart, checkout (simulated form), sign-in/up. NO reviews, brand story, FAQ, blog, behind-the-scenes, social proof.
DESIGN SYSTEM: minimal-luxury editorial. radius 0 (sharp corners), no shadows except overlays, MDL currency (locale-aware ro-MD/ru-RU/en-US), Montserrat with cyrillic subset. Chrome=UPPERCASE wide-tracked; product names/prices stay mixed-case. Admin retheme via CSS vars only.
A MARKETING AUDIT flagged these gaps: weak selling homepage; thin brand story (founder/philosophy/production/materials/process); no trust triggers (reviews, buyer photos, order counts, ratings, media, certs, awards); weak SEO content (no blog/articles/guides); no emotional/lifestyle engagement. Requested blocks: "Why choose us", "Brand story", "Reviews" (photos/video/Instagram), "Behind the scenes" (workshop/process/team), "FAQ" (delivery/returns/payment/custom orders), "Social proof" (customers/orders/geography/partners).
GOAL: a small fashion brand wants the shop to STAND OUT. Constraints: small team, 3 languages, single store, simulated payments today.
`

phase('Scout')
const scouts = await parallel([
  () => agent(`${CTX}\nYou are mapping the ADMIN app. Read admin/prisma/schema.prisma fully, and skim admin/app and admin/components to understand existing admin features and the data model. Report: current admin capabilities, concrete gaps for a standout fashion back-office, and what the data model already supports vs would need new models. Be specific with file/model names.`, { label: 'scout:admin', phase: 'Scout', schema: SCOUT_SCHEMA }),
  () => agent(`${CTX}\nYou are mapping the STOREFRONT app. Skim store/app and store/components and the i18n message files (store/messages or similar). Report: current storefront capabilities, gaps vs the marketing audit blocks, how content is rendered (hardcoded vs DB vs i18n), and what multilingual content infrastructure exists. Be specific with file names.`, { label: 'scout:store', phase: 'Scout', schema: SCOUT_SCHEMA }),
])

const scoutSummary = JSON.stringify(scouts.filter(Boolean), null, 2)

phase('Ideate')
const LENSES = [
  { key: 'conversion-trust', brief: 'Conversion & trust on the STOREFRONT: directly address the audit (Why-choose-us, brand story, reviews+buyer photos+video, behind-the-scenes, FAQ, social-proof counters, ratings, certs/awards/media). Focus on what converts a fashion shopper and builds trust for international delivery.' },
  { key: 'seo-content', brief: 'SEO & content engine: blog/articles/lookbooks/style guides, structured data (Product/Review/FAQ schema.org), sitemaps, metadata, multilingual SEO (en/ru/ro hreflang), shoppable editorial content. What gives organic reach for a Moldovan brand.' },
  { key: 'admin-power', brief: 'Standout ADMIN/back-office power features: real analytics dashboards, inventory/low-stock, order fulfillment workflow, discounts/promo engine, abandoned-cart, CSV import/export, roles/permissions, audit log, bulk actions, a real CMS for the storefront content blocks. What makes the operator say "wow".' },
  { key: 'ai-differentiation', brief: 'AI-powered differentiation (this is an AI-built shop): AI product description/translation generation (en/ru/ro), AI image tagging/background cleanup, AI size/fit recommender, visual search, AI styling assistant/chat, AI-generated SEO content, smart merchandising. Tie each to the existing stack (could use Claude API).' },
  { key: 'fashion-market-fit', brief: 'Fashion & Moldova-market fit: size guides & made-to-measure/custom orders, fabric/material storytelling, lookbooks & outfit bundles, wishlist, restock alerts, gift cards, loyalty, local delivery + international shipping UX, MDL/multi-currency, virtual try-on. What fits a premium fashion brand specifically.' },
  { key: 'ops-crm', brief: 'Operations, CRM & retention: customer accounts/order history, email/notification flows (order, shipping, abandoned cart, back-in-stock), reviews moderation, returns/RMA, segments, post-purchase, real payment provider integration path, GDPR. The unglamorous-but-essential standouts.' },
]

const ideas = await parallel(LENSES.map(l => () =>
  agent(`${CTX}\n\nCODEBASE SCOUT FINDINGS:\n${scoutSummary}\n\nYOUR LENS: ${l.brief}\n\nGenerate 6-10 concrete, well-scoped feature ideas for THIS specific project (not generic). For each: a crisp name, what it is (1-2 sentences), why it stands out / the payoff, who it serves (customer|operator|both), the surface (storefront|admin|both), impact (1-5, 5=highest), effort (S|M|L), key dependencies, and a one-line note on fit for a small Moldovan premium fashion brand with 3 languages and currently-simulated payments. Be ambitious but realistic; prefer features that build on the existing stack. Avoid duplicating obvious CRUD that already exists.`,
    { label: `ideate:${l.key}`, phase: 'Ideate', schema: IDEA_SCHEMA })
))

phase('Synthesize')
const allIdeas = JSON.stringify(ideas.filter(Boolean), null, 2)
const roadmap = await agent(`${CTX}\n\nCODEBASE SCOUT FINDINGS:\n${scoutSummary}\n\nALL IDEATED FEATURES (6 lenses):\n${allIdeas}\n\nSynthesize into ONE prioritized roadmap for the LILETTI shop. Tasks:
1) Merge duplicates across lenses; keep the best framing.
2) Score each surviving feature by impact (1-5) and effort (S/M/L).
3) Identify the 6-8 highest-leverage QUICK WINS (high impact, S/M effort) and the 3-5 BIG BETS (transformative, may be L).
4) Organize everything into 3-4 sequenced PHASES, each with a clear goal/theme, where earlier phases unblock later ones (e.g. CMS foundation before content blocks; data models before analytics). Note dependencies.
5) Call out the CMS/data-model foundations the storefront content blocks require (so they're editable in en/ru/ro, not hardcoded).
6) Flag anything that depends on real payments or external services.
Be decisive and specific to this codebase. This is a brainstorm to be reviewed by the owner, so make it scannable and opinionated.`,
  { label: 'synthesize:roadmap', phase: 'Synthesize', schema: ROADMAP_SCHEMA })

return { scouts: scouts.filter(Boolean), roadmap }

// ---- schemas ----
function _schemas() {}

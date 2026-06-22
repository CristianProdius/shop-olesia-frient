export const meta = {
  name: 'i18n-review',
  description: 'Adversarially review the i18n migration for gaps and correctness',
  phases: [{ title: 'Review' }],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string' },
          evidence: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['file', 'severity', 'issue', 'suggestedFix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings'],
}

const BASE = `You are reviewing an i18n migration (next-intl, locale-prefixed /en /ru /ro) in a Next.js 15
monorepo (admin app on disk under admin/, store under store/). cwd is the repo root.
Be adversarial and precise. ONLY report issues you can prove by reading the code. Read files, grep,
and verify before reporting. Prefer FEWER high-confidence findings over speculation. Do NOT edit files.
Return findings with concrete file paths and a concrete suggestedFix. If clean, return findings: [].`

const DIMENSIONS = [
  { key: 'store-strings', prompt: `${BASE}
DIMENSION: Missed user-facing hardcoded strings in the STORE app.
Scan store/app/**/*.tsx and store/components/**/*.tsx. Flag any user-visible text — JSX text nodes,
button/heading copy, input placeholders, aria-labels, toast messages — that is still a hardcoded
English literal instead of a next-intl t('...') call. Ignore: code identifiers, className strings,
API URLs, console.* text, date format tokens, and the LanguageSwitcher labels (EN/RU/RO).` },

  { key: 'admin-strings', prompt: `${BASE}
DIMENSION: Missed user-facing hardcoded strings in the ADMIN app.
Scan admin/app/[locale]/**/*.tsx and admin/components/**/*.tsx (skip components/ui primitives that
have no copy). Flag user-visible text still hardcoded instead of using t('...'). Same ignore-list as above.
Note: server components must use getTranslations; client components ('use client') use useTranslations.` },

  { key: 'db-render', prompt: `${BASE}
DIMENSION: DB-content localization on the STORE render side.
Translatable DB fields have JSON companions: Product.nameI18n, Category.nameI18n, Size.nameI18n,
Color.nameI18n, Billboard.labelI18n. The store should display them via
localizedField(entity.nameI18n, locale, entity.name) from '@/lib/i18n-content' (Billboard uses labelI18n+label).
Check every store place that renders a product/category/size/color/billboard NAME or LABEL
(product-card, product-list, info, preview-modal, filter, mobile-filters, cart-item, summary, billboard,
main-nav, category page, home page). Flag any that still render raw .name/.label without localizedField,
or that fail to obtain the locale (useLocale in client / getLocale in server).` },

  { key: 'db-persist', prompt: `${BASE}
DIMENSION: DB-content in ADMIN forms + API routes.
For each of billboards(label->labelI18n), categories, products, sizes, colors (name->nameI18n):
1) the *-form.tsx must: include the i18n field in the zod schema (optional en/ru/ro), default it from
   initialData, render three locale inputs, and include it in the submit payload;
2) BOTH the collection route (POST create) AND the [id] route (PATCH update) under admin/app/api/[storeId]/...
   must read the i18n field from the body and persist it. For products PATCH note there may be two update
   calls — the i18n field must be on the data update, not lost. Flag any entity missing any of these.` },

  { key: 'locale-nav', prompt: `${BASE}
DIMENSION: Locale-aware navigation.
Internal navigation must use the app's '@/i18n/navigation' (Link, useRouter, redirect) so the locale
prefix is preserved. Flag any component still importing Link from 'next/link' or useRouter/redirect from
'next/navigation' AND using it to navigate to an INTERNAL app path (e.g. router.push('/cart'),
href to '/sign-in', redirect('/...')). Also flag server components/layouts/pages that call redirect()
from 'next/navigation' to an internal path. Ignore useParams/useSearchParams/usePathname for reading.
Check both apps. (Note: the admin server-component layouts/navbar use redirect('/sign-in') etc.)` },

  { key: 'catalog-icu', prompt: `${BASE}
DIMENSION: Translation catalog sanity (store/messages and admin/messages, en/ru/ro).
For each app compare en.json against ru.json and ro.json. Flag: (a) any ICU placeholder like {count} or
{email} present in en but missing/renamed in ru or ro for the same key; (b) values left untranslated
(identical English text) in ru/ro where they clearly should differ — list a few representative keys, not
every word; (c) any value in ru/ro that is empty. Read the JSON files directly.` },
]

phase('Review')
const results = await parallel(DIMENSIONS.map((d) => () =>
  agent(d.prompt, { label: d.key, phase: 'Review', schema: FINDINGS_SCHEMA, agentType: 'Explore' })
    .then((r) => ({ dimension: d.key, ...(r || {}) }))
))

const all = []
for (const r of results.filter(Boolean)) {
  for (const f of (r.findings || [])) all.push({ dimension: r.dimension, ...f })
}
all.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))

return {
  total: all.length,
  high: all.filter((f) => f.severity === 'high').length,
  medium: all.filter((f) => f.severity === 'medium').length,
  low: all.filter((f) => f.severity === 'low').length,
  findings: all,
  summaries: results.filter(Boolean).map((r) => `${r.dimension}: ${r.summary || ''}`),
}

export const meta = {
  name: 'i18n-fanout',
  description: 'Localize both apps (UI strings + DB content) and translate en->ru,ro',
  phases: [
    { title: 'Localize', detail: 'one agent per disjoint file group: replace strings with next-intl, wire DB-content i18n, return en keys' },
    { title: 'Translate', detail: 'translate merged en catalog to ru and ro per app' },
  ],
}

// ---------------------------------------------------------------------------
// Shared rules every localizer agent must follow.
// ---------------------------------------------------------------------------
const COMMON = `
You are adding internationalization (next-intl, already installed and configured) to a
Next.js 15 App Router project. The repo root is your cwd. Routing is locale-prefixed
(/en, /ru, /ro); config lives in each app's i18n/ folder and messages/ catalogs.

STRICT SCOPE — only edit the files listed for you. Never edit:
- any messages/*.json, i18n/*, middleware.ts, next.config.js, *layout.tsx, language-switcher.tsx
- any file not in your list (another agent owns it).
Do NOT run npm/prisma/build/git. Just edit code.

UI STRING RULES:
- Replace every USER-FACING hardcoded string (headings, labels, buttons, placeholders,
  toasts, aria-labels, empty states) with a next-intl translation call.
- In a CLIENT component ('use client' at top): import { useTranslations } from 'next-intl';
  const t = useTranslations('<NAMESPACE>'); then t('key'). For the active locale use
  useLocale() from 'next-intl'.
- In a SERVER component (async function, no 'use client'): import { getTranslations, getLocale }
  from 'next-intl/server'; const t = await getTranslations('<NAMESPACE>'); const locale = await getLocale();
- Use ONLY the namespace(s) assigned to you. Key names: short camelCase, grouped logically.
- Do NOT translate: code identifiers, CSS classes, API paths, console.log text, or developer-only strings.

NAVIGATION:
- For app-internal navigation, import Link / useRouter / redirect from the app's i18n nav module
  ('@/i18n/navigation') instead of 'next/link' or 'next/navigation' so the locale prefix is kept.
- Keep useParams / useSearchParams from 'next/navigation' as-is for reading params.

DB-CONTENT i18n (only if your task says so):
- Translatable DB fields carry a companion JSON column: Product.nameI18n, Category.nameI18n,
  Size.nameI18n, Color.nameI18n, Billboard.labelI18n — shape { en, ru, ro }.
- RENDER (store): show localizedField(entity.nameI18n, locale, entity.name) using
  import { localizedField } from '@/lib/i18n-content'. (Billboard uses labelI18n + entity.label.)
- ADMIN FORM: add the companion field to the zod schema as an optional object
  z.object({ en: z.string().optional(), ru: z.string().optional(), ro: z.string().optional() }).optional(),
  default it from initialData?.<field>I18n, render a "Translations" group with three Inputs
  (English / Russian / Romanian) bound to <field>I18n.en/.ru/.ro, and include it in the submit payload.
  Keep the existing primary field (name/label) as the default/fallback — do not remove it.
- ADMIN API ROUTE: read the companion field from the request body and persist it in create (POST)
  and update (PATCH) calls (data: { ..., nameI18n }). Treat it as optional (default to undefined/null).

RETURN: a JSON object { messages, filesEdited, notes } where 'messages' is the COMPLETE nested
object of every key you referenced, keyed by namespace, e.g.
{ "Product": { "addToCart": "Add to cart", "outOfStock": "Out of stock" } }.
Every t('NS.key') you wrote MUST appear in messages. English values only.
`

const LOCALIZE_SCHEMA = {
  type: 'object',
  properties: {
    messages: { type: 'object' },
    filesEdited: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['messages'],
}

const TRANSLATE_SCHEMA = {
  type: 'object',
  properties: { translated: { type: 'object' } },
  required: ['translated'],
}

// ---------------------------------------------------------------------------
// Disjoint file groups. Each runs as one agent.
// ---------------------------------------------------------------------------
const GROUPS = [
  // ---- STORE ----
  { app: 'store', label: 'store-chrome', ns: ['Navbar', 'Footer'],
    db: 'render category.name (main-nav)',
    files: ['store/components/navbar.tsx', 'store/components/main-nav.tsx', 'store/components/footer.tsx', 'store/components/navbar-actions.tsx', 'store/components/ui/no-results.tsx'] },
  { app: 'store', label: 'store-home', ns: ['Home'],
    db: 'render product.name (product-card, product-list) and billboard.label (billboard)',
    files: ['store/app/[locale]/(routes)/page.tsx', 'store/components/billboard.tsx', 'store/components/product-list.tsx', 'store/components/ui/product-card.tsx'] },
  { app: 'store', label: 'store-product', ns: ['Product'],
    db: 'render product.name, size.name, color.name (info, preview-modal)',
    files: ['store/app/[locale]/(routes)/product/[productId]/page.tsx', 'store/components/info.tsx', 'store/components/preview-modal.tsx', 'store/components/gallery/index.tsx', 'store/components/gallery/gallery-tab.tsx'] },
  { app: 'store', label: 'store-category', ns: ['CategoryPage'],
    db: 'render category.name, size.name, color.name (filter, mobile-filters, page)',
    files: ['store/app/[locale]/(routes)/category/[categoryId]/page.tsx', 'store/app/[locale]/(routes)/category/[categoryId]/components/filter.tsx', 'store/app/[locale]/(routes)/category/[categoryId]/components/mobile-filters.tsx'] },
  { app: 'store', label: 'store-cart', ns: ['Cart'],
    db: 'render product.name (cart-item, summary)',
    files: ['store/app/[locale]/(routes)/cart/page.tsx', 'store/app/[locale]/(routes)/cart/components/cart-item.tsx', 'store/app/[locale]/(routes)/cart/components/summary.tsx', 'store/app/[locale]/(routes)/checkout/page.tsx'] },
  { app: 'store', label: 'store-auth', ns: ['Auth'], db: null,
    files: ['store/app/[locale]/(routes)/sign-in/page.tsx', 'store/app/[locale]/(routes)/sign-up/page.tsx'] },

  // ---- ADMIN ----
  { app: 'admin', label: 'admin-chrome', ns: ['Nav', 'StoreSwitcher', 'Modals', 'ApiAlert', 'Overview'], db: null,
    files: ['admin/components/main-nav.tsx', 'admin/components/store-switcher.tsx', 'admin/components/account-menu.tsx', 'admin/components/modals/store-modal.tsx', 'admin/components/modals/alert-modal.tsx', 'admin/components/overview.tsx', 'admin/components/ui/api-alert.tsx', 'admin/components/ui/api-list.tsx'] },
  { app: 'admin', label: 'admin-billboards', ns: ['Billboards'],
    db: 'FORM billboard-form label->labelI18n; API persist labelI18n',
    files: ['admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/components/cell-action.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/[billboardId]/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/billboards/[billboardId]/components/billboard-form.tsx', 'admin/app/api/[storeId]/billboards/route.ts', 'admin/app/api/[storeId]/billboards/[billboardId]/route.ts'] },
  { app: 'admin', label: 'admin-categories', ns: ['Categories'],
    db: 'FORM category-form name->nameI18n; API persist nameI18n',
    files: ['admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/components/cell-action.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/[categoryId]/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/categories/[categoryId]/components/category-form.tsx', 'admin/app/api/[storeId]/categories/route.ts', 'admin/app/api/[storeId]/categories/[categoryId]/route.ts'] },
  { app: 'admin', label: 'admin-products', ns: ['Products'],
    db: 'FORM product-form name->nameI18n; API persist nameI18n',
    files: ['admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/components/cell-action.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/[productId]/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/products/[productId]/components/product-form.tsx', 'admin/app/api/[storeId]/products/route.ts', 'admin/app/api/[storeId]/products/[productId]/route.ts'] },
  { app: 'admin', label: 'admin-sizes-colors', ns: ['Sizes', 'Colors'],
    db: 'FORMS size-form & color-form name->nameI18n; APIs persist nameI18n',
    files: ['admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/components/cell-action.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/[sizeId]/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/sizes/[sizeId]/components/size-form.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/components/cell-action.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/[colorId]/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/colors/[colorId]/components/color-form.tsx', 'admin/app/api/[storeId]/sizes/route.ts', 'admin/app/api/[storeId]/sizes/[sizeId]/route.ts', 'admin/app/api/[storeId]/colors/route.ts', 'admin/app/api/[storeId]/colors/[colorId]/route.ts'] },
  { app: 'admin', label: 'admin-orders-misc', ns: ['Orders', 'Dashboard', 'Settings'],
    db: null,
    files: ['admin/app/[locale]/(dashboard)/[storeId]/(routes)/orders/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/orders/components/client.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/orders/components/columns.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/settings/page.tsx', 'admin/app/[locale]/(dashboard)/[storeId]/(routes)/settings/components/settings-form.tsx', 'admin/app/[locale]/(root)/(routes)/page.tsx'] },
  { app: 'admin', label: 'admin-auth', ns: ['AuthAdmin'], db: null,
    files: ['admin/app/[locale]/(auth)/(routes)/sign-in/[[...sign-in]]/page.tsx', 'admin/app/[locale]/(auth)/(routes)/sign-up/[[...sign-up]]/page.tsx'] },
]

function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] && typeof target[key] === 'object' ? target[key] : {}, source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

// ---------------------------------------------------------------------------
phase('Localize')
const results = await parallel(GROUPS.map((g) => () =>
  agent(
    `${COMMON}\n\nAPP: ${g.app}\nASSIGNED NAMESPACE(S): ${g.ns.join(', ')}\n` +
    `DB-CONTENT TASK: ${g.db ?? 'none (UI strings only)'}\n` +
    `i18n nav module for this app: '@/i18n/navigation'. localizedField: '@/lib/i18n-content'.\n` +
    `YOUR FILES (edit only these):\n${g.files.map((f) => '  - ' + f).join('\n')}\n\n` +
    `Read each file, apply the rules, and return the messages object covering every key you used.`,
    { label: g.label, phase: 'Localize', schema: LOCALIZE_SCHEMA }
  ).then((r) => ({ app: g.app, label: g.label, ...(r || {}) }))
))

// Merge per app.
const enStore = {}
const enAdmin = {}
const localizeNotes = []
for (const r of results.filter(Boolean)) {
  if (!r.messages) { localizeNotes.push(`${r.label}: NO messages returned`); continue }
  deepMerge(r.app === 'store' ? enStore : enAdmin, r.messages)
  localizeNotes.push(`${r.label}: ${(r.filesEdited || []).length} files; ${r.notes || ''}`)
}

log(`Localize done. store namespaces: ${Object.keys(enStore).join(', ')}; admin namespaces: ${Object.keys(enAdmin).join(', ')}`)

// ---------------------------------------------------------------------------
phase('Translate')
const TR = `Translate this next-intl message catalog JSON to %LANG%. Rules:
- Translate ONLY the string values; keep every key and the nesting EXACTLY identical.
- Preserve ICU placeholders like {count}, {name}, and any HTML/markup tags untouched.
- Natural, idiomatic %LANG% appropriate for an e-commerce UI. Keep it concise.
Return { translated: <the fully translated object> }.\n\nCATALOG:\n`

const [ruStore, roStore, ruAdmin, roAdmin] = await parallel([
  () => agent(TR.replace(/%LANG%/g, 'Russian') + JSON.stringify(enStore, null, 2), { label: 'store-ru', phase: 'Translate', schema: TRANSLATE_SCHEMA }),
  () => agent(TR.replace(/%LANG%/g, 'Romanian') + JSON.stringify(enStore, null, 2), { label: 'store-ro', phase: 'Translate', schema: TRANSLATE_SCHEMA }),
  () => agent(TR.replace(/%LANG%/g, 'Russian') + JSON.stringify(enAdmin, null, 2), { label: 'admin-ru', phase: 'Translate', schema: TRANSLATE_SCHEMA }),
  () => agent(TR.replace(/%LANG%/g, 'Romanian') + JSON.stringify(enAdmin, null, 2), { label: 'admin-ro', phase: 'Translate', schema: TRANSLATE_SCHEMA }),
])

return {
  localizeNotes,
  store: { en: enStore, ru: ruStore?.translated ?? {}, ro: roStore?.translated ?? {} },
  admin: { en: enAdmin, ru: ruAdmin?.translated ?? {}, ro: roAdmin?.translated ?? {} },
}

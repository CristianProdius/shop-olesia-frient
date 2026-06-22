# ROLE & GOAL

You are an expert multi-agent front-end implementation team operating in the **ultracode** orchestrator. Your job is to **fully redesign two Next.js (App Router, Tailwind v4, next-intl en/ro/ru) apps** to a single brand design system called **"Olesia Frient — minimal-luxury editorial."**

Two apps, one brand:
- **Storefront** → `/Users/cristian/orca/shop-olesia-frient/store`
- **Admin** → `/Users/cristian/orca/shop-olesia-frient/admin`

The wordmark is a two-line stacked lockup: **`OLESIA` / `FRIENT`**.

You will: (a) install shared design tokens + Montserrat font in BOTH apps, (b) restyle every storefront page/component, (c) restyle admin into a modern on-brand dashboard (sidebar shell, refined shadcn theme, better tables/forms/cards, light-default dark mode), (d) **preserve all existing functionality, i18n keys, data fetching, auth, and component APIs**, (e) ship responsive + accessible.

This is a **visual + structural redesign, not a rewrite.** Theme by changing token *values* and component markup/classes — never delete features, routes, props, or i18n keys.

---

# NON-NEGOTIABLE AESTHETIC PRINCIPLES

1. **Monochrome restraint.** UI chrome is pure white `#FFFFFF` + near-black `#232323` only. Color (coral `#E95144`) is rationed to functional **sale price** and **error** signals. When in doubt, remove color.
2. **Tracking-as-elegance.** Uppercase structural type with wide letter-spacing; the *smaller* the text, the *wider* the tracking. Airy small-caps cadence is the brand signature.
3. **Weight contrast over size jumps.** Bold-700 uppercase tracked chrome vs. regular-400 mixed-case product info.
4. **Whitespace + hairlines, not boxes.** Generous spacing and 1px `#CFCFCF` rules. No cards, no shadows, **no rounded corners** in storefront (except the cart badge circle).
5. **Frameless imagery.** Product photos sit directly on the white page; the photo's own neutral backdrop *is* the surface.
6. **Never uppercase a product name or a price.** Product names/prices/body/inputs = 400, mixed case, ~0 tracking.
7. **Tokens are the source of truth.** Components must never hardcode hex values — consume tokens via Tailwind utilities / CSS vars.
8. **Admin retheme = change CSS-var VALUES only.** Keep every shadcn class contract (`bg-primary`, `text-muted-foreground`, `border-input`, …) intact.

---

# DESIGN TOKENS (use verbatim — do not re-derive)

## Color — Storefront semantic roles (light)

| Token | Hex | Usage |
|---|---|---|
| `--color-background` | `#FFFFFF` | Page + nav |
| `--color-surface` | `#FAFAFA` | Rare section banding |
| `--color-surface-2` | `#F8F8F8` | Cart/checkout summary panel |
| `--color-placeholder` | `#F4F0EB` | Warm neutral behind loading images |
| `--color-text` | `#232323` | Body, product names, prices |
| `--color-ink` | `#000000` | Active/hover nav, logo, page titles |
| `--color-muted` | `#969696` | Placeholder, large/decorative meta ONLY |
| `--color-muted-strong` | `#6E6E6E` | Secondary labels / info text (AA 4.6:1) |
| `--color-border` | `#CFCFCF` | Rules, dropdown outlines, inputs (1px) |
| `--color-border-strong` | `#232323` | Active toggle outline, input focus |
| `--color-sale` | `#E95144` | Sale price, error state |
| `--color-success` | `#428445` | In-stock, confirmations, toasts |
| `--color-badge` | `#F5D9DC` | Cart count badge fill (dark `#232323` text) |
| `--color-on-dark` | `#FFFFFF` | Text over hero imagery |
| `--color-on-dark-muted` | `rgba(255,255,255,0.85)` | Secondary over imagery |
| `--color-focus` | `#232323` | `focus-visible` outline |

**A11y rule:** `#969696` (2.9:1) and `#858585` (3.5:1) FAIL WCAG AA for normal text. Use `--color-muted` only for large/decorative meta; use **`--color-muted-strong #6E6E6E`** for any muted text carrying real information. Never remove `focus-visible` outlines.

## Radius / Tracking / Shadow / Motion (storefront)

```
--radius: 0px;  --radius-sm: 2px (toasts only);  --radius-input: 0px;  --radius-full: 9999px (cart badge only)
--tracking-luxe: 0.06em (headings);  --tracking-wide-sm: 0.1em (labels/buttons);  --tracking-logo: 0.3em (wordmark)
--shadow-overlay: 0 8px 30px rgba(0,0,0,0.08);  --shadow-nav: 0 2px 8px rgba(0,0,0,0.06)
--ease-luxe / --ease-out: cubic-bezier(0.16, 1, 0.3, 1)   (no spring, no bounce)
```

**Shadows:** NONE on cards/images/buttons/sections. Allowed only on floating layers (menus, drawer, modal → `--shadow-overlay`; scrolled sticky nav → `--shadow-nav`).

**Motion durations:** 150ms input/color focus · 200ms links/buttons/nav shadow · 300ms underline grow / drawer / quick-view fade / scrim · 500ms image crossfade & fade-in · 700ms gentle image scale. Always honor `prefers-reduced-motion`.

## Z-index scale
`base 0 · sticky toolbar 30 · sticky navbar 50 · dropdown/menu 60 · drawer scrim 70 · drawer/modal 80 · toast 90`

## Spacing (4px base, Tailwind-aligned)
`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120` px.
- Card caption: image→name **14px**, name→price **6px**.
- Grid gaps: mobile `gap-x-4 gap-y-8`; desktop `gap-x-14 gap-y-16`.
- Toolbar margins **24px** above/below. Section rhythm **80px** mobile / **96–120px** desktop. Header vertical padding 28–32px desktop / 12–14px mobile.

## Containers & breakpoints
- Content container: `max-w-[1170px] mx-auto`. Side gutters `px-4 → sm:px-6 → md:px-8 → lg:px-10`.
- Hero/billboard: full-bleed `w-screen`, no container, no padding.
- Breakpoints (Tailwind v4 defaults): sm 640 / md 768 / lg 1024 / xl 1280.
- `<640` 2-col grid, sidebar→Filter button. `640–1023` 2-col, narrow/collapsed sidebar. `≥1024` 3-col grid (toggle 1/2/3/4) + persistent left sidebar.
- Centered-logo nav switches to hamburger below `md` (768).

## Typography scale — Storefront

Rule: structural/brand/nav = **uppercase + 700 + tracking that grows as size shrinks**. Read-as-data content = **400, mixed case, ~0 tracking**.

| Role | Size | Weight | Tracking | LH | Transform | Color |
|---|---|---|---|---|---|---|
| Hero H1 (over image) | 40px | 700 | 0.05em | 1.1 | UPPER | on-dark |
| Page title (DRESSES/NEW IN) | 22–24px | 700 | 0.5px | 1.2 | UPPER | ink |
| H2 section | 28px | 700 | 0.05em | 1.2 | UPPER | text |
| H3 | 20px | 700 | 1px | 1.25 | UPPER | text |
| H4 | 16px | 700 | 0.6px | 1.3 | UPPER | text |
| H5 / group label | 13px | 700 | 0.08em | 1.4 | UPPER | text |
| H6 / micro label | 11px | 700 | 0.1em | 1.4 | UPPER | text |
| Nav link | 13px | 700 | 1px | 1.0 | UPPER | text→ink hover |
| Sidebar category | 13px | 600–700 | 0.8px | ~2.3 row | UPPER | text |
| Logo line 1 (OLESIA) | 22–24px | 700 | 0.3em | 1.0 | UPPER | ink |
| Logo line 2 (FRIENT) | 9–10px | 600–700 | 0.4em | 1.0 | UPPER | ink |
| Product name | 14px | 400 | 0.2px | 1.4 | Title | text |
| Price | 14px | 400 | 0.3px | 1.4 | as-is | text |
| Body | 14–15px | 400 | 0 | 1.6 | as-is | text |
| Small / caption | 12px | 400 | 0 | 1.5 | as-is | muted-strong |
| Eyebrow (VIEW AS / SORT BY) | 12px | 700 | 0.1em | 1.4 | UPPER | muted-strong |
| Button / CTA | 12–13px | 700 | 0.1em | 1.0 | UPPER | per variant |

---

# FILES TO CREATE / EDIT (Storefront `globals.css`)

Replace `store/app/globals.css` content (keep `@import "tailwindcss"` and `html,body,:root{height:100%}`):

```css
@import "tailwindcss";

@theme {
  --font-sans: "Montserrat", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;

  --color-background: #ffffff;
  --color-surface: #fafafa;
  --color-surface-2: #f8f8f8;
  --color-placeholder: #f4f0eb;
  --color-text: #232323;
  --color-ink: #000000;
  --color-muted: #969696;
  --color-muted-strong: #6e6e6e;
  --color-border: #cfcfcf;
  --color-border-strong: #232323;
  --color-sale: #e95144;
  --color-success: #428445;
  --color-badge: #f5d9dc;
  --color-on-dark: #ffffff;
  --color-on-dark-muted: rgba(255, 255, 255, 0.85);
  --color-focus: #232323;

  --radius: 0px;
  --radius-sm: 2px;
  --radius-input: 0px;
  --radius-full: 9999px;

  --tracking-luxe: 0.06em;
  --tracking-wide-sm: 0.1em;
  --tracking-logo: 0.3em;

  --shadow-overlay: 0 8px 30px rgba(0, 0, 0, 0.08);
  --shadow-nav: 0 2px 8px rgba(0, 0, 0, 0.06);

  --ease-luxe: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer base {
  html, body, :root { height: 100%; }
  body {
    background: var(--color-background);
    color: var(--color-text);
    font-family: var(--font-sans);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  *, ::before, ::after { border-color: var(--color-border); }
  :focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  .eyebrow { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: var(--tracking-wide-sm); color: var(--color-muted-strong); }
  .product-name { font-size: 0.875rem; font-weight: 400; letter-spacing: 0.2px;
    line-height: 1.4; color: var(--color-text); text-align: center; }
  .price { font-size: 0.875rem; font-weight: 400; letter-spacing: 0.3px;
    color: var(--color-text); text-align: center; }
  .price--was { color: var(--color-muted-strong); text-decoration: line-through; }
  .price--sale { color: var(--color-sale); font-weight: 500; }
  .heading-luxe { font-weight: 700; text-transform: uppercase; letter-spacing: var(--tracking-luxe); }
  .rule { height: 1px; background: var(--color-border); border: 0; }
}
```

Remove the old v3 border-color compat shim and the gradient-only `@theme`.

---

# FILES TO CREATE / EDIT (Admin `globals.css`)

In `admin/app/globals.css`, **keep all shadcn class contracts**; change only the HSL var values in `:root`/`.dark`, tighten `--radius`, add `--success`, and wire Montserrat. Map the existing `@theme inline` block to these vars (preserve every existing `--color-*` mapping; add `--color-success` and `--font-sans`).

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 14%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 14%;
    --primary: 0 0% 0%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 97%;
    --secondary-foreground: 0 0% 14%;
    --muted: 0 0% 98%;
    --muted-foreground: 0 0% 43%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 14%;
    --destructive: 5 80% 59%;
    --destructive-foreground: 0 0% 100%;
    --success: 130 34% 39%;
    --success-foreground: 0 0% 100%;
    --border: 0 0% 81%;
    --input: 0 0% 81%;
    --ring: 0 0% 14%;
    --radius: 0.375rem;
  }
  .dark {
    --background: 0 0% 8%;
    --foreground: 0 0% 96%;
    --card: 0 0% 11%;
    --card-foreground: 0 0% 96%;
    --popover: 0 0% 11%;
    --popover-foreground: 0 0% 96%;
    --primary: 0 0% 96%;
    --primary-foreground: 0 0% 8%;
    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 96%;
    --muted: 0 0% 14%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 18%;
    --accent-foreground: 0 0% 96%;
    --destructive: 5 75% 64%;
    --destructive-foreground: 0 0% 100%;
    --success: 130 38% 52%;
    --success-foreground: 0 0% 8%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 80%;
  }
}
```

In `@theme inline` add: `--color-success: hsl(var(--success));` and `--font-sans: "Montserrat", ui-sans-serif, system-ui, sans-serif;`. Keep `--radius-lg/md/sm` deriving from `--radius`.

---

# FONT LOADING (both apps, `next/font/google`)

```tsx
import { Montserrat } from "next/font/google";
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"], // cyrillic REQUIRED for ru
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
// <body className={`${montserrat.variable} font-sans`}>
```
- Storefront `store/app/[locale]/layout.tsx`: replace **Urbanist** with the above; wire `--font-sans` into `@theme`.
- Admin `admin/app/[locale]/layout.tsx`: replace **Inter** with the above; set body `font-sans`.

---

# WORK PLAN (ordered phases)

> Work the phases in order. Phase 0 is a hard prerequisite for all others. Within a phase, parallelize independent files. **If editing both apps concurrently, use git worktree isolation** (see Execution Mode) so the two apps never share an uncommitted working tree.

## PHASE 0 — Foundation tokens & fonts (do FIRST, blocks everything)
- `store/app/globals.css` — install `@theme` tokens + utility classes (above).
- `store/app/[locale]/layout.tsx` — Montserrat (cyrillic) → `--font-sans`.
- `admin/app/globals.css` — retheme HSL values, `--radius: 0.375rem`, add `--success`, Montserrat var.
- `admin/app/[locale]/layout.tsx` — Montserrat; body `font-sans`.
- `admin` ThemeProvider → `attribute="class" defaultTheme="light" enableSystem` (remove `dark` default).
- **Gate:** both apps build after Phase 0 before proceeding.

## PHASE 1 — Storefront shared primitives (`store/components/ui/*` + `lib`)
- `ui/button.tsx`: **Fix the `cn()` merge bug** (pass `className` as a separate `cn()` arg, not interpolated in a template literal). Add variants: `primary` (`bg-ink text-white px-9 py-4`, hover invert to white bg + 1px ink border), `secondary` (transparent + 1px `#232323` border, hover fills `#232323`), `ghost` (no bg/border, hover underline or `#969696`). Sizes sm `px-6 py-3`/md `px-9 py-4`/lg `px-12 py-5`. Base: `uppercase font-bold tracking-[0.1em] rounded-none transition-colors duration-200 ease-out`. On-dark variants: primary→white bg/black text; outline→white border. Disabled: `bg-[#CFCFCF] text-white`.
- `ui/icon-button.tsx`: strip `rounded-full bg-white border shadow-md hover:scale-110` → borderless, transparent, `rounded-none`, 40×40 tap target, hover color `#969696`/opacity 0.7 (150–200ms), `focus-visible` outline.
- `ui/currency.tsx`: **Functional fix** — change hardcoded `en-US`/`USD` to **MDL**, locale-aware (`ro-MD`/`ru`/`en`), format `2,700.00 MDL` (thousands comma, 2 decimals, space + uppercase `MDL`). Add sale support (`price--was` / `price--sale`).
- `ui/product-card.tsx`: remove `p-3 bg-white border rounded-xl` and square image. → frameless: `aspect-[3/4] object-cover`, placeholder `#F4F0EB`, two stacked `<Image fill>` for hover crossfade (`opacity-0→100 duration-500 ease-out`) + base `scale-100→scale-[1.03] duration-700`; optional `QUICK VIEW` strip `bg-white/85` 12px/700 uppercase fading in (300ms). Centered name (`.product-name`) 14px gap below image, price (`.price`) 6px below name. Whole card links to PDP (accessible name); quick-view keyboard-focusable; `motion-reduce` disables crossfade/scale. Sale: pair color with strikethrough/label.
- `ui/modal.tsx`: radius 0, overlay `bg-black/50` (replace deprecated `bg-opacity-50`), panel white `--shadow-overlay`, borderless close icon-button.
- `ui/no-results.tsx`, `ui/container.tsx` (optional full-bleed variant for billboard).
- `lib/utils.ts` — `cn()` stays; reuse everywhere.

## PHASE 2 — Storefront chrome
- `components/navbar.tsx`: sticky white bar `top-0 z-50`, ~80px desktop / ~56px mobile, **3-column grid** (left logo / center nav / right icons). No bottom border at top; after scroll >8px add 1px `#CFCFCF` border + `--shadow-nav` (200ms). Replace left-aligned `text-xl font-bold` with the two-line `OLESIA`/`FRIENT` wordmark (line1 ~24px/700 `tracking-[0.3em]`, line2 ~10px/600 `tracking-[0.4em]` centered under line1), links home, `focus-visible` outline. Below `md` → hamburger layout.
- `components/main-nav.tsx`: fixed top-level items, `13px/700 uppercase tracking-[1px] text-text`, gap ~40px centered. Hover: color→`#000` + 1px center-grow underline pseudo-element (`after: h-px w-0→w-full left-1/2 -translate-x-1/2 transition-[width] 300ms ease-out`). Active = persistent underline. Keep existing dynamic-category data wiring/i18n.
- `components/navbar-actions.tsx`: replace black-pill buttons with borderless thin-line lucide icons (stroke 1.5px, 20–22px, `#232323`), order Search, Account, Cart(+badge), Language; gap ~22px. **Cart badge:** circle top-right of cart icon `translate(+8px,-8px)`, fill `#F5D9DC`, ~18px, number `10px/600 #232323`, always visible (shows `0`), wired to zustand count. **Add a search affordance** (currently absent): magnifier icon → full-width white slide-down strip / `@headlessui` Dialog, input 1px `#CFCFCF` bottom-border, 48px, radius 0, ESC/outside-click close.
- `components/language-switcher.tsx`: replace native `<select>` with Globe icon → dropdown menu EN/RO/RU (next-intl), white bg, 1px `#CFCFCF`, radius 0, faint `--shadow-overlay`, items `12px/600 uppercase`, active locale bold `#232323`, others `#969696`, row hover `#FAFAFA`. **Preserve locale-switch behavior.**
- `components/footer.tsx`: expand from single line → container `max-w-[1170px]`, top padding 80–96px. **FOLLOW US ON INSTAGRAM** centered heading `13px/700 uppercase tracking-[1.5px]` + centered grid of 4–6 square images (`object-cover`, radius 0, tiny gaps). Link columns (Catalog/Info/Contact/Social) headings `13px/700 uppercase tracked`, items `12px/600 uppercase`, hover `#969696`. Bottom copyright row ~64px `12px #6E6E6E`. Top border 1px `#CFCFCF`.
- Mobile hamburger drawer: `@headlessui` Dialog/Transition, left off-canvas slide (`-translate-x-full→0` 300ms), scrim `bg-black/40`, white ~82%/max 360px, vertical uppercase links 14px/700 row spacing 20–24px, lang+account at bottom. `aria-label`/`aria-expanded` on trigger, `role="dialog"` + focus trap, ESC closes, body scroll lock.

## PHASE 3 — Storefront pages
- **Home** `app/[locale]/(routes)/page.tsx` + `components/billboard.tsx`: full-bleed hero (remove `rounded-xl`, outer `p-4/p-8`), `w-screen` ignore container, height `clamp(520px,88vh,900px)` desktop / 60–72vh mobile portrait crop via `<picture>`/`next/image sizes`. Optional video `autoPlay muted loop playsInline poster`. Overlay text on-dark only. Then GET INSPIRED eyebrow (centered, flanked by short rules), editorial blocks 2-up mobile/3-up desktop frameless, then featured `ProductList`, then Instagram + footer. Section rhythm 80/96–120px.
- **Collection/Category** `category/[categoryId]/page.tsx` + `components/filter.tsx` + `mobile-filters.tsx`: **Remove `console.log(category)`.** Replace `lg:grid-cols-5` Billboard+Size/Color layout with: left **CATEGORIES sidebar** (~200px, header 13–15px/700 uppercase, list items 13–14px/600 uppercase, ~30px rows, active = 1px underline `#000`, hover underline/`#969696`) + main content (Page H1 uppercase/tracked + full-width 1px `#CFCFCF` rule spanning main only, ~18px above/28px below). **Toolbar:** VIEW AS density toggle (desktop, 4 icons 1/2/3/4, active 1px `#232323` box, hidden `<md` → mobile 1/2-col switcher) left + SORT BY (`@headlessui Listbox`, 150px/44px, 1px `#CFCFCF`, radius 0, chevron, options: Date new→old, Date old→new, Price low→high, Price high→low, A–Z) right. Grid: `grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-14 md:gap-y-16`. Restyle Size/Color pills → minimal tracked list. Mobile sidebar → Filter button + drawer. Keep all data fetching/filtering logic.
- **Product** `product/[productId]/page.tsx` + `components/info.tsx` + `gallery/index.tsx` + `gallery/gallery-tab.tsx` + `preview-modal.tsx`: breadcrumb `12px #6E6E6E` slash-separated (no chevrons), 2-col (gallery ~58% / info ~42%). `info.tsx`: `h1` uppercase/tracked, `hr`→`#CFCFCF`, sale support (was+coral), sharp primary ADD TO CART, swatch border `#CFCFCF`. Gallery thumbnails square, 1px `#CFCFCF`, active border `#232323`, no heavy rounding. Then related `ProductList`.
- **Cart** `cart/page.tsx` + `components/cart-item.tsx` + `summary.tsx`: page title CART + rule. 2-col; items rows separated 1px `#CFCFCF`, 3:4 thumbs, Title-case names, qty, remove icon-button. Summary `bg-gray-50`→`#F8F8F8`, uppercase tracked headings, `#CFCFCF` dividers, TOTAL ink, sharp CHECKOUT primary.
- **Checkout** `checkout/page.tsx`: page title + rule, 2-col form/summary. Sections CONTACT/SHIPPING/PAYMENT, uppercase labels `12/700`, shared sharp inputs (1px `#CFCFCF`, radius 0, focus `#232323`), errors coral. Summary `#F8F8F8`, sharp PLACE ORDER. **Checkout is simulated (no Stripe) — keep existing simulated flow.**
- **Auth** `sign-in/page.tsx` + `sign-up/page.tsx`: centered narrow column `max-w-[400px] mx-auto py-24`, uppercase tracked title, `rounded-md`→radius 0, tokenized colors, sharp inputs, full-width primary CONTINUE, helper link `12px #6E6E6E` underline. **Keep Better Auth wiring intact.**
- `components/product-list.tsx`: title uppercase/tracked + rule under it, 3-col big-gap grid, wire to VIEW AS density.

## PHASE 4 — Admin shell + components
- `(dashboard)/[storeId]/layout.tsx`: introduce **two-pane shell**. Left sidebar `w-60 border-r bg-muted/40 sticky top-0 h-screen`: (1) `OLESIA`/`FRIENT` two-line wordmark uppercase `tracking-[0.15em] ~13px/700`, (2) `StoreSwitcher`, (3) grouped nav — **Store:** Overview · **Catalog:** Products, Categories, Sizes, Colors · **Content:** Billboards · **Sales:** Orders · pinned bottom: **Settings**. Items: lucide icon + label `h-9 px-3 rounded-md`, idle `text-muted-foreground hover:bg-accent`, active `bg-secondary text-foreground font-medium` + left accent bar. Mobile: sidebar → `Sheet`/`Dialog` via header hamburger. Retire/repurpose horizontal `MainNav` (mobile sheet body only).
- `components/navbar.tsx` → slim **topbar** `h-14 border-b`: breadcrumb left + right cluster Language/Theme toggle/Account.
- `components/ui/card.tsx`: `shadow-none`, keep `rounded-md`, inner padding `p-5`. Overview stat cards: `CardTitle`→`text-sm uppercase tracking-wide text-muted-foreground`, value `text-2xl font-semibold`. Overview grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (fix fixed `grid-cols-3` + stray `col-span-4`).
- `components/ui/data-table.tsx`: **keep `DataTable<TData,TValue>` props (`columns/data/searchKey`)**. Add `getSortedRowModel` + sortable header buttons (`ArrowUpDown`), column-visibility `DropdownMenu` ("Columns"), result count + "Page X of Y" + "N row(s)", search `Input` with left icon, header `bg-muted/50` `text-xs uppercase tracking-wide text-muted-foreground`, rows `h-12`, replace "No results." with centered `EmptyState`.
- `components/ui/heading.tsx`: page title `text-2xl uppercase tracking-[0.04em] font-semibold`; description `max-w` muted. Standardize Heading+action+Separator page-header pattern.
- New reusable `EmptyState` (icon in muted `rounded-full` circle + title + description + primary CTA) used in each `*Client` when `data.length === 0`.
- `[productId]/components/product-form.tsx` (& other forms): group fields into `Card` sections, responsive `grid-cols-1 md:grid-cols-2/3`, `FormLabel`→`text-xs uppercase tracking-wide text-muted-foreground`, inline `FormMessage` coral, sticky bottom action bar (Save/Cancel), `space-y-8` sections / `gap-6` within. ImageUpload square tiles 1px border `rounded-md` remove-on-hover.
- `components/ui/button.tsx`: keep stock cva contract; add brand CTAs via call-site classes (`uppercase text-xs tracking-wide`); optional `size="xs"` (`h-8`) for row actions.
- `components/ui/badge.tsx`: map status — default neutral, `destructive` coral (Unpaid/Out of stock), new **success** (`bg-success/10 text-success border-success/20`) for Paid/In stock, uppercase `text-[10px] tracking-wide`.
- `components/ui/dialog.tsx` + `ui/modal.tsx`/`AlertModal`: keep `--radius`, overlay `bg-black/50`, destructive confirms use `destructive` button.
- Recharts (Overview): neutral palette (bars/line `foreground`/`primary`, grid `border`, axis `text-muted-foreground text-xs`, no gradients, tooltip as card `shadow-none`).
- Page density: main `p-6`, `space-y-6`; Separator under each Heading.
- Dark mode: verify charcoal neutrals + coral/success legibility (lightness bumped in `.dark`).

## PHASE 5 — Cleanups bundle + QA
- Storefront cleanups (verify done): remove `console.log(category)`; Currency→MDL; Button `cn()` merge fixed; `bg-opacity-50`→`bg-black/50`; sale-price support; search affordance added.
- A11y pass: `--color-muted-strong` for info text; `focus-visible` intact; hamburger `aria-label`/`aria-expanded`; drawer `role="dialog"` + focus trap; `prefers-reduced-motion` honored across crossfade/scale/drawer.
- Run full verification checklist below.

---

# HARD CONSTRAINTS — DO NOT BREAK

1. **No functionality regressions.** Cart (zustand), filtering/sorting, gallery, modals, simulated checkout, Better Auth sign-in/up, MinIO image flows — all must keep working.
2. **Preserve all `next-intl` i18n keys (en/ro/ru).** Do not rename/remove translation keys; render existing translated strings. Cyrillic must render (Montserrat cyrillic subset).
3. **Preserve data fetching & Prisma usage** — no changes to API routes, server actions, queries, or schema.
4. **Admin: never change shadcn class contracts** (`bg-primary`, `text-muted-foreground`, `border-input`, etc.) or component public APIs. Retheme via CSS-var values + markup only.
5. **Preserve component prop APIs**, especially `DataTable<TData,TValue>` (`columns/data/searchKey`) and `Button`/`Currency`/`ProductCard` call signatures (additive props only).
6. **No hardcoded hex in components** — consume tokens.
7. **Builds must pass** for both apps; **zero TypeScript errors**; lint clean.
8. **No new heavy dependencies.** Reuse installed deps: `@headlessui/react`, `lucide-react`, `clsx`, `tailwind-merge` (`cn`), `react-hot-toast`, `next-themes`, `@tanstack/react-table`, `recharts`, `next/font`.
9. **Currency change to MDL is intentional** (was USD) — apply consistently.
10. Keep storefront radius 0 (cart badge circle excepted); admin radius `0.375rem`.

---

# PER-PAGE / PER-AREA ACCEPTANCE CRITERIA

**Storefront**
- Navbar: centered `OLESIA/FRIENT` wordmark, centered uppercase tracked nav with center-grow underline hover, 4 borderless icons, pink cart badge wired to count, working search, sticky border/shadow appears only after scroll.
- Language switcher: Globe dropdown EN/RO/RU, switches locale, active bold.
- Footer: Instagram block + link columns + copyright, hairline borders, no shadows.
- Product card: frameless 3:4, centered Title-case name + price, hover crossfade to 2nd image, sale = was(strikethrough `#6E6E6E`)+sale(coral). Keyboard-accessible; `motion-reduce` static.
- Currency: renders `2,700.00 MDL`, locale-aware.
- Collection page: NO console.log, sidebar categories + active underline, page H1 + single rule, VIEW AS + SORT BY toolbar functional, responsive grid (2→3 col), mobile Filter drawer.
- Product page: breadcrumb, 2-col gallery/info, uppercase name, sale support, sharp ADD TO CART, swatch borders `#CFCFCF`.
- Cart/Checkout: `#F8F8F8` summary, `#CFCFCF` dividers, sharp CTAs, coral input errors, simulated checkout still completes.
- Auth: radius-0 sharp inputs, uppercase title, full-width primary, Better Auth works.
- Buttons: variants render, `cn()` override works, on-dark variants correct.

**Admin**
- Sidebar shell with grouped nav + active state + brand wordmark; topbar with breadcrumb/lang/theme/account; mobile sheet nav.
- Cards: shadow-none, stat cards uppercase muted title, responsive overview grid.
- DataTable: search w/ icon, sortable headers, column toggle, count + "Page X of Y", `h-12` rows, EmptyState on empty; **props unchanged**.
- Forms: card sections, uppercase muted labels, coral errors, sticky action bar.
- Badges: success/destructive/neutral statuses.
- Charts neutralized.
- Dark mode default **light**, charcoal (not slate) in dark, coral/success legible.

---

# FINAL VERIFICATION CHECKLIST (run before declaring done)

```bash
# Storefront
cd /Users/cristian/orca/shop-olesia-frient/store && npm run build && npm run lint
# Admin
cd /Users/cristian/orca/shop-olesia-frient/admin && npm run build && npm run lint
# TypeScript (each app)
npx tsc --noEmit
```
- [ ] Both apps build with **0 errors**, lint clean, `tsc --noEmit` passes.
- [ ] No hardcoded hex in components; tokens consumed.
- [ ] i18n: en/ro/ru all render; Cyrillic visible; no missing keys.
- [ ] Responsive verified at **390 / 768 / 1440** for: home, collection, product, cart, checkout, auth (storefront) and overview, a list page, an edit form (admin).
- [ ] Admin **dark mode** verified (charcoal neutrals, coral/success legible, default light).
- [ ] A11y: `focus-visible` outlines present; hamburger `aria-label`/`aria-expanded`; drawer `role="dialog"` + focus trap + ESC; `prefers-reduced-motion` disables crossfade/scale/drawer; muted info text uses `#6E6E6E`.
- [ ] All cleanups done: no `console.log(category)`; Currency MDL; Button `cn()` fix; `bg-black/50`; sale support; search affordance.
- [ ] No regressions: cart, filter/sort, gallery, modals, simulated checkout, Better Auth, MinIO images.
- [ ] Visual parity to the minimal-luxury editorial reference (monochrome restraint, tracked uppercase chrome, frameless 3:4 imagery, hairlines not boxes, sharp corners).

---

# EXECUTION MODE (ultracode)

- **Parallelize where safe.** Independent files within a phase may be edited concurrently by separate agents. Respect phase ordering (Phase 0 blocks all).
- **Worktree isolation:** when editing the storefront and admin **concurrently**, run each app's work in its own git worktree to avoid cross-app interference in one working tree; reconcile/merge after each app's phase passes its build gate.
- **Gate between phases:** do not advance until the relevant app builds. Re-run the verification checklist at the end.
- Keep commits scoped per phase/app with clear messages. Do not commit or push unless asked; if on the default branch, branch first.

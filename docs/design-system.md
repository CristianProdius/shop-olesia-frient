# Olesia Frient — Design System

> A minimal-luxury editorial design system for the Olesia Frient women's fashion store (storefront + admin). Inspired by barbaracollection.com, refined for stronger accessibility, a clearer dark mode, and a unified token layer across both Next.js App Router apps (Tailwind v4, next-intl en/ro/ru).

---

## 0. How to use this document

- **Source of truth = tokens.** Define everything in `globals.css` `@theme` and consume via Tailwind utility classes / semantic CSS variables. Components must never hardcode hex values.
- **Storefront** = editorial, frameless, near-zero radius, pure white chrome.
- **Admin** = same brand palette and font, but keeps the shadcn class contract intact (retheme by changing CSS-var *values* only, never class names).
- Two apps, one brand: the `BARBARA / COLLECTION`-style wordmark becomes `OLESIA / FRIENT`.

---

## 1. Brand & Art-Direction Principles

### 1.1 The feel
Minimal luxury editorial. The luxury signal is **restraint** — the deliberate *absence* of color, chrome, borders, and shadows. The page is a quiet gallery; the product photography is the only loud element.

Five operating principles:

1. **Monochrome restraint.** UI chrome is pure white `#FFFFFF` + near-black `#232323` only. Color (coral `#E95144`) is rationed to functional sale/error signals. If in doubt, remove color.
2. **Tracking-as-elegance.** Uppercase structural type with wide letter-spacing; the *smaller* the text, the *wider* the tracking. This airy small-caps cadence is the brand signature.
3. **Weight contrast over size jumps.** Bold-700 uppercase tracked chrome vs. regular-400 mixed-case product info builds hierarchy without large font-size leaps.
4. **Whitespace + hairlines, not boxes.** Use generous spacing and 1px `#CFCFCF` rules. No cards, no shadows, no rounded corners (except the cart badge circle).
5. **Frameless imagery.** Product photos sit directly on the white page; the photo's own neutral backdrop *is* the surface.

### 1.2 Photography rules (art direction)

**Hero / mood imagery**
- Full-bleed, edge-to-edge (100vw, ignores the container). No horizontal padding.
- Desktop height `clamp(520px, 88vh, 900px)`; mobile uses an **art-directed portrait crop** (~3:4 / 4:5) served via `<picture>`/`next/image` `sizes`, height ~60–72vh.
- Editorial/atmospheric (a model in environment, warm light), not a flat e-com still.
- Optional video: `autoPlay muted loop playsInline poster={firstFrame}`.
- Overlay text (if any) only over imagery: white `#FFFFFF` / `rgba(255,255,255,0.85)`, uppercase, tracked.

**Product / catalog imagery**
- Full-figure model on a warm-neutral seamless backdrop chosen to harmonize with the garment: warm sand `~#D8CFC4`, soft blush `~#E9D9D6`, warm grey `~#C9CCCE`. These backdrops are **image content, never UI tokens**.
- Composition: model centered, head-to-mid-calf, occupying ~70% of frame height, generous empty backdrop above/below. Eye-level camera, soft diffuse daylight, no harsh shadows.
- **Fixed card aspect ratio 3:4 (portrait)** + `object-cover` so mixed sources stay uniform.
- **No chrome:** no border, no radius, no shadow, no background fill behind the image.
- Provide a **second image** per product (alternate angle / on-figure detail) for the hover crossfade.

**Loading polish**
- Neutral placeholder `#F4F0EB` (warm, not white-flash) behind images; soft fade-in (opacity 0→1, 500ms) on load.
- Skeletons = plain neutral 3:4 blocks `#F4F0EB`, no shimmer gradient (or a very slow pulse).

---

## 2. Color Tokens

### 2.1 Refinements (and their justification)
- **`--color-muted` darkened for body use.** `#969696` (2.9:1) and `#858585` (3.5:1) **fail WCAG AA** on white for normal text. We keep `#969696` strictly for *large/decorative* meta, and introduce **`--color-muted-strong #6E6E6E` (4.6:1 AA)** for any muted text that carries real information (prices' secondary state, secondary labels).
- **Cart badge** kept as the reference's blush `#F5D9DC` with dark `#232323` text (dark-on-light pink is legible and softer than coral). The coral `#E95144` remains reserved for *sale price* and *error*.
- Added explicit `--color-ink #000` (active/hover nav, page titles), `--color-placeholder`, and `--color-focus` so a11y outlines are tokenized.

### 2.2 Storefront — semantic roles (light)

| Role | Token | Hex | Usage |
|---|---|---|---|
| Background | `--color-background` | `#FFFFFF` | Page + nav (dominant) |
| Surface subtle | `--color-surface` | `#FAFAFA` | Rare section banding |
| Surface subtle 2 | `--color-surface-2` | `#F8F8F8` | Cart summary panel |
| Image placeholder | `--color-placeholder` | `#F4F0EB` | Warm neutral behind loading images |
| Text (primary) | `--color-text` | `#232323` | Body, product names, prices |
| Ink (strong) | `--color-ink` | `#000000` | Active/hover nav, logo, page titles |
| Muted (decorative) | `--color-muted` | `#969696` | Placeholder, large meta only |
| Muted (info, AA) | `--color-muted-strong` | `#6E6E6E` | Secondary labels, eyebrows w/ real info |
| Border / hairline | `--color-border` | `#CFCFCF` | Rules, dropdown outlines, inputs |
| Border strong | `--color-border-strong` | `#232323` | Active toggle outline, input focus |
| Sale / error | `--color-sale` | `#E95144` | Sale price, error state |
| Success | `--color-success` | `#428445` | In-stock, confirmations, toasts |
| Badge bg | `--color-badge` | `#F5D9DC` | Cart count badge fill |
| On-dark | `--color-on-dark` | `#FFFFFF` | Text over hero imagery |
| On-dark muted | `--color-on-dark-muted` | `rgba(255,255,255,0.85)` | Secondary over imagery |
| Focus ring | `--color-focus` | `#232323` | `focus-visible` outline |

### 2.3 Storefront `globals.css`

```css
@import "tailwindcss";

@theme {
  /* fonts */
  --font-sans: "Montserrat", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-serif: Georgia, "Times New Roman", serif; /* rare editorial accents */

  /* color */
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

  /* radius — near-sharp */
  --radius: 0px;
  --radius-sm: 2px;
  --radius-input: 0px;
  --radius-full: 9999px; /* cart badge only */

  /* tracking */
  --tracking-luxe: 0.06em;     /* headings */
  --tracking-wide-sm: 0.1em;   /* small labels / buttons */
  --tracking-logo: 0.3em;      /* wordmark */

  /* shadows — overlays only */
  --shadow-overlay: 0 8px 30px rgba(0, 0, 0, 0.08);
  --shadow-nav: 0 2px 8px rgba(0, 0, 0, 0.06);

  /* motion */
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
  :focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### 2.4 Utility classes (storefront)

```css
@layer components {
  .eyebrow {
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: var(--tracking-wide-sm); color: var(--color-muted-strong);
  }
  .product-name {
    font-size: 0.875rem; font-weight: 400; letter-spacing: 0.2px;
    line-height: 1.4; color: var(--color-text); text-align: center;
  }
  .price {
    font-size: 0.875rem; font-weight: 400; letter-spacing: 0.3px;
    color: var(--color-text); text-align: center;
  }
  .price--was { color: var(--color-muted-strong); text-decoration: line-through; }
  .price--sale { color: var(--color-sale); font-weight: 500; }
  .heading-luxe {
    font-weight: 700; text-transform: uppercase;
    letter-spacing: var(--tracking-luxe);
  }
  .rule { height: 1px; background: var(--color-border); border: 0; }
}
```

### 2.5 Admin — shadcn token mapping (retheme by value only)

Keep every shadcn class contract (`bg-primary`, `text-muted-foreground`, `border-input`, …). Only change the HSL values + add the font var. Tighten `--radius` to `0.375rem`.

```css
/* admin app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;          /* #FFFFFF */
    --foreground: 0 0% 14%;           /* #232323 */
    --card: 0 0% 100%;
    --card-foreground: 0 0% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 14%;
    --primary: 0 0% 0%;               /* pure black */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 97%;            /* #F8F8F8 */
    --secondary-foreground: 0 0% 14%;
    --muted: 0 0% 98%;                /* #FAFAFA */
    --muted-foreground: 0 0% 43%;     /* #6E6E6E — AA-safe (refined from #858585) */
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 14%;
    --destructive: 5 80% 59%;         /* #E95144 coral, doubles as sale */
    --destructive-foreground: 0 0% 100%;
    --success: 130 34% 39%;           /* #428445 (new token) */
    --success-foreground: 0 0% 100%;
    --border: 0 0% 81%;               /* #CFCFCF */
    --input: 0 0% 81%;
    --ring: 0 0% 14%;                 /* #232323 */
    --radius: 0.375rem;
  }

  .dark {
    --background: 0 0% 8%;            /* charcoal, not slate-blue */
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
    --destructive: 5 75% 64%;         /* +lightness for dark legibility */
    --destructive-foreground: 0 0% 100%;
    --success: 130 38% 52%;
    --success-foreground: 0 0% 8%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 80%;
  }
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-destructive: hsl(var(--destructive));
  --color-success: hsl(var(--success));
  /* …map remaining shadcn roles identically… */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  --font-sans: "Montserrat", ui-sans-serif, system-ui, sans-serif;
}
```

Also set `ThemeProvider defaultTheme="light"` (off-brand `dark` default removed).

---

## 3. Typography

### 3.1 Font loading (`next/font/google`) — both apps

```tsx
// app/[locale]/layout.tsx
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"], // cyrillic required for ru
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",   // admin may use --font-montserrat; wire into @theme
  display: "swap",
});

// <body className={montserrat.variable}>  (then font-family via --font-sans)
```

- One family across all UI. Serif (`Georgia`) is optional, used *only* for rare decorative accents — not wired into core tokens.
- Default body line-height 1.5; antialiased.

### 3.2 Type scale (storefront)

Rule: structural/brand/nav = **uppercase + 700 + positive tracking that grows as size shrinks**. Content the user reads as data = **400, mixed case, ~0 tracking**.

| Role | Size (px / rem) | Weight | Tracking | Line-height | Transform | Color | Utility |
|---|---|---|---|---|---|---|---|
| Hero H1 (over image) | 40 / 2.5 | 700 | 2px (`0.05em`) | 1.1 | UPPERCASE | on-dark | `text-[40px] heading-luxe` |
| Page title (NEW IN / DRESSES) | 22–24 / 1.5 | 700 | 0.5px | 1.2 | UPPERCASE | ink `#000` | `page-title` |
| H2 section | 28 / 1.75 | 700 | 1.5px (`0.05em`) | 1.2 | UPPERCASE | text | `heading-luxe` |
| H3 | 20 / 1.25 | 700 | 1px | 1.25 | UPPERCASE | text | `heading-luxe` |
| H4 | 16 / 1.0 | 700 | 0.6px | 1.3 | UPPERCASE | text | `heading-luxe` |
| H5 / group label | 13 / 0.8125 | 700 | 1px (`0.08em`) | 1.4 | UPPERCASE | text | `heading-luxe` |
| H6 / micro label | 11 / 0.6875 | 700 | 1.2px (`0.1em`) | 1.4 | UPPERCASE | text | `heading-luxe` |
| Nav link | 13 / 0.8125 | 700 | 1px | 1.0 | UPPERCASE | text→ink hover | `nav-link` |
| Sidebar category | 13 / 0.8125 | 600–700 | 0.8px | 2.3 (~30px row) | UPPERCASE | text | `cat-link` |
| Logo line 1 (OLESIA) | 22–24 | 700 | 6–8px (`0.3em`) | 1.0 | UPPERCASE | ink | `logo-1` |
| Logo line 2 (FRIENT) | 9–10 | 600–700 | 5–6px | 1.0 | UPPERCASE | ink | `logo-2` |
| Product name | 14 / 0.875 | 400 | 0.2px | 1.4 | Title case | text | `product-name` |
| Price | 14 / 0.875 | 400 | 0.3px | 1.4 | as-is | text | `price` |
| Body / paragraph | 14–15 | 400 | 0 | 1.6 | as-is | text | `body` |
| Small / caption | 12 / 0.75 | 400 | 0 | 1.5 | as-is | muted-strong | `caption` |
| Eyebrow (VIEW AS / SORT BY) | 12 / 0.75 | 700 | 1px (`0.1em`) | 1.4 | UPPERCASE | muted-strong | `eyebrow` |
| Dropdown value | 13 / 0.8125 | 400 | 0 | 1.4 | as-is | text | — |
| Button / CTA label | 12–13 | 700 | 1.5px (`0.1em`) | 1.0 | UPPERCASE | per variant | `btn` |

### 3.3 Uppercase vs sentence-case decision table

| UPPERCASE + bold + tracked | Sentence/Title case + 400 + ~0 tracking |
|---|---|
| Navigation, sidebar categories | Product names |
| Page / section headings | Prices |
| Eyebrow labels (VIEW AS, SORT BY) | Body copy / descriptions |
| Buttons, logo, breadcrumbs | Dropdown selected values, form input text |

**Never uppercase a product name or a price.**

### 3.4 Admin typography overrides
- `body` → Montserrat.
- `Heading.tsx` page title: `text-2xl` (not `text-3xl`), `uppercase tracking-[0.04em] font-semibold`.
- Stat-card titles: `text-sm uppercase tracking-wide text-muted-foreground`; value `text-2xl font-semibold`.
- Nav/sidebar items: `text-xs uppercase font-semibold tracking-[0.08em]`.
- Table headers: `text-xs uppercase tracking-wide text-muted-foreground`.

---

## 4. Foundations: Spacing, Layout, Radius, Border, Shadow, Z-index, Motion

### 4.1 Spacing scale (4px base, Tailwind-aligned)
`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120` px.

Key usages:
- Card caption: image→name **14px**, name→price **6px**.
- Grid gaps: mobile `gap-x-4 gap-y-8`; desktop `gap-x-14 gap-y-16` (56–60 / 64px).
- Toolbar margins: **24px** above & below.
- Section rhythm: **80px** mobile, **96–120px** desktop.
- Header vertical padding: **28–32px** desktop, 12–14px mobile.
- Page side padding: 16 / 24 / 40px.

### 4.2 Containers & breakpoints

| Token | Value |
|---|---|
| Content container | `max-w-[1170px] mx-auto` |
| Side gutters | `px-4` → `sm:px-6` → `md:px-8` → `lg:px-10` |
| Hero / billboard | full-bleed `w-screen`, no container, no padding |

Breakpoints (Tailwind v4 defaults): `sm 640 / md 768 / lg 1024 / xl 1280`.

| Range | Grid | Sidebar | Gutter |
|---|---|---|---|
| `<640` mobile | 2-col | collapsed → Filter button | 16px |
| `640–1023` tablet | 2-col | collapsed/narrow | 24–32px |
| `≥1024` desktop | 3-col (toggle 1/2/3/4) | persistent left | 40px, container caps ~1280 |

Centered-logo nav switches to hamburger below `md` (768).

### 4.3 Radius (near-sharp)
- Global `--radius: 0` (buttons, inputs, dropdowns, cards, images all sharp).
- `--radius-sm: 2px` for toasts only.
- `--radius-full` reserved for the **cart badge** circle.
- Admin: `--radius: 0.375rem` (slightly softer for shadcn density).

### 4.4 Border
- Hairline 1px `#CFCFCF` everywhere (rules, inputs, dropdowns, dividers).
- Active/focus border `#232323` (1px, no glow ring).
- Letter-spacing-style "thickness" never implied — single weight hairlines only.

### 4.5 Shadow (minimal)
- **None** on cards, billboards, sections, images, buttons.
- Allowed only on genuinely floating layers:
  - Overlays/menus (sort menu, language menu, drawer, modal): `--shadow-overlay` = `0 8px 30px rgba(0,0,0,0.08)`.
  - Sticky nav once scrolled: `--shadow-nav` = `0 2px 8px rgba(0,0,0,0.06)`.

### 4.6 Z-index scale

| Layer | z |
|---|---|
| Base content | 0 |
| Sticky toolbar | 30 |
| Sticky navbar | 50 |
| Dropdown / menu | 60 |
| Drawer scrim | 70 |
| Drawer / modal | 80 |
| Toast | 90 |

### 4.7 Motion

Easing: `--ease-out` / `--ease-luxe` = `cubic-bezier(0.16, 1, 0.3, 1)`. No spring, no bounce.

| Duration | Use |
|---|---|
| 150ms | input/color focus |
| 200ms | links, buttons, nav shadow/border |
| 300ms | underline grow, drawer slide, quick-view fade, scrim |
| 500ms | image crossfade, image fade-in on load |
| 700ms | gentle image scale (ken-burns) |

Always honor `prefers-reduced-motion` (disable crossfade/scale/drawer transforms).

---

## 5. Component Specs — Storefront

> Restyle targets: `navbar.tsx`, `main-nav.tsx`, `navbar-actions.tsx`, `language-switcher.tsx`, `footer.tsx`, `billboard.tsx`, `product-list.tsx`, `info.tsx`, `ui/{button,icon-button,currency,modal,no-results,container,product-card}.tsx`, `preview-modal.tsx`, `gallery/*`, plus category/cart/checkout/auth pages.

### 5.1 Navbar + logo
**Anatomy.** Sticky white bar, `position:sticky top-0 z-50`, height ~**80px** desktop / ~56px mobile. Three-zone layout: **left** = logo wordmark, **center** = nav links (centered to viewport via 3-col grid, not flex-center of remaining space), **right** = icon cluster. Background `#FFFFFF`, text `#232323`. No bottom border at scroll-top; after scroll >8px add 1px `#CFCFCF` bottom border + `--shadow-nav` (transition 200ms).

**Logo wordmark.** Two-line stacked lockup. Line 1 `OLESIA` ~24px/700, tracking `0.3em`, `#232323`, uppercase. Line 2 `FRIENT` ~10px/600, tracking ~`0.4em` (sized to match line-1 width), centered under line 1, tight line-height. Pure type, links to home. (`navbar.tsx` currently left-aligned `text-xl font-bold` → replace.)

**States.** Logo static; whole lockup is the home link with `:focus-visible` outline.

### 5.2 Nav links (CATALOG, NEW IN, COLLECTIONS, CONTACT)
- Row, gap ~**40px**, centered. Each `13px/700 uppercase tracking-[1px] text-#232323`.
- Rest: no underline. **Hover:** color → `#000`; a 1px underline grows from center via pseudo-element (`after: h-px w-0 → w-full, left-1/2 -translate-x-1/2, transition-[width] 300ms ease-out`), offset ~`0.2em` below baseline.
- **Active/current:** underline persistent. (Note: on collection pages, identity also lives in the sidebar.)
- `main-nav.tsx` currently `text-sm font-medium`, dynamic categories → restyle to fixed top-level items, 700 uppercase tracked.

### 5.3 Icon buttons + cart badge
- Right cluster, 4 icons, gap ~**22px**, order: **Search, Account, Cart (+badge), Language(Globe)**. lucide thin-line, stroke 1.5px, size 20–22px, `#232323`. Borderless, no background, 40×40 tap target.
- **Hover:** color → `#969696` or opacity 0.7 (transition 150–200ms). **Focus-visible:** 2px `#232323` outline offset 2px.
- `icon-button.tsx` currently `rounded-full bg-white border shadow-md hover:scale-110` → strip to `rounded-none` transparent borderless; keep a subtle color/opacity hover.
- **Cart badge:** small circle anchored top-right of cart icon, `translate(+8px,-8px)`. Fill `--color-badge #F5D9DC`, ~18px diameter, number `10px/600 #232323`, centered. Always visible (shows `0`). Wired to zustand count in `navbar-actions.tsx` (replace the black-pill buttons).

### 5.4 Search
- Trigger = magnifier icon (no inline input at rest; one must be **added** — currently absent).
- On click: full-width white slide-down strip under nav (or `@headlessui` Dialog). Input: 1px `#CFCFCF` bottom-border (or full border), height ~48px, radius 0, text 14px `#232323`, placeholder `#969696`. Close on ESC / outside click. Sharp corners.

### 5.5 Language switcher
- Globe icon → small dropdown menu listing **EN / RO / RU** (next-intl). Menu: white bg, 1px `#CFCFCF`, radius 0, faint `--shadow-overlay`. Items `12px/600 uppercase`, padding `10px 16px`. Active locale `#232323` bold, others `#969696`, row hover bg `#FAFAFA`. Right-aligned under icon.
- `language-switcher.tsx` currently native `<select>` → replace with this menu (keep functional locale switch).

### 5.6 Filter sidebar — CATEGORIES list (collection page)
- Left column ~**200px** wide, starts at content left edge. Header `CATEGORIES` `13–15px/700 uppercase tracking-[1px] #232323`, `mb-6`.
- List items `13–14px/600 uppercase #232323`, generous ~30px row height (gap ~14–16px). No bullets, no borders, single level, no counts/checkboxes/accordion.
- **Active** (e.g. DRESSES on its page): 1px underline (offset ~3px) `#000`. **Hover:** underline appears or color → `#969696`.
- Mobile: sidebar collapses into a **Filter** button (icon + label) left of the VIEW AS toggle; opens a drawer.
- Current `filter.tsx` only has Size/Color pills → add a categories list and restyle pills to a minimal tracked list.

### 5.7 Sort dropdown (SORT BY)
- Right side of toolbar. Eyebrow `SORT BY` `12px/700 uppercase tracking-[1px]` + control.
- Control: width ~150px, height ~44px, 1px `#CFCFCF`, radius 0, white bg, value `13px #232323` (e.g. "Date, new to old"), right chevron-down lucide 14px `#232323`, padding `0 14px`. **Hover/focus:** border → `#232323`.
- Options panel (`@headlessui Listbox`): white, 1px `#CFCFCF`, radius 0, `--shadow-overlay`, options 13px, hover row bg `#FAFAFA`, selected bold.
- Options: Date new→old, Date old→new, Price low→high, Price high→low, A–Z.

### 5.8 Grid-density toggle (VIEW AS) — desktop only
- Left of toolbar. Eyebrow `VIEW AS` + 4 icon buttons (1/2/3/4 columns), each ~22px square, gap ~6px, drawn as outlined rectangles (stroke 1.5px `#232323`). **Active** (default 3-col): enclosed in 1px `#232323` box / darker fill; inactive `#969696`. Sharp corners. Click sets grid columns. Hidden `<md`; mobile shows a 1-col/2-col switcher (two icons) instead.

### 5.9 Product card (+ hover)
**Anatomy.** No border/shadow/radius/background/padding. Three centered stacked blocks: image, name, price. Card width = grid column.
- Image: `aspect-[3/4]` (portrait), `object-cover`, on its own neutral backdrop; placeholder `#F4F0EB`. Two stacked `<Image fill>` for hover.
- Image→name **14px**; name→price **6px**. Name `product-name` (14/400 Title case, centered). Price `price` (14/400 centered, format `2,700.00 MDL`).
- `product-card.tsx` currently `p-3 bg-white border rounded-xl` square image → remove all chrome, switch to 3:4, center text.

**Hover (desktop).** Base image crossfades to second image (`opacity-0→100`, `transition-opacity duration-500 ease-out`) + subtle base `scale-100→scale-[1.03] duration-700`. Optional low-contrast `QUICK VIEW` strip fading in at image bottom (`bg-white/85`, `12px/700 uppercase tracking-[0.1em] #232323`, opacity 0→1 300ms). No translate/bounce. `motion-reduce:` disables both.

**Touch / a11y.** No hover dependency — whole card links to PDP; quick-view also keyboard-focusable; link has accessible name.

**Sale state.** Original `price--was` (`#6E6E6E` strikethrough) + `price--sale` (`#E95144` weight 500). Always pair color with strikethrough/label (never color alone).

### 5.10 Buttons — variants & sizes

Base: uppercase, `font-bold`, `tracking-[0.1em]`, radius 0, no shadow, `transition-colors duration-200 ease-out`. (`button.tsx` currently single `rounded-full` variant with a `cn()` template-literal merge bug — fix to pass `className` as a separate `cn()` arg, add variants.)

| Variant | Light bg | Hover | Disabled |
|---|---|---|---|
| Primary (solid) | `bg-#000 text-#fff`, `px-9 py-4` | invert: `bg-#fff text-#000 border border-#000` (or lighten to `#3a3a3a`) | `bg-#CFCFCF text-#fff` |
| Secondary (outline) | `bg-transparent border border-#232323 text-#232323` | fill `bg-#232323 text-#fff` | border `#CFCFCF` text `#CFCFCF` |
| Ghost / text | no border/bg, `text-#232323` | underline or color → `#969696` | opacity 0.5 |

| Size | Padding | Font |
|---|---|---|
| sm | `px-6 py-3` | 12px |
| md (default) | `px-9 py-4` | 12–13px |
| lg | `px-12 py-5` | 13px |

**On dark (hero/footer):** primary → `bg-#fff text-#000`; outline → `border-#fff text-#fff`, hover fills white.

### 5.11 Inputs / forms
- Full 1px `#CFCFCF` border (or bottom-border), radius 0, white bg, height ~48px, padding `0 16px`, text `14px #232323`, placeholder `#969696`.
- Label above: `12px/700 uppercase tracking-[1px] #232323`, `mb-2`.
- **Focus:** border `#232323` (1px, no glow), transition 150ms; keep a subtle `focus-visible` ring offset for a11y (don't remove it).
- **Error:** border + helper text `#E95144` 12px.
- Shared input mirrors the admin shadcn input but `radius-0`. Used in sign-in/up/checkout.

### 5.12 Breadcrumbs
- (Not on collection pages — sidebar + H1 instead.) On product pages: `12px #6E6E6E`, segments separated by ` / `, current segment `#232323`, link hover underline. Title/sentence case (lighter feel), no chevron icons. Minimal.

### 5.13 Page header + rule
- Page H1 at top of main area (right of sidebar): `20–24px/700 uppercase tracking-[1px] #232323` (use `#000` for emphasis). Directly below: full-width 1px `#CFCFCF` rule spanning **main content only** (not the sidebar), ~18px gap above / ~28px below before toolbar. This rule is the only divider on the page.

### 5.14 Pagination
- Prefer a centered **LOAD MORE** secondary outline button (uppercase 12px/700, radius 0) for short lists.
- Numbered fallback: centered row, links `13px/600 #232323`, gap ~10px, current underlined or boxed in 1px `#232323` (radius 0), inactive `#6E6E6E`, prev/next thin chevron icons.

### 5.15 Footer + "FOLLOW US ON INSTAGRAM"
- Sits inside container `max-w-[1170px]` (optional full-bleed top border 1px `#CFCFCF`). Large whitespace; top padding ~80–96px.
- **Instagram block:** centered heading `FOLLOW US ON INSTAGRAM` `13px/700 uppercase tracking-[1.5px] #232323`, flanked by short 1px `#CFCFCF` rules on mobile section labels. Below: centered grid of 4–6 square images (`object-cover`, tiny/no gaps, radius 0).
- **Link columns:** multi-column lists (Catalog, Info, Contact, Social), headings `13px/700 uppercase tracked`, items `12px/600 uppercase #232323`, hover `#969696`. Column gaps ~32–48px.
- **Bottom copyright row** ~64px tall, `12px #6E6E6E`.
- `footer.tsx` currently bare single line → expand to columns + IG block.

### 5.16 Toasts (react-hot-toast)
- White bg, 1px `#CFCFCF` border, `#232323` text, radius 2px (`--radius-sm`), no `rounded-full`. Success accent `#428445`, error `#E95144`. No shadow beyond a faint `--shadow-overlay`.

### 5.17 Modal / preview
- `ui/modal.tsx`: sharpen radius to 0, overlay `bg-black/50` (fix deprecated `bg-opacity-50`), panel white `--shadow-overlay`, retheme close icon-button (borderless). `preview-modal.tsx` renders Gallery + Info inside.

### 5.18 Currency (functional fix)
- `currency.tsx` currently hardcodes `en-US`/`USD`. Change to **MDL**, locale-aware (`ro-MD`/`ru`/`en`), format `2,700.00 MDL` (thousands comma, 2 decimals, space + uppercase `MDL`). Support sale styling (`price--was` / `price--sale`).

### 5.19 Storefront cleanups to bundle
1. Remove `console.log(category)` in `category/[categoryId]/page.tsx`. 2. Currency → MDL. 3. Fix Button `cn()` merge. 4. `bg-opacity-50` → `bg-black/50`. 5. Add sale-price support. 6. Add search affordance.

---

## 6. Component Specs — Admin (shadcn-mapped)

> Principle: change CSS-var values + structure, **never the shadcn class contract**.

### 6.1 App shell with sidebar nav
Introduce a two-pane shell in `(dashboard)/[storeId]/layout.tsx` (currently just `<Navbar/> + children`).

- **Left sidebar:** `w-60 border-r bg-muted/40 sticky top-0 h-screen`. Top→bottom:
  1. Brand block: `OLESIA / FRIENT` wordmark, two-line uppercase `tracking-[0.15em] ~13px/700 text-foreground`.
  2. `StoreSwitcher` (popover + cmdk).
  3. Grouped vertical nav:
     - **Store:** Overview
     - **Catalog:** Products, Categories, Sizes, Colors
     - **Content:** Billboards
     - **Sales:** Orders
     - pinned bottom: **Settings**
- Each item: lucide icon + label, `h-9 px-3 rounded-md`. Idle `text-muted-foreground hover:bg-accent`; **active** `bg-secondary text-foreground font-medium` + subtle left accent bar.
- **Mobile:** sidebar collapses into a `Sheet`/`Dialog` triggered by a header hamburger. The old horizontal `MainNav` is retired (or reused only as the mobile sheet body) — it crammed 8 routes in one row.

### 6.2 Topbar
Slim header `h-14 border-b`, holds page breadcrumb (left) + right cluster: Language, Theme toggle, Account menu. Replaces the current `h-16` all-in-one bar.

### 6.3 Cards (`ui/card.tsx`)
- `shadow-none`, rely on `border`, keep `rounded-md`. Inner padding `p-5` (down from p-6).
- Overview stat cards: `CardTitle` → `text-sm uppercase tracking-wide text-muted-foreground`; value `text-2xl font-semibold`.
- Overview grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (fix the fixed `grid-cols-3` + stray `col-span-4`).

### 6.4 Data tables (`ui/data-table.tsx`)
Upgrade without changing `DataTable<TData,TValue>` props (`columns/data/searchKey`):
- Search `Input` with left search icon (`max-w-sm`).
- Add `getSortedRowModel` + sortable header buttons (`ArrowUpDown` icon).
- Column-visibility `DropdownMenu` ("Columns", `getIsVisible/toggleVisibility`).
- Result count + "Page X of Y", "N row(s)".
- Header row `bg-muted/50`, `text-xs uppercase tracking-wide text-muted-foreground`, row height `h-12`.
- Replace bare "No results." with centered **EmptyState** (icon + title + muted hint).

### 6.5 Forms (`product-form.tsx` & others)
- Group fields into `Card` sections with section labels; responsive grid `grid-cols-1 md:grid-cols-2/3` for short fields.
- `FormLabel` → `text-xs uppercase tracking-wide text-muted-foreground`.
- Inline `FormMessage` errors in destructive coral.
- Long forms: sticky bottom action bar (Save/Cancel). Spacing: `space-y-8` sections, `gap-6` within.

### 6.6 Buttons (`ui/button.tsx`)
- Keep stock cva contract. The `--primary: pure black` retheme already makes default buttons editorial. For brand CTAs add `uppercase text-xs tracking-wide` at the call site (e.g. "ADD NEW") rather than altering cva. Optionally add `size="xs"` (`h-8`) for table row actions.

### 6.7 Badges
- `Badge` variants map to status: default (neutral `secondary`), `destructive` (coral, e.g. "Unpaid"/"Out of stock"), and a new **success** style (`bg-success/10 text-success border-success/20`) for "Paid"/"In stock". Uppercase `text-[10px] tracking-wide`.

### 6.8 Dialogs / modals (`ui/dialog.tsx`, `ui/modal.tsx`)
- Keep radius at `--radius` (0.375rem). Overlay `bg-black/50`. Used for confirm-delete (`AlertModal`) and image-upload flows. Destructive confirmations use `destructive` button + clear title.

### 6.9 Charts (recharts on Overview)
- Neutralize palette: bars/line in `foreground` / `primary`; grid lines in `border`; muted axis labels `text-muted-foreground text-xs`. No gradients. One accent (coral) only for highlighting a key series if needed. Tooltip styled as a card (`border`, `bg-popover`, `shadow-none`/faint).

### 6.10 Empty states (reusable `EmptyState`)
- Icon in a muted `rounded-full` circle + title + one-line description + primary CTA (e.g. "Add your first product"). Use in each `*Client` when `data.length === 0` (products, categories, orders) instead of an empty table.

### 6.11 Dark mode
- `ThemeProvider attribute="class" defaultTheme="light" enableSystem`.
- Tokens shift slate → **true neutral charcoal** (values in §2.5 `.dark`). Verify coral `--destructive` and new `--success` legibility (lightness bumped ~+8% in dark).

---

## 7. Page-Level Layout Blueprints

### 7.1 Storefront — Home
```
[ Sticky white navbar — centered logo + nav + icons ]
[ Full-bleed hero  100vw × clamp(520px,88vh,900px) — no padding, optional overlay text ]
( ~80px gap )
[ Section: GET INSPIRED — centered eyebrow flanked by short rules ]
[ Editorial blocks: 2-up mobile / 3-up desktop, frameless images ]
( ~96–120px section rhythm )
[ Featured products: ProductList — uppercase tracked title + rule, 3-col grid big gaps ]
( ~96px )
[ FOLLOW US ON INSTAGRAM — centered heading + 4–6 square image grid ]
[ Footer — link columns + copyright, container max-w-[1170px] ]
```

### 7.2 Storefront — Collection / Category (with filters)
```
[ Navbar ]
Container max-w-[1170px]:
  ┌ Sidebar (~200px) ───────┬ Main content ───────────────────────────┐
  │ CATEGORIES (header)     │ Page title (DRESSES)  ← uppercase 700    │
  │  SHOES                  │ ───────────── 1px #CFCFCF rule ──────────│
  │  OUTERWEAR              │ [VIEW AS ▣▣▣▣]        [SORT BY ▾]  toolbar│
  │  DRESSES (underlined)   │ ──────────────────────────────────────── │
  │  …                      │ Product grid: 3-col, gap-x-14 gap-y-16   │
  │  (Size/Color filters    │   frameless 3:4 cards, centered name+price│
  │   below, minimal list)  │                                          │
  └─────────────────────────┴──────────────────────────────────────────┘
Mobile: sidebar → [Filter] button; toolbar sticky; grid grid-cols-2 gap-x-4 gap-y-8.
[ Footer ]
```
Implements across `category/[categoryId]/page.tsx` (was `lg:grid-cols-5` Billboard+Size/Color only) + `product-list.tsx`. Toolbar (VIEW AS / SORT BY) and categories list are new.

### 7.3 Storefront — Product detail
```
[ Navbar ]
[ Breadcrumb: Home / Dresses / 33575 Dress   (12px muted) ]
Container, 2-col on desktop:
  ┌ Gallery (left ~58%) ─────────┬ Info (right ~42%) ──────────────┐
  │ main image (3:4, frameless)  │ Name  (uppercase tracked OR     │
  │ thumbnail strip below:       │   editorial; per scale)          │
  │  square, 1px #CFCFCF,         │ Price 2,700.00 MDL              │
  │  active border #232323        │   (sale → was + coral)          │
  │                              │ ── 1px #CFCFCF rule ──           │
  │                              │ Size row · Color swatches        │
  │                              │   (swatch border #CFCFCF)        │
  │                              │ [ ADD TO CART ] sharp primary    │
  │                              │ Description (body 14/1.6)        │
  └──────────────────────────────┴──────────────────────────────────┘
[ Related: ProductList ]  [ Footer ]
```
`info.tsx`: `h1` uppercase/tracked, `hr` → `#CFCFCF`, sale support, sharp CTA, swatch border `#CFCFCF`.

### 7.4 Storefront — Cart
```
[ Navbar ]
Page title "CART" + rule.
2-col desktop:
  ┌ Cart items (left) ───────────────┬ Summary (right) ──────────────┐
  │ each row: thumb 3:4, name (Title),│ Surface #F8F8F8, radius 0     │
  │ price, qty, remove (icon-button)  │ Subtotal / Shipping rows      │
  │ rows separated by 1px #CFCFCF     │ TOTAL  (ink #232323)          │
  │                                   │ [ CHECKOUT ] sharp primary    │
  └───────────────────────────────────┴───────────────────────────────┘
[ Footer ]
```
`summary.tsx`: `bg-gray-50` → `#F8F8F8`, uppercase tracked headings, `#CFCFCF` dividers, sharp CTA.

### 7.5 Storefront — Checkout
```
[ Navbar (minimal) ]
Page title "CHECKOUT" + rule.
2-col:
  ┌ Form (left) ─────────────────────┬ Order summary (right) ────────┐
  │ Sections w/ uppercase labels:    │ Surface #F8F8F8               │
  │  CONTACT / SHIPPING / PAYMENT     │ line items + totals           │
  │  inputs: 1px #CFCFCF, radius 0,   │ [ PLACE ORDER ] primary       │
  │  label 12/700 uppercase, focus #232323                            │
  └───────────────────────────────────┴───────────────────────────────┘
```
(Checkout is simulated — no Stripe.) Inputs use the shared sharp input; errors coral.

### 7.6 Storefront — Auth (sign-in / sign-up)
```
[ Navbar ]
Centered narrow column (max-w-[400px], mx-auto, py-24):
  Title "SIGN IN" / "CREATE ACCOUNT"  ← uppercase tracked
  ── rule ──
  Labeled inputs (sharp, #CFCFCF)
  [ CONTINUE ]  full-width primary, radius 0
  Helper link: "Don't have an account?"  (12px #6E6E6E, link underline)
```
`sign-in/page.tsx`: `rounded-md` → radius 0, tokenized colors, uppercase tracked title.

### 7.7 Admin — Dashboard (Overview)
```
[ Sidebar shell ][ Topbar: breadcrumb + lang/theme/account ]
Main (p-6, space-y-6):
  Heading "Overview" (text-2xl uppercase tracking) + Separator
  Stat cards: grid-cols-1 sm:2 lg:3 — title (sm uppercase muted), value (2xl)
  Revenue chart Card (recharts, neutral palette, shadow-none border)
```

### 7.8 Admin — List pages (Products / Categories / Orders …)
```
PageHeader: Heading + description + right action [ ADD NEW ] (uppercase) + Separator
DataTable: search w/ icon, sortable headers (uppercase muted), Columns toggle,
           rows h-12, count + "Page X of Y"
Empty: EmptyState (icon circle + "Add your first product" CTA) when data.length===0
```

### 7.9 Admin — Entity edit forms
```
PageHeader: Heading (entity name / "New product") + [ Delete ] (destructive) + Separator
Form: Card sections (e.g. "Details", "Pricing", "Media", "Options")
      grid-cols-1 md:grid-cols-2/3 for short fields
      FormLabel uppercase muted; FormMessage coral
      Sticky bottom bar: [ Cancel ] ghost · [ Save changes ] primary
ImageUpload: square tiles, 1px border, radius-md, remove on hover
```

---

## 8. Implementation Order (foundational first)

1. **Storefront** `app/globals.css` (add `@theme` tokens + utility classes), `app/[locale]/layout.tsx` (Montserrat with cyrillic).
2. **Admin** `app/globals.css` (retheme HSL values + Montserrat var), `ThemeProvider defaultTheme="light"`.
3. Storefront chrome: `navbar` → `main-nav` → `navbar-actions` → `language-switcher` → `footer`.
4. Core UI: `button`, `icon-button`, `currency` (MDL fix), `product-card`, `product-list`, `modal`.
5. Pages: home → category (sidebar + toolbar) → product → cart → checkout → auth.
6. Admin shell (sidebar + topbar) → data-table upgrade → cards/forms/empty-states → badges/charts → dark-mode verification.
7. Bundle cleanups (§5.19) and run an a11y pass: contrast (use `--color-muted-strong` for info text), `focus-visible` outlines intact, hamburger `aria-label`/`aria-expanded`, drawer `role="dialog"` + focus trap, `prefers-reduced-motion` honored.

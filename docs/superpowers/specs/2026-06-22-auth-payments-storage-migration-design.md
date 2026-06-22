# Migration: Clerk → Better Auth, Remove Stripe, Cloudinary → MinIO

**Date:** 2026-06-22
**Repo:** shop-olesia-frient (admin CMS on :3001, store on :3002, shared Postgres via Prisma)

## Goals

1. Replace Clerk with **Better Auth** (email + password) — fully, in both apps.
2. Remove **Stripe** entirely; replace with a simulated checkout (fake payment form that marks orders paid).
3. Replace **Cloudinary** with **MinIO** (self-hosted, S3-compatible) for image storage.

## Decisions (confirmed with user)

- Auth methods: **email + password only**.
- Auth scope: admin (staff) **and** store (customers).
- User pools: **separate** — admin staff vs store customers; each app its own Better Auth instance + tables, same Postgres DB.
- Store checkout: **login required**; **fake checkout page with name/address/phone form**.
- Storage: **MinIO**, self-hosted via Docker, presigned-URL uploads, public-read bucket for product image display.

---

## Section 1 — Database & Prisma

- **Admin `schema.prisma`** gains Better Auth staff tables: `User`, `Session`, `Account` (password hash), `Verification`.
- **Store** gets its own Prisma setup (`store/lib/prismadb.ts` + `store/prisma/schema.prisma`) pointed at the **same** `DATABASE_URL`, owning only **customer** tables, prefixed to avoid collision: `Customer`, `CustomerSession`, `CustomerAccount`, `CustomerVerification`.
- **`Order`** gains `customerId String?` (plain string, no FK — `relationMode = "prisma"`; customer tables live in store's schema).
- Repo uses `prisma db push` (no migrations dir). Each app pushes the tables it owns.

## Section 2 — Auth (Clerk → Better Auth)

**Shared per app:** `lib/auth.ts` (server instance, Prisma adapter, emailAndPassword enabled), `lib/auth-client.ts` (signIn/signUp/signOut/useSession), `app/api/auth/[...all]/route.ts` (handler).

**Admin:**
- `middleware.ts`: replace `clerkMiddleware()` with session-cookie check → redirect to `/sign-in`.
- `app/layout.tsx`: drop `<ClerkProvider>`.
- Replace `const { userId } = await auth()` (from `@clerk/nextjs/server`) with a Better Auth server session helper returning `session.user.id` in: `(root)/layout.tsx`, `(dashboard)/[storeId]/layout.tsx`, `(dashboard)/[storeId]/(routes)/settings/page.tsx`, `components/navbar.tsx`, and all **13 API routes**. `userId` semantics unchanged → `Store.userId` ownership logic untouched.
- `navbar.tsx`: replace `<UserButton>` with custom account menu (email + sign-out).
- Sign-in/sign-up pages: replace Clerk `<SignIn>`/`<SignUp>` with email+password forms wired to `auth-client`.
- Remove `@clerk/nextjs` dep.

**Store (mirrors, customer instance):**
- `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`.
- New `/sign-in`, `/sign-up` pages.
- Navbar gains account menu / sign-in link.
- Cart "Checkout" gated: no customer session → redirect to `/sign-in`.

Admin (:3001) and store (:3002) are different origins → independent cookies (desired for separate pools).

## Section 3 — Remove Stripe & simulated checkout

**Delete:** `admin/lib/stripe.ts`, `admin/app/api/webhook/route.ts`, `stripe` dep, `STRIPE_*` env vars.

**Rework `admin/app/api/[storeId]/checkout/route.ts`** (keep CORS): accept `productIds`, `customerId`, `name`, `address`, `phone`; in one step create `Order` (`isPaid: true`, `address`, `phone`, `customerId`), archive purchased products (`isArchived: true` — old webhook behavior), return `{ success: true }`.

**Store flow:**
1. Cart → "Checkout" (login-gated) → store `/checkout` page.
2. `/checkout` renders fake payment form (name/address/phone, prefilled where possible) + order summary.
3. Submit → POST admin checkout API with productIds + customerId + fields.
4. Success → redirect `/cart?success=1`, clear cart, toast. Existing `success`/`canceled` param handling in `summary.tsx` stays.

**Security note (acceptable for simulation):** admin checkout trusts `customerId` in the payload; no cross-origin session verification. When integrating a real payment provider, add a verified token/shared secret between apps. Noted in code.

## Section 4 — Cloudinary → MinIO

- Root **`docker-compose.yml`**: MinIO + bucket `shop-images` (public-read for image display).
- Admin **`app/api/upload/route.ts`**: presigned PUT URL via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- **`image-upload.tsx`**: file input → request presigned URL → PUT file to MinIO → save public object URL via `onChange`. Remove `CldUploadWidget`/`next-cloudinary`.
- Both apps `next.config.js`: add MinIO host to `images.remotePatterns` (replace `domains: ['res.cloudinary.com']`).
- Env: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `NEXT_PUBLIC_S3_PUBLIC_URL`.

---

## Env var summary

**Admin `.env`:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (http://localhost:3001), `FRONTEND_STORE_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `NEXT_PUBLIC_S3_PUBLIC_URL`.
Removed: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, Clerk keys.

**Store `.env`:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (http://localhost:3002), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_S3_PUBLIC_URL`.

## Out of scope

- Real payment provider integration.
- Password reset / email verification flows (email provider not configured).
- Migrating existing Clerk users (none in DB; fresh start).

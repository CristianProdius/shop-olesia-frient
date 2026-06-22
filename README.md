# E-Commerce (Code With Antonio — customized)

Full-stack e-commerce with a separate admin/CMS and storefront.

- **`admin/`** (port 3001) — dashboard / CMS + backend API
- **`store/`** (port 3002) — customer-facing storefront

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, Prisma
→ PostgreSQL, **Better Auth** (email + password), **MinIO** (S3-compatible image
storage). Payments are **simulated** (no real provider integrated yet).

## Architecture notes

- **Auth:** Better Auth, two **separate** account pools — admin staff and store
  customers — each its own instance and tables in the shared Postgres DB.
  Distinct cookie prefixes (`admin` / `store`) keep sessions isolated on localhost.
- **Database ownership:** the **admin** Prisma schema is canonical and owns
  `prisma db push` (it includes the `Customer*` auth tables too). The store only
  runs `prisma generate` — never `db push`.
- **Payments:** the store's `/checkout` page is a simulated payment form
  (name/address/phone) that calls the admin checkout API, which creates the order,
  marks it paid, and archives the products.
- **Storage:** product images are uploaded to MinIO via presigned URLs.

## Setup

### 1. Infrastructure

```bash
# From repo root — start MinIO (creates the public-read `shop-images` bucket)
docker compose up -d
```

You also need a PostgreSQL database reachable via `DATABASE_URL`.

### 2. Environment

Copy the examples and fill them in:

```bash
cp admin/.env.example admin/.env
cp store/.env.example store/.env
# generate secrets: openssl rand -base64 32
```

In `store/.env`, set `NEXT_PUBLIC_API_URL` to `http://localhost:3001/api/<storeId>`
once you've created a store (step 4).

### 3. Install + push schema

```bash
cd admin && npm install && npx prisma db push   # admin owns the schema
cd ../store && npm install                       # store only generates its client
```

### 4. Run

```bash
cd admin && npm run dev   # http://localhost:3001
cd store && npm run dev   # http://localhost:3002
```

First run: sign up on the admin to create a staff account, create a store, copy its
id into `store/.env` `NEXT_PUBLIC_API_URL`, then sign up as a customer on the store.

## Migrating a real payment provider later

The admin checkout API currently trusts the `customerId` sent by the store and marks
orders paid immediately (simulation). When integrating a real provider, verify a
signed token / shared secret between the apps and gate `isPaid` on a real payment
confirmation. See `admin/app/api/[storeId]/checkout/route.ts`.

# Bloom Beauty — Web Edition

A full-stack cosmetics & beauty storefront built with **Next.js 15, TypeScript, and MongoDB**. It's the web rebuild of a React Native/Expo portfolio project of the same store concept — same core engineering demonstration, different platform and the judgment calls that come with it.

Built with [Claude](https://claude.com/claude-code).

## Overview

Bloom Beauty is a small e-commerce demo: browse products by category or search, add to cart, check out, and view order history. The centerpiece of the project isn't the UI — it's the checkout endpoint, which is built to guarantee **exactly one order gets created even if the same checkout request is submitted twice** (a double-tap, a retried request after a dropped response, a flaky connection). That guarantee is verified end-to-end, not just assumed.

## Features

- Email/password auth with an httpOnly-cookie JWT session (no token ever touches client JS)
- Product browsing with server-rendered pages (search + category filtering via URL params, no loading spinner on first paint)
- Cart with optimistic updates (quantity changes and removals feel instant, roll back automatically on a failed request)
- Checkout with manual card entry (Luhn + expiry validation client-side; only the last 4 digits ever reach the server)
- **Idempotent order creation** — the three-layer guard described below
- Order history and detail pages showing an immutable price snapshot from the moment of purchase

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Database | MongoDB via Mongoose |
| Server state (client) | TanStack React Query |
| Initial data fetching | React Server Components |
| Auth | JWT in an httpOnly cookie, bcrypt-hashed passwords |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |

## Architecture

### Server Components + React Query, not just one

A product page's first render has no interactivity to react to — a Server Component fetching straight from MongoDB and streaming HTML is strictly better than a client-side fetch-then-render waterfall. But "add to cart," "update quantity," category filtering are genuinely interactive and need optimistic updates and cache invalidation — that's what React Query is for. `/shop`, `/products/[id]`, `/orders`, and `/orders/[id]` are Server Components; `/cart`, `/checkout`, `/login`, and `/register` are Client Components, and that split is deliberate rather than defaulting everything to client-side rendering.

### No client-side auth store

The mobile version of this project kept the session token in a Zustand store persisted to `expo-secure-store`, because it had to be read synchronously at launch on a device. On the web, the session lives in an httpOnly cookie the *server* reads directly — a Server Component or Route Handler just checks it, so there's no client store to keep in sync.

### MongoDB data modeling (not a 1:1 port of a relational schema)

- **CartItem** is its own collection (not embedded in `User`), with a compound unique index on `{ userId, productId }` — one line per product per user, so "add to cart" can upsert-by-key instead of scanning for an existing line first.
- **Order.items** is embedded as a sub-document array, not a separate collection. Order line items are always fetched together with the order and never queried independently — the textbook case for embedding instead of a join.
- **Order.idempotencyKey** has a unique index. This is the actual mechanism the checkout guarantee is built on (see below).

## Folder structure

```
cosmetics-store-web/
├── docker-compose.yml       # local MongoDB replica set (optional — see "Running locally")
├── src/
│   ├── app/
│   │   ├── shop/                  browse: SSR product grid, search + category filter
│   │   ├── products/[id]/         product detail (Server Component)
│   │   ├── cart/                  optimistic client-side mutations
│   │   ├── checkout/              shipping/card form, idempotency guard
│   │   ├── orders/                order history + detail
│   │   ├── login/, register/
│   │   └── api/
│   │       ├── auth/{register,login,logout,me}/route.ts
│   │       ├── products/route.ts, products/[id]/route.ts, categories/route.ts
│   │       ├── cart/route.ts, cart/items/[id]/route.ts
│   │       └── orders/route.ts, orders/[id]/route.ts
│   ├── components/          shared presentational components
│   ├── features/            feature-scoped React Query hooks + Zod schemas
│   ├── lib/                 db connection, auth, pricing, shared query helpers
│   ├── models/              Mongoose schemas: User, Product, CartItem, Order
│   └── scripts/seed.ts
```

## API overview

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | sets the session cookie |
| POST | `/api/auth/logout` | clears it |
| GET | `/api/auth/me` | current session user |
| GET | `/api/products` | `?search=&category=&page=&limit=` |
| GET | `/api/products/:id`, `/api/categories` | |
| GET/POST | `/api/cart` | |
| PATCH/DELETE | `/api/cart/items/:id` | |
| POST | `/api/orders` | the idempotent checkout endpoint |
| GET | `/api/orders`, `/api/orders/:id` | order history / detail |

## Auth flow

Register/login hash the password with bcrypt, sign a JWT (`{ userId }`, 7-day expiry — an accepted MVP shortcut, no refresh rotation), and set it as an httpOnly, `sameSite: lax` cookie. `middleware.ts` does a fast, presence-only check to redirect unauthenticated requests off `/cart`, `/checkout`, and `/orders` (full verification needs Node's `crypto`, unavailable in the Edge runtime middleware runs in by default); `requireUser()` inside each Route Handler / Server Component does the real verification and is the actual source of truth.

## Checkout / idempotency flow — the centerpiece

Three layers, each catching what the one before it can't:

1. **UI** — the Place Order button disables synchronously on submit, before any request goes out.
2. **Client** — one `Idempotency-Key` (a UUID) is generated once per checkout attempt and reused on every retry within that attempt, rather than a fresh key per request.
3. **Server — the layer that actually holds under a race.** `POST /api/orders` first checks for an existing order with that key and replays it if found. Otherwise it opens a MongoDB transaction that re-prices every cart line from the current `Product.priceCents` (never trusts a client-supplied price), checks stock, creates the order, decrements stock, and clears the cart — all committing or rolling back together. If two identical requests somehow both reach the transaction at once, the loser hits the unique index on `idempotencyKey` (Mongo error 11000) instead of the earlier check; that case is handled explicitly by fetching and returning the winning order rather than surfacing a 500 for what is actually a successful order.

This is why MongoDB has to run as a replica set (even a single-node one) for local dev — plain standalone MongoDB can't run multi-document transactions.

## Why no card-scan feature (unlike the mobile version)

The mobile app's mocked camera-based card scanner made sense as a demonstration of a mobile-only device API. On the web there's no equivalent to demonstrate, so checkout here is manual entry only: card number (Luhn-validated) and expiry (checked against the current date), both validated client-side, with only the last 4 digits ever sent to the server — same "no real card data server-side" rule, just without the scan flow.

## What's intentionally out of scope

Same discipline as the mobile project — this is meant to demonstrate judgment, not chase 100% feature coverage. In order of what would get cut first if time ran short (this is the actual order it was cut in):

- **Storybook** — the architecture plan called for a component catalog; it didn't make the cut here.
- **Automated tests** — no Jest/RTL suite yet. The one test that would matter most if added is the same one described above: submit one `Idempotency-Key` twice, assert exactly one `Order` document exists.
- **Polish pass** — no per-route `loading.tsx`/`error.tsx`, just top-level handling.

None of these affect the checkout guarantee itself, which was verified manually (see below) rather than with an automated test.

Also out of scope by design (same as the mobile version): real payment processing, real card storage, an admin dashboard, reviews, notifications, i18n.

## Running locally

### 1. Database — either works

**Option A — MongoDB Atlas (recommended, zero local setup):** create a free M0 cluster, add a database user, allow your IP (or `0.0.0.0/0` for a demo), and grab the `mongodb+srv://...` connection string from Atlas's "Connect → Drivers" flow. Atlas is already a replica set, so transactions work with no extra steps.

**Option B — local Docker:**
```
docker compose up -d
docker exec bloom-beauty-mongo mongosh --eval "rs.initiate()"   # once
```

### 2. Environment

```
cp .env.example .env
```
Fill in `MONGODB_URI` (from step 1) and `JWT_SECRET` (`openssl rand -base64 32`).

### 3. Install, seed, run

```
npm install
npm run seed   # 19 products across 4 categories + a demo user (demo@bloombeauty.dev / password123)
npm run dev
```

Then open `http://localhost:3000`.

### Verifying the idempotency guarantee manually

```
curl -s -b cookies.txt -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" -H "Idempotency-Key: test-key-123" \
  -d '{"shippingInfo":{...},"cardLast4":"4242"}'
# run the exact same request again with the same Idempotency-Key —
# it should return the SAME order both times, and GET /api/orders
# should show exactly one order, not two.
```

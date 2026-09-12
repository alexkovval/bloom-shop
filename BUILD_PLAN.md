# Bloom Beauty — Web Edition — Build Plan

## Before phase 1: the two open questions from ARCHITECTURE_PLAN.md §6, resolved with defaults

You said "начинай" without picking, so here's what this plan assumes — flag either one if you'd rather go the other way, it's a small change either way:

1. **Hosting** — build and document for local dev first; Vercel is the natural deploy target for Next.js and gets a short "how to deploy" note in the README at the end, not its own phase. Not designing around any Vercel-specific constraints (e.g. serverless function timeouts) unless you want to actually deploy it there.
2. **Playwright e2e** — cut for now, same "focused, not exhaustive" call the mobile app made. The test suite is component tests (Jest + RTL) plus the same centerpiece as before: a test that proves the idempotent-checkout guard actually holds. Easy to add a Playwright checkout-flow test later if you want one.

## Repo layout

Single Next.js app, per the confirmed architecture:
```
cosmetics-store-web/
├── ARCHITECTURE_PLAN.md   (already exists)
├── BUILD_PLAN.md          (this file)
└── (everything else, scaffolded in Phase 1)
```

---

## Phase 1 — Scaffold + MongoDB + models + seed

- `npx create-next-app@latest` — TypeScript, App Router, Tailwind, ESLint, `src/` directory.
- Install: `mongoose`, `bcrypt`, `jsonwebtoken`, `zod`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`; dev deps for testing (Phase 8) and Storybook (Phase 4) come in when those phases start, not all up front.
- `docker-compose.yml`: MongoDB as a **single-node replica set** (`mongod --replSet rs0`), since Phase 5's transaction needs it — this is the one infra step Postgres didn't require, so it's worth getting right now rather than discovering it's missing when checkout is built. A one-time `docker exec ... mongosh --eval "rs.initiate()"` after first start.
- `src/models/`: `User`, `Product` (with a text index on `name`/`description`), `CartItem` (compound unique index on `{ userId, productId }`), `Order` (unique index on `idempotencyKey`, embedded `items` sub-documents).
- `src/lib/db.ts`: cached Mongoose connection (the standard Next.js dev-mode pattern — without caching, hot reload reconnects on every file save).
- Seed script (`src/scripts/seed.ts`, run via `tsx` or `ts-node`): ~15-20 products across Skincare/Makeup/Haircare/Fragrance + one demo user. Product photos go straight in `public/images/` and are referenced as `/images/skincare.jpg` etc. — Next.js serves `public/` automatically, so (unlike the mobile backend) there's no need to write a static-file route by hand.

**Verify:** `docker compose up -d`, run the seed script, confirm documents exist (`mongosh` or a quick script). `npm run dev` boots with no errors.

## Phase 2 — Auth

- `src/lib/auth.ts`: `signToken`/`verifyToken` (JWT, 7-day expiry — same accepted MVP shortcut as mobile, no refresh rotation), cookie helpers (`httpOnly`, `secure` in production, `sameSite: "lax"`), `requireUser()` for Route Handlers and Server Components alike.
- `src/app/api/auth/register/route.ts`, `login/route.ts`, `me/route.ts`.
- `src/app/(auth)/login/page.tsx`, `register/page.tsx` — Client Components (forms need interactivity), React Hook Form + Zod.
- `src/middleware.ts`: redirects unauthenticated requests away from `/cart`, `/checkout`, `/orders/*` to `/login` — this is the web equivalent of the mobile app's `RootNavigator` switching stacks based on session state.

**Verify:** register → login → refresh the page and confirm the session persists (cookie survives) → visiting `/cart` while logged out redirects to `/login`.

## Phase 3 — Products: Route Handlers + SSR browsing

- `src/app/api/products/route.ts` (`?search=&category=&page=&limit=`), `products/[id]/route.ts`, `categories/route.ts` — kept even though the pages below fetch directly via Mongoose, because these are what Phase 4's client-side interactions (re-filtering without a full page reload) call.
- `src/app/shop/page.tsx` — **Server Component**, reads `search`/`category` from `searchParams`, queries MongoDB directly, renders the grid server-side. No loading spinner on first load — that's the point.
- `src/app/products/[id]/page.tsx` — Server Component, same direct-fetch pattern.
- `src/components/`: `ProductCard`, `CategoryChipRow`, `SearchBar`, `Button`, `TextField` — plain presentational components, not yet wired to Storybook (that's Phase 4).

**Verify:** View Source on `/shop?category=Makeup` shows the actual product HTML already present (proves it's server-rendered, not client-fetched). Search and category filtering work via URL params.

## Phase 4 — Cart + Storybook

- `src/app/api/cart/route.ts`, `cart/items/[id]/route.ts`.
- `src/features/cart/`: React Query hooks (`useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveCartItem`) with the same optimistic-update-then-rollback pattern as the mobile app.
- `src/app/cart/page.tsx` — Client Component (genuinely interactive: quantity steppers, remove, live subtotal).
- Storybook: `npx storybook@latest init`. Stories for every component built so far (`Button`, `Chip`, `ProductCard`, `TextField`, `CartLineItem`) — starting Storybook now, not at the end, so every component built from here on gets its story alongside it instead of a scramble to backfill later.

**Verify:** add/update/remove reflects immediately and matches a fresh page reload (no optimistic-update drift). `npm run storybook` shows every component in isolation with realistic props.

## Phase 5 — Checkout + idempotency (the centerpiece)

- `src/lib/pricing.ts` — same flat 8% tax / $5 shipping math as the mobile backend, ported as-is.
- `src/app/api/orders/route.ts`: reads the `Idempotency-Key` header, checks for an existing order with that key (replay → return it, 200), otherwise runs the whole re-price → create-order → clear-cart sequence inside **one Mongoose transaction** (`session.withTransaction`).
- `src/features/checkout/validation/`: shipping schema + card schema (Luhn check as a real tested function, expiry-in-future check) — manual entry only, per your call to drop the scan feature.
- `src/app/checkout/page.tsx` — Client Component: one idempotency key generated via `useRef` on mount and reused for retries, Place Order button disables synchronously on submit (layer 1 of the guard), mutation with no auto-retry.
- `src/app/orders/[id]/confirmation/page.tsx` (or a query param on the order page) — shows the order returned directly from the create-order response, no extra fetch needed.

**Verify:** the one test that matters most — submit the same idempotency key twice (a script or an early Jest test, whichever is faster to reach) and confirm exactly one `Order` document exists, second response replays the first. Also: airplane-mode-style network failure mid-checkout, then retry, still only one order.

## Phase 6 — Order history + detail

- `src/app/api/orders/route.ts` (GET list), `orders/[id]/route.ts` (GET detail) — list/detail reads.
- `src/app/orders/page.tsx`, `orders/[id]/page.tsx` — Server Components (pure data display, no interactivity needed, so no reason to ship client JS for these).

**Verify:** an order placed in Phase 5 shows correctly in both; change the underlying product's price afterward and confirm the historical order is unaffected (proves the snapshot).

## Phase 7 — Polish pass

- `loading.tsx`/`error.tsx` per route segment (`shop/`, `products/[id]/`, `orders/`) — the App Router's built-in convention for this, used consistently instead of ad hoc spinners.
- Empty states: no search results, empty cart, no orders yet — same `EmptyState` component pattern as mobile, now as a shared React component with its own Storybook story.
- Sweep every page against the same checklist the mobile app used: loading/error/empty/success all present, no bare unstyled fetch failures.

**Verify:** manual pass through empty-DB and populated-DB states; throttle/kill the DB connection briefly to confirm error states actually show instead of an unhandled Next.js error page.

## Phase 8 — Tests

- Jest + React Testing Library: component tests for `EmptyState`, `ProductCard`, the Luhn function, the checkout Zod schema — mirroring exactly which tests the mobile app prioritized.
- Jest against Route Handlers: cart stock/nonexistent-product rejection, and **the duplicate-order test** (same shape as `orders.duplicate.test.ts` — submit one idempotency key twice, assert one document, assert the cart was cleared once).

**Verify:** `npm test` green.

## Phase 9 — Storybook completion + README

- Finish any remaining component stories.
- `README.md`: overview → features → stack → architecture → project structure → API overview → auth flow → cart/order architecture → checkout/idempotency flow (the main event) → why no card-scan this time → key technical decisions (Server Components + React Query split, Mongo transaction requirement, httpOnly cookie auth) → challenges & solutions → how to run (incl. the replica-set init step) → how to run Storybook → screenshots.

**Verify:** fresh read-through against the running app; every claimed feature is demoable; `npm run build` succeeds (catches the kind of Server/Client Component boundary mistakes that only show up at build time).

---

## Notes on scope flex

If time runs short, cut in this order: Storybook coverage beyond the core components (Button/ProductCard/Chip/TextField) → the polish pass's `loading.tsx`/`error.tsx` granularity (fall back to a single top-level error boundary) → the mobile app's own precedent still applies here too: if only one test survives, it's the duplicate-order one, because that's the one that actually proves the thing this whole project is about.

## Verification summary (end-to-end)

1. `npm run dev` + `npm test` green, `npm run build` succeeds, seed data present.
2. Full user journey works locally: register → browse (SSR, search/filter) → add to cart → checkout (including a deliberate double-submit test) → see the order in history.
3. Duplicate-order guard re-verified directly: fire the same `Idempotency-Key` twice and confirm exactly one row in MongoDB.
4. `npm run storybook` shows every shared component.
5. `README.md` accurately describes the shipped app.

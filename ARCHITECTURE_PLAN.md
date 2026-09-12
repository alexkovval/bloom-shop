# Bloom Beauty — Web Edition — Architecture Plan

## 0. What this is

The same cosmetics/beauty-store MVP already built as a React Native app (`~/proj/react-native/cosmetics-app`), rebuilt as a web application on a different stack — **Next.js + Node + MongoDB**, with **Storybook** and a **test suite**. Same product domain, same core engineering demonstration (idempotent checkout above all), different platform and the judgment calls that come with it.

This is a plan only — no code yet. Once you confirm the direction here, the next step is a phased **BUILD_PLAN.md**, same as before.

---

## 1. Final architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router), TypeScript** | One deployable, one repo. Route Handlers under `app/api/**` are the backend — no separate Express process needed for an app this size. |
| Database | **MongoDB via Mongoose** | Explicitly requested. Schemas defined in Mongoose give us validation + a typed model layer similar to what Prisma gave the mobile backend. |
| Server state (client) | **TanStack React Query** | Same reasoning as the mobile app: caching, de-dupe, optimistic cart updates. Used in Client Components only. |
| Initial data fetching | **React Server Components** | Web-specific advantage over the mobile app: the product list/detail pages can fetch directly on the server and stream HTML — no loading spinner on first paint, and it's real SEO for a storefront. React Query then takes over for anything interactive (filtering, cart mutations) client-side. |
| Auth | **JWT in an httpOnly cookie** (bcrypt-hashed passwords) | Same credential model as mobile, but the token never touches client JS — no XSS-exfiltratable token in `localStorage`, and no Zustand-persisted session needed: a Server Component can just read the cookie to know who's logged in. |
| Forms | **React Hook Form + Zod** | Unchanged rationale from the mobile app. |
| Styling | **Tailwind CSS** | Fast to build a clean, consistent UI without a component library fighting Storybook for ownership of the design system. |
| Components / design system | **Storybook** | Explicitly requested. Every presentational component (`Button`, `ProductCard`, `Chip`, `PriceSummary`, form fields...) gets a story — this is the component catalog a recruiter can browse independent of the running app. |
| Testing | **Jest + React Testing Library** (components/hooks) + **Jest** against Route Handlers directly (business logic, incl. the duplicate-order test) | Mirrors the mobile app's "focused, not exhaustive" testing philosophy — the one test that matters most is the same one: submit the same idempotency key twice, prove exactly one order exists. |
| Card entry | **Manual form only — no scan/camera feature** | Dropped for the web version (your call). The checkout card fields are typed in directly, validated client-side (Luhn + expiry, same as mobile), and only the last 4 digits ever reach the server — same "no real card data server-side" rule, just without the camera-mock flow that made sense as a mobile-device-API demo but doesn't add anything here. |

### Why Server Components + React Query, not just one

This is the web-specific version of the same "why two state tools" question the mobile app answered with React Query + Zustand. Here: a product page's *first render* has no interactivity to react to — Server Components fetching straight from MongoDB and streaming HTML is strictly better than a client-side fetch-then-render waterfall. But "add to cart," "update quantity," category filtering — genuinely interactive, client-side, need optimistic updates and cache invalidation — that's what React Query is for. Splitting this way, instead of making everything a Client Component with `useEffect` fetches (the common mistake when a mobile-first mental model gets carried into Next.js), is itself one of the judgment calls this project is meant to demonstrate.

### Why no Zustand this time

The mobile app's Zustand store held exactly one thing: the auth session, because it had to persist client-side (`expo-secure-store`) and be read synchronously at launch. On the web, the session lives in an httpOnly cookie the *server* reads — a Server Component or Route Handler just checks it, no client store required. If a later phase needs small pieces of client-only UI state (a mobile nav drawer open/closed, say), plain `useState`/context is enough at this app's size; introducing a global client store without a genuine cross-tree state need would be the same over-engineering the mobile app's own docs explicitly avoided.

---

## 2. Folder structure

```
cosmetics-store-web/
├── ARCHITECTURE_PLAN.md
├── BUILD_PLAN.md                 # written after this plan is confirmed
├── docker-compose.yml            # MongoDB (as a single-node replica set — see §5)
├── .storybook/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Home/landing route group
│   │   ├── shop/                  # browse: search + category filter, SSR product grid
│   │   ├── products/[id]/         # product detail (Server Component)
│   │   ├── cart/                  # client-heavy: optimistic mutations
│   │   ├── checkout/              # shipping/card form, idempotency guard
│   │   ├── orders/                # order history + detail
│   │   ├── login/, register/
│   │   └── api/
│   │       ├── auth/{register,login,me}/route.ts
│   │       ├── products/route.ts, products/[id]/route.ts, categories/route.ts
│   │       ├── cart/route.ts, cart/items/[id]/route.ts
│   │       └── orders/route.ts, orders/[id]/route.ts
│   ├── components/                # every one gets a .stories.tsx alongside it
│   ├── lib/
│   │   ├── db.ts                  # cached Mongoose connection (Next.js dev hot-reload safe)
│   │   ├── auth.ts                # sign/verify JWT, cookie helpers, requireUser()
│   │   ├── pricing.ts             # same tax/shipping math as the mobile backend
│   │   └── errors.ts
│   ├── models/                    # Mongoose schemas: User, Product, CartItem, Order
│   ├── features/                  # feature-scoped hooks (React Query) + Zod schemas
│   └── middleware.ts              # redirects unauthenticated users off /cart, /checkout, /orders
└── tests/
```

---

## 3. Data model (MongoDB / Mongoose)

Deliberately not a 1:1 port of the Postgres schema — MongoDB rewards different modeling choices, and the plan should say so rather than pretend a relational schema translates unchanged.

- **User** — `email` (unique), `passwordHash`, `name`, timestamps.
- **Product** — `name`, `description`, `price` (cents, integer), `imageUrl`, `category`, `stock`. A text index on `name`/`description` for search, instead of the Postgres `ILIKE` query.
- **CartItem** — its own collection (not embedded in `User`), compound unique index on `{ userId, productId }` — this mirrors the mobile app's design deliberately, because the stock-check-then-upsert logic wants that same atomic-per-line guarantee.
- **Order** — `userId`, `status`, `subtotal`/`tax`/`shipping`/`total` (cents), **`idempotencyKey` with a unique index** (this is MongoDB's equivalent of the Postgres unique constraint — same job, same non-negotiable importance), and **`items` embedded as a sub-document array** (`productId`, `nameSnapshot`, `priceSnapshot`, `quantity`). Order items are a genuine "always fetched together, never queried independently" case — the textbook example of when MongoDB wants embedding instead of a join.

---

## 4. Checkout / idempotency flow (the part that matters most)

Same three-layer guard as the mobile app, adapted to Mongo:

1. **UI** — the Place Order button disables synchronously on submit, before any request goes out.
2. **Client** — one idempotency key (UUID) generated once per checkout attempt, sent as a header, reused on retry.
3. **Server — the layer that actually holds under a race.** The unique index on `Order.idempotencyKey` is what a Postgres unique constraint was doing before. Creating the order, reading current product prices, and clearing the cart all happen inside **one MongoDB transaction** (a multi-document ACID transaction, via a Mongoose session) — which requires Mongo running as a replica set, even a single-node one, for local dev. `docker-compose.yml` sets this up (`mongod --replSet rs0` + a one-time `rs.initiate()`), called out explicitly since it's the one non-obvious infra step this stack needs that Postgres didn't.

The proof carries over unchanged in spirit: a test that submits the same idempotency key twice and asserts exactly one `Order` document exists afterward.

---

## 5. MVP scope

Same discipline as the mobile app — this is a demonstration of judgment, not a feature race.

**In scope:** register/login (cookie session), product browsing with SSR + search/category filter, cart CRUD with optimistic updates, checkout with server-authoritative pricing, manual card entry (Luhn/expiry-validated, last-4-only to the server), and the idempotency guard, order history/detail with immutable snapshots, a Storybook catalog of every shared component, a focused test suite (component tests + the duplicate-order test as the centerpiece), a recruiter-facing README.

**Explicitly out of scope:** real payment processing, real card storage, an admin dashboard, reviews/social features, push/email notifications, multi-region deployment concerns, i18n.

---

## 6. Open questions before the build plan

1. Any preference on hosting the demo (Vercel is the obvious fit for Next.js) — worth designing for from day one, or a "how to run locally" README is enough?
2. Playwright/Cypress end-to-end test for the checkout flow — worth including, or does it get cut in favor of keeping the test suite focused (same cut-list philosophy as the mobile app)?

Everything else above is a concrete recommendation, not an open choice — say the word and I'll turn this into a phased BUILD_PLAN.md next, the same way the mobile app's build was sequenced.

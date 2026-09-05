# MyShopBD — Codebase explanation

Read-only analysis of the `shopWeb` repo (5 Sep 2026). No code was changed as part of this write-up.

**MyShopBD** is a Bangladesh-focused e-commerce starter: a Next.js website, a customer account area, and an admin dashboard, all talking to **Supabase** (database + login) and **SSLCommerz** (bKash / Nagad / cards). It is a working MVP with extra enterprise-style pieces layered on, not a finished production marketplace.

---

## 1. Project architecture

Think of three rooms in one building:

- **Storefront** — what shoppers see: home, category, product, cart, checkout.
- **Customer account** — `/account/...`: login, orders, addresses, wishlist, wallet, reviews.
- **Admin** — `/admin`: staff login, products, orders, coupons, settings, analytics.

### How data moves

1. The browser loads a **Next.js page** from `app/`.
2. Catalog pages (home, product) often read **Supabase** directly with the public (anon) key.
3. Sensitive work (checkout, login, admin saves) goes to **`app/api/...` routes** on the server.
4. Those routes use a **service-role** Supabase client (full database access). That must stay on the server only.
5. Online payment leaves your site, opens **SSLCommerz**, then comes back through `/api/checkout/ipn`.

The **cart** is stored in the shopper’s browser (`localStorage`), not in the database, until they check out.

### Folder map (beginner)

| Folder | What it is |
|---|---|
| `app/` | Pages you visit, plus `app/api/` endpoints the browser calls |
| `components/` | Reusable UI (header, product card, checkout bits) |
| `lib/` | Shared logic: cart, auth, Supabase clients, SSLCommerz |
| `supabase/` | Later SQL modules (accounts, search, reviews) |
| `supabase - Copy/` | Original schema, seed data, and older migrations the README still points at |

---

## 2. Important files

| File | Why it matters |
|---|---|
| `app/layout.tsx` | Wrap of every page: header, footer, cart + wishlist providers, shop name from `store_settings` |
| `app/page.tsx` | Homepage: loads live categories and products from Supabase |
| `lib/supabase.ts` | Two clients: public (browser-safe) and admin (service role, server only) |
| `lib/cart-context.tsx` | Shopping cart in `localStorage` |
| `lib/customer-auth.ts` / `lib/admin-auth.ts` | Session cookies + admin role checks |
| `app/api/checkout/init/route.ts` | Creates the order, then COD success or SSLCommerz redirect |
| `lib/sslcommerz.ts` | Talks to the Bangladesh payment gateway |
| `app/api/checkout/ipn/route.ts` | Confirms payment with the gateway before marking an order paid |
| `app/admin/page.tsx` | Main staff dashboard (login + catalog + orders in one file) |
| `supabase - Copy/schema.sql` | Core tables: categories, products, orders — not in `supabase/` |

`README.md` is **out of date**. It still says login and reviews are missing; those pages already exist.

---

## 3. How the application works

### Browse

Home and `/product/[id]` (the `[id]` is actually a **slug**, like `pomodoro-timer`) load active products from Supabase.

### Buy

1. Homepage and product pages fetch active products from Supabase.
2. “Add to cart” stores items in the browser. Refreshing the tab keeps the cart.
3. Checkout posts name, phone, address, cart, and payment method to `/api/checkout/init`.
4. The database function `create_order_with_coupon` (defined in the copied Phase 5 SQL) creates the order and reduces stock.
5. Cash on delivery jumps to `/checkout/success`. Online pay opens SSLCommerz (bKash / Nagad / cards live there).
6. SSLCommerz calls `/api/checkout/ipn`. The server validates the transaction, then sets `payment_status` to paid.

### Customer login

Email/password via `/api/customer/auth`. A cookie is set. Account pages then load that user’s orders (by `customer_user_id`).

### Admin

Staff sign in at `/admin`. Roles such as `owner` / `catalog` / `fulfillment` control who can edit products vs orders.

---

## 4. How to run the project

```bash
npm install
copy .env.example .env.local
# then put your own keys in .env.local — see the warning below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You also need a **Supabase** project. Run SQL there. The README says `supabase/schema.sql`, but that file is actually in **`supabase - Copy/`**. After the core schema, you still need the admin, customer, phase 5/6, and `module_*.sql` files, plus an Auth user with an `owner` role for `/admin`.

For card/bKash testing, add SSLCommerz sandbox credentials and set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

### Intended setup path

1. `npm install`
2. Create a Supabase project and run SQL in order: core schema, then admin, customer, phase 5/6, then `supabase/migrations/module_*.sql`
3. Copy `.env.example` to `.env.local` — use **new** keys, not any committed service-role key
4. Create an Auth user and assign an `owner` row in `admin_user_roles`
5. Optional: SSLCommerz sandbox store id/password
6. `npm run dev` then open http://localhost:3000

**README does not match the repo.** It tells you to run `supabase/schema.sql` and `supabase/seed.sql`. Those files live under `supabase - Copy/`. The live `supabase/` folder only has later modules. A new database will fail if you follow the README literally.

---

## 5. Current problems / errors

### Blocker — sign-up page is broken

`app/(dashboard)/account/register/page.tsx` is corrupted (binary garbage in the JSX). TypeScript fails with parse errors. The app cannot typecheck until that file is rewritten.

### High — real database admin key is in the repo

`.env.example` includes a live **service-role** key and is not gitignored. Anyone with the repo can bypass row-level security. **Rotate that key in the Supabase dashboard** and replace the example file with empty placeholders. Do not commit real keys.

### High — SQL is split and inconsistent

- Core schema lives in `supabase - Copy/` (awkward folder name).
- App code uses `orders.customer_user_id` and `order_status_history`.
- Later SQL adds `orders.user_id` and `order_status_logs`.
- Product variants: admin uses `options`; module 3 uses `attributes`.

If those migrations were applied in the wrong order, checkout, orders, and variants can fail at runtime.

### Medium — register form does not match the API

The form posts to `/api/customer/auth/register` with `name`. The real route is `/api/customer/register` and expects `full_name`.

### Medium — unused product UI

`ProductMediaGallery` and `ProductVariantSelector` exist but are never used. The product page shows one image and no size/color picker.

### Lower

- Duplicate admin screens (`/admin` vs `/admin/products`).
- Header wishlist is `localStorage`; account wishlist is the API — they are not synced.
- README “what’s missing” list is wrong.

Typecheck stopped on the register file, so other TypeScript issues may be hiding behind it.

---

## 6. Recommended next work

1. **Rotate the leaked Supabase keys** and clean `.env.example`.
2. **Rewrite the register page** and wire it to `/api/customer/register`.
3. **One SQL story:** put `schema.sql` + seed back under `supabase/`, document the exact run order, and stop using `supabase - Copy/` as the source of truth.
4. **Align column/table names** (`customer_user_id` vs `user_id`, history tables, variant fields).
5. **Smoke-test** browse → cart → COD order → admin login → save a product.
6. Only then: attach variants/gallery to the product page, unify admin UI, sync wishlist.

---

## What this is not yet

Not a multi-vendor marketplace. Not a finished production ops tool. README still lists reviews and user login as missing, but those pages already exist — they need schema alignment and the register fix before they are trustworthy.

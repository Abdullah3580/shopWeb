# Security Remediation Notes

Date: 2026-09-07

This document records the security and reliability changes applied after the project audit.

## Security Changes

- Replaced the real-looking Supabase service-role token in `.env.example` with a placeholder.
- Added `server-only` protection to the Supabase module so service-role code cannot be imported into browser components accidentally.
- Added admin role checks to inventory updates and order-status updates.
- Protected the analytics summary endpoint with manager/finance authorization.
- Unified affected customer routes with the project customer session helper.
- Prevented direct unauthenticated mutations through the public Supabase client.
- Added basic process-local rate limiting for admin login, customer login, registration, and OTP requests.
- Added email, password, UUID, amount, status, and length validation where appropriate.
- Replaced detailed database error responses with generic client-facing messages in updated routes.

## Authentication Fixes

The following routes previously used a separate Supabase SSR-cookie authentication flow while the application used custom HTTP-only cookies. They now use the project authentication helpers:

- `app/api/customer/notifications/route.ts`
- `app/api/customer/refunds/route.ts`
- `app/api/customer/orders/[id]/tracking/route.ts`
- `app/api/analytics/summary/route.ts`

Customer and admin authentication inputs now reject malformed email addresses and unreasonable input lengths. Customer registration no longer automatically confirms email ownership.

## API and Schema Fixes

- Updated order queries to use current schema columns such as `total`, `order_status`, and `customer_user_id`.
- Updated order tracking to use `order_status_history` instead of the legacy `order_status_logs` table.
- Added refund amount and order-state checks.
- Added allowed-value validation for order statuses.
- Inventory changes now use `inventory_movements` and record the authenticated admin as the actor.
- SSLCommerz environment names are now consistent with `lib/sslcommerz.ts`:

```env
SSLCZ_STORE_ID=your_store_id
SSLCZ_STORE_PASSWORD=your_store_password
SSLCZ_IS_LIVE=false
```

## Error Handling

Added root-level error boundaries:

- `app/error.tsx`
- `app/global-error.tsx`

These provide controlled fallback pages for unexpected route and application-level failures.

## Documentation and Dependencies

- Updated `README.md` to remove outdated claims that customer login and reviews are unavailable.
- Documented the server-role key requirement and production rate-limiting considerations.
- Added the `server-only` dependency.

## Verification

The following checks pass:

- `npm run typecheck`
- `git diff --check`

The Next.js production build compiles successfully through route compilation and TypeScript validation. Full build completion requires valid Supabase environment variables at build time.

## Required Deployment Actions

1. Rotate the previously exposed Supabase service-role key in the Supabase dashboard.
2. Confirm all required environment variables are configured in the deployment platform.
3. Never commit `.env.local`, service-role keys, payment passwords, or other secrets.
4. Replace the process-local rate limiter with Redis or a WAF-backed limiter for multiple production instances.
5. Test login, customer order history, refunds, inventory updates, order status changes, and SSLCommerz callbacks in a staging environment.

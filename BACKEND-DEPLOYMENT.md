# Professional Studio backend deployment

## Included
- Supabase/Postgres schema with tenant isolation and RLS.
- Secure HttpOnly session cookie with SameSite protection.
- Login, signup, logout, current-user endpoints.
- Profile persistence and public profile API.
- Persistent studio state bridge for the existing UI.
- CRUD API for services, equipment, clients, bookings, galleries, recent work metadata, reviews, notifications and analytics records.
- Public booking endpoint with input validation and basic abuse throttling.
- Security headers and API health endpoint.
- Payment/subscription processing intentionally left out.

## Required Vercel environment variables
`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend JavaScript. Supabase's service/secret key bypasses RLS and must remain server-side.

## Database
Run `supabase/migrations/001_initial.sql` against the production Supabase project before deploying.

## Existing frontend compatibility
The existing localStorage-driven UI is retained as a compatibility/cache layer. `backend-client.js` hydrates authenticated state from the server and periodically persists changes back to the server. Public portfolios can be loaded from the server using `client.html?slug=<profile-slug>`, and public bookings are posted to `/api/public-booking` when a slug is present.

## Still intentionally not included
- Razorpay/Stripe or any payment gateway
- Subscription billing/webhooks
- Production object-storage upload pipeline for original photo/video binaries
- Transactional email/SMS provider configuration
- External analytics provider

Those require account/provider credentials and billing configuration that cannot safely be embedded in a ZIP.

Password recovery endpoints are included. Configure Supabase Auth's Site URL and redirect URL to the deployed `/auth/reset-password.html` page.

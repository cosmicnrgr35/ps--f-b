# Professional Studio backend setup

1. Create a Supabase project.
2. Run `migrations/001_initial.sql` in the Supabase SQL Editor (or apply it with the Supabase CLI).
3. Configure Auth email verification/reset URLs for your deployed domain.
4. Add these Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (publishable/anon key, used only where a public client key is needed)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never expose it in HTML/JS)
5. Deploy.

Payments/subscriptions are deliberately not implemented in this version.

The API persists studio data per authenticated user and keeps server-side authorization based on the authenticated user's UUID. Database RLS is enabled as defense in depth.

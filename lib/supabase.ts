import { createClient } from "@supabase/supabase-js";

// Public client (safe for use in client components) — uses the anon key,
// which respects Row Level Security. Not used for products/batches here
// since those are locked down entirely (see schema.sql), but kept for
// future use (e.g. customer-facing auth if you add accounts later).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client — SERVER-SIDE ONLY. Uses the service role key, which
// bypasses Row Level Security. Never import this file into a component
// marked "use client" or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// For the demo, every product/batch belongs to this single company row.
// When you add real multi-tenant admin auth later, this becomes dynamic
// (looked up from the logged-in user's company_users record) instead of
// a hardcoded constant.
export const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID!;

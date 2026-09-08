# Product QR Tracking — Demo

Scan a QR code on a product bag/pouch -> name+phone verify gate -> see
product & batch details (quality/traceability info) on a styled result
page. Built so the same backend can later power a mobile app and WhatsApp
delivery without a rewrite.

## What's included

- `/admin` — add a product + batch (with photo, quality/test fields), get
  its QR code, download it for printing; dashboard shows scan count per batch
- `/p/[slug]` — customer-facing flow: enter name + phone -> Verify -> see
  full product details. Blocked automatically after 3 successful verifications
  for the same QR code (anti-duplication safeguard)
- `/api/verify/[slug]` — the endpoint the public page actually calls: logs
  the scan (name, phone, hashed IP, best-effort location) and enforces the
  scan limit
- `/api/batch/[slug]` — raw data lookup by slug, no gate — this is what a
  future mobile app should call instead
- `/api/upload` — uploads a product photo to Supabase Storage
- `schema.sql` — full database schema (run this for a brand new project)
- `migration_2.sql` — same changes, but safe to run on top of an EXISTING
  project that already had the original schema (adds the new columns/tables
  without touching what's there)

## 1. If you already set up Supabase before (schema.sql v1)

Just run `migration_2.sql` in the SQL Editor — it only adds new things,
nothing is deleted or overwritten.

**Then create a Storage bucket** (new requirement, for product photos):
1. In Supabase, go to **Storage** (left sidebar) -> **New bucket**
2. Name it exactly: `product-images`
3. Toggle **Public bucket: ON**
4. Create

That's it — no new env vars needed, the app uses the same service role key.

## 2. If this is a brand new Supabase project

Follow the original steps: run `schema.sql` (now includes everything),
create the `companies` row, create the `product-images` storage bucket
(step 1 above), copy your keys into `.env.local`.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Deploy

Same as before — push to GitHub, import into Vercel, add the same env vars,
deploy. See git history / prior instructions if you need the detailed
click-by-click steps again.

## How the scan limit works

Every time someone submits the name+phone form on `/p/[slug]` and it
succeeds, that counts as one verification. On the 4th attempt for the same
QR code, the page shows a "scanned multiple times" message instead of the
product details. The admin dashboard shows each batch's scan count and
flags any that have hit the limit.

## What's next (after this demo)

- **Mobile app**: build it against `/api/batch/[slug]`.
- **WhatsApp**: not wired in yet at this stage — can be added as a
  `/api/whatsapp-send` route later, using the name+phone already captured
  at the verify gate.
- **Admin auth**: `/admin` still has no login — fine for a demo, add
  Supabase Auth before real use (schema already supports it via
  `company_users`).
- **Real-time location gate**: currently location is requested silently
  in the background and never blocks the flow, by design (agreed for this
  phase) — revisit if the future mobile app needs to enforce it.

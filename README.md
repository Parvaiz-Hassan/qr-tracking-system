# Product QR Tracking — Demo

Scan a QR code on a product bag/pouch → see product & batch details on a
web page. Built so the same backend can later power a mobile app and
WhatsApp delivery without a rewrite.

## What's included

- `/admin` — add a product + batch, get its QR code, download it for printing
- `/p/[slug]` — public page a customer sees after scanning (no login needed)
- `/api/batch/[slug]` — the same data as JSON — this is what a future mobile
  app will call
- `schema.sql` — the database schema (multi-tenant, ready for more clients later)

## 1. Set up Supabase (free, ~5 minutes, no domain needed)

1. Create a free account at https://supabase.com and a new project.
2. In the Supabase dashboard, go to **SQL Editor** -> paste the contents of
   `schema.sql` -> run it.
3. Still in SQL Editor, create your first company row:
   ```sql
   insert into companies (name, slug) values ('JP Agro Innovations', 'jp-agro')
   returning id;
   ```
   Copy the returned `id`.
4. Go to **Settings -> API** and copy: Project URL, `anon` public key,
   `service_role` key.
5. Copy `.env.local.example` to `.env.local` and fill in all four values
   (including the company id from step 3 as `DEMO_COMPANY_ID`).

## 2. Run it locally

```bash
npm install
npm run dev
```
Open http://localhost:3000/admin, add a product batch, and you'll see a QR
code appear. Scanning it with your phone will only work once it's deployed
(step 3) — on localhost, just click the link under the QR to preview the
verify page instead.

## 3. Deploy for the client demo (free, no domain required)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com -> **New Project** -> import the repo.
3. Add the same four environment variables from `.env.local` in Vercel's
   project settings.
4. Deploy. You'll get a free URL like `your-project.vercel.app` —
   fully public, so QR codes will scan correctly on any phone.

## What's next (after the demo)

- **Mobile app**: build it against `/api/batch/[slug]` — the response shape
  is already the contract for it, no backend changes needed.
- **WhatsApp**: the verify page already has a (disabled) WhatsApp input
  field as a placeholder. To wire it up: add a `/api/whatsapp-send` route
  that calls the WhatsApp Cloud API (or a reseller like AiSensy/Interakt),
  and enable the button.
- **Admin auth**: right now `/admin` has no login (fine for a demo). Before
  real use, add Supabase Auth and swap `DEMO_COMPANY_ID` for a real lookup
  from the logged-in user — the `company_users` table in `schema.sql`
  already supports this.
- **Custom domain**: once ready, point your own domain at the Vercel
  project — this doesn't require changing any application code.

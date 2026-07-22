-- ============================================================
-- QR Product/Batch Tracking System — Schema (Supabase Postgres)
-- Multi-tenant from day one: every core table scoped by company_id
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- Companies (tenants) ----------
-- Each client (JP Agro, future clients) is a row here.
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,              -- used in subdomains or admin URLs later e.g. jp-agro
  whatsapp_provider text default 'meta',  -- 'meta' | 'aisensy' | 'interakt' | 'gupshup'
  whatsapp_config jsonb default '{}',     -- provider-specific keys/ids (encrypted at rest by Supabase)
  privacy_note text,                      -- shown on verify page, per-company customizable
  created_at timestamptz default now()
);

-- ---------- Admin users (per company) ----------
-- Supabase Auth handles login; this maps auth.users -> company + role
create table company_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  role text not null default 'admin',     -- 'owner' | 'admin' | 'viewer'
  created_at timestamptz default now(),
  unique (auth_user_id, company_id)
);

-- ---------- Products ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  category text,                          -- 'seed' | 'fertilizer' | custom
  product_code text,                      -- short code used in batch_number, e.g. WHEAT
  uses text,
  instructions text,
  image_url text,
  created_at timestamptz default now()
);

-- ---------- Batches ----------
create table batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  batch_number text not null,             -- human-readable e.g. JPA-SEED-WHEAT-24B-0417
  qr_slug text unique not null,           -- random component used in the QR URL, e.g. 8 char nanoid
  manufacturing_date date,
  expiry_date date,
  quantity numeric,
  quantity_unit text,                     -- 'kg', 'bags', etc.
  notes text,
  created_at timestamptz default now(),
  unique (company_id, batch_number)
);

create index idx_batches_qr_slug on batches (qr_slug);

-- ---------- Scan / verification requests ----------
-- Logs every time someone opens a verify page and/or requests WhatsApp delivery.
create table scan_requests (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null, -- denormalized for fast RLS + reporting
  whatsapp_number text,                   -- null until customer submits it
  message_status text default 'pending',  -- 'pending' | 'sent' | 'failed'
  provider_response jsonb,
  ip_hash text,                           -- store a hash, not raw IP, for basic abuse detection without storing PII
  created_at timestamptz default now()
);

create index idx_scan_requests_batch on scan_requests (batch_id);
create index idx_scan_requests_company on scan_requests (company_id);

-- ============================================================
-- Row Level Security (RLS)
-- Public (anon) role: can only read products/batches via the verify
-- page, and can only insert scan_requests. No direct table access
-- for writes to products/batches — that goes through admin-authenticated
-- API routes only.
-- ============================================================

alter table companies enable row level security;
alter table company_users enable row level security;
alter table products enable row level security;
alter table batches enable row level security;
alter table scan_requests enable row level security;

-- Admin users can only see their own company's data
create policy "admins read own company products"
  on products for select
  using (
    company_id in (
      select company_id from company_users where auth_user_id = auth.uid()
    )
  );

create policy "admins write own company products"
  on products for all
  using (
    company_id in (
      select company_id from company_users where auth_user_id = auth.uid()
    )
  );

create policy "admins read own company batches"
  on batches for select
  using (
    company_id in (
      select company_id from company_users where auth_user_id = auth.uid()
    )
  );

create policy "admins write own company batches"
  on batches for all
  using (
    company_id in (
      select company_id from company_users where auth_user_id = auth.uid()
    )
  );

-- Public verify page needs to read a SINGLE batch by qr_slug (via server-side
-- API route using the service role key, NOT the anon key) — so no public
-- select policy is needed here. Keep batches/products locked down entirely
-- and only ever query them from your Next.js server (API routes), never
-- from the browser client directly. This is the safest default.

-- Public can insert scan_requests only (no select/update/delete)
create policy "anyone can log a scan request"
  on scan_requests for insert
  with check (true);

-- ============================================================
-- Notes:
-- 1. qr_slug should be generated with a short random ID (e.g. nanoid, 8-10
--    chars) — NOT the batch_number itself — so QR URLs aren't guessable/
--    enumerable by incrementing a sequence.
-- 2. All reads for the public verify page should go through a Next.js API
--    route using the Supabase SERVICE ROLE key server-side (never expose
--    service role key to the browser). This keeps products/batches fully
--    locked down from anon access while still letting the verify page work.
-- 3. Add a `deleted_at` column later if you want soft-deletes instead of
--    hard deletes on products/batches.
-- ============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

const DEFAULT_PAGE_SIZE = 15;

// GET — paginated scan log, most recent first (added 2026-09-18 — this
// used to return up to 500 rows in one go, which turns into a very long
// scroll once a product's been scanned a lot in the real world).
//
// Query params: page (1-based, default 1), pageSize (default 15),
// q (search text — matches customer name, phone number, or batch/lot
// number). Note: search does not match on product name here, only on
// the batch number, since the customer/product relationship is nested
// two levels deep and Postgres/PostgREST search filters only reach one
// level of embedded table. Searching by batch number covers the same
// batch either way.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.max(
    1,
    parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) ||
      DEFAULT_PAGE_SIZE
  );
  const q = (searchParams.get("q") || "").trim();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("scan_requests")
    .select(
      `id, customer_name, customer_phone, latitude, longitude, location_status, location_place, ip_address, created_at,
       batches!inner ( batch_number, products ( name ) )`,
      { count: "exact" }
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,batches.batch_number.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scans: data, total: count ?? 0, page, pageSize });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

const SCAN_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 10;

// GET — paginated list of QR codes scanned more than SCAN_LIMIT times
// (added 2026-09-18, same reasoning as the Products and Scan Log pages —
// this list is unbounded in the real world once a lot of QR codes get
// reused/rescanned).
//
// scan_count isn't a stored column (it's derived from counting
// scan_requests per batch), so unlike the other two list endpoints this
// one can't push the >SCAN_LIMIT filter down to the database with a
// plain .gt() — it fetches all batches with their scan counts, filters
// and paginates in memory. Fine at this scale (this list is already a
// small subset of all batches); if the catalog gets very large, that
// would be the point to add a maintained scan_count column instead.
//
// Query params: page (1-based, default 1), pageSize (default 10),
// q (search text — matches product name or batch/lot number).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.max(
    1,
    parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) ||
      DEFAULT_PAGE_SIZE
  );
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const { data: batches, error } = await supabaseAdmin
    .from("batches")
    .select(`id, batch_number, qr_slug, products ( name ), scan_requests ( id )`)
    .eq("company_id", DEMO_COMPANY_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let blocked = (batches || [])
    .map((b: any) => ({
      id: b.id,
      batch_number: b.batch_number,
      qr_slug: b.qr_slug,
      product_name: Array.isArray(b.products) ? b.products[0]?.name : b.products?.name,
      scan_count: b.scan_requests?.length || 0,
    }))
    .filter((b: any) => b.scan_count > SCAN_LIMIT);

  if (q) {
    blocked = blocked.filter(
      (b: any) =>
        b.batch_number.toLowerCase().includes(q) ||
        (b.product_name || "").toLowerCase().includes(q)
    );
  }

  const total = blocked.length;
  const from = (page - 1) * pageSize;
  const paged = blocked.slice(from, from + pageSize);

  return NextResponse.json({ blocked: paged, total, page, pageSize });
}

import { NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

const SCAN_LIMIT = 3;

export async function GET() {
  // All scans for this company, with batch/product info for grouping
  const { data: scans, error: scansError } = await supabaseAdmin
    .from("scan_requests")
    .select("id, batch_id, created_at")
    .eq("company_id", DEMO_COMPANY_ID);

  if (scansError) {
    return NextResponse.json({ error: scansError.message }, { status: 500 });
  }

  const { data: batches, error: batchesError } = await supabaseAdmin
    .from("batches")
    .select("id, batch_number, products ( name )")
    .eq("company_id", DEMO_COMPANY_ID);

  if (batchesError) {
    return NextResponse.json({ error: batchesError.message }, { status: 500 });
  }

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const totalScans = scans?.length || 0;
  const scansToday =
    scans?.filter((s) => now - new Date(s.created_at).getTime() < oneDayMs).length || 0;
  const scansThisWeek =
    scans?.filter((s) => now - new Date(s.created_at).getTime() < sevenDaysMs).length || 0;

  // Count scans per batch
  const countByBatch: Record<string, number> = {};
  scans?.forEach((s) => {
    countByBatch[s.batch_id] = (countByBatch[s.batch_id] || 0) + 1;
  });

  const batchList = (batches || []).map((b: any) => ({
    id: b.id,
    batch_number: b.batch_number,
    product_name: Array.isArray(b.products) ? b.products[0]?.name : b.products?.name,
    scan_count: countByBatch[b.id] || 0,
  }));

  const mostScanned = [...batchList]
    .sort((a, b) => b.scan_count - a.scan_count)
    .slice(0, 5)
    .filter((b) => b.scan_count > 0);

  const blockedCount = batchList.filter((b) => b.scan_count > SCAN_LIMIT).length;

  return NextResponse.json({
    totalScans,
    scansToday,
    scansThisWeek,
    totalProducts: batchList.length,
    blockedCount,
    mostScanned,
  });
}

import { NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

const SCAN_LIMIT = 3;

export async function GET() {
  const { data: batches, error } = await supabaseAdmin
    .from("batches")
    .select(`id, batch_number, qr_slug, products ( name ), scan_requests ( id )`)
    .eq("company_id", DEMO_COMPANY_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const blocked = (batches || [])
    .map((b: any) => ({
      id: b.id,
      batch_number: b.batch_number,
      qr_slug: b.qr_slug,
      product_name: Array.isArray(b.products) ? b.products[0]?.name : b.products?.name,
      scan_count: b.scan_requests?.length || 0,
    }))
    .filter((b: any) => b.scan_count > SCAN_LIMIT);

  return NextResponse.json({ blocked });
}

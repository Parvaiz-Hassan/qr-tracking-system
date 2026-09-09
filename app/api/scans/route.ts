import { NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scan_requests")
    .select(
      `id, customer_name, customer_phone, latitude, longitude, created_at,
       batches ( batch_number, products ( name ) )`
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scans: data });
}

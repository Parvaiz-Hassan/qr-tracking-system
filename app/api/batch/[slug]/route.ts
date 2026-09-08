import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/batch/{slug} — raw product/batch lookup by QR slug, for
// future clients (e.g. a mobile app) that want the data without going
// through the name+phone verify gate. Does NOT log a scan or apply the
// scan-limit block — that logic lives in /api/verify/[slug], which is
// what the public web verify page actually uses.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `batch_number, label_number, manufacturing_date, expiry_date, date_of_testing,
       net_weight, mrp, usp,
       products ( name, variety, category, uses, instructions, image_url ),
       batch_attributes ( section, label, value, sort_order )`
    )
    .eq("qr_slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/batch/{slug} — public product lookup by QR slug.
// This is the endpoint a future mobile app would call too, so keep the
// response shape stable once you're past the demo stage.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `id, company_id, batch_number, manufacturing_date, expiry_date, quantity, quantity_unit,
       products ( name, category, uses, instructions, image_url )`
    )
    .eq("qr_slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Fire-and-forget scan log — don't block the response on this.
  supabaseAdmin
    .from("scan_requests")
    .insert({
      batch_id: (data as any).id,
      company_id: (data as any).company_id,
    })
    .then(() => {});

  return NextResponse.json(data);
}

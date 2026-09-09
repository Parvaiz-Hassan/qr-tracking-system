import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const SCAN_LIMIT = 3; // 4th+ verify attempt for the same batch gets blocked

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { name, phone, latitude, longitude, locationStatus } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  // 1. Look up the batch by its QR slug
  const { data: batch, error: batchError } = await supabaseAdmin
    .from("batches")
    .select(
      `id, company_id, batch_number, label_number, manufacturing_date, expiry_date,
       date_of_testing, net_weight, mrp, usp,
       products ( name, variety, category, sub_category, uses, instructions, image_url ),
       batch_attributes ( section, label, value, sort_order )`
    )
    .eq("qr_slug", slug)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Company branding (logo/name/tagline/thank-you message) for the header/footer
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("name, logo_url, tagline, thank_you_message")
    .eq("id", batch.company_id)
    .single();

  // 2. Count existing successful verifications for this batch
  const { count, error: countError } = await supabaseAdmin
    .from("scan_requests")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batch.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= SCAN_LIMIT) {
    return NextResponse.json({ blocked: true, scanCount: count });
  }

  // 3. Get a best-effort IP hash (never store the raw IP)
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ipHash = await hash(rawIp);

  // 4. Log the scan (location fields are usually still null here now —
  // the client calls this immediately without waiting on geolocation,
  // then patches location in separately via /api/scans/{id}/location)
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("scan_requests")
    .insert({
      batch_id: batch.id,
      company_id: batch.company_id,
      customer_name: name,
      customer_phone: phone,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      location_status: locationStatus || null,
      ip_hash: ipHash,
      message_status: "verified",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    blocked: false,
    batch,
    company,
    scanId: inserted.id,
    scanCount: (count ?? 0) + 1,
  });
}

async function hash(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

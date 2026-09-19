import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidIndianPhone, normalizePhone } from "@/lib/phone";

const SCAN_LIMIT = 3; // legacy global per-QR limit (see ENFORCE_SCAN_LIMIT below)

// Client asked (2026-09-18) to remove the OLD global scan-limit block —
// flip this back to `true` to restore it. It's superseded for now by the
// per-phone-number limit below (PER_PHONE_LIMIT), which is the active
// restriction. Both can coexist if you ever want both rules at once.
const ENFORCE_SCAN_LIMIT = false;

// New restriction (added 2026-09-18): a single phone number can verify
// the SAME QR code at most this many times. This is what actually stops
// one farmer from burning through a code by himself — the old global
// counter didn't distinguish who was scanning, so one person re-scanning
// could "use up" the limit for everyone else.
const PER_PHONE_LIMIT = 2;

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

  if (!isValidIndianPhone(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(phone);

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

  // Expiry check (added 2026-09-18): once the batch's expiry date has
  // passed, stop showing product details entirely and tell the customer
  // instead. Comparing as plain "YYYY-MM-DD" strings works because that's
  // the format the date column returns and ISO dates sort correctly as
  // strings — no timezone conversion needed. The batch stays valid
  // through the whole of its expiry date itself and is treated as expired
  // starting the day after.
  const today = new Date().toISOString().slice(0, 10);
  if (batch.expiry_date && batch.expiry_date < today) {
    return NextResponse.json({
      expired: true,
      expiryDate: batch.expiry_date,
      message:
        "This product has passed its expiry date and can no longer be verified. Please do not use an expired product — contact your retailer or Geneva Seeds for assistance.",
    });
  }

  // Company branding (logo/name/tagline/thank-you message) for the header/footer
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select(
      "name, logo_url, tagline, thank_you_message, produced_by_name, produced_by_subtitle, produced_by_address"
    )
    .eq("id", batch.company_id)
    .single();

  // 2. Count existing successful verifications for this batch (overall —
  // still tracked for the admin dashboard even though ENFORCE_SCAN_LIMIT
  // is off) AND specifically from this phone number (the active limit).
  const { count, error: countError } = await supabaseAdmin
    .from("scan_requests")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batch.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if (ENFORCE_SCAN_LIMIT && (count ?? 0) >= SCAN_LIMIT) {
    return NextResponse.json({ blocked: true, scanCount: count });
  }

  const { count: phoneCount, error: phoneCountError } = await supabaseAdmin
    .from("scan_requests")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batch.id)
    .eq("normalized_phone", normalizedPhone);

  if (phoneCountError) {
    return NextResponse.json({ error: phoneCountError.message }, { status: 500 });
  }

  if ((phoneCount ?? 0) >= PER_PHONE_LIMIT) {
    return NextResponse.json({
      phoneLimitExceeded: true,
      message:
        "You've already verified this product the maximum number of times from this mobile number. Please try scanning again using a different mobile number.",
    });
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
      normalized_phone: normalizedPhone,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      location_status: locationStatus || null,
      ip_hash: ipHash,
      ip_address: rawIp,
      message_status: "verified",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    blocked: false,
    phoneLimitExceeded: false,
    expired: false,
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

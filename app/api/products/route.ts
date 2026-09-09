import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";
import { generateQrSlug } from "@/lib/slug";

// GET — list all products+batches for the admin dashboard, including
// a live scan count so the dashboard can flag batches over the limit.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `id, batch_number, qr_slug, label_number, manufacturing_date, expiry_date,
       date_of_testing, net_weight, mrp, usp,
       products ( id, name, variety, category, sub_category, uses, instructions, image_url ),
       scan_requests ( id )`
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withCounts = (data || []).map((b: any) => ({
    ...b,
    scan_count: b.scan_requests?.length || 0,
  }));

  return NextResponse.json({ batches: withCounts });
}

// POST — create a new product + its first batch + optional quality
// attribute rows, in one step (demo-friendly).
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name,
    variety,
    category,
    sub_category,
    uses,
    instructions,
    image_url,
    batch_number,
    label_number,
    manufacturing_date,
    expiry_date,
    date_of_testing,
    net_weight,
    mrp,
    usp,
    quality_attributes, // [{ label, value }]
  } = body;

  if (!name || !batch_number) {
    return NextResponse.json(
      { error: "Product name and batch number are required." },
      { status: 400 }
    );
  }

  // 1. Create the product
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      company_id: DEMO_COMPANY_ID,
      name,
      variety: variety || null,
      category,
      sub_category: sub_category || null,
      uses,
      instructions,
      image_url: image_url || null,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // 2. Create the batch, tied to that product, with a fresh random qr_slug
  const qr_slug = generateQrSlug();

  const { data: batch, error: batchError } = await supabaseAdmin
    .from("batches")
    .insert({
      company_id: DEMO_COMPANY_ID,
      product_id: product.id,
      batch_number,
      label_number: label_number || null,
      qr_slug,
      manufacturing_date: manufacturing_date || null,
      expiry_date: expiry_date || null,
      date_of_testing: date_of_testing || null,
      net_weight: net_weight || null,
      mrp: mrp || null,
      usp: usp || null,
    })
    .select()
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  // 3. Insert quality attribute rows, if any were provided
  if (Array.isArray(quality_attributes) && quality_attributes.length > 0) {
    const rows = quality_attributes
      .filter((a: any) => a.label && a.value)
      .map((a: any, i: number) => ({
        batch_id: batch.id,
        section: "quality",
        label: a.label,
        value: a.value,
        sort_order: i,
      }));

    if (rows.length > 0) {
      const { error: attrError } = await supabaseAdmin
        .from("batch_attributes")
        .insert(rows);

      if (attrError) {
        return NextResponse.json({ error: attrError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ product, batch });
}

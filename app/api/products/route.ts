import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";
import { generateQrSlug } from "@/lib/slug";

const DEFAULT_PAGE_SIZE = 10;

// GET — paginated list of products+batches for the admin dashboard
// (added 2026-09-18 so this stays usable once there are hundreds of
// batches, instead of one giant page everyone has to scroll through),
// including a live scan count so the dashboard can flag batches over
// the limit.
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
  const q = (searchParams.get("q") || "").trim();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // `products!inner` (rather than the default left join) is required so
  // the `.or(...)` search filter below is allowed to reference the
  // embedded products.name column.
  let query = supabaseAdmin
    .from("batches")
    .select(
      `id, batch_number, qr_slug, label_number, manufacturing_date, expiry_date,
       date_of_testing, net_weight, mrp, usp,
       products!inner ( id, name, variety, category, sub_category, uses, instructions, image_url ),
       scan_requests ( id )`,
      { count: "exact" }
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`batch_number.ilike.%${q}%,products.name.ilike.%${q}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withCounts = (data || []).map((b: any) => ({
    ...b,
    scan_count: b.scan_requests?.length || 0,
  }));

  return NextResponse.json({
    batches: withCounts,
    total: count ?? 0,
    page,
    pageSize,
  });
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

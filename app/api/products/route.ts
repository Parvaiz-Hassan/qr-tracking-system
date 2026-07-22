import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";
import { generateQrSlug } from "@/lib/slug";

// GET — list all products+batches for the admin dashboard
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `id, batch_number, qr_slug, manufacturing_date, expiry_date, quantity, quantity_unit,
       products ( id, name, category, uses, instructions )`
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ batches: data });
}

// POST — create a new product + its first batch in one step (demo-friendly).
// Body: { name, category, uses, instructions, batch_number,
//          manufacturing_date, expiry_date, quantity, quantity_unit }
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name,
    category,
    uses,
    instructions,
    batch_number,
    manufacturing_date,
    expiry_date,
    quantity,
    quantity_unit,
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
      category,
      uses,
      instructions,
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
      qr_slug,
      manufacturing_date: manufacturing_date || null,
      expiry_date: expiry_date || null,
      quantity: quantity || null,
      quantity_unit: quantity_unit || null,
    })
    .select()
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  return NextResponse.json({ product, batch });
}

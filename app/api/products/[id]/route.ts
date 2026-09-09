import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/products/{batchId} — fetch one batch (with product + quality
// attributes) to prefill the edit form.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `id, batch_number, label_number, manufacturing_date, expiry_date, date_of_testing,
       net_weight, mrp, usp,
       products ( id, name, variety, category, sub_category, uses, instructions, image_url ),
       batch_attributes ( label, value, sort_order )`
    )
    .eq("id", batchId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ batch: data });
}

// PATCH /api/products/{batchId} — update product + batch fields together.
// Quality attribute rows are fully replaced (delete then reinsert) since
// that's simpler and safe for a small list.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;
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
    quality_attributes,
  } = body;

  // Find the batch to get its product_id
  const { data: existingBatch, error: findError } = await supabaseAdmin
    .from("batches")
    .select("id, product_id")
    .eq("id", batchId)
    .single();

  if (findError || !existingBatch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const { error: productError } = await supabaseAdmin
    .from("products")
    .update({
      name,
      variety: variety || null,
      category,
      sub_category: sub_category || null,
      uses,
      instructions,
      ...(image_url ? { image_url } : {}),
    })
    .eq("id", existingBatch.product_id);

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const { error: batchError } = await supabaseAdmin
    .from("batches")
    .update({
      batch_number,
      label_number: label_number || null,
      manufacturing_date: manufacturing_date || null,
      expiry_date: expiry_date || null,
      date_of_testing: date_of_testing || null,
      net_weight: net_weight || null,
      mrp: mrp || null,
      usp: usp || null,
    })
    .eq("id", batchId);

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  if (Array.isArray(quality_attributes)) {
    await supabaseAdmin.from("batch_attributes").delete().eq("batch_id", batchId);

    const rows = quality_attributes
      .filter((a: any) => a.label && a.value)
      .map((a: any, i: number) => ({
        batch_id: batchId,
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

  return NextResponse.json({ success: true });
}

// DELETE /api/products/{batchId} — deletes the batch (and its scan_requests
// / batch_attributes via cascade). Leaves the product row in place in case
// other batches still reference it.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  const { error } = await supabaseAdmin.from("batches").delete().eq("id", batchId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

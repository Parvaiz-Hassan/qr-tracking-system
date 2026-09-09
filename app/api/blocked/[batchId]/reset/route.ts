import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/blocked/{batchId}/reset — deletes all scan_requests for a batch,
// effectively "unblocking" it. Use when a block was a false positive
// (e.g. a retailer legitimately showing the pack to several customers).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;

  const { error } = await supabaseAdmin
    .from("scan_requests")
    .delete()
    .eq("batch_id", batchId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

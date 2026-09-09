import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH /api/scans/{id}/location — updates a scan_requests row with
// location data AFTER the fact. Called fire-and-forget from the browser
// once geolocation resolves, so the verify button never has to wait on it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { latitude, longitude, locationStatus } = body;

  const { error } = await supabaseAdmin
    .from("scan_requests")
    .update({
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      location_status: locationStatus || null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

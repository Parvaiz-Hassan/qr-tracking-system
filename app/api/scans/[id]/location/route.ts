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

  let locationPlace: string | null = null;

  // Reverse-geocode to a human-readable place (village/tehsil/district/
  // state) using OpenStreetMap's free Nominatim service — no API key
  // needed. Best-effort: if this fails, we still save the coordinates.
  if (latitude != null && longitude != null) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
        {
          headers: {
            // Nominatim's usage policy requires a descriptive User-Agent
            "User-Agent": "qr-tracking-demo/1.0 (product verification app)",
          },
        }
      );
      if (res.ok) {
        const geo = await res.json();
        const addr = geo.address || {};
        const village = addr.village || addr.town || addr.city || addr.suburb;
        const tehsil = addr.county || addr.state_district || addr.tehsil;
        const state = addr.state;
        locationPlace = [village, tehsil, state].filter(Boolean).join(", ") || null;
      }
    } catch {
      // Best-effort only — coordinates are still saved even if this fails.
    }
  }

  const { error } = await supabaseAdmin
    .from("scan_requests")
    .update({
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      location_status: locationStatus || null,
      location_place: locationPlace,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, locationPlace });
}

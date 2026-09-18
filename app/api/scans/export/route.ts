import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

// GET /api/scans/export — downloads the scan log as a CSV file.
//
// Honors the same ?q= search filter as the Scan Log page (so "download
// what I'm looking at" works), but ignores pagination — it exports every
// matching row, not just the current page. Capped at 10,000 rows as a
// safety limit; raise MAX_ROWS if a single export ever needs to go
// beyond that.
const MAX_ROWS = 10000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  let query = supabaseAdmin
    .from("scan_requests")
    .select(
      `customer_name, customer_phone, latitude, longitude, location_status, location_place, ip_address, created_at,
       batches!inner ( batch_number, products ( name ) )`
    )
    .eq("company_id", DEMO_COMPANY_ID)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (q) {
    query = query.or(
      `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,batches.batch_number.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((s: any) => {
    const batch = Array.isArray(s.batches) ? s.batches[0] : s.batches;
    const product = batch
      ? Array.isArray(batch.products)
        ? batch.products[0]
        : batch.products
      : null;

    const location = s.location_place
      ? s.location_place
      : s.latitude != null && s.longitude != null
      ? `${s.latitude}, ${s.longitude}`
      : locationStatusLabel(s.location_status);

    return [
      product?.name || "",
      batch?.batch_number || "",
      s.customer_name || "",
      s.customer_phone || "",
      location,
      s.ip_address || "",
      new Date(s.created_at).toLocaleString(),
    ];
  });

  const header = ["Product", "Batch", "Name", "Phone", "Location", "IP Address", "Time"];
  const csv = toCsv([header, ...rows]);

  const filename = `scan-log-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function locationStatusLabel(status: string | null) {
  switch (status) {
    case "denied":
      return "Denied by customer";
    case "timed_out":
      return "Timed out";
    case "unsupported":
      return "Not supported";
    case "unavailable":
      return "Unavailable";
    default:
      return "";
  }
}

// Minimal CSV encoder — wraps any field containing a comma, quote, or
// newline in double quotes (doubling internal quotes), per RFC 4180. A
// leading BOM is prepended so Excel opens UTF-8 files (e.g. names with
// accents) without mangling them.
function toCsv(rows: (string | number)[][]): string {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? "");
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const body = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
  return "﻿" + body;
}

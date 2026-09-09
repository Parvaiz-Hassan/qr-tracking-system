import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEMO_COMPANY_ID } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("name, logo_url, tagline, thank_you_message")
    .eq("id", DEMO_COMPANY_ID)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ company: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { name, logo_url, tagline, thank_you_message } = body;

  const { error } = await supabaseAdmin
    .from("companies")
    .update({ name, logo_url, tagline, thank_you_message })
    .eq("id", DEMO_COMPANY_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

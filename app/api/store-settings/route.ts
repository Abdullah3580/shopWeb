import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin().from("store_settings").select("shop_name,logo_url,inside_dhaka_shipping,outside_dhaka_shipping,cod_enabled,sslcommerz_enabled").eq("id", 1).single();
  if (error || !data) return NextResponse.json({ error: "Store settings unavailable" }, { status: 503 });
  return NextResponse.json({ settings: data });
}

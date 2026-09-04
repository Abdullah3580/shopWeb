import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!await requireAdminRole(["manager", "finance"])) return NextResponse.json({ error: "Settings permission required" }, { status: 403 });
  const { data, error } = await supabaseAdmin().from("store_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdminRole(["manager", "finance"]);
  if (!session) return NextResponse.json({ error: "Settings permission required" }, { status: 403 });
  const input = await req.json().catch(() => ({}));
  const settings = { shop_name: String(input.shop_name || "").trim(), logo_url: input.logo_url || null, store_address: input.store_address || null, contact_phone: input.contact_phone || null, contact_email: input.contact_email || null, inside_dhaka_shipping: Number(input.inside_dhaka_shipping), outside_dhaka_shipping: Number(input.outside_dhaka_shipping), tax_rate: Number(input.tax_rate || 0), cod_enabled: Boolean(input.cod_enabled), sslcommerz_enabled: Boolean(input.sslcommerz_enabled), updated_at: new Date().toISOString() };
  if (!settings.shop_name || !Number.isFinite(settings.inside_dhaka_shipping) || !Number.isFinite(settings.outside_dhaka_shipping) || !Number.isFinite(settings.tax_rate) || settings.inside_dhaka_shipping < 0 || settings.outside_dhaka_shipping < 0 || settings.tax_rate < 0 || settings.tax_rate > 100) return NextResponse.json({ error: "Invalid store settings" }, { status: 400 });
  const { data, error } = await supabaseAdmin().from("store_settings").update(settings).eq("id", 1).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabaseAdmin().from("admin_activity_logs").insert({ action: "Updated store settings", entity_type: "settings", entity_id: "1", details: { actor_id: session.user.id } });
  return NextResponse.json({ settings: data });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!await requireAdminRole(["catalog"])) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
  const { data, error } = await supabaseAdmin().from("brands").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data || [] });
}
export async function POST(req: NextRequest) {
  const session = await requireAdminRole(["catalog"]);
  if (!session) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
  const input = await req.json().catch(() => ({}));
  const brand = { name: String(input.name || "").trim().slice(0, 120), slug: String(input.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""), logo_url: String(input.logo_url || "").trim().slice(0, 1000) || null, is_active: input.is_active !== false };
  if (!brand.name || !brand.slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  const query = input.id ? supabaseAdmin().from("brands").update(brand).eq("id", input.id).select().single() : supabaseAdmin().from("brands").insert(brand).select().single();
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabaseAdmin().from("admin_activity_logs").insert({ action: input.id ? "Updated brand" : "Created brand", entity_type: "brand", entity_id: data.id, details: { name: brand.name, actor: session.user.id } });
  return NextResponse.json({ brand: data });
}

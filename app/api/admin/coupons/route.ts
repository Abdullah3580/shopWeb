import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!await requireAdminRole(["manager", "finance"])) return NextResponse.json({ error: "Marketing permission required" }, { status: 403 });
  const { data, error } = await supabaseAdmin().from("coupons").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminRole(["manager", "finance"]);
  if (!session) return NextResponse.json({ error: "Marketing permission required" }, { status: 403 });
  const input = await req.json().catch(() => ({}));
  const coupon = { code: String(input.code || "").trim().toUpperCase(), discount_type: input.discount_type === "percentage" ? "percentage" : "fixed", discount_value: Number(input.discount_value), max_discount: input.max_discount === "" || input.max_discount == null ? null : Number(input.max_discount), min_order_amount: Number(input.min_order_amount || 0), max_uses: input.max_uses === "" || input.max_uses == null ? null : Number(input.max_uses), starts_at: input.starts_at || new Date().toISOString(), expires_at: input.expires_at || null, is_active: input.is_active !== false };
  if (coupon.code.length < 3 || !Number.isFinite(coupon.discount_value) || coupon.discount_value <= 0 || coupon.min_order_amount < 0 || (coupon.max_uses !== null && (!Number.isInteger(coupon.max_uses) || coupon.max_uses < 1))) return NextResponse.json({ error: "Invalid coupon values" }, { status: 400 });
  const query = input.id ? supabaseAdmin().from("coupons").update(coupon).eq("id", input.id).select().single() : supabaseAdmin().from("coupons").insert(coupon).select().single();
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabaseAdmin().from("admin_activity_logs").insert({ action: input.id ? "Updated coupon" : "Created coupon", entity_type: "coupon", entity_id: data.id, details: { code: coupon.code } });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdminRole(["manager", "finance"])) return NextResponse.json({ error: "Marketing permission required" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
  const { error } = await supabaseAdmin().from("coupons").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

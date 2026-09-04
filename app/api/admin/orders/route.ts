import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const orderStatuses = new Set(["processing", "shipped", "delivered", "cancelled"]);
const paymentStatuses = new Set(["pending", "paid", "failed", "cancelled"]);

export async function GET(req: NextRequest) {
  const session = await requireAdminRole(["fulfillment", "finance"]);
  if (!session) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });
  const params = req.nextUrl.searchParams;
  const page = Math.max(Number(params.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.get("page_size") || 20), 1), 100);
  const search = params.get("search")?.trim();
  const from = params.get("from");
  const to = params.get("to");
  const orderStatus = params.get("order_status");
  const paymentStatus = params.get("payment_status");
  const supabase = supabaseAdmin();
  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (search) query = query.or(`tran_id.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  if (from && !Number.isNaN(Date.parse(from))) query = query.gte("created_at", new Date(from).toISOString());
  if (to && !Number.isNaN(Date.parse(to))) query = query.lt("created_at", new Date(new Date(to).getTime() + 86400000).toISOString());
  if (orderStatus && orderStatuses.has(orderStatus)) query = query.eq("order_status", orderStatus);
  if (paymentStatus && paymentStatuses.has(paymentStatus)) query = query.eq("payment_status", paymentStatus);
  const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [], page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdminRole(["fulfillment", "finance"]);
  if (!session) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  const updates: Record<string, string | null> = {};
  if (body.order_status && orderStatuses.has(body.order_status)) updates.order_status = body.order_status;
  if (body.payment_status && paymentStatuses.has(body.payment_status) && session.roles.some((role) => ["owner", "manager", "finance"].includes(role))) updates.payment_status = body.payment_status;
  if (typeof body.courier_name === "string") updates.courier_name = body.courier_name.trim().slice(0, 120) || null;
  if (typeof body.tracking_number === "string") updates.tracking_number = body.tracking_number.trim().slice(0, 120) || null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("orders").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (updates.order_status) await supabase.from("order_status_history").insert({ order_id: id, status: updates.order_status, note: "Updated from operations dashboard" });
  if (updates.order_status === "cancelled") {
    const { error: releaseError } = await supabase.rpc("release_order_inventory", { p_tran_id: data.tran_id });
    if (releaseError) return NextResponse.json({ error: releaseError.message }, { status: 400 });
  }
  await supabase.from("admin_activity_logs").insert({ action: "Updated order", entity_type: "order", entity_id: id, details: updates });
  return NextResponse.json({ order: data });
}

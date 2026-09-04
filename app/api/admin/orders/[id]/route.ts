import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole(["fulfillment", "finance"]);
  if (!session) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });
  const { id } = await params;
  const supabase = supabaseAdmin();
  const [order, items, payments, timeline, returns] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
    supabase.from("payment_transactions").select("id,tran_id,gateway,gateway_val_id,amount,status,created_at,updated_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("returns").select("*").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  if (order.error || !order.data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const failure = [items, payments, timeline, returns].find((result) => result.error);
  if (failure) return NextResponse.json({ error: failure.error?.message || "Unable to load order" }, { status: 500 });
  return NextResponse.json({ order: order.data, items: items.data || [], payments: payments.data || [], timeline: timeline.data || [], returns: returns.data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole(["fulfillment", "finance"]);
  if (!session) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "process_return") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const status = ["requested", "approved", "received", "refunded", "rejected", "cancelled"].includes(body.status) ? body.status : null;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  const refundAmount = Number(body.refund_amount || 0);
  if (!status || !reason || !Number.isFinite(refundAmount) || refundAmount < 0) return NextResponse.json({ error: "Valid return status, reason, and refund amount are required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("process_order_return", { p_order_id: id, p_reason: reason, p_status: status, p_refund_amount: refundAmount, p_actor_id: session.user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ return: data });
}

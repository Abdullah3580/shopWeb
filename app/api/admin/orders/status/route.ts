import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'] as const;

export async function PATCH(request: NextRequest) {
  const session = await requireAdminRole(["fulfillment", "finance"]);
  if (!session) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const newStatus = typeof body.newStatus === "string" ? body.newStatus : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !ORDER_STATUSES.includes(newStatus as typeof ORDER_STATUSES[number])) {
    return NextResponse.json({ error: "Valid order ID and status are required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: updatedOrder, error: updateError } = await supabase.from("orders").update({ order_status: newStatus }).eq("id", orderId).select("tran_id").single();
  if (updateError) {
    console.error("Order status update failed", updateError);
    return NextResponse.json({ error: "Unable to update order status" }, { status: 500 });
  }

  const { error: logError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    status: newStatus,
    note: notes || `Status updated to ${newStatus}`,
  });
  if (logError) console.error("Order status audit log failed", logError);

  if (newStatus === "cancelled" && updatedOrder?.tran_id) {
    const { error: releaseError } = await supabase.rpc("release_order_inventory", { p_tran_id: updatedOrder.tran_id });
    if (releaseError) {
      console.error("Inventory release failed", releaseError);
      return NextResponse.json({ error: "Order cancelled but stock release failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

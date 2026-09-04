import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const supabase = supabaseAdmin();
  const [order, items, timeline] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).eq("customer_user_id", session.user.id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
  ]);
  if (order.error || !order.data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (items.error || timeline.error) return NextResponse.json({ error: "Unable to load order" }, { status: 500 });
  return NextResponse.json({ order: order.data, items: items.data || [], timeline: timeline.data || [] });
}

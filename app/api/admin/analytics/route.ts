import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!await requireAdminRole(["manager", "finance"])) return NextResponse.json({ error: "Analytics permission required" }, { status: 403 });
  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  const supabase = supabaseAdmin();
  let ordersQuery = supabase.from("orders").select("id,total,subtotal,discount_amount,created_at,payment_status").eq("payment_status", "paid");
  if (from && !Number.isNaN(Date.parse(from))) ordersQuery = ordersQuery.gte("created_at", new Date(from).toISOString());
  if (to && !Number.isNaN(Date.parse(to))) ordersQuery = ordersQuery.lt("created_at", new Date(new Date(to).getTime() + 86400000).toISOString());
  const { data: orders, error: ordersError } = await ordersQuery;
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });
  const orderIds = (orders || []).map((order) => order.id);
  const { data: items, error: itemError } = orderIds.length ? await supabase.from("order_items").select("product_name,quantity,unit_price,order_id").in("order_id", orderIds) : { data: [], error: null };
  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  const topProducts = Object.values((items || []).reduce<Record<string, { product_name: string; quantity: number; revenue: number }>>((result, item) => { const key = item.product_name; result[key] ||= { product_name: key, quantity: 0, revenue: 0 }; result[key].quantity += item.quantity; result[key].revenue += Number(item.unit_price) * item.quantity; return result; }, {})).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  return NextResponse.json({ summary: { revenue: (orders || []).reduce((sum, order) => sum + Number(order.total), 0), orders: orders?.length || 0, discounts: (orders || []).reduce((sum, order) => sum + Number(order.discount_amount || 0), 0) }, topProducts });
}

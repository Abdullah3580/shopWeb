import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const supabase = supabaseAdmin();
  const { data: reviews, error } = await supabase.from("product_reviews").select("*, products(name,images)").eq("user_id", session.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: orders } = await supabase.from("orders").select("id,tran_id").eq("customer_user_id", session.user.id).eq("order_status", "delivered");
  const orderIds = (orders || []).map((order) => order.id);
  const { data: items } = orderIds.length ? await supabase.from("order_items").select("order_id,product_id,product_name").in("order_id", orderIds) : { data: [] };
  const reviewed = new Set((reviews || []).map((review) => `${review.order_id}:${review.product_id}`));
  const toReview = (items || []).filter((item) => !reviewed.has(`${item.order_id}:${item.product_id}`)).map((item) => ({ ...item, tran_id: orders?.find((order) => order.id === item.order_id)?.tran_id }));
  return NextResponse.json({ reviews: reviews || [], toReview });
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || ""); const productId = String(body.product_id || ""); const rating = Number(body.rating); const comment = String(body.comment || "").trim().slice(0, 1000);
  if (!orderId || !productId || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Valid review details are required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: order } = await supabase.from("orders").select("id").eq("id", orderId).eq("customer_user_id", session.user.id).eq("order_status", "delivered").single();
  if (!order) return NextResponse.json({ error: "You can review delivered orders only" }, { status: 403 });
  const { data: item } = await supabase.from("order_items").select("id").eq("order_id", orderId).eq("product_id", productId).maybeSingle();
  if (!item) return NextResponse.json({ error: "Product was not in this order" }, { status: 403 });
  const { data, error } = await supabase.from("product_reviews").insert({ user_id: session.user.id, order_id: orderId, product_id: productId, rating, comment: comment || null }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This product is already reviewed" : error.message }, { status: 400 });
  return NextResponse.json({ review: data });
}

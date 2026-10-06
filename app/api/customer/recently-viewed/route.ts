//D:\Desktop\-\startup\shopWeb\app\api\customer\recently-viewed\route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productId = String(body.product_id || "");
  if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  const session = await getCustomerSession();
  if (session) {
    const { error } = await supabaseAdmin().from("recently_viewed_products").upsert({ user_id: session.user.id, product_id: productId, viewed_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ products: [] });
  // The anon client has no logged-in user in RLS terms, so it always returned an empty list.
  // Use the server client, filter by the verified session user, and hide inactive products.
  const { data, error } = await supabaseAdmin().from("recently_viewed_products").select("viewed_at,products!inner(*)").eq("user_id", session.user.id).eq("products.is_active", true).order("viewed_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [] });
}
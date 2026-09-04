import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const productId = String((await req.json().catch(() => ({}))).product_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const session = await getCustomerSession();
  const { error } = await supabaseAdmin().from("product_view_events").insert({ product_id: productId, user_id: session?.user.id || null, session_id: req.cookies.get("myshopbd_discovery_session")?.value || null });
  if (error) return NextResponse.json({ error: "Unable to record product view" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

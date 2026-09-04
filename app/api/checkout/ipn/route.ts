import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateSSLCommerzTransaction } from "@/lib/sslcommerz";

type PaymentStatus = "paid" | "failed" | "cancelled";

async function handle(req: NextRequest) {
  const redirectType = req.nextUrl.searchParams.get("redirect");
  const queryTranId = req.nextUrl.searchParams.get("tran_id");
  let formData: Record<string, string> = {};
  try {
    const form = await req.formData();
    form.forEach((value, key) => { if (typeof value === "string") formData[key] = value; });
  } catch { /* Browser redirects may have no form body. */ }

  const tranId = formData.tran_id || queryTranId;
  const valId = formData.val_id;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !tranId) {
    return redirectType ? NextResponse.redirect(`${appUrl || ""}/checkout/fail`) : NextResponse.json({ error: "Missing transaction" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: order, error: orderError } = await supabase.from("orders").select("id,tran_id,total,payment_method,payment_status").eq("tran_id", tranId).single();
  if (orderError || !order) return redirectType ? NextResponse.redirect(`${appUrl}/checkout/fail`) : NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_method !== "sslcommerz") return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  let paymentStatus: PaymentStatus = redirectType === "cancel" ? "cancelled" : "failed";
  let validation: Record<string, unknown> = {};
  if (valId && redirectType !== "cancel") {
    validation = await validateSSLCommerzTransaction(valId);
    const valid = (validation.status === "VALID" || validation.status === "VALIDATED")
      && validation.tran_id === tranId
      && validation.currency === "BDT"
      && Number(validation.amount) === Number(order.total);
    if (valid) paymentStatus = "paid";
  }

  if (order.payment_status !== "paid") {
    await supabase.from("orders").update({ payment_status: paymentStatus, updated_at: new Date().toISOString() }).eq("id", order.id).neq("payment_status", "paid");
    await supabase.from("payment_transactions").upsert({ order_id: order.id, tran_id: tranId, gateway: "sslcommerz", gateway_val_id: valId || null, amount: Number(order.total), status: paymentStatus, raw_response: validation }, { onConflict: "tran_id" });
    if (paymentStatus !== "paid") await supabase.rpc("release_order_inventory", { p_tran_id: tranId });
  }

  if (!redirectType) return NextResponse.json({ received: true });
  const destination = paymentStatus === "paid" ? "success" : paymentStatus === "cancelled" ? "cancel" : "fail";
  return NextResponse.redirect(`${appUrl}/checkout/${destination}?order=${encodeURIComponent(tranId)}`);
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateSSLCommerzTransaction } from "@/lib/sslcommerz";

function checkoutRedirect(req: NextRequest, destination: "success" | "fail" | "cancel") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const tranId = req.nextUrl.searchParams.get("tran_id");
  if (!appUrl) return NextResponse.json({ error: "Payment configuration is incomplete" }, { status: 503 });
  const query = tranId ? `?order=${encodeURIComponent(tranId)}` : "";
  return NextResponse.redirect(`${appUrl}/checkout/${destination}${query}`);
}

// Browser redirects are untrusted. They may show a result page, but never change an order.
export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect");
  return checkoutRedirect(req, redirect === "cancel" ? "cancel" : redirect === "success" ? "success" : "fail");
}

// Only a gateway callback with a validation ID can update a payment record.
export async function POST(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect");
  const form = await req.formData().catch(() => null);
  const tranId = form?.get("tran_id");
  const valId = form?.get("val_id");
  if (typeof tranId !== "string" || typeof valId !== "string") {
    return redirect ? checkoutRedirect(req, "fail") : NextResponse.json({ error: "Missing payment validation data" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: order, error } = await supabase.from("orders").select("id,tran_id,total,payment_method,payment_status").eq("tran_id", tranId).single();
    if (error || !order || order.payment_method !== "sslcommerz") {
      return redirect ? checkoutRedirect(req, "fail") : NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const validation = await validateSSLCommerzTransaction(valId);
    const isPaid = (validation.status === "VALID" || validation.status === "VALIDATED")
      && validation.tran_id === tranId
      && validation.currency === "BDT"
      && Number(validation.amount) === Number(order.total);

    if (isPaid && order.payment_status !== "paid") {
      const { error: updateError } = await supabase.from("orders").update({ payment_status: "paid", updated_at: new Date().toISOString() }).eq("id", order.id).neq("payment_status", "paid");
      if (updateError) throw updateError;
      await supabase.from("payment_transactions").upsert({ order_id: order.id, tran_id: tranId, gateway: "sslcommerz", gateway_val_id: valId, amount: Number(order.total), status: "paid", raw_response: validation }, { onConflict: "tran_id" });
    }

    if (redirect) return checkoutRedirect(req, isPaid ? "success" : "fail");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payment validation failed", error);
    return redirect ? checkoutRedirect(req, "fail") : NextResponse.json({ error: "Payment validation failed" }, { status: 502 });
  }
}

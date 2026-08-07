import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateSSLCommerzTransaction } from "@/lib/sslcommerz";

// SSLCommerz calls this endpoint two ways:
// 1. Browser redirect (success_url/fail_url/cancel_url) — has ?redirect=success|fail|cancel
// 2. Server-to-server IPN (ipn_url) — no "redirect" query param, just confirms payment async
async function handle(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const redirectType = searchParams.get("redirect"); // success | fail | cancel | null
  const tranIdFromQuery = searchParams.get("tran_id");

  let valId: string | null = null;
  let tranId = tranIdFromQuery;

  // SSLCommerz posts form-encoded data on both the redirect and the IPN call
  try {
    const form = await req.formData();
    valId = (form.get("val_id") as string) || null;
    tranId = (form.get("tran_id") as string) || tranId;
  } catch {
    // no body — fine, we may already have tran_id from the query string
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const supabase = supabaseAdmin();

  if (!tranId) {
    return redirectType
      ? NextResponse.redirect(`${appUrl}/checkout/fail`)
      : NextResponse.json({ error: "Missing tran_id" }, { status: 400 });
  }

  let paymentStatus: "paid" | "failed" | "cancelled" = "failed";

  if (redirectType === "cancel") {
    paymentStatus = "cancelled";
  } else if (valId) {
    // Always re-validate server-side with SSLCommerz — never trust the redirect status alone.
    const validation = await validateSSLCommerzTransaction(valId);
    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      paymentStatus = "paid";
    }
  }

  await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("tran_id", tranId);

  // Server-to-server IPN call: just acknowledge, no redirect needed
  if (!redirectType) {
    return NextResponse.json({ received: true });
  }

  // Browser redirect: send the customer to the right confirmation page
  const destination =
    paymentStatus === "paid" ? "success" : paymentStatus === "cancelled" ? "cancel" : "fail";
  return NextResponse.redirect(`${appUrl}/checkout/${destination}?order=${tranId}`);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { initiateSSLCommerzPayment } from "@/lib/sslcommerz";
import { getCustomerSession } from "@/lib/customer-auth";

type CheckoutBody = {
  customer?: { name?: unknown; phone?: unknown; email?: unknown; address?: unknown; city?: unknown; payment_method?: unknown };
  items?: Array<{ product_id?: unknown; quantity?: unknown }>;
  couponCode?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const customer = body.customer;
    const name = text(customer?.name, 120);
    const phone = text(customer?.phone, 30);
    const email = customer?.email ? text(customer.email, 160) : null;
    const address = text(customer?.address, 500);
    const city = customer?.city === "inside_dhaka" || customer?.city === "outside_dhaka" ? customer.city : null;
    const paymentMethod = customer?.payment_method === "cod" || customer?.payment_method === "sslcommerz" ? customer.payment_method : null;
    const couponCode = body.couponCode ? text(body.couponCode, 40) : null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!name || !phone || !address || !city || !paymentMethod || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: "Invalid checkout details" }, { status: 400 });
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (paymentMethod === "sslcommerz" && (!appUrl || !process.env.SSLCZ_STORE_ID || !process.env.SSLCZ_STORE_PASSWORD)) {
      return NextResponse.json({ error: "Payment configuration is incomplete" }, { status: 503 });
    }

    const supabase = supabaseAdmin();
    const { data: settings, error: settingsError } = await supabase.from("store_settings").select("cod_enabled,sslcommerz_enabled").eq("id", 1).single();
    if (settingsError || !settings || (paymentMethod === "cod" && !settings.cod_enabled) || (paymentMethod === "sslcommerz" && !settings.sslcommerz_enabled)) {
      return NextResponse.json({ error: "This payment method is currently unavailable." }, { status: 400 });
    }

    const normalizedItems = items.map((item) => ({ product_id: typeof item.product_id === "string" ? item.product_id : "", quantity: Number(item.quantity) }));
    if (normalizedItems.some((item) => !/^[0-9a-f-]{36}$/i.test(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
    }

    const idempotencyKey = req.headers.get("x-idempotency-key") || crypto.randomUUID();
    if (idempotencyKey.length < 16 || idempotencyKey.length > 100) return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });

    const { data: order, error } = await supabase.rpc("create_order_with_coupon", {
      p_idempotency_key: idempotencyKey,
      p_customer_name: name,
      p_customer_phone: phone,
      p_customer_email: email,
      p_shipping_address: address,
      p_shipping_city: city,
      p_payment_method: paymentMethod,
      p_coupon_code: couponCode,
      p_items: normalizedItems,
    });

    if (error || !order) {
      console.error("Order transaction failed", error);
      const message = error?.message?.toLowerCase().includes("insufficient stock") ? "One or more products are out of stock." : "Unable to create order. Please try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const customerSession = await getCustomerSession();
    if (customerSession) await supabase.from("orders").update({ customer_user_id: customerSession.user.id }).eq("id", order.id);

    if (paymentMethod === "cod") return NextResponse.json({ tranId: order.tran_id, total: order.total });

    try {
      const gatewayUrl = await initiateSSLCommerzPayment({
        tranId: order.tran_id,
        totalAmount: Number(order.total),
        customerName: name,
        customerEmail: email || "no-reply@myshopbd.com",
        customerPhone: phone,
        customerAddress: address,
        customerCity: city,
        successUrl: `${appUrl}/api/checkout/ipn?redirect=success&tran_id=${order.tran_id}`,
        failUrl: `${appUrl}/api/checkout/ipn?redirect=fail&tran_id=${order.tran_id}`,
        cancelUrl: `${appUrl}/api/checkout/ipn?redirect=cancel&tran_id=${order.tran_id}`,
        ipnUrl: `${appUrl}/api/checkout/ipn`,
      });
      return NextResponse.json({ tranId: order.tran_id, gatewayUrl, total: order.total });
    } catch (paymentError) {
      console.error("Payment initialization failed", paymentError);
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id).eq("payment_status", "pending");
      await supabase.rpc("release_order_inventory", { p_tran_id: order.tran_id });
      return NextResponse.json({ error: "Payment gateway is unavailable. Please try again." }, { status: 502 });
    }
  } catch (error) {
    console.error("Checkout request failed", error);
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }
}

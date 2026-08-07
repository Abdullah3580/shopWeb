import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { initiateSSLCommerzPayment } from "@/lib/sslcommerz";
import { CartItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, subtotal, shippingFee, total } = body as {
      customer: {
        name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        payment_method: "cod" | "sslcommerz";
      };
      items: CartItem[];
      subtotal: number;
      shippingFee: number;
      total: number;
    };

    if (!customer?.name || !customer?.phone || !customer?.address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const tranId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 1. Create the order as "pending"
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        tran_id: tranId,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        shipping_address: customer.address,
        shipping_city: customer.city,
        subtotal,
        shipping_fee: shippingFee,
        total,
        payment_method: customer.payment_method,
        payment_status: customer.payment_method === "cod" ? "pending" : "pending",
        order_status: "processing",
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error(orderErr);
      return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    // 2. Insert line items
    const lineItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
    }));
    await supabase.from("order_items").insert(lineItems);

    // 3. Cash on delivery: nothing more to do, return tranId for the success page
    if (customer.payment_method === "cod") {
      return NextResponse.json({ tranId });
    }

    // 4. Online payment: create an SSLCommerz session and return the gateway URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const gatewayUrl = await initiateSSLCommerzPayment({
      tranId,
      totalAmount: total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      successUrl: `${appUrl}/api/checkout/ipn?redirect=success&tran_id=${tranId}`,
      failUrl: `${appUrl}/api/checkout/ipn?redirect=fail&tran_id=${tranId}`,
      cancelUrl: `${appUrl}/api/checkout/ipn?redirect=cancel&tran_id=${tranId}`,
      ipnUrl: `${appUrl}/api/checkout/ipn`,
    });

    return NextResponse.json({ tranId, gatewayUrl });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

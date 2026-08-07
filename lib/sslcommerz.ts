// Minimal SSLCommerz REST integration (no extra npm package needed).
// Docs: https://developer.sslcommerz.com/
//
// Sandbox test credentials (store_id / store_passwd) can be created for free at:
// https://developer.sslcommerz.com/registration/
//
// IMPORTANT: SSLCommerz's own gateway is what actually shows the bKash/Nagad/Rocket/
// card options to the customer — Mastercard-style aggregation. You don't integrate
// bKash/Nagad separately; SSLCommerz handles that once your store is approved.

const SSLCZ_BASE = process.env.SSLCZ_IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

type InitPaymentParams = {
  tranId: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
};

export async function initiateSSLCommerzPayment(params: InitPaymentParams) {
  const body = new URLSearchParams({
    store_id: process.env.SSLCZ_STORE_ID!,
    store_passwd: process.env.SSLCZ_STORE_PASSWORD!,
    total_amount: params.totalAmount.toString(),
    currency: "BDT",
    tran_id: params.tranId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    cus_name: params.customerName,
    cus_email: params.customerEmail || "no-reply@myshopbd.com",
    cus_add1: params.customerAddress,
    cus_city: params.customerCity,
    cus_country: "Bangladesh",
    cus_phone: params.customerPhone,
    shipping_method: "Courier",
    product_name: "MyShopBD Order",
    product_category: "General",
    product_profile: "general",
  });

  const res = await fetch(`${SSLCZ_BASE}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();

  if (data.status !== "SUCCESS") {
    throw new Error(data.failedreason || "SSLCommerz session creation failed");
  }

  return data.GatewayPageURL as string;
}

// Called from the IPN handler to double-check the transaction is genuine
// before marking an order as paid (never trust the client-side redirect alone).
export async function validateSSLCommerzTransaction(valId: string) {
  const url = `${SSLCZ_BASE}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${process.env.SSLCZ_STORE_ID}&store_passwd=${process.env.SSLCZ_STORE_PASSWORD}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  return data; // data.status should be "VALID" or "VALIDATED"
}

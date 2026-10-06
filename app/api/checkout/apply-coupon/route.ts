//app/api/checkout/apply-coupon/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`apply-coupon:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const { code, orderAmount } = await request.json().catch(() => ({} as { code?: unknown; orderAmount?: unknown }));

  if (typeof code !== "string" || code.trim().length < 1 || code.trim().length > 40 || typeof orderAmount !== "number" || !Number.isFinite(orderAmount) || orderAmount < 0) {
    return NextResponse.json({ error: "Coupon code and valid order amount are required" }, { status: 400 });
  }

  const { data: coupon, error } = await supabaseAdmin()
    .from("coupons")
    .select("id,code,discount_type,discount_value,max_discount,min_order_amount,max_uses,usage_count,starts_at,expires_at")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ error: "Coupon is not active yet" }, { status: 400 });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }
  if (coupon.max_uses !== null && Number(coupon.usage_count || 0) >= Number(coupon.max_uses)) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }
  if (coupon.min_order_amount && orderAmount < Number(coupon.min_order_amount)) {
    return NextResponse.json({ error: `Minimum order amount of ৳${coupon.min_order_amount} required` }, { status: 400 });
  }

  let discountAmount = 0;
  if (coupon.discount_type === "fixed") {
    discountAmount = Number(coupon.discount_value);
  } else if (coupon.discount_type === "percentage") {
    discountAmount = (orderAmount * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
      discountAmount = Number(coupon.max_discount);
    }
  }

  discountAmount = Math.round(Math.min(discountAmount, orderAmount) * 100) / 100;

  return NextResponse.json({
    couponId: coupon.id,
    code: coupon.code,
    discountAmount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
  });
}
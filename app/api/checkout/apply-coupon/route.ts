import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { code, orderAmount } = await request.json();

  if (!code || typeof orderAmount !== 'number') {
    return NextResponse.json({ error: 'Coupon code and valid order amount are required' }, { status: 400 });
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ error: 'Coupon is not active yet' }, { status: 400 });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
  }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }
  if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
    return NextResponse.json({ error: `Minimum order amount of ৳${coupon.min_order_amount} required` }, { status: 400 });
  }

  let discountAmount = 0;
  if (coupon.discount_type === 'fixed') {
    discountAmount = coupon.discount_value;
  } else if (coupon.discount_type === 'percentage') {
    discountAmount = (orderAmount * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount;
    }
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  return NextResponse.json({
    couponId: coupon.id,
    code: coupon.code,
    discountAmount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value
  });
}

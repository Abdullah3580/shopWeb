import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from('order_refunds')
    .select(`*, orders ( id, total, order_status )`)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Refund query failed', error);
    return NextResponse.json({ error: 'Unable to load refunds' }, { status: 500 });
  }
  return NextResponse.json({ refunds: data });
}

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  const amount = Number(body.amount);
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !Number.isFinite(amount) || amount <= 0 || !reason) {
    return NextResponse.json({ error: 'Order ID, amount, and reason are required' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: order } = await supabase
    .from('orders')
    .select('id, total, customer_user_id, order_status')
    .eq('id', orderId)
    .eq('customer_user_id', session.user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (amount > Number(order.total) || !['delivered', 'cancelled'].includes(order.order_status)) {
    return NextResponse.json({ error: 'This order is not eligible for a refund' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('order_refunds')
    .insert({
      order_id: orderId,
      user_id: session.user.id,
      amount,
      reason,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Refund creation failed', error);
    return NextResponse.json({ error: 'Unable to create refund request' }, { status: 500 });
  }
  return NextResponse.json({ refund: data });
}

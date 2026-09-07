import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = supabaseAdmin();

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_status, created_at')
    .eq('id', orderId)
    .eq('customer_user_id', session.user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: logs, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Order tracking query failed', error);
    return NextResponse.json({ error: 'Unable to load order tracking' }, { status: 500 });
  }

  return NextResponse.json({ currentStatus: order.order_status, timeline: logs || [] });
}

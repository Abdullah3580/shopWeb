import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await requireAdminRole(['manager', 'finance']);
  if (!session) return NextResponse.json({ error: 'Analytics permission required' }, { status: 403 });

  const { data: orders, error } = await supabaseAdmin()
    .from('orders')
    .select('total, payment_status, created_at')
    .eq('payment_status', 'paid');
  if (error) {
    console.error('Analytics query failed', error);
    return NextResponse.json({ error: 'Unable to load analytics' }, { status: 500 });
  }

  const totalRevenue = orders?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0;
  const totalOrders = orders?.length || 0;

  return NextResponse.json({
    revenue: totalRevenue,
    ordersCount: totalOrders,
    successRate: totalOrders > 0 ? 100 : 0
  });
}

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, status, created_at');

  const totalRevenue = orders?.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;

  return NextResponse.json({
    revenue: totalRevenue,
    ordersCount: totalOrders,
    successRate: totalOrders > 0 ? 100 : 0
  });
}

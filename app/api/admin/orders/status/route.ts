import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { orderId, newStatus, notes } = await request.json();

  if (!orderId || !newStatus) {
    return NextResponse.json({ error: 'Order ID and new status are required' }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await supabase.from('order_status_logs').insert({
    order_id: orderId,
    status: newStatus,
    notes: notes || `Status updated to ${newStatus}`
  });

  return NextResponse.json({ success: true });
}

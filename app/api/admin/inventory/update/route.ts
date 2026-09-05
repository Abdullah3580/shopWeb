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

  const { productId, stockChange, reason } = await request.json();

  if (!productId || typeof stockChange !== 'number') {
    return NextResponse.json({ error: 'Product ID and stock change amount required' }, { status: 400 });
  }

  const { data: product, error: fetchErr } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (fetchErr || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const newStock = Math.max(0, (product.stock || 0) + stockChange);

  const { error: updateErr } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await supabase.from('inventory_logs').insert({
    product_id: productId,
    change_amount: stockChange,
    reason: reason || 'Manual adjustment'
  });

  return NextResponse.json({ success: true, newStock });
}

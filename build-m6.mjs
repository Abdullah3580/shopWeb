import fs from 'fs';
import path from 'path';

const files = {
  'app/api/admin/inventory/update/route.ts': `import { createServerClient } from '@supabase/ssr';
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
`,
  'app/api/admin/orders/status/route.ts': `import { createServerClient } from '@supabase/ssr';
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
    notes: notes || \`Status updated to \${newStatus}\`
  });

  return NextResponse.json({ success: true });
}
`,
  'components/admin/InventoryUpdater.tsx': `'use client';

import { useState } from 'react';

export default function InventoryUpdater({ productId, currentStock }: { productId: string; currentStock: number }) {
  const [stock, setStock] = useState(currentStock);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (adjustment === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stockChange: adjustment, reason: 'Admin Manual Adjustment' })
      });

      const data = await res.json();
      if (res.ok) {
        setStock(data.newStock);
        setAdjustment(0);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded border bg-gray-50 p-2 text-xs">
      <span className="font-semibold text-gray-700">Stock: {stock}</span>
      <input
        type="number"
        value={adjustment}
        onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
        className="w-16 rounded border px-2 py-1 text-xs"
        placeholder="+/-"
      />
      <button
        onClick={handleUpdate}
        disabled={loading || adjustment === 0}
        className="rounded bg-black px-3 py-1 font-medium text-white hover:bg-gray-800 disabled:opacity-40"
      >
        {loading ? '...' : 'Update'}
      </button>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created: ${filePath}`);
}
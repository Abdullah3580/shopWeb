'use client';

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

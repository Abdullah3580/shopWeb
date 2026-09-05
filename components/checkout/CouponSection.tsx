'use client';

import { useState } from 'react';

interface CouponSectionProps {
  orderAmount: number;
  onApplyDiscount: (discount: number, couponCode: string | null) => void;
}

export default function CouponSection({ orderAmount, onApplyDiscount }: CouponSectionProps) {
  const [code, setCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply coupon');

      setAppliedCoupon(data.code);
      setDiscount(data.discountAmount);
      onApplyDiscount(data.discountAmount, data.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCode('');
    setError(null);
    onApplyDiscount(0, null);
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Apply Voucher / Coupon</h3>
      
      {appliedCoupon ? (
        <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 p-3 border border-green-200">
          <div>
            <span className="font-bold text-green-700">{appliedCoupon}</span>
            <p className="text-xs text-green-600">Discount: -৳{discount.toFixed(2)}</p>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm uppercase focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

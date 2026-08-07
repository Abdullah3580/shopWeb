"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">আপনার কার্ট খালি।</p>
        <Link href="/" className="text-brand-600 font-medium">
          শপিং শুরু করুন →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-3">
        <h1 className="text-2xl font-bold mb-4">আপনার কার্ট</h1>
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center gap-4 bg-white border rounded-xl p-3"
          >
            <img
              src={item.image || "https://placehold.co/100x100?text=No+Image"}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg bg-gray-100"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-brand-600 font-semibold">৳{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="w-8 h-8 border rounded-lg"
              >
                -
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                className="w-8 h-8 border rounded-lg"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.product_id)}
              className="text-red-500 text-sm ml-2"
            >
              মুছুন
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5 h-fit space-y-3">
        <h2 className="font-bold text-lg">অর্ডার সামারি</h2>
        <div className="flex justify-between text-sm">
          <span>সাবটোটাল</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>ডেলিভারি চার্জ</span>
          <span>চেকআউটে হিসাব হবে</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>মোট</span>
          <span>৳{subtotal}</span>
        </div>
        <Link
          href="/checkout"
          className="block text-center bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-lg transition"
        >
          চেকআউটে যান
        </Link>
      </div>
    </div>
  );
}

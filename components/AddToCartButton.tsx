"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Product } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-9 h-9 border rounded-lg text-lg"
        >
          -
        </button>
        <span className="w-8 text-center">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="w-9 h-9 border rounded-lg text-lg"
        >
          +
        </button>
        <span className="text-xs text-gray-500">স্টকে আছে: {product.stock}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
        >
          {added ? "✓ কার্টে যোগ হয়েছে" : "কার্টে যোগ করুন"}
        </button>
        <button
          onClick={() => {
            handleAdd();
            router.push("/checkout");
          }}
          disabled={product.stock === 0}
          className="flex-1 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
        >
          এখনই কিনুন
        </button>
      </div>
    </div>
  );
}

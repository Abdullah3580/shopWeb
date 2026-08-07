"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { useWishlist } from "@/lib/wishlist-context";

export default function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
      )
    : 0;
  const wished = has(product.id);

  return (
    <div className="group bg-white rounded-xl border hover:shadow-lg transition overflow-hidden relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(product.id);
        }}
        aria-label="wishlist"
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-sm"
      >
        {wished ? "❤️" : "🤍"}
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <img
            src={product.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs px-2 py-1 rounded">
              -{discountPct}%
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-xs text-green-600 mb-1">স্টকে আছে</p>
          <div className="flex items-center gap-2">
            <span className="text-brand-600 font-semibold">৳{product.price}</span>
            {hasDiscount && (
              <span className="text-gray-400 text-xs line-through">
                ৳{product.compare_at_price}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { OfferBar } from "@/components/Hero";

export default function Header() {
  const { totalCount } = useCart();

  return (
    <div className="sticky top-0 z-50">
      <OfferBar />
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            MyShop<span className="text-gray-800">BD</span>
          </Link>

          <div className="flex-1 max-w-xl hidden md:block">
            <input
              type="text"
              placeholder="প্রোডাক্ট খুঁজুন..."
              className="w-full border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <span>🛒</span>
            <span className="hidden sm:inline text-sm font-medium">কার্ট</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </header>
    </div>
  );
}

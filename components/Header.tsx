"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { OfferBar } from "@/components/Hero";
import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/wishlist-context";

export default function Header() {
  const { totalCount } = useCart();
  const { ids } = useWishlist();
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => { fetch("/api/customer/auth").then((response) => response.json()).then((result) => setAuthenticated(Boolean(result.authenticated))); }, []);
  async function logout() { await fetch("/api/customer/auth", { method: "DELETE" }); setAuthenticated(false); }

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

          <Link href={authenticated ? "/account/wishlist" : "/account/login"} className="relative rounded-lg px-3 py-2 hover:bg-gray-100" aria-label="Wishlist">
            <span>♡</span>
            {ids.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">{ids.length}</span>}
          </Link>

          {authenticated ? <div className="group relative"><button className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100">Account ▾</button><div className="invisible absolute right-0 top-full z-50 w-44 rounded-lg border bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100"><Link href="/account" className="block rounded px-3 py-2 text-sm hover:bg-orange-50">My Account</Link><Link href="/account/orders" className="block rounded px-3 py-2 text-sm hover:bg-orange-50">My Orders</Link><Link href="/account/wishlist" className="block rounded px-3 py-2 text-sm hover:bg-orange-50">Wishlist</Link><button onClick={logout} className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Logout</button></div></div> : <Link href="/account/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 sm:block">Login</Link>}
        </div>
      </header>
    </div>
  );
}

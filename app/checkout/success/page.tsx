"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

function SuccessContent() {
  const params = useSearchParams();
  const order = params.get("order");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">অর্ডার কনফার্ম হয়েছে!</h1>
      <p className="text-gray-600 mb-1">আপনার অর্ডার আইডি:</p>
      <p className="font-mono font-semibold mb-6">{order}</p>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        আমরা শীঘ্রই আপনার দেওয়া মোবাইল নাম্বারে যোগাযোগ করব। ধন্যবাদ MyShopBD-এ কেনাকাটার জন্য।
      </p>
      <Link href="/" className="text-brand-600 font-medium">
        আরও শপিং করুন →
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">লোড হচ্ছে...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

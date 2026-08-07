"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function FailContent() {
  const params = useSearchParams();
  const order = params.get("order");

  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">❌</div>
      <h1 className="text-2xl font-bold mb-2">পেমেন্ট ব্যর্থ হয়েছে</h1>
      {order && <p className="text-gray-600 mb-6">অর্ডার আইডি: {order}</p>}
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        দুঃখিত, আপনার পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।
      </p>
      <Link href="/checkout" className="text-brand-600 font-medium">
        আবার চেষ্টা করুন →
      </Link>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">লোড হচ্ছে...</div>}>
      <FailContent />
    </Suspense>
  );
}

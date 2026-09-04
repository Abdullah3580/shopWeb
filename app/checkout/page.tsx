"use client";

import { useCart } from "@/lib/cart-context";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const router = useRouter();
  const checkoutKey = useRef(crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [shippingFees, setShippingFees] = useState<{ inside_dhaka: number; outside_dhaka: number } | null>(null);
  useEffect(() => { fetch("/api/store-settings").then((response) => response.json()).then((result) => { if (result.settings) setShippingFees({ inside_dhaka: Number(result.settings.inside_dhaka_shipping), outside_dhaka: Number(result.settings.outside_dhaka_shipping) }); }); }, []);
  useEffect(() => { fetch("/api/customer/addresses").then((response) => response.ok ? response.json() : null).then((result) => { const address = result?.addresses?.find((item: { is_default: boolean }) => item.is_default); if (address) setForm((current) => ({ ...current, name: address.recipient_name, phone: address.phone, address: address.full_address })); }); }, []);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "inside_dhaka",
    payment_method: "cod", // cod | sslcommerz
  });

  const shippingFee =
    shippingFees ? (form.city === "inside_dhaka" ? shippingFees.inside_dhaka : shippingFees.outside_dhaka) : 0;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return <p className="text-center py-20 text-gray-500">কার্ট খালি। আগে প্রোডাক্ট যোগ করুন।</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.address) {
      setError("নাম, ফোন নাম্বার এবং ঠিকানা দিন।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": checkoutKey.current },
        body: JSON.stringify({
          customer: form,
          items,
          couponCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।");
        setLoading(false);
        return;
      }

      if (form.payment_method === "cod") {
        // Order placed directly, go to success page
        router.push(`/checkout/success?order=${data.tranId}`);
      } else {
        // Redirect to SSLCommerz payment gateway
        window.location.href = data.gatewayUrl;
      }
    } catch (err) {
      console.error(err);
      setError("নেটওয়ার্ক সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold mb-2">ডেলিভারি তথ্য</h1>

        <div>
          <label className="text-sm font-medium">কুপন কোড</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            placeholder="যদি থাকে"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-gray-500 mt-1">ছাড়টি অর্ডার নিশ্চিত করার সময় সার্ভারে যাচাই হবে।</p>
        </div>

        <div>
          <label className="text-sm font-medium">পুরো নাম</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">মোবাইল নাম্বার</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">ইমেইল (ঐচ্ছিক)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">সম্পূর্ণ ঠিকানা</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 mt-1"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">এলাকা</label>
          <select
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          >
            <option value="inside_dhaka">ঢাকার ভেতরে {shippingFees ? `(৳${shippingFees.inside_dhaka})` : "(লোড হচ্ছে...)"}</option>
            <option value="outside_dhaka">ঢাকার বাইরে {shippingFees ? `(৳${shippingFees.outside_dhaka})` : "(লোড হচ্ছে...)"}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">পেমেন্ট মেথড</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                checked={form.payment_method === "cod"}
                onChange={() => setForm({ ...form, payment_method: "cod" })}
              />
              <span>ক্যাশ অন ডেলিভারি</span>
            </label>
            <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                checked={form.payment_method === "sslcommerz"}
                onChange={() => setForm({ ...form, payment_method: "sslcommerz" })}
              />
              <span>bKash / Nagad / Rocket / কার্ড (SSLCommerz)</span>
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !shippingFees}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
        >
          {loading ? "প্রসেস হচ্ছে..." : !shippingFees ? "সেটিংস লোড হচ্ছে..." : `অর্ডার কনফার্ম করুন — ৳${total}`}
        </button>
      </form>

      <div className="bg-white border rounded-xl p-5 h-fit space-y-3">
        <h2 className="font-bold text-lg">অর্ডার সামারি</h2>
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>৳{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t pt-3 flex justify-between text-sm">
          <span>সাবটোটাল</span>
          <span>৳{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>ডেলিভারি চার্জ</span>
          <span>৳{shippingFee}</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>মোট</span>
          <span>৳{total}</span>
        </div>
      </div>
    </div>
  );
}

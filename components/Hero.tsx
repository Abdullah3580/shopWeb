"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Countdown to end of current day — creates urgency, resets automatically every day.
function useCountdownToMidnight() {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export function OfferBar() {
  const { h, m, s } = useCountdownToMidnight();
  return (
    <div className="bg-gray-900 text-white text-xs sm:text-sm text-center py-2 px-3">
      ⚡ সীমিত সময়ের অফার | নির্বাচিত প্রোডাক্টে ৩০% পর্যন্ত ছাড় | ক্যাশ অন ডেলিভারি সুবিধা —{" "}
      <span className="font-mono font-semibold">
        {h}:{m}:{s}
      </span>
    </div>
  );
}

export function Hero({
  categoryName,
  ctaHref,
}: {
  categoryName: string;
  ctaHref: string;
}) {
  return (
    <section className="bg-gradient-to-br from-brand-50 to-white rounded-2xl border p-8 md:p-14 text-center">
      <p className="text-brand-600 font-semibold text-sm tracking-wide mb-2">
        সীমিত সময়ের অফার
      </p>
      <h1 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">
        {categoryName} — আরও ভালোভাবে কাজ করুন
      </h1>
      <p className="text-gray-600 max-w-xl mx-auto mb-2">
        মনোযোগ ধরে রাখতে ও পরিষ্কারভাবে কাজ করতে সহজ টুলস।
      </p>
      <p className="text-gray-500 text-sm max-w-xl mx-auto mb-6">
        বাংলাদেশের শিক্ষার্থী, পেশাজীবী ও ক্রিয়েটরদের জন্য বিশেষভাবে তৈরি।
      </p>
      <Link
        href={ctaHref}
        className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-3 rounded-full transition"
      >
        এখনই কিনুন
      </Link>
      <p className="text-xs text-gray-400 mt-4 tracking-wide">১০,০০০+ কাস্টমারের পছন্দ</p>
    </section>
  );
}

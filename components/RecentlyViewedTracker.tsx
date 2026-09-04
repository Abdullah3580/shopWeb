"use client";
import { useEffect } from "react";

export default function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ product_id: productId });
    void fetch("/api/customer/recently-viewed", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    void fetch("/api/discovery/view", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }, [productId]);
  return null;
}

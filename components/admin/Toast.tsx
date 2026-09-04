"use client";

import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose?: () => void }) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div role="status" className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div>;
}

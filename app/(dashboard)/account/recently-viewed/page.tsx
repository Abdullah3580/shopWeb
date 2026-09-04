"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
export default function RecentlyViewedPage() {
  const [items, setItems] = useState<Array<{ products: Product }>>([]); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/customer/recently-viewed").then(async (response) => { const result = await response.json(); if (!response.ok) setError(result.error || "Unable to load recently viewed products"); else setItems(result.products || []); }); }, []);
  if (error) return <p className="text-red-600">{error}</p>;
  return <section><h2 className="mb-5 text-2xl font-bold">Recently viewed</h2>{items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map(({ products }) => <ProductCard key={products.id} product={products} />)}</div> : <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Products you view will appear here.</p>}</section>;
}

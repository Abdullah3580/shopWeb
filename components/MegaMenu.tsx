"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Category = { id: string; name: string; slug: string; parent_id: string | null };
export default function MegaMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { fetch("/api/discovery/menu").then((response) => response.json()).then((result) => setCategories(result.categories || [])); }, []);
  const roots = categories.filter((category) => !category.parent_id); const children = (id: string) => categories.filter((category) => category.parent_id === id);
  if (!roots.length) return null;
  return <nav className="hidden border-b bg-white md:block"><div className="group relative mx-auto max-w-7xl px-4 py-2"><button className="text-sm font-semibold text-slate-700">Categories ▾</button><div className="invisible absolute left-4 top-full z-50 grid w-[min(900px,calc(100vw-2rem))] grid-cols-4 gap-5 rounded-b-xl border bg-white p-5 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">{roots.slice(0, 12).map((root) => <section key={root.id}><Link href={`/category/${root.slug}`} className="font-semibold text-slate-900 hover:text-orange-600">{root.name}</Link>{children(root.id).slice(0, 6).map((child) => <Link key={child.id} href={`/category/${child.slug}`} className="mt-2 block text-sm text-slate-500 hover:text-orange-600">{child.name}</Link>)}</section>)}</div></div></nav>;
}

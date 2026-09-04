"use client";

import { FormEvent, useEffect, useState } from "react";
import Toast from "@/components/admin/Toast";

type Product = { id: string; name: string; slug: string; barcode: string | null; price: number; stock: number; reorder_threshold: number; images: string[]; product_variants?: unknown[]; product_images?: { id: string; url: string }[] };
type FormState = { id?: string; name: string; slug: string; barcode: string; price: string; stock: string; reorder_threshold: string; images: string; variants: string; previous_stock?: number };
const empty: FormState = { name: "", slug: "", barcode: "", price: "", stock: "", reorder_threshold: "10", images: "", variants: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  async function load() {
    const auth = await fetch("/api/admin/auth");
    if (!auth.ok || !(await auth.json()).authenticated) { setError("Sign in at /admin first."); return; }
    const response = await fetch("/api/admin"); const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to load products"); return; }
    setProducts(data.products || []);
  }
  useEffect(() => { load(); }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    let variants: unknown[] = [];
    try { variants = form.variants.trim() ? JSON.parse(form.variants) : []; } catch { setError("Variants must be valid JSON."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_product", product: { ...form, price: Number(form.price), stock: Number(form.stock), reorder_threshold: Number(form.reorder_threshold), compare_at_price: null, category_id: null, description: null, images: form.images.split("\n").filter(Boolean), variants } }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Save failed"); return; }
      setNotice("Product saved"); setForm(empty); await load();
    } finally { setSaving(false); }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !form.id) return;
    const body = new FormData(); body.set("file", file); body.set("productId", form.id);
    const response = await fetch("/api/admin/images", { method: "POST", body }); const data = await response.json();
    if (!response.ok) { setError(data.error || "Upload failed"); return; }
    setForm((current) => ({ ...current, images: `${current.images}${current.images ? "\n" : ""}${data.image.url}` })); setNotice("Image uploaded"); await load();
  }
  const filtered = products.filter((product) => `${product.name} ${product.slug} ${product.barcode || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="min-h-screen bg-slate-100 p-5 md:p-8"><Toast message={error || notice} type={error ? "error" : "success"} onClose={() => { setError(""); setNotice(""); }} /><div className="max-w-7xl mx-auto"><header className="flex flex-wrap justify-between gap-4 mb-7"><div><p className="text-xs uppercase tracking-[.25em] text-orange-600 font-bold">Catalog control</p><h1 className="text-3xl font-bold">Products & inventory</h1></div><a href="/admin" className="bg-slate-950 text-white rounded-lg px-4 py-2 h-fit text-sm">Back to dashboard</a></header>{error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}{notice && <p className="bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-4 text-sm">{notice}</p>}<div className="grid xl:grid-cols-[1fr_420px] gap-5"><section className="bg-white border rounded-xl overflow-hidden"><div className="p-5 border-b"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, barcode" className="border rounded-lg px-3 py-2 w-full" /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-4 text-left">Product</th><th className="p-4 text-left">SKU / barcode</th><th className="p-4 text-left">Stock</th><th className="p-4" /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-t"><td className="p-4 font-medium">{product.name}<span className="block text-xs text-slate-400">{product.product_variants?.length || 0} variants</span></td><td className="p-4 text-slate-500">{product.barcode || "Not set"}</td><td className={`p-4 font-semibold ${product.stock <= product.reorder_threshold ? "text-orange-600" : ""}`}>{product.stock} / reorder at {product.reorder_threshold}</td><td className="p-4 text-right"><button onClick={() => setForm({ ...product, barcode: product.barcode || "", price: String(product.price), stock: String(product.stock), reorder_threshold: String(product.reorder_threshold), images: product.images.join("\n"), variants: JSON.stringify(product.product_variants || [], null, 2), previous_stock: product.stock })} className="text-orange-600 font-semibold">Edit</button></td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-slate-500">No products found.</p>}</div></section><form onSubmit={save} className="bg-white border rounded-xl p-5 space-y-3 h-fit"><h2 className="font-bold text-lg">{form.id ? "Edit product" : "Add product"}</h2>{([["name", "Product name"], ["slug", "Slug"], ["barcode", "Barcode"], ["price", "Price"], ["stock", "Stock"], ["reorder_threshold", "Reorder threshold"]] as const).map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<input required={key !== "barcode"} type={key === "price" || key === "stock" || key === "reorder_threshold" ? "number" : "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>)}<label className="block text-sm font-medium">Image URLs<textarea value={form.images} onChange={(event) => setForm({ ...form, images: event.target.value })} rows={3} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>{form.id && <label className="block text-sm font-medium">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} className="mt-1 w-full text-sm" /></label>}<label className="block text-sm font-medium">Variants JSON<textarea value={form.variants} onChange={(event) => setForm({ ...form, variants: event.target.value })} rows={7} placeholder='[{"sku":"RED-M","barcode":"123","name":"Red / M","options":{"color":"red","size":"M"},"price":1490,"stock":10}]' className="mt-1 w-full border rounded-lg px-3 py-2 font-mono text-xs" /></label><button disabled={saving} className="w-full bg-orange-500 text-white rounded-lg py-3 font-semibold disabled:opacity-50">{saving ? "Saving..." : "Save product"}</button></form></div></div></main>;
}

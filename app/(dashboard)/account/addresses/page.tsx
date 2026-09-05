// "use client";
// import { FormEvent, useEffect, useState } from "react";
// type Address = { id: string; label: string; recipient_name: string; phone: string; full_address: string; city: string; zone: string | null; is_default: boolean };
// const empty = { label: "Home", recipient_name: "", phone: "", full_address: "", city: "", zone: "", is_default: false };
// export default function AddressesPage() { const [addresses, setAddresses] = useState<Address[]>([]); const [form, setForm] = useState<any>(empty); const [error, setError] = useState(""); async function load() { const response = await fetch("/api/customer/addresses"); const result = await response.json(); if (!response.ok) setError(result.error || "Unable to load addresses"); else setAddresses(result.addresses || []); } useEffect(() => { load(); }, []); async function save(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/customer/addresses", { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const result = await response.json(); if (!response.ok) setError(result.error || "Save failed"); else { setForm(empty); load(); } } async function remove(id: string) { await fetch(`/api/customer/addresses?id=${id}`, { method: "DELETE" }); load(); } return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Address book</h2>{addresses.map((address) => <div key={address.id} className="mt-4 rounded-lg border p-4"><div className="flex justify-between"><p className="font-semibold">{address.label} {address.is_default && <span className="text-xs text-orange-600">Default</span>}</p><div className="space-x-3 text-sm"><button onClick={() => setForm(address)} className="text-orange-600">Edit</button><button onClick={() => remove(address.id)} className="text-red-600">Delete</button></div></div><p className="mt-2 text-sm leading-6">{address.recipient_name}<br />{address.phone}<br />{address.full_address}, {address.city} {address.zone}</p></div>)}{!addresses.length && <p className="mt-5 text-sm text-slate-500">No saved addresses.</p>}</section><form onSubmit={save} className="h-fit space-y-3 rounded-xl border bg-white p-5"><h2 className="font-bold">{form.id ? "Edit address" : "Add address"}</h2>{[["recipient_name","Recipient name"],["phone","Phone"],["full_address","Full address"],["city","City"],["zone","Zone"]].map(([key,label]) => <label key={key} className="block text-sm font-medium">{label}<input required={key !== "zone"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>)}<select value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="w-full rounded-lg border px-3 py-2"><option>Home</option><option>Work</option></select><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_default} onChange={(event) => setForm({ ...form, is_default: event.target.checked })} /> Set as default</label>{error && <p className="text-sm text-red-600">{error}</p>}<button className="w-full rounded-lg bg-orange-500 py-3 font-semibold text-white">Save address</button></form></div>; }

'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/account/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-1 text-sm text-gray-500">Sign up to get started</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700">Full Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 rounded-md bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <Link href="/account/login" className="font-semibold text-orange-500 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
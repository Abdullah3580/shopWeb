"use client";
import { useEffect, useState } from "react";

type WalletData = { wallet: { balance: number; reward_coins: number }; transactions: Array<{ id: string; amount: number; coins: number; transaction_type: string; note: string | null; created_at: string }>; rewards: Array<{ id: string; coins: number; event_type: string; note: string | null; created_at: string }> };
export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/customer/wallet").then(async (response) => { const result = await response.json(); if (!response.ok) setError(result.error || "Unable to load wallet"); else setData(result); }); }, []);
  if (error) return <p className="text-red-600">{error}</p>; if (!data) return <p>Loading wallet…</p>;
  return <div className="space-y-5"><section className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Store wallet</p><p className="mt-2 text-3xl font-bold">৳{Number(data.wallet.balance).toFixed(2)}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Reward coins</p><p className="mt-2 text-3xl font-bold">{data.wallet.reward_coins}</p></div></section><section className="rounded-xl border bg-white p-5"><h2 className="font-bold">Wallet activity</h2>{data.transactions.map((item) => <div key={item.id} className="flex justify-between border-b py-3 text-sm"><span>{item.transaction_type}<small className="block text-slate-400">{item.note || new Date(item.created_at).toLocaleDateString()}</small></span><span>৳{item.amount} · {item.coins} coins</span></div>)}{!data.transactions.length && <p className="mt-4 text-sm text-slate-500">No wallet activity yet.</p>}</section></div>;
}

import Link from "next/link";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

type AccountOrder = { id: string; tran_id: string; payment_status: string; order_status: string; total: number; created_at: string };

export default async function AccountDashboard() {
  const session = await getCustomerSession();
  if (!session) return null;
  const supabase = supabaseAdmin();
  const [orders, address] = await Promise.all([
    supabase.from("orders").select("id,tran_id,payment_status,order_status,total,created_at").eq("customer_user_id", session.user.id).order("created_at", { ascending: false }),
    supabase.from("customer_addresses").select("*").eq("user_id", session.user.id).eq("is_default", true).maybeSingle(),
  ]);
  const list = (orders.data || []) as AccountOrder[];
  const counts = { pay: list.filter((order) => order.payment_status === "pending").length, ship: list.filter((order) => order.order_status === "processing").length, receive: list.filter((order) => order.order_status === "shipped").length };
  return <div className="space-y-5"><section className="grid gap-4 sm:grid-cols-3">{[["To Pay", counts.pay], ["To Ship", counts.ship], ["To Receive", counts.receive]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</section><div className="grid gap-5 md:grid-cols-2"><section className="rounded-xl border bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">Default address</h2><Link href="/account/addresses" className="text-sm text-orange-600">Manage</Link></div>{address.data ? <p className="mt-4 text-sm leading-6">{address.data.recipient_name}<br />{address.data.phone}<br />{address.data.full_address}, {address.data.city}</p> : <p className="mt-4 text-sm text-slate-500">No default address saved.</p>}</section><section className="rounded-xl border bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">Recent orders</h2><Link href="/account/orders" className="text-sm text-orange-600">View all</Link></div>{list.slice(0, 4).map((order) => <div key={order.id} className="flex justify-between border-b py-3 text-sm"><span>{order.tran_id}<span className="block text-slate-400">{order.order_status}</span></span><span>৳{order.total}</span></div>)}{!list.length && <p className="mt-4 text-sm text-slate-500">No orders yet.</p>}</section></div></div>;
}

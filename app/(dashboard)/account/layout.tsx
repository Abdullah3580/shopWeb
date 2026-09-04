import Link from "next/link";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) return <>{children}</>;
  const links = [["Dashboard", "/account"], ["My Orders", "/account/orders"], ["Address Book", "/account/addresses"], ["Wishlist", "/account/wishlist"], ["Recently Viewed", "/account/recently-viewed"], ["Wallet & Coins", "/account/wallet"], ["My Reviews", "/account/reviews"], ["Account Details", "/account/profile"], ["Security", "/account/security"]];
  return <main className="min-h-screen bg-slate-100 p-4 md:p-8"><div className="mx-auto max-w-7xl"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.25em] text-brand-600">MyShopBD</p><h1 className="mt-1 text-3xl font-bold">My Account</h1></div><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><aside className="h-fit rounded-xl border bg-white p-3"><nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">{links.map(([label, href]) => <Link key={href} href={href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-700">{label}</Link>)}</nav></aside><section>{children}</section></div></div></main>;
}

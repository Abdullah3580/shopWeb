import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const supabase = supabaseAdmin();
  const [wallet, transactions, rewards] = await Promise.all([
    supabase.from("customer_wallets").select("balance,reward_coins,updated_at").eq("user_id", session.user.id).maybeSingle(),
    supabase.from("wallet_transactions").select("id,amount,coins,transaction_type,reference_id,note,created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("reward_events").select("id,coins,event_type,order_id,note,created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (transactions.error || rewards.error) return NextResponse.json({ error: "Unable to load wallet activity" }, { status: 500 });
  return NextResponse.json({ wallet: wallet.data || { balance: 0, reward_coins: 0 }, transactions: transactions.data || [], rewards: rewards.data || [] });
}

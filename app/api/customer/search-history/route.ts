import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ history: [] });
  const { data, error } = await supabaseAdmin().from("search_history").select("id,query,searched_at").eq("user_id", session.user.id).order("searched_at", { ascending: false }).limit(10);
  if (error) return NextResponse.json({ error: "Unable to load search history" }, { status: 500 });
  return NextResponse.json({ history: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: true });
  const query = String((await req.json().catch(() => ({}))).query || "").trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "Search query is required" }, { status: 400 });
  const { error } = await supabaseAdmin().from("search_history").insert({ user_id: session.user.id, query });
  if (error) return NextResponse.json({ error: "Unable to save search" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

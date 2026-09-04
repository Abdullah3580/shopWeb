import { NextRequest, NextResponse } from "next/server";
import { clearCustomerCookies, getCustomerSession, setCustomerCookies } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });
  if (error || !data.session) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  const response = NextResponse.json({ user: data.user });
  setCustomerCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearCustomerCookies(response);
  return response;
}

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json({ authenticated: Boolean(session), user: session?.user || null });
}

import { NextRequest, NextResponse } from "next/server";
import { adminCookieNames, getAdminSession, setAuthCookies } from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const ipLimit = rateLimit(`admin-login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || email.length > 160 || password.length > 200) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });
  if (error || !data.session) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieNames.ACCESS_COOKIE);
  response.cookies.delete(adminCookieNames.REFRESH_COOKIE);
  return response;
}

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({ authenticated: Boolean(session), roles: session?.roles || [] });
}

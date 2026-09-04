import { NextRequest, NextResponse } from "next/server";
import { clearCustomerCookies, customerCookieNames, getCustomerSession, setCustomerCookies } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });
  if (error || !data.session) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  const { data: device } = await supabaseAdmin().from("customer_devices").insert({
    user_id: data.user.id,
    device_name: String(req.headers.get("sec-ch-ua-platform") || "Web browser").replaceAll('"', "").slice(0, 80),
    user_agent: String(req.headers.get("user-agent") || "").slice(0, 500),
  }).select("id").single();
  const response = NextResponse.json({ user: data.user });
  setCustomerCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in, device?.id);
  return response;
}

export async function DELETE(req: NextRequest) {
  const deviceId = req.cookies.get(customerCookieNames.DEVICE_COOKIE)?.value;
  const session = await getCustomerSession();
  if (session && session.deviceId === deviceId) await supabaseAdmin().from("customer_devices").update({ revoked_at: new Date().toISOString() }).eq("id", deviceId).eq("user_id", session.user.id);
  const response = NextResponse.json({ ok: true });
  clearCustomerCookies(response);
  return response;
}

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json({ authenticated: Boolean(session), user: session?.user || null });
}

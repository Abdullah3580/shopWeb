import { NextRequest, NextResponse } from "next/server";
import { clearCustomerCookies, customerCookieNames, getCustomerSession, setCustomerCookies } from "@/lib/customer-auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const ipLimit = rateLimit(`customer-login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  // ৮ অক্ষরের শর্ত সরানো হয়েছে: Supabase নিজেই পাসওয়ার্ড যাচাই করে,
  // আর register-এর নিয়মের সাথে না মিললে লগইন আটকে যেত।
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 || password.length < 1 || password.length > 200) {
    console.error("LOGIN VALIDATION FAILED: bad email format or password length");
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    // আসল কারণ শুধু সার্ভার টার্মিনালে দেখা যাবে, ব্রাউজারে যাবে না
    console.error("LOGIN ERROR:", error?.message);

    if (error?.message?.toLowerCase().includes("email not confirmed")) {
      return NextResponse.json(
        { error: "আপনার ইমেইলটি ভেরিফাই করা হয়নি। অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { data: device, error: deviceError } = await supabaseAdmin()
    .from("customer_devices")
    .insert({
      user_id: data.user.id,
      device_name: String(req.headers.get("sec-ch-ua-platform") || "Web browser").replaceAll('"', "").slice(0, 80),
      user_agent: String(req.headers.get("user-agent") || "").slice(0, 500),
    })
    .select("id")
    .single();

  if (deviceError) {
    // লগইন বন্ধ করছি না, কিন্তু সমস্যাটা টার্মিনালে দেখা যাবে
    console.error("DEVICE INSERT ERROR:", deviceError.message);
  }

  const response = NextResponse.json({ user: data.user });
  setCustomerCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in, device?.id);
  return response;
}

export async function DELETE(req: NextRequest) {
  const deviceId = req.cookies.get(customerCookieNames.DEVICE_COOKIE)?.value;
  const session = await getCustomerSession();
  if (session && session.deviceId === deviceId) {
    await supabaseAdmin()
      .from("customer_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("user_id", session.user.id);
  }
  const response = NextResponse.json({ ok: true });
  clearCustomerCookies(response);
  return response;
}

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json({ authenticated: Boolean(session), user: session?.user || null });
}
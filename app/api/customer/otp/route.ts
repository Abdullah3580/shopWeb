import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const ipLimit = rateLimit(`customer-otp-ip:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  const emailLimit = rateLimit(`customer-otp-email:${email}`, 3, 15 * 60 * 1000);
  if (!emailLimit.allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } });
  const { error } = await supabaseAdmin().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) {
    console.error("OTP request failed", error);
    return NextResponse.json({ error: "Unable to send verification code" }, { status: 400 });
  }
  return NextResponse.json({ message: "A verification code was sent if the account exists." });
}

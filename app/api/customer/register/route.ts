import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.full_name || "").trim().slice(0, 120);
  if (!email || password.length < 8 || !fullName) return NextResponse.json({ error: "Name, valid email, and an 8-character password are required" }, { status: 400 });
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name: fullName, phone: String(body.phone || "").trim().slice(0, 30) } });
  if (error || !data.user) return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 400 });
  await supabaseAdmin().from("customer_profiles").insert({ user_id: data.user.id, full_name: fullName, phone: body.phone || null });
  return NextResponse.json({ user: data.user, message: "Account created. Verify your email before signing in." }, { status: 201 });
}

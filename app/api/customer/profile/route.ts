import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data: profile } = await supabaseAdmin().from("customer_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
  return NextResponse.json({ profile: { id: session.user.id, email: session.user.email, ...session.user.user_metadata, ...(profile || {}) } });
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const fullName = String(body.full_name || "").trim().slice(0, 120);
  const phone = String(body.phone || "").trim().slice(0, 30);
  const avatarUrl = String(body.avatar_url || "").trim().slice(0, 1000) || null;
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) return NextResponse.json({ error: "Avatar must be a valid HTTPS or HTTP URL" }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  const { data, error } = await supabaseAdmin().auth.admin.updateUserById(session.user.id, { user_metadata: { ...session.user.user_metadata, full_name: fullName, phone } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const supabase = supabaseAdmin();
  await supabase.from("customer_profiles").upsert({ user_id: session.user.id, full_name: fullName, phone, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
  return NextResponse.json({ profile: { id: data.user.id, email: data.user.email, ...data.user.user_metadata, full_name: fullName, phone, avatar_url: avatarUrl } });
}

import { NextRequest, NextResponse } from "next/server";
import { clearCustomerCookies, getCustomerSession } from "@/lib/customer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("customer_devices").select("id,device_name,user_agent,last_seen_at,created_at").eq("user_id", session.user.id).is("revoked_at", null).order("last_seen_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load active devices" }, { status: 500 });
  return NextResponse.json({ devices: data || [], currentDeviceId: session.deviceId || null });
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session || !session.user.email) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.current_password || "");
  const newPassword = String(body.new_password || "");
  if (!currentPassword || newPassword.length < 8) return NextResponse.json({ error: "Enter your current password and a new password of at least 8 characters" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: currentPassword });
  if (verifyError) return NextResponse.json({ error: "Your current password is incorrect" }, { status: 401 });
  const { error } = await supabase.auth.admin.updateUserById(session.user.id, { password: newPassword });
  if (error) return NextResponse.json({ error: "Unable to update password" }, { status: 400 });
  const response = NextResponse.json({ ok: true, message: "Password changed. Please sign in again." });
  clearCustomerCookies(response);
  return response;
}

export async function DELETE(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const deviceId = String((await req.json().catch(() => ({}))).device_id || "");
  if (!deviceId) return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
  const { data, error } = await supabaseAdmin().from("customer_devices").update({ revoked_at: new Date().toISOString() }).eq("id", deviceId).eq("user_id", session.user.id).is("revoked_at", null).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Active device not found" }, { status: 404 });
  const response = NextResponse.json({ ok: true });
  if (deviceId === session.deviceId) clearCustomerCookies(response);
  return response;
}

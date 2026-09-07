import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim().slice(0, 120);
    const phone = String(body.phone || "").trim().slice(0, 30);

    // ১. ইনপুট ভ্যালিডেশন
    if (!email || password.length < 8 || !fullName) {
      return NextResponse.json(
        { error: "Name, valid email, and an 8-character password are required" },
        { status: 400 }
      );
    }

    // ২. ইউজার তৈরি ও অটো-কনফার্মকরণ (email_confirm: true)
    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true, // <--- সাথে সাথে অ্যাকাউন্ট কনফার্ম হয়ে যাবে
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Registration failed" },
        { status: 400 }
      );
    }

    // ৩. customer_profiles টেবিলে প্রোফাইল ডাটা যুক্ত করা
    const { error: profileError } = await supabaseAdmin()
      .from("customer_profiles")
      .insert({
        user_id: data.user.id,
        full_name: fullName,
        phone: phone || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    return NextResponse.json(
      {
        user: data.user,
        message: "Account created successfully! You can now log in.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
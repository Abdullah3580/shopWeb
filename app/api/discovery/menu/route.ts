import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin().from("categories").select("id,name,slug,parent_id,image_url").order("name");
  if (error) return NextResponse.json({ error: "Menu unavailable" }, { status: 503 });
  return NextResponse.json({ categories: data || [] });
}

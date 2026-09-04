import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });
  const supabase = supabaseAdmin();
  const [products, categories] = await Promise.all([
    supabase.from("products").select("id,name,slug,price,images").eq("is_active", true).ilike("name", `%${q}%`).limit(6),
    supabase.from("categories").select("id,name,slug,parent_id").ilike("name", `%${q}%`).limit(5),
  ]);
  if (products.error || categories.error) return NextResponse.json({ error: "Suggestions unavailable" }, { status: 503 });
  return NextResponse.json({ products: products.data || [], categories: categories.data || [] });
}

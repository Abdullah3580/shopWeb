import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await requireAdminRole(["catalog"]);
  if (!session) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
  const productId = req.nextUrl.searchParams.get("product_id");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 100), 500);
  const supabase = supabaseAdmin();
  let query = supabase.from("inventory_movements").select("*, products(name), product_variants(name,sku)").order("created_at", { ascending: false }).limit(limit);
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movements: data || [] });
}

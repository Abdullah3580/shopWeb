import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const sorts = new Set(["newest", "price_asc", "price_desc", "rating", "popularity"]);
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const queryText = params.get("q")?.trim() || "";
  const page = Math.max(Number(params.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.get("page_size") || 24), 1), 60);
  let query = supabase.from("products").select("*, brands(name)", { count: "exact" }).eq("is_active", true);
  if (queryText) query = query.or(`name.ilike.%${queryText}%,description.ilike.%${queryText}%`);
  const minPrice = Number(params.get("min_price")); const maxPrice = Number(params.get("max_price"));
  if (Number.isFinite(minPrice)) query = query.gte("price", minPrice);
  if (Number.isFinite(maxPrice)) query = query.lte("price", maxPrice);
  if (params.get("brand_id")) query = query.eq("brand_id", params.get("brand_id"));
  if (params.get("in_stock") === "true") query = query.gt("stock", 0);
  const sort = sorts.has(params.get("sort") || "") ? params.get("sort") : "newest";
  if (sort === "price_asc") query = query.order("price");
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "rating") query = query.order("rating_average", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data || [], page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const sorts = new Set(["newest", "price_asc", "price_desc", "rating", "popularity"]);
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const queryText = params.get("q")?.trim() || "";
  const page = Math.max(Number(params.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.get("page_size") || 24), 1), 60);
  let query = supabaseAdmin().from("products").select("*, brands(name)", { count: "exact" }).eq("is_active", true);
  if (queryText) query = query.or(`name.ilike.%${queryText}%,description.ilike.%${queryText}%`);
  const minPrice = Number(params.get("min_price")); const maxPrice = Number(params.get("max_price"));
  if (Number.isFinite(minPrice)) query = query.gte("price", minPrice);
  if (Number.isFinite(maxPrice)) query = query.lte("price", maxPrice);
  if (params.get("brand_id")) query = query.eq("brand_id", params.get("brand_id"));
  const minRating = Number(params.get("min_rating"));
  if (Number.isFinite(minRating) && minRating >= 0 && minRating <= 5) query = query.gte("rating_average", minRating);
  if (params.get("in_stock") === "true") query = query.gt("stock", 0);
  const sort = sorts.has(params.get("sort") || "") ? params.get("sort") : "newest";
  if (sort === "price_asc") query = query.order("price");
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "rating") query = query.order("rating_average", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range(sort === "popularity" ? 0 : (page - 1) * pageSize, sort === "popularity" ? 499 : page * pageSize - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let products = data || [];
  if (sort === "popularity" && products.length) {
    const { data: scores } = await supabaseAdmin().from("product_popularity_daily").select("product_id,popularity_score").in("product_id", products.map((product) => product.id));
    const scoreMap = new Map((scores || []).map((score) => [score.product_id, Number(score.popularity_score)]));
    products = products.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    products = products.slice((page - 1) * pageSize, page * pageSize);
  }
  return NextResponse.json({ products, page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) });
}

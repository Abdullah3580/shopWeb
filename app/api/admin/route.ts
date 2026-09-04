import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

async function guard() {
  return requireAdminRole();
}

async function logActivity(supabase: ReturnType<typeof supabaseAdmin>, action: string, entityType: string, entityId?: string, details?: unknown) {
  await supabase.from("admin_activity_logs").insert({ action, entity_type: entityType, entity_id: entityId || null, details: details || null });
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = supabaseAdmin();
  const [products, categories, orders, recentOrders, lowStock, activity, revenue] = await Promise.all([
    supabase.from("products").select("*, categories(name), product_variants(*), product_images(*)").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(12),
    supabase.from("products").select("id,name,stock,price,reorder_threshold").eq("is_active", true).order("stock"),
    supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
  ]);
  const totalRevenue = (revenue.data || []).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lowStockProducts = (lowStock.data || []).filter((product) => product.stock <= product.reorder_threshold);
  const failed = [products, categories, recentOrders, lowStock, activity].find((result) => result.error);
  if (failed) return NextResponse.json({ error: failed.error?.message || "Failed to load dashboard" }, { status: 500 });
  return NextResponse.json({
    products: products.data || [], categories: categories.data || [], orders: recentOrders.data || [],
    lowStock: lowStockProducts, activity: activity.data || [],
    stats: { orderCount: orders.count || 0, revenue: totalRevenue, productCount: (products.data || []).length, lowStockCount: lowStockProducts.length },
  });
}

export async function POST(req: NextRequest) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const supabase = supabaseAdmin();
  try {
    if (body.action === "save_product") {
      if (!session.roles.some((role) => ["owner", "manager", "catalog"].includes(role))) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
      const input = body.product || {};
      const product = { name: String(input.name || "").trim(), slug: String(input.slug || "").trim(), description: input.description || null, price: Number(input.price), compare_at_price: input.compare_at_price ? Number(input.compare_at_price) : null, stock: Number(input.stock), reorder_threshold: Number(input.reorder_threshold ?? 10), barcode: String(input.barcode || "").trim() || null, images: Array.isArray(input.images) ? input.images : [], category_id: input.category_id || null, is_active: input.is_active !== false };
      if (!product.name || !product.slug || !Number.isFinite(product.price) || !Number.isInteger(product.stock) || product.stock < 0 || !Number.isInteger(product.reorder_threshold) || product.reorder_threshold < 0) return NextResponse.json({ error: "Name, slug, valid price, stock, and reorder threshold are required" }, { status: 400 });
      const query = input.id ? supabase.from("products").update(product).eq("id", input.id).select().single() : supabase.from("products").insert(product).select().single();
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (Array.isArray(input.variants)) {
        const variants = input.variants.map((variant: Record<string, unknown>) => ({ product_id: data.id, sku: String(variant.sku || "").trim(), barcode: String(variant.barcode || "").trim() || null, name: String(variant.name || "").trim(), options: variant.options && typeof variant.options === "object" ? variant.options : {}, price: variant.price === "" || variant.price == null ? null : Number(variant.price), compare_at_price: variant.compare_at_price === "" || variant.compare_at_price == null ? null : Number(variant.compare_at_price), stock: Number(variant.stock), reorder_threshold: Number(variant.reorder_threshold ?? 5), is_active: variant.is_active !== false }));
        if (variants.some((variant: { sku: string; name: string; stock: number; reorder_threshold: number }) => !variant.sku || !variant.name || !Number.isInteger(variant.stock) || variant.stock < 0 || !Number.isInteger(variant.reorder_threshold) || variant.reorder_threshold < 0)) return NextResponse.json({ error: "Invalid product variant" }, { status: 400 });
        const { error: deleteError } = await supabase.from("product_variants").delete().eq("product_id", data.id);
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
        const { error: variantError } = variants.length ? await supabase.from("product_variants").insert(variants) : { error: null };
        if (variantError) return NextResponse.json({ error: variantError.message }, { status: 400 });
      }
      if (input.id && Number(input.previous_stock) !== product.stock) {
        const quantityChange = product.stock - Number(input.previous_stock || 0);
        await supabase.from("inventory_adjustments").insert({ product_id: input.id, quantity_change: quantityChange, stock_after: product.stock, reason: "Admin dashboard adjustment" });
        await supabase.from("inventory_movements").insert({ product_id: input.id, quantity_change: quantityChange, stock_after: product.stock, movement_type: "adjustment", reason: "Admin dashboard adjustment", actor_id: session.user.id });
      }
      await logActivity(supabase, input.id ? "Updated product" : "Created product", "product", data.id, { name: product.name });
      return NextResponse.json({ data });
    }
    if (body.action === "delete_product") {
      if (!session.roles.some((role) => ["owner", "manager", "catalog"].includes(role))) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
      const { id } = body;
      const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await logActivity(supabase, "Archived product", "product", id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "save_category") {
      if (!session.roles.some((role) => ["owner", "manager", "catalog"].includes(role))) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
      const input = body.category || {};
      const category = { name: String(input.name || "").trim(), slug: String(input.slug || "").trim(), image_url: input.image_url || null, parent_id: input.parent_id || null };
      if (!category.name || !category.slug) return NextResponse.json({ error: "Category name and slug are required" }, { status: 400 });
      const query = input.id ? supabase.from("categories").update(category).eq("id", input.id).select().single() : supabase.from("categories").insert(category).select().single();
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await logActivity(supabase, input.id ? "Updated category" : "Created category", "category", data.id, { name: category.name });
      return NextResponse.json({ data });
    }
    if (body.action === "update_order") {
      if (!session.roles.some((role) => ["owner", "manager", "fulfillment", "finance"].includes(role))) return NextResponse.json({ error: "Order management permission required" }, { status: 403 });
      const { id, order_status, payment_status } = body;
      const updates: Record<string, string> = {};
      if (order_status) updates.order_status = order_status;
      if (payment_status) updates.payment_status = payment_status;
      const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (order_status) await supabase.from("order_status_history").insert({ order_id: id, status: order_status, note: "Updated from admin dashboard" });
      await logActivity(supabase, "Updated order", "order", id, updates);
      return NextResponse.json({ data });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

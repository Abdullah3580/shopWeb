import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const session = await requireAdminRole(["catalog"]);
  if (!session) return NextResponse.json({ error: "Inventory permission required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const productId = typeof body.productId === "string" ? body.productId : "";
  const stockChange = Number(body.stockChange);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 240) : "Manual adjustment";

  if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(stockChange) || stockChange === 0) {
    return NextResponse.json({ error: "Valid product ID and integer stock change are required" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();
  if (fetchError || !product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const newStock = product.stock + stockChange;
  if (newStock < 0) return NextResponse.json({ error: "Stock cannot become negative" }, { status: 400 });

  const { error: updateError } = await supabase.from("products").update({ stock: newStock }).eq("id", productId);
  if (updateError) {
    console.error("Inventory update failed", updateError);
    return NextResponse.json({ error: "Unable to update inventory" }, { status: 500 });
  }

  const { error: logError } = await supabase.from("inventory_movements").insert({
    product_id: productId,
    quantity_change: stockChange,
    stock_after: newStock,
    movement_type: "adjustment",
    reason,
    actor_id: session.user.id,
  });
  if (logError) console.error("Inventory audit log failed", logError);

  return NextResponse.json({ success: true, newStock });
}

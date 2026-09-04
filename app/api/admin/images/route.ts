import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const session = await requireAdminRole(["catalog"]);
  if (!session) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  const productId = form.get("productId");
  if (!(file instanceof File) || typeof productId !== "string" || !productId || !allowedTypes.has(file.type) || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image under 5 MB" }, { status: 400 });
  }
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
  const { data: image, error: imageError } = await supabase.from("product_images").insert({ product_id: productId, url: publicUrl.publicUrl, alt_text: String(form.get("altText") || "").slice(0, 160) || null }).select().single();
  if (imageError) {
    await supabase.storage.from("product-images").remove([path]);
    return NextResponse.json({ error: imageError.message }, { status: 400 });
  }
  return NextResponse.json({ image });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminRole(["catalog"]);
  if (!session) return NextResponse.json({ error: "Catalog permission required" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const imageId = typeof body.imageId === "string" ? body.imageId : "";
  if (!imageId) return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: image, error: findError } = await supabase.from("product_images").select("id,url").eq("id", imageId).single();
  if (findError || !image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  const marker = "/storage/v1/object/public/product-images/";
  const path = image.url.split(marker)[1];
  if (path) await supabase.storage.from("product-images").remove([decodeURIComponent(path)]);
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

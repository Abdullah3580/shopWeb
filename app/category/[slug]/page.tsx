import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/types";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {(products as Product[] | null)?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {!products?.length && (
          <p className="text-gray-500 col-span-full text-sm">
            এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট নেই।
          </p>
        )}
      </div>
    </div>
  );
}

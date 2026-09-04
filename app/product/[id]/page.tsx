import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { id: string } }) {
  // params.id is actually the product slug
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.id)
    .single();

  if (!product) notFound();

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <RecentlyViewedTracker productId={product.id} />
      <div className="aspect-square bg-white rounded-xl border overflow-hidden">
        <img
          src={product.images?.[0] || "https://placehold.co/600x600?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold text-brand-600">৳{product.price}</span>
          {hasDiscount && (
            <span className="text-gray-400 line-through">৳{product.compare_at_price}</span>
          )}
        </div>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{product.description}</p>

        <AddToCartButton product={product} />

        <div className="mt-6 text-sm text-gray-500 space-y-1 border-t pt-4">
          <p>✓ ক্যাশ অন ডেলিভারি সুবিধা</p>
          <p>✓ bKash / Nagad / Rocket / কার্ড পেমেন্ট</p>
          <p>✓ সারা বাংলাদেশে ডেলিভারি</p>
        </div>
      </div>
    </div>
  );
}

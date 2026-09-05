import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import ProductMediaGallery from "@/components/product/ProductMediaGallery";
import ProductInteractiveSection from "@/components/product/ProductInteractiveSection";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.id)
    .single();

  if (!product) notFound();

  const galleryImages: string[] = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url || "https://placehold.co/600x600?text=No+Image"];

  // ProductMediaGallery-এর প্রত্যাশিত ডাটা স্ট্রাকচার
  const media = galleryImages.map((url, index) => ({
    id: String(index),
    url: url,
    media_type: 'image' as const,
    type: 'image' as const
  }));

  const mainImage = product.image_url || galleryImages[0] || "https://placehold.co/600x600?text=No+Image";

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <RecentlyViewedTracker productId={product.id} />
      
      {/* সঠিক Prop দিয়ে মিডিয়া গ্যালারি */}
      <ProductMediaGallery media={media} mainImage={mainImage} />

      <div>
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{product.description}</p>

        {/* ইন্টারঅ্যাক্টিভ সেকশন (প্রাইস, ভ্যারিয়েন্ট সিলেক্টর ও কার্ট বাটন) */}
        <ProductInteractiveSection product={product} />

        <div className="mt-6 text-sm text-gray-500 space-y-1 border-t pt-4">
          <p>✓ ক্যাশ অন ডেলিভারি সুবিধা</p>
          <p>✓ bKash / Nagad / Rocket / কার্ড পেমেন্ট</p>
          <p>✓ সারা বাংলাদেশে ডেলিভারি</p>
        </div>
      </div>
    </div>
  );
}
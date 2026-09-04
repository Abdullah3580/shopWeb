import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Hero } from "@/components/Hero";
import FeaturedProduct from "@/components/FeaturedProduct";
import TrustBadges from "@/components/TrustBadges";
import { Category, Product } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  // Since the store currently runs with a single category, we just grab the first one.
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const category = (categories as Category[] | null)?.[0];

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const productList = (products as Product[] | null) || [];
  const featured = productList[0];
  const rest = productList.slice(1);

  return (
    <div className="space-y-14">
      <Hero categoryName={category?.name || "প্রোডাক্ট"} ctaHref="#best-selling" />

      {featured && <FeaturedProduct product={featured} />}

      {rest.length > 0 && (
        <section id="best-selling">
          <h2 className="text-xl font-bold mb-1">বেস্ট সেলিং প্রোডাক্ট</h2>
          <p className="text-sm text-gray-500 mb-5">নির্বাচিত প্রোডাক্টে ৪২% পর্যন্ত ছাড়</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {!productList.length && (
        <p className="text-gray-500 text-sm text-center py-10">
          এখনো কোনো প্রোডাক্ট যোগ করা হয়নি। Supabase → products টেবিলে যোগ করুন।
        </p>
      )}

      <TrustBadges />
    </div>
  );
}

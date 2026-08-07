import Link from "next/link";
import { Product } from "@/lib/types";

export default function FeaturedProduct({ product }: { product: Product }) {
  return (
    <section className="bg-white border rounded-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center">
      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={product.images?.[0] || "https://placehold.co/500x500?text=New+Product"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          নতুন প্রোডাক্ট
        </span>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h2>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{product.description}</p>
        <Link
          href={`/product/${product.slug}`}
          className="inline-block bg-gray-900 hover:bg-black text-white font-medium px-8 py-3 rounded-lg transition"
        >
          অর্ডার করুন — ৳{product.price}
        </Link>
      </div>
    </section>
  );
}

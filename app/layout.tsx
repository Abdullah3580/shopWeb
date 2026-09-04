import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import NewsletterForm from "@/components/NewsletterForm";
import { supabaseAdmin } from "@/lib/supabase";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "MyShopBD | সব কিছু, এক জায়গায়",
  description: "বাংলাদেশের অনলাইন মার্কেটপ্লেস — ইলেকট্রনিক্স, ফ্যাশন, হোম ও আরও অনেক কিছু।",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: storeSettings } = await supabaseAdmin()
    .from("store_settings")
    .select("shop_name,store_address,contact_phone,contact_email")
    .eq("id", 1)
    .maybeSingle();
  const shopName = storeSettings?.shop_name || "MyShopBD";
  const storeAddress = storeSettings?.store_address || "ঠিকানা পাওয়া যায়নি";
  const supportPhone = storeSettings?.contact_phone || "সাপোর্ট নম্বর সেট করা হয়নি";
  return (
    <html lang="bn" className={cn("font-sans", geist.variable)}>
      <body className="bg-gray-50 text-gray-900">
        <CartProvider>
          <WishlistProvider>
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
            <footer className="bg-gray-900 text-gray-300 mt-12 pt-10 text-sm">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-8">
                <div>
                  <h4 className="text-white font-semibold mb-2">{shopName}</h4>
                  <p>{storeAddress}</p>
                  <p className="mt-1">কাস্টমার সাপোর্ট: {supportPhone}</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">সহায়তা</h4>
                  <p>যোগাযোগ করুন</p>
                  <p>রিটার্ন ও রিপ্লেসমেন্ট</p>
                  <p>ডেলিভারি নীতি</p>
                  <p>অর্ডার ট্র্যাক করুন</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">পেমেন্ট</h4>
                  <p>bKash • Nagad • Rocket</p>
                  <p>Visa / Mastercard</p>
                  <p>ক্যাশ অন ডেলিভারি</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">খবর ও অফার</h4>
                  <p className="mb-2 text-gray-400">নতুন প্রোডাক্ট ও অফারের আপডেট পেতে সাবস্ক্রাইব করুন।</p>
                  <NewsletterForm />
                </div>
              </div>
              <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} MyShopBD. সর্বস্বত্ব সংরক্ষিত।
              </div>
            </footer>
            <WhatsAppButton />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
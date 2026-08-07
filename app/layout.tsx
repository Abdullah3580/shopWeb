import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "MyShopBD | সব কিছু, এক জায়গায়",
  description: "বাংলাদেশের অনলাইন মার্কেটপ্লেস — ইলেকট্রনিক্স, ফ্যাশন, হোম ও আরও অনেক কিছু।",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="bg-gray-50 text-gray-900">
        <CartProvider>
          <WishlistProvider>
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
            <footer className="bg-gray-900 text-gray-300 mt-12 pt-10 text-sm">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-8">
                <div>
                  <h4 className="text-white font-semibold mb-2">MyShopBD</h4>
                  <p>ঢাকা, বাংলাদেশ</p>
                  <p className="mt-1">কাস্টমার সাপোর্ট: সকাল ১০টা – রাত ৮টা (শনি–বৃহস্পতি)</p>
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
                  <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="email"
                      placeholder="ইমেইল"
                      className="flex-1 min-w-0 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                    <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 rounded-lg">
                      Send
                    </button>
                  </form>
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

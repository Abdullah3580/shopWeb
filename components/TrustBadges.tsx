const badges = [
  { icon: "🚚", title: "দ্রুত ডেলিভারি", desc: "সারা বাংলাদেশে দ্রুত ও নির্ভরযোগ্য ডেলিভারি" },
  { icon: "💵", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পাওয়ার পরই পেমেন্ট করুন" },
  { icon: "🔄", title: "৭ দিনের রিপ্লেসমেন্ট", desc: "কোনো সমস্যা হলে সহজে রিপ্লেসমেন্ট" },
];

export default function TrustBadges() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {badges.map((b) => (
        <div key={b.title} className="bg-white border rounded-xl p-5 text-center">
          <div className="text-3xl mb-2">{b.icon}</div>
          <h3 className="font-semibold mb-1">{b.title}</h3>
          <p className="text-sm text-gray-500">{b.desc}</p>
        </div>
      ))}
    </section>
  );
}

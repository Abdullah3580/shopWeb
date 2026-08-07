// Placeholder testimonials — replace with your real customer reviews once you have them.
const testimonials = [
  {
    quote:
      "প্রোডাক্টটা যেমন বলা হয়েছিল ঠিক তেমনই পেয়েছি। ডেলিভারিও দ্রুত হয়েছে, খুব ভালো অভিজ্ঞতা।",
    name: "রাফি হাসান",
    role: "ঢাকা",
  },
  {
    quote: "ব্যবহার করা খুব সহজ, প্রতিদিনের রুটিনে এখন এটাই ব্যবহার করি। দামের তুলনায় মানও ভালো।",
    name: "সাদিয়া আক্তার",
    role: "চট্টগ্রাম",
  },
  {
    quote: "ক্যাশ অন ডেলিভারি থাকায় নিশ্চিন্তে অর্ডার করেছিলাম, প্যাকেজিংও ভালো ছিল।",
    name: "তানভীর ইসলাম",
    role: "সিলেট",
  },
];

export default function Testimonials() {
  return (
    <section>
      <h2 className="text-xl font-bold mb-1">কাস্টমারদের মতামত</h2>
      <p className="text-sm text-gray-500 mb-5">আমাদের প্রোডাক্ট নিয়ে কাস্টমাররা যা বলছেন</p>
      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white border rounded-xl p-5">
            <p className="text-yellow-500 mb-2">★★★★★</p>
            <p className="text-sm text-gray-700 mb-4">"{t.quote}"</p>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-gray-500">{t.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

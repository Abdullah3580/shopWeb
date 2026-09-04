# MyShopBD — Next.js + Supabase Marketplace Starter

দারাজ-স্টাইল মাল্টি-ক্যাটাগরি ই-কমার্স স্টোরের একটি working MVP। এটা একটা **শুরুর ভিত্তি** — production-ready
পূর্ণাঙ্গ মার্কেটপ্লেস (multi-vendor, seller dashboard, রিভিউ, সার্চ/ফিল্টার ইত্যাদি) বানাতে এর উপর ধাপে ধাপে ফিচার যোগ করতে হবে।

## ডিজাইন
হোমপেজ productivebangladesh.com-এর স্টাইলে সাজানো: অফার বার + কাউন্টডাউন, হিরো, ফিচার্ড (নতুন) প্রোডাক্ট স্পটলাইট,
ডিসকাউন্ট ব্যাজ ও উইশলিস্টসহ প্রোডাক্ট গ্রিড, টেস্টিমোনিয়াল, ট্রাস্ট ব্যাজ, হোয়াটসঅ্যাপ ফ্লোটিং বাটন, নিউজলেটার ফুটার।

**Deploy করার আগে অবশ্যই বদলাও:**
- `components/WhatsAppButton.tsx` — `WHATSAPP_NUMBER` তোমার আসল নাম্বার দিয়ে বদলাও
- `components/Testimonials.tsx` — এখন placeholder রিভিউ, আসল কাস্টমার রিভিউ পেলে বদলে দিও
- `supabase/seed.sql` — এখানে Pomodoro Timer-এর ডেমো ডাটা আছে, নিজের প্রোডাক্ট দিয়ে বদলাও

## ক্যাটাগরি সম্পর্কে
এখন ডাটাবেজে ইচ্ছাকৃতভাবে **একটাই category** সিড করা আছে (`productivity-tools`)। ভবিষ্যতে নতুন category
যোগ করতে চাইলে শুধু Supabase Table Editor-এ `categories` টেবিলে নতুন সারি (row) যোগ করলেই হবে — কোনো কোড বদলাতে হবে না,
হোমপেজ ও `/category/[slug]` পেজ automatically নতুন ক্যাটাগরি সাপোর্ট করবে।

## যা যা আছে
- হোমপেজ: ক্যাটাগরি + লেটেস্ট প্রোডাক্ট (Supabase থেকে লাইভ ডাটা)
- ক্যাটাগরি পেজ, প্রোডাক্ট ডিটেইল পেজ
- কার্ট (localStorage-এ পার্সিস্ট হয়)
- চেকআউট ফর্ম (নাম, ফোন, ঠিকানা, এলাকা অনুযায়ী শিপিং চার্জ)
- পেমেন্ট: ক্যাশ অন ডেলিভারি + SSLCommerz (bKash/Nagad/Rocket/কার্ড সবই এর মধ্যে দিয়ে আসে)
- অর্ডার + অর্ডার আইটেম Supabase-এ সেভ হয়, IPN দিয়ে পেমেন্ট স্ট্যাটাস ভেরিফাই হয়
- অ্যাডমিন ড্যাশবোর্ড: লগইন, ওভারভিউ মেট্রিক্স, প্রোডাক্ট/ক্যাটাগরি CRUD, ইনভেন্টরি ও অর্ডার স্ট্যাটাস ম্যানেজমেন্ট
- পেমেন্ট ট্রানজ্যাকশন, ইনভেন্টরি অ্যাডজাস্টমেন্ট ও অ্যাডমিন অ্যাক্টিভিটি অডিট লগ

## যা এখনো নেই (পরের ধাপে যোগ করতে হবে)
- মাল্টি-ভেন্ডর সাপোর্ট (একাধিক সেলার)
- প্রোডাক্ট রিভিউ/রেটিং
- ইউজার লগইন/অর্ডার হিস্টোরি
- SMS/ইমেইল নোটিফিকেশন

## সেটআপ ধাপে ধাপে

### ১. Dependencies ইনস্টল করুন
```bash
npm install
```

### ২. Supabase প্রজেক্ট বানান
1. [supabase.com](https://supabase.com) → New Project
2. SQL Editor-এ গিয়ে `supabase/schema.sql` এর পুরো কন্টেন্ট রান করুন
3. এরপর `supabase/seed.sql` রান করুন (স্যাম্পল প্রোডাক্ট দেখতে চাইলে)
4. Project Settings → API থেকে URL, anon key, service_role key কপি করুন

যদি `categories already exists` error আসে, database আগে থেকেই তৈরি আছে। সেক্ষেত্রে পুরো `schema.sql` আবার চালাবেন না;
শুধু `supabase/admin-migration.sql` চালান। এটি existing data না মুছে admin dashboard-এর নতুন টেবিলগুলো যোগ করবে।

Phase 5-এর coupons, store settings এবং analytics database অংশের জন্য `supabase/phase5-migration.sql` আলাদা করে চালান।
Phase 6-এর database reliability hardening-এর জন্য `supabase/phase-06-migration.sql` চালান।

### ৩.১ Admin dashboard সেটআপ
1. Supabase Dashboard → Authentication → Users থেকে admin/staff user তৈরি করুন।
2. `supabase/admin-migration.sql` রান করার পর SQL Editor-এ user-এর UUID দিয়ে role assign করুন:
```sql
insert into public.admin_user_roles (user_id, role_id)
select 'AUTH_USER_UUID', id from public.admin_roles where name = 'owner'
on conflict do nothing;
```
3. `/admin` খুলে Supabase Auth email/password দিয়ে sign in করুন।

Roles: `owner`, `manager`, `catalog`, `fulfillment`, `finance`। Product/category actions-এর জন্য `catalog`, আর order actions-এর জন্য `fulfillment` বা `finance` role প্রয়োজন। `owner` সব permission পায়।

### ৩. Environment variables সেট করুন
`.env.example` কে `.env.local` নামে কপি করে মান বসান:
```bash
cp .env.example .env.local
```

### ৪. SSLCommerz sandbox অ্যাকাউন্ট নিন (পেমেন্ট টেস্ট করার জন্য)
1. [developer.sslcommerz.com/registration](https://developer.sslcommerz.com/registration/) থেকে ফ্রি sandbox অ্যাকাউন্ট খুলুন
2. Store ID ও Store Password `.env.local`-এ বসান
3. sandbox-এ টেস্ট bKash/Nagad/কার্ড নাম্বার দিয়ে পুরো ফ্লো টেস্ট করতে পারবেন
4. আসল পেমেন্ট নিতে চাইলে SSLCommerz-এ merchant হিসেবে আবেদন করে approve হতে হবে (ট্রেড লাইসেন্স লাগে), তারপর live credentials দিয়ে `SSLCZ_IS_LIVE=true` করবেন

### ৫. লোকালি রান করুন
```bash
npm run dev
```
[http://localhost:3000](http://localhost:3000) এ দেখুন।

### ৬. Deploy (Vercel)
Chosma-র মতোই — GitHub-এ পুশ করে Vercel-এ ইম্পোর্ট করুন, environment variables Vercel dashboard-এ বসান।
`NEXT_PUBLIC_APP_URL` অবশ্যই আপনার Vercel ডোমেইনে আপডেট করবেন, নাহলে SSLCommerz রিডাইরেক্ট কাজ করবে না।

## প্রোডাক্ট/ক্যাটাগরি যোগ করা
`/admin` dashboard থেকে `categories` ও `products` যোগ এবং আপডেট করা যাবে। Database schema পরিবর্তন হলে
Supabase SQL Editor-এ `supabase/schema.sql` আবার রান করুন (নতুন প্রজেক্টে পুরো ফাইল, existing প্রজেক্টে migration অংশ আলাদা করে চালান)।

## পরের ধাপগুলো (রিকমেন্ডেশন)
1. আগে ১০-২০টা রিয়েল প্রোডাক্ট দিয়ে টেস্ট করুন, COD দিয়ে অর্ডার ফ্লো ভেরিফাই করুন
2. SSLCommerz sandbox-এ পুরো পেমেন্ট ফ্লো টেস্ট করুন
3. একটা সিম্পল admin পেজ বানান (প্রোডাক্ট add/edit করার জন্য) — Supabase Auth দিয়ে প্রোটেক্ট করা
4. সার্চ যোগ করুন (Supabase full-text search বা Algolia)
5. SSLCommerz merchant approval-এর জন্য আবেদন করুন (ট্রেড লাইসেন্স/ব্যবসার কাগজপত্র লাগবে)

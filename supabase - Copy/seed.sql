-- Sample data so you can see the storefront working immediately.
-- Only ONE category is seeded on purpose — add more later from Supabase Table Editor
-- whenever you're ready to expand beyond a single product line.

insert into public.categories (name, slug) values
  ('প্রোডাক্টিভিটি টুলস', 'productivity-tools');

-- Featured / newest product (shown in the homepage spotlight section)
insert into public.products (category_id, name, slug, description, price, compare_at_price, stock, images)
select id,
  'স্মার্ট পমোডোরো টাইমার',
  'smart-pomodoro-timer',
  'একটি সহজ, ফ্লিপ-টু-স্টার্ট টাইমার যা মনোযোগ ধরে রাখতে ও সময় ব্যবস্থাপনায় সাহায্য করে।' || E'\n\n' ||
  'ফিচার:' || E'\n' ||
  '• প্রিসেট সেশন: ৫, ১০, ২৫ ও ৫০ মিনিট' || E'\n' ||
  '• ফ্লিপ করলেই টাইমার শুরু হয়ে যায়' || E'\n' ||
  '• কাস্টম টাইমিং মোড, ৯৯ মিনিট পর্যন্ত' || E'\n' ||
  '• সাইলেন্ট, লো বা হাই অ্যালার্ট মোড',
  1490, 2500, 60,
  array['https://placehold.co/600x600?text=Pomodoro+Timer']
from public.categories where slug = 'productivity-tools';

insert into public.products (category_id, name, slug, description, price, compare_at_price, stock, images)
select id, 'পমোডোরো টাইমার (উডেন)', 'pomodoro-timer-wooden', 'কাঠের তৈরি ক্লাসিক পমোডোরো টাইমার।', 1490, 2300, 40,
  array['https://placehold.co/600x600?text=Wooden+Timer']
from public.categories where slug = 'productivity-tools';

insert into public.products (category_id, name, slug, description, price, compare_at_price, stock, images)
select id, 'পমোডোরো টাইমার (হোয়াইট)', 'pomodoro-timer-white', 'মিনিমাল হোয়াইট ডিজাইনের পমোডোরো টাইমার।', 1490, 2300, 40,
  array['https://placehold.co/600x600?text=White+Timer']
from public.categories where slug = 'productivity-tools';

insert into public.products (category_id, name, slug, description, price, compare_at_price, stock, images)
select id, 'ডেইলি ফোকাস টু-ডু লিস্ট প্যাড', 'daily-focus-todo-pad', 'প্রতিদিনের কাজ গুছিয়ে রাখার জন্য টু-ডু লিস্ট প্যাড।', 100, 300, 100,
  array['https://placehold.co/600x600?text=To-Do+Pad']
from public.categories where slug = 'productivity-tools';

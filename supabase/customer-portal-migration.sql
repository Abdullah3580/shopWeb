-- Customer portal migration. Run after schema.sql, admin-migration.sql,
-- phase5-migration.sql, and phase-06-migration.sql.
-- Safe for an existing database; no existing data is deleted.

create table if not exists public.customer_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  full_address text not null,
  city text not null,
  zone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_label_valid check (label in ('Home', 'Work'))
);

create unique index if not exists customer_addresses_one_default
  on public.customer_addresses(user_id) where is_default;
create index if not exists customer_addresses_user on public.customer_addresses(user_id, created_at desc);

create table if not exists public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists wishlists_user on public.wishlists(user_id, created_at desc);

create table if not exists public.product_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating int not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_id, product_id),
  constraint product_reviews_rating_valid check (rating between 1 and 5)
);
create index if not exists product_reviews_user on public.product_reviews(user_id, created_at desc);
create index if not exists product_reviews_product on public.product_reviews(product_id, created_at desc);

alter table public.customer_addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.product_reviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_addresses' and policyname = 'Customers manage own addresses') then
    create policy "Customers manage own addresses" on public.customer_addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wishlists' and policyname = 'Customers manage own wishlist') then
    create policy "Customers manage own wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_reviews' and policyname = 'Customers view own reviews') then
    create policy "Customers view own reviews" on public.product_reviews for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_reviews' and policyname = 'Customers create own reviews') then
    create policy "Customers create own reviews" on public.product_reviews for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_reviews' and policyname = 'Customers edit own reviews') then
    create policy "Customers edit own reviews" on public.product_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end;
$$;

create or replace function public.set_default_customer_address(p_address_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.customer_addresses set is_default = false, updated_at = now() where user_id = p_user_id;
  update public.customer_addresses set is_default = true, updated_at = now() where id = p_address_id and user_id = p_user_id;
end;
$$;
revoke all on function public.set_default_customer_address(uuid, uuid) from public, anon, authenticated;

-- Add ownership to future customer orders without changing existing orders.
alter table public.orders add column if not exists customer_user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_customer_user on public.orders(customer_user_id, created_at desc);

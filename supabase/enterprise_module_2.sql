-- Enterprise Module 2: marketplace discovery and search.
-- Run after enterprise_module_1.sql. Safe for existing data.

create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (length(trim(name)) > 0)
);

alter table public.products add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.products add column if not exists rating_average numeric(3,2) not null default 0;
alter table public.products add column if not exists rating_count int not null default 0;

create table if not exists public.search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  searched_at timestamptz not null default now(),
  constraint search_history_query_not_blank check (length(trim(query)) > 0)
);
create index if not exists search_history_user on public.search_history(user_id, searched_at desc);

create table if not exists public.product_view_events (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists product_view_events_product on public.product_view_events(product_id, created_at desc);
create index if not exists products_discovery_sort on public.products(is_active, price, rating_average, created_at desc);
create index if not exists products_brand on public.products(brand_id) where is_active;

alter table public.brands enable row level security;
alter table public.search_history enable row level security;
alter table public.product_view_events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'brands' and policyname = 'Public read active brands') then
    create policy "Public read active brands" on public.brands for select using (is_active = true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'search_history' and policyname = 'Customers manage own search history') then
    create policy "Customers manage own search history" on public.search_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'product_view_events' and policyname = 'Customers create product views') then
    create policy "Customers create product views" on public.product_view_events for insert with check (auth.uid() = user_id or user_id is null);
  end if;
end $$;

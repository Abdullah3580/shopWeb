-- Enterprise Module 2: enhanced product discovery and search.
-- Run after module_1.sql and the existing core schema. Safe for existing data.

create extension if not exists "uuid-ossp";

-- Category hierarchy. Existing root categories remain valid with a NULL parent_id.
alter table public.categories add column if not exists parent_id uuid;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'categories_parent_id_fkey' and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_parent_id_fkey
      foreign key (parent_id) references public.categories(id) on delete set null;
  end if;
end;
$$;
create index if not exists categories_parent_name_idx on public.categories(parent_id, name);
create index if not exists categories_root_idx on public.categories(name) where parent_id is null;

-- Brands and filter-ready product attributes.
create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (length(trim(name)) > 0)
);
alter table public.products add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.products add column if not exists rating_average numeric(3,2) not null default 0 check (rating_average between 0 and 5);
alter table public.products add column if not exists rating_count integer not null default 0 check (rating_count >= 0);
create index if not exists products_brand_active_idx on public.products(brand_id) where is_active;
create index if not exists products_discovery_sort_idx on public.products(is_active, price, rating_average desc, created_at desc);

-- Signed-in search history is private to the buyer.
create table if not exists public.search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  normalized_query text generated always as (lower(trim(query))) stored,
  searched_at timestamptz not null default now(),
  constraint search_history_query_not_blank check (length(trim(query)) between 1 and 200)
);
alter table public.search_history add column if not exists normalized_query text generated always as (lower(trim(query))) stored;
create index if not exists search_history_user_recent_idx on public.search_history(user_id, searched_at desc);
create index if not exists search_history_user_normalized_idx on public.search_history(user_id, normalized_query, searched_at desc);

-- Product views are written only by trusted server routes; RLS intentionally exposes no client write policy.
create table if not exists public.product_view_events (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists product_view_events_product_recent_idx on public.product_view_events(product_id, created_at desc);
create index if not exists product_view_events_user_recent_idx on public.product_view_events(user_id, created_at desc) where user_id is not null;

-- Incremental daily popularity aggregation for fast popularity sorting.
create table if not exists public.product_popularity_daily (
  product_id uuid not null references public.products(id) on delete cascade,
  metric_date date not null default current_date,
  view_count integer not null default 0 check (view_count >= 0),
  popularity_score numeric(14,4) not null default 0 check (popularity_score >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, metric_date)
);
create index if not exists product_popularity_daily_rank_idx on public.product_popularity_daily(metric_date desc, popularity_score desc);

create or replace function public.record_product_view_popularity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_popularity_daily (product_id, metric_date, view_count, popularity_score, updated_at)
  values (new.product_id, current_date, 1, 1, now())
  on conflict (product_id, metric_date) do update
    set view_count = public.product_popularity_daily.view_count + 1,
        popularity_score = public.product_popularity_daily.popularity_score + 1,
        updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'product_view_events_record_popularity') then
    create trigger product_view_events_record_popularity
      after insert on public.product_view_events
      for each row execute function public.record_product_view_popularity();
  end if;
end;
$$;

alter table public.brands enable row level security;
alter table public.search_history enable row level security;
alter table public.product_view_events enable row level security;
alter table public.product_popularity_daily enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'brands' and policyname = 'Public read active brands') then
    create policy "Public read active brands" on public.brands for select using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'search_history' and policyname = 'Customers manage own search history') then
    create policy "Customers manage own search history" on public.search_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end;
$$;

revoke all on function public.record_product_view_popularity() from public, anon, authenticated;

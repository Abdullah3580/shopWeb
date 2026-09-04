create extension if not exists "uuid-ossp";

alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists specifications jsonb default '{}'::jsonb;
alter table public.products add column if not exists warranty_info text;
alter table public.products add column if not exists return_policy_info text;
alter table public.products add column if not exists estimated_delivery_days integer default 3;

create table if not exists public.product_media (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  thumbnail_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  attributes jsonb not null default '{}'::jsonb,
  price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.product_reviews add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.product_reviews add column if not exists media_urls text[] default array[]::text[];
alter table public.product_reviews add column if not exists is_verified_purchase boolean not null default false;
alter table public.product_reviews add column if not exists status text not null default 'approved' check (status in ('pending', 'approved', 'rejected'));
alter table public.product_reviews add column if not exists updated_at timestamptz not null default now();

create table if not exists public.product_questions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (length(trim(question)) > 3),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.product_answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.product_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer text not null check (length(trim(answer)) > 0),
  is_official boolean not null default true,
  created_at timestamptz not null default now()
);

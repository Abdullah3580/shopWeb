-- Enterprise Module 4: Checkout, Dynamic Payments, Coupons & Refunds (Fixed)
create extension if not exists "uuid-ossp";

create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed', 'percentage')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) default 0,
  max_discount_amount numeric(12,2),
  usage_limit integer,
  used_count integer default 0,
  starts_at timestamptz default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_usages (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  used_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.payment_transactions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.payment_transactions add column if not exists tran_id text;
alter table public.payment_transactions add column if not exists payment_method text;
alter table public.payment_transactions add column if not exists amount numeric(12,2) default 0;
alter table public.payment_transactions add column if not exists status text default 'pending';
alter table public.payment_transactions add column if not exists gateway_response jsonb default '{}'::jsonb;
alter table public.payment_transactions add column if not exists updated_at timestamptz default now();

create table if not exists public.order_refunds (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'processed')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.order_refunds enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'coupons' and policyname = 'Public view active coupons') then
    create policy "Public view active coupons" on public.coupons for select using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'payment_transactions' and policyname = 'Customers view own payments') then
    create policy "Customers view own payments" on public.payment_transactions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'order_refunds' and policyname = 'Customers view own refunds') then
    create policy "Customers view own refunds" on public.order_refunds for select using (auth.uid() = user_id);
  end if;
end;
$$;

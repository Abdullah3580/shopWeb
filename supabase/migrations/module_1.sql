-- Enterprise Module 1: buyer identity and account data.
-- Run after customer-portal-migration.sql. Safe for existing data.
-- Passwords, OTP, MFA, and auth sessions are managed by Supabase Auth.

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  marketing_email_enabled boolean not null default true,
  marketing_sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_devices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_name text not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists customer_devices_user on public.customer_devices(user_id, last_seen_at desc);

create table if not exists public.customer_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  reward_coins int not null default 0,
  updated_at timestamptz not null default now(),
  constraint customer_wallets_balance_valid check (balance >= 0),
  constraint customer_wallets_coins_valid check (reward_coins >= 0)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  coins int not null default 0,
  transaction_type text not null,
  reference_id text,
  note text,
  created_at timestamptz not null default now(),
  constraint wallet_transactions_type_valid check (transaction_type in ('credit','debit','refund','reward','redemption'))
);
create index if not exists wallet_transactions_user on public.wallet_transactions(user_id, created_at desc);

create table if not exists public.reward_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coins int not null,
  event_type text not null,
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint reward_events_coins_nonzero check (coins <> 0)
);
create index if not exists reward_events_user on public.reward_events(user_id, created_at desc);

create table if not exists public.recently_viewed_products (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists recently_viewed_products_user on public.recently_viewed_products(user_id, viewed_at desc);

alter table public.customer_profiles enable row level security;
alter table public.customer_devices enable row level security;
alter table public.customer_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.reward_events enable row level security;
alter table public.recently_viewed_products enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'customer_profiles' and policyname = 'Customers manage own profile') then
    create policy "Customers manage own profile" on public.customer_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'customer_devices' and policyname = 'Customers manage own devices') then
    create policy "Customers manage own devices" on public.customer_devices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'customer_wallets' and policyname = 'Customers view own wallet') then
    create policy "Customers view own wallet" on public.customer_wallets for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'wallet_transactions' and policyname = 'Customers view own wallet transactions') then
    create policy "Customers view own wallet transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reward_events' and policyname = 'Customers view own rewards') then
    create policy "Customers view own rewards" on public.reward_events for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'recently_viewed_products' and policyname = 'Customers manage own history') then
    create policy "Customers manage own history" on public.recently_viewed_products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end;
$$;

create or replace function public.touch_customer_profile()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'customer_profiles_set_updated_at') then
    create trigger customer_profiles_set_updated_at before update on public.customer_profiles for each row execute function public.touch_customer_profile();
  end if;
end $$;

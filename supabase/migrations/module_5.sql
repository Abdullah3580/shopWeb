-- Enterprise Module 5: Order Lifecycle, Tracking & Customer Notifications (Fixed)
create extension if not exists "uuid-ossp";

alter table public.orders add column if not exists user_id uuid references auth.users(id);

do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'orders' and column_name = 'customer_id'
  ) then
    execute 'update public.orders set user_id = customer_id where user_id is null';
  end if;
end $$;

create table if not exists public.order_status_logs (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.order_status_logs add column if not exists notes text;
alter table public.order_status_logs add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists order_status_logs_order_idx on public.order_status_logs(order_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'order' check (type in ('order', 'promo', 'system', 'wallet')),
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists link_url text;
alter table public.notifications add column if not exists is_read boolean not null default false;

create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read, created_at desc);

alter table public.order_status_logs enable row level security;
alter table public.notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'order_status_logs' and policyname = 'Customers view own order logs') then
    create policy "Customers view own order logs" on public.order_status_logs
      for select using (
        exists (
          select 1 from public.orders o
          where o.id = public.order_status_logs.order_id
          and o.user_id = auth.uid()
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'notifications' and policyname = 'Customers manage own notifications') then
    create policy "Customers manage own notifications" on public.notifications
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end;
$$;

-- BD Marketplace core schema
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Categories (supports nested categories, e.g. Electronics > Mobile Accessories)
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);

-- Products
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  stock int not null default 0,
  images text[] default '{}',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_price_non_negative check (price >= 0),
  constraint products_compare_price_valid check (compare_at_price is null or compare_at_price >= price),
  constraint products_stock_non_negative check (stock >= 0)
);

-- Orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  tran_id text unique not null,           -- SSLCommerz transaction id
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address text not null,
  shipping_city text not null,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_method text not null,            -- sslcommerz / cod
  payment_status text not null default 'pending', -- pending / paid / failed / cancelled
  order_status text not null default 'processing', -- processing / shipped / delivered / cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_shipping_fee_non_negative check (shipping_fee >= 0),
  constraint orders_total_matches_amounts check (total = subtotal + shipping_fee),
  constraint orders_payment_method_valid check (payment_method in ('cod', 'sslcommerz')),
  constraint orders_payment_status_valid check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  constraint orders_order_status_valid check (order_status in ('processing', 'shipped', 'delivered', 'cancelled'))
);

-- Order line items
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,   -- snapshot, in case product changes later
  unit_price numeric(10,2) not null,
  quantity int not null,
  created_at timestamptz not null default now(),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0)
);

-- Payment attempts are retained separately so retries and gateway callbacks are auditable.
create table public.payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tran_id text not null references public.orders(tran_id) on delete cascade,
  gateway text not null default 'sslcommerz',
  gateway_val_id text,
  amount numeric(10,2) not null,
  status text not null default 'initiated',
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_amount_positive check (amount > 0),
  constraint payment_transactions_status_valid check (status in ('initiated', 'paid', 'failed', 'cancelled'))
);

create table public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint order_status_history_status_valid check (status in ('processing', 'shipped', 'delivered', 'cancelled'))
);

-- Admin-facing operational records. Admin APIs access these with the service-role key.
create table public.inventory_adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_change int not null,
  stock_after int not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint inventory_adjustments_stock_non_negative check (stock_after >= 0),
  constraint inventory_adjustments_reason_not_blank check (length(trim(reason)) > 0)
);

create table public.admin_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now(),
  constraint admin_activity_action_not_blank check (length(trim(action)) > 0)
);

-- Indexes
create index idx_products_category on public.products(category_id);
create index idx_products_active on public.products(is_active);
create index idx_orders_tran_id on public.orders(tran_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_payment_transactions_order on public.payment_transactions(order_id);
create index idx_payment_transactions_tran_id on public.payment_transactions(tran_id);
create index idx_order_status_history_order on public.order_status_history(order_id, created_at desc);
create index idx_inventory_adjustments_product on public.inventory_adjustments(product_id, created_at desc);
create index idx_admin_activity_logs_created on public.admin_activity_logs(created_at desc);

-- Row Level Security: public can read active products/categories,
-- only service role (server-side) can write orders/products.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.admin_activity_logs enable row level security;

create policy "Public read categories" on public.categories
  for select using (true);

create policy "Public read active products" on public.products
  for select using (is_active = true);

-- Orders/order_items are only accessed via server (service role key), so no public policy needed.

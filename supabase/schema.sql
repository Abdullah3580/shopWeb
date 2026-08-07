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
  created_at timestamptz default now()
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
  created_at timestamptz default now()
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
  payment_method text,                    -- bkash / nagad / card / cod
  payment_status text not null default 'pending', -- pending / paid / failed / cancelled
  order_status text not null default 'processing', -- processing / shipped / delivered / cancelled
  created_at timestamptz default now()
);

-- Order line items
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,   -- snapshot, in case product changes later
  unit_price numeric(10,2) not null,
  quantity int not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_products_category on public.products(category_id);
create index idx_products_active on public.products(is_active);
create index idx_orders_tran_id on public.orders(tran_id);
create index idx_order_items_order on public.order_items(order_id);

-- Row Level Security: public can read active products/categories,
-- only service role (server-side) can write orders/products.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public read categories" on public.categories
  for select using (true);

create policy "Public read active products" on public.products
  for select using (is_active = true);

-- Orders/order_items are only accessed via server (service role key), so no public policy needed.

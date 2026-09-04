-- Safe migration for an existing MyShopBD database.
-- Run this file after the original schema.sql has already been applied.
-- It does not delete or recreate existing tables or data.

alter table public.categories add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists idempotency_key text;
alter table public.orders add column if not exists inventory_released boolean not null default false;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists reorder_threshold int not null default 10;
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists invoice_number text;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancelled_reason text;
create unique index if not exists idx_orders_idempotency_key on public.orders(idempotency_key) where idempotency_key is not null;
create unique index if not exists idx_orders_invoice_number on public.orders(invoice_number) where invoice_number is not null;
create index if not exists idx_orders_status_created on public.orders(order_status, created_at desc);
create index if not exists idx_orders_payment_status_created on public.orders(payment_status, created_at desc);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);

create table if not exists public.payment_transactions (
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

create table if not exists public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint order_status_history_status_valid check (status in ('processing', 'shipped', 'delivered', 'cancelled'))
);

create table if not exists public.inventory_adjustments (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_change int not null,
  stock_after int not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint inventory_adjustments_stock_non_negative check (stock_after >= 0),
  constraint inventory_adjustments_reason_not_blank check (length(trim(reason)) > 0)
);

create table if not exists public.admin_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now(),
  constraint admin_activity_action_not_blank check (length(trim(action)) > 0)
);

create index if not exists idx_payment_transactions_order on public.payment_transactions(order_id);
create index if not exists idx_payment_transactions_tran_id on public.payment_transactions(tran_id);
create unique index if not exists idx_payment_transactions_tran_id_unique on public.payment_transactions(tran_id);
create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at desc);
create index if not exists idx_inventory_adjustments_product on public.inventory_adjustments(product_id, created_at desc);
create index if not exists idx_admin_activity_logs_created on public.admin_activity_logs(created_at desc);

alter table public.payment_transactions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.admin_activity_logs enable row level security;

create table if not exists public.returns (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reason text not null,
  status text not null default 'requested',
  refund_amount numeric(10,2) not null default 0,
  notes text,
  requested_by uuid references auth.users(id) on delete set null,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint returns_reason_not_blank check (length(trim(reason)) > 0),
  constraint returns_status_valid check (status in ('requested', 'approved', 'received', 'refunded', 'rejected', 'cancelled')),
  constraint returns_refund_non_negative check (refund_amount >= 0)
);

create table if not exists public.return_items (
  id uuid primary key default uuid_generate_v4(),
  return_id uuid not null references public.returns(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  quantity int not null,
  created_at timestamptz not null default now(),
  constraint return_items_quantity_positive check (quantity > 0)
);

create index if not exists idx_returns_order on public.returns(order_id, created_at desc);
create index if not exists idx_returns_status on public.returns(status, created_at desc);
create index if not exists idx_return_items_return on public.return_items(return_id);
alter table public.returns enable row level security;
alter table public.return_items enable row level security;

create table if not exists public.inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  quantity_change int not null,
  stock_after int not null,
  movement_type text not null,
  reason text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_valid check (movement_type in ('restock', 'sale', 'return', 'adjustment', 'reservation', 'release')),
  constraint inventory_movements_stock_non_negative check (stock_after >= 0),
  constraint inventory_movements_reason_not_blank check (length(trim(reason)) > 0)
);

create index if not exists idx_inventory_movements_product on public.inventory_movements(product_id, created_at desc);
create index if not exists idx_inventory_movements_variant on public.inventory_movements(variant_id, created_at desc);
alter table public.inventory_movements enable row level security;

-- Atomically validate prices/stock, reserve inventory, and create an order.
create or replace function public.create_order_with_inventory(
  p_idempotency_key text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_fee numeric,
  p_payment_method text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_subtotal numeric(10,2) := 0;
  v_total numeric(10,2);
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 16 then
    raise exception 'Invalid idempotency key';
  end if;

  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then return v_order; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart cannot be empty';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and is_active = true for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock < v_quantity then raise exception 'Insufficient stock for %', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  v_total := v_subtotal + p_shipping_fee;
  insert into public.orders (idempotency_key, tran_id, customer_name, customer_phone, customer_email, shipping_address, shipping_city, subtotal, shipping_fee, total, payment_method, payment_status, order_status)
  values (p_idempotency_key, 'ORD-' || extract(epoch from clock_timestamp())::bigint || '-' || floor(random() * 10000)::int, trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''), trim(p_shipping_address), p_shipping_city, v_subtotal, p_shipping_fee, v_total, p_payment_method, 'pending', 'processing')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    update public.products set stock = stock - v_quantity, updated_at = now() where id = v_product.id and stock >= v_quantity;
    if not found then raise exception 'Insufficient stock for %', v_product.name; end if;
    insert into public.inventory_movements (product_id, quantity_change, stock_after, movement_type, reason)
    values (v_product.id, -v_quantity, v_product.stock - v_quantity, 'reservation', 'Checkout inventory reservation');
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_quantity);
  end loop;
  return v_order;
end;
$$;

revoke all on function public.create_order_with_inventory(text, text, text, text, text, text, numeric, text, jsonb) from public, anon, authenticated;

create or replace function public.release_order_inventory(p_tran_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where tran_id = p_tran_id for update;
  if not found or v_order.inventory_released or v_order.payment_status = 'paid' then return; end if;
  for v_item in select product_id, sum(quantity)::integer as quantity from public.order_items where order_id = v_order.id and product_id is not null group by product_id loop
    update public.products set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_id;
    insert into public.inventory_movements (product_id, quantity_change, stock_after, movement_type, reason)
    select v_item.product_id, v_item.quantity, stock, 'release', 'Payment failure or cancellation release'
    from public.products where id = v_item.product_id;
  end loop;
  update public.orders set inventory_released = true, updated_at = now() where id = v_order.id;
end;
$$;

revoke all on function public.release_order_inventory(text) from public, anon, authenticated;

create or replace function public.process_order_return(
  p_order_id uuid,
  p_reason text,
  p_status text,
  p_refund_amount numeric,
  p_actor_id uuid
)
returns public.returns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.returns;
  v_order public.orders;
  v_item record;
begin
  if p_status not in ('requested', 'approved', 'received', 'refunded', 'rejected', 'cancelled') then raise exception 'Invalid return status'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_status in ('received', 'refunded') and v_order.inventory_released = false then
    for v_item in select product_id, sum(quantity)::integer as quantity from public.order_items where order_id = p_order_id and product_id is not null group by product_id loop
      update public.products set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_id;
      insert into public.inventory_movements (product_id, quantity_change, stock_after, movement_type, reason, actor_id)
      select v_item.product_id, v_item.quantity, stock, 'return', 'Approved order return', p_actor_id from public.products where id = v_item.product_id;
    end loop;
    update public.orders set inventory_released = true, order_status = 'cancelled', updated_at = now() where id = p_order_id;
  end if;
  insert into public.returns (order_id, reason, status, refund_amount, requested_by, processed_by, processed_at)
  values (p_order_id, trim(p_reason), p_status, greatest(coalesce(p_refund_amount, 0), 0), p_actor_id, p_actor_id, case when p_status in ('received', 'refunded', 'rejected', 'cancelled') then now() end)
  returning * into v_return;
  return v_return;
end;
$$;

revoke all on function public.process_order_return(uuid, text, text, numeric, uuid) from public, anon, authenticated;

-- Supabase Auth-backed RBAC. Create users from Supabase Authentication first,
-- then assign one of these roles in the user_roles table.
create table if not exists public.admin_roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamptz not null default now(),
  constraint admin_roles_name_valid check (name in ('owner', 'manager', 'catalog', 'fulfillment', 'finance'))
);

create table if not exists public.admin_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

insert into public.admin_roles (name, description) values
  ('owner', 'Full store access'),
  ('manager', 'Catalog and order management'),
  ('catalog', 'Products, variants, categories, and inventory'),
  ('fulfillment', 'Orders and delivery operations'),
  ('finance', 'Payments, revenue, and invoices')
on conflict (name) do nothing;

alter table public.admin_roles enable row level security;
alter table public.admin_user_roles enable row level security;
create index if not exists idx_admin_user_roles_user on public.admin_user_roles(user_id);
create index if not exists idx_admin_user_roles_role on public.admin_user_roles(role_id);

create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null,
  name text not null,
  options jsonb not null default '{}'::jsonb,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  stock int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_sku_not_blank check (length(trim(sku)) > 0),
  constraint product_variants_name_not_blank check (length(trim(name)) > 0),
  constraint product_variants_price_valid check (price is null or price >= 0),
  constraint product_variants_compare_price_valid check (compare_at_price is null or price is null or compare_at_price >= price),
  constraint product_variants_stock_non_negative check (stock >= 0)
);

create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_url_not_blank check (length(trim(url)) > 0)
);

create index if not exists idx_product_variants_product on public.product_variants(product_id);
create index if not exists idx_product_images_product on public.product_images(product_id, sort_order);
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants add column if not exists barcode text;
alter table public.product_variants add column if not exists reorder_threshold int not null default 5;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;


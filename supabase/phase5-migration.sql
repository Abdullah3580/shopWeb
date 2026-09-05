-- Phase 5 migration: Marketing, store settings, and analytics.
-- Run after schema.sql and admin-migration.sql.
-- Safe for an existing database; does not delete existing data.

alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists tax_amount numeric(10,2) not null default 0;
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount_type text not null,
  discount_value numeric(10,2) not null,
  max_discount numeric(10,2),
  min_order_amount numeric(10,2) not null default 0,
  max_uses int,
  usage_count int not null default 0,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_valid check (length(trim(code)) >= 3),
  constraint coupons_type_valid check (discount_type in ('percentage', 'fixed')),
  constraint coupons_value_positive check (discount_value > 0),
  constraint coupons_percentage_valid check (discount_type <> 'percentage' or discount_value <= 100),
  constraint coupons_max_discount_valid check (max_discount is null or max_discount >= 0),
  constraint coupons_min_order_non_negative check (min_order_amount >= 0),
  constraint coupons_max_uses_valid check (max_uses is null or max_uses > 0),
  constraint coupons_usage_valid check (usage_count >= 0 and (max_uses is null or usage_count <= max_uses)),
  constraint coupons_dates_valid check (expires_at is null or expires_at > starts_at)
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_phone text not null,
  discount_amount numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint coupon_redemptions_discount_non_negative check (discount_amount >= 0)
);

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'MyShopBD',
  logo_url text,
  contact_phone text,
  contact_email text,
  inside_dhaka_shipping numeric(10,2) not null default 70,
  outside_dhaka_shipping numeric(10,2) not null default 130,
  cod_enabled boolean not null default true,
  sslcommerz_enabled boolean not null default false,
  store_address text,
  tax_rate numeric(5,2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint store_settings_shipping_non_negative check (inside_dhaka_shipping >= 0 and outside_dhaka_shipping >= 0),
  constraint store_settings_tax_rate_valid check (tax_rate >= 0 and tax_rate <= 100)
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;
alter table public.store_settings add column if not exists store_address text;
alter table public.store_settings add column if not exists tax_rate numeric(5,2) not null default 0;
create index if not exists idx_coupons_active_dates on public.coupons(is_active, starts_at, expires_at);
create index if not exists idx_coupon_redemptions_coupon on public.coupon_redemptions(coupon_id, created_at desc);
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.create_order_with_coupon(
  p_idempotency_key text, p_customer_name text, p_customer_phone text, p_customer_email text,
  p_shipping_address text, p_shipping_city text, p_payment_method text, p_coupon_code text, p_items jsonb
)
returns public.orders language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders; v_item jsonb; v_product public.products; v_coupon public.coupons;
  v_quantity integer; v_subtotal numeric(10,2) := 0; v_discount numeric(10,2) := 0;
  v_shipping numeric(10,2); v_total numeric(10,2); v_code text;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 16 then raise exception 'Invalid idempotency key'; end if;
  select * into v_order from public.orders where idempotency_key = p_idempotency_key;
  if found then return v_order; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart cannot be empty'; end if;
  if p_payment_method not in ('cod', 'sslcommerz') then raise exception 'Invalid payment method'; end if;
  if p_shipping_city not in ('inside_dhaka', 'outside_dhaka') then raise exception 'Invalid shipping area'; end if;
  select case when p_shipping_city = 'inside_dhaka' then inside_dhaka_shipping else outside_dhaka_shipping end into v_shipping from public.store_settings where id = 1;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and is_active = true for update;
    if not found or v_product.stock < v_quantity then raise exception 'Product unavailable or insufficient stock'; end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;
  v_code := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  if v_code is not null then
    select * into v_coupon from public.coupons where upper(code) = v_code for update;
    if not found or not v_coupon.is_active or now() < v_coupon.starts_at or (v_coupon.expires_at is not null and now() > v_coupon.expires_at) then raise exception 'Invalid or expired coupon'; end if;
    if v_coupon.max_uses is not null and v_coupon.usage_count >= v_coupon.max_uses then raise exception 'Coupon usage limit reached'; end if;
    if v_subtotal < v_coupon.min_order_amount then raise exception 'Minimum order amount not reached'; end if;
    if exists (select 1 from public.coupon_redemptions where coupon_id = v_coupon.id and customer_phone = p_customer_phone) then raise exception 'Coupon already used'; end if;
    v_discount := case when v_coupon.discount_type = 'percentage' then v_subtotal * v_coupon.discount_value / 100 else v_coupon.discount_value end;
    if v_coupon.max_discount is not null then v_discount := least(v_discount, v_coupon.max_discount); end if;
    v_discount := least(v_discount, v_subtotal);
    update public.coupons set usage_count = usage_count + 1, updated_at = now() where id = v_coupon.id;
  end if;
  v_total := v_subtotal - v_discount + v_shipping;
  insert into public.orders (idempotency_key, tran_id, customer_name, customer_phone, customer_email, shipping_address, shipping_city, subtotal, shipping_fee, total, discount_amount, coupon_code, payment_method, payment_status, order_status)
  values (p_idempotency_key, 'ORD-' || extract(epoch from clock_timestamp())::bigint || '-' || floor(random() * 10000)::int, trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''), trim(p_shipping_address), p_shipping_city, v_subtotal, v_shipping, v_total, v_discount, v_code, p_payment_method, 'pending', 'processing') returning * into v_order;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    update public.products set stock = stock - v_quantity, updated_at = now() where id = v_product.id and stock >= v_quantity;
    if not found then raise exception 'Insufficient stock'; end if;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity) values (v_order.id, v_product.id, v_product.name, v_product.price, v_quantity);
    insert into public.inventory_movements (product_id, quantity_change, stock_after, movement_type, reason) values (v_product.id, -v_quantity, v_product.stock - v_quantity, 'reservation', 'Checkout inventory reservation');
  end loop;
  if v_coupon.id is not null then insert into public.coupon_redemptions (coupon_id, order_id, customer_phone, discount_amount) values (v_coupon.id, v_order.id, p_customer_phone, v_discount); end if;
  return v_order;
end; $$;

revoke all on function public.create_order_with_coupon(text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;

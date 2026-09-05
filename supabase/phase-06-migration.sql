-- Phase 6 migration: pre-production database reliability hardening.
-- Run after schema.sql, admin-migration.sql, and phase5-migration.sql.
-- This migration does not delete or recreate data.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep update timestamps accurate for admin edits and operational changes.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'categories_set_updated_at') then
    create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'products_set_updated_at') then
    create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'orders_set_updated_at') then
    create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'coupons_set_updated_at') then
    create trigger coupons_set_updated_at before update on public.coupons for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'store_settings_set_updated_at') then
    create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'product_variants_set_updated_at') then
    create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- Useful indexes for production dashboard reads and operational cleanup.
create index if not exists idx_orders_courier_tracking on public.orders(courier_name, tracking_number) where tracking_number is not null;
create index if not exists idx_orders_cancelled_at on public.orders(cancelled_at) where cancelled_at is not null;
create index if not exists idx_products_reorder on public.products(stock, reorder_threshold) where is_active = true;
create index if not exists idx_product_variants_reorder on public.product_variants(stock, reorder_threshold) where is_active = true;

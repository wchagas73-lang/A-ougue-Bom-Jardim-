-- Segunda etapa: catálogo público seguro e imagens dos produtos.
-- Esta migração não libera acesso público a pedidos, clientes ou pagamentos.

alter table public.stores
  add column if not exists address text,
  add column if not exists business_hours text,
  add column if not exists instagram text;

alter table public.delivery_settings
  add column if not exists orders_paused boolean not null default false,
  add column if not exists minimum_order numeric(10,2) not null default 0
    check (minimum_order >= 0);

-- View pública limitada aos dados necessários para montar o catálogo.
-- Não inclui dados de clientes, pedidos, pagamentos nem configurações internas.
create or replace view public.public_store_catalog
with (security_barrier = true)
as
select
  s.slug as store_slug,
  s.name as store_name,
  s.whatsapp as store_whatsapp,
  s.business_hours,
  s.instagram,
  c.id as category_id,
  c.name as category_name,
  c.sort_order as category_sort_order,
  p.id as product_id,
  p.name as product_name,
  p.description as product_description,
  p.price as product_price,
  p.unit as product_unit,
  p.image_url as product_image_url,
  p.available as product_available
from public.stores s
join public.products p on p.store_id = s.id
left join public.categories c on c.id = p.category_id and c.active = true
where p.active = true;

grant select on public.public_store_catalog to anon, authenticated;

-- Bucket público somente para leitura das fotos do catálogo.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public can view product images" on storage.objects;
create policy "public can view product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "owners upload product images to own store" on storage.objects;
create policy "owners upload product images to own store"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

drop policy if exists "owners update product images in own store" on storage.objects;
create policy "owners update product images in own store"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

drop policy if exists "owners delete product images in own store" on storage.objects;
create policy "owners delete product images in own store"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

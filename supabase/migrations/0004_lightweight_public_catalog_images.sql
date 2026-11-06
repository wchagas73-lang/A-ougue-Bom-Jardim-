-- Otimização do catálogo público: imagens Base64 antigas não são baixadas junto dos produtos.
-- URLs do Supabase Storage e URLs externas continuam visíveis normalmente.
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
  case
    when p.image_url like 'data:image/%;base64,%' then null
    else p.image_url
  end as product_image_url,
  p.available as product_available
from public.stores s
join public.products p on p.store_id = s.id
left join public.categories c on c.id = p.category_id and c.active = true
where p.active = true;

grant select on public.public_store_catalog to anon, authenticated;

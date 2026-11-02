-- Promoções agendadas por produto. A agenda é acessível somente à equipe autenticada da loja.
alter table public.promotions
  add column if not exists title text not null default 'Oferta especial',
  add column if not exists description text,
  add column if not exists icon text not null default '🔥',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.promotions
  drop constraint if exists promotions_dates_valid;
alter table public.promotions
  add constraint promotions_dates_valid
  check (starts_at is null or ends_at is null or ends_at > starts_at);

create index if not exists promotions_store_schedule_idx
  on public.promotions(store_id, active, starts_at, ends_at);

-- A tabela permanece protegida por RLS: apenas membros autenticados da própria loja
-- podem consultar a agenda; somente owner pode criar, alterar ou excluir.

-- Vitrine pública: somente promoções vigentes e campos necessários ao catálogo.
-- A agenda completa continua protegida pela RLS da tabela promotions.
create or replace view public.public_active_promotions
with (security_barrier = true) as
select
  s.slug as store_slug,
  p.id as promotion_id,
  p.product_id,
  pr.name as product_name,
  pr.unit as product_unit,
  p.old_price,
  p.promotional_price,
  p.title,
  p.description,
  p.icon
from public.promotions p
join public.stores s on s.id = p.store_id
join public.products pr on pr.id = p.product_id and pr.store_id = p.store_id
where p.active = true
  and pr.active = true
  and pr.available = true
  and (p.starts_at is null or p.starts_at <= now())
  and (p.ends_at is null or p.ends_at >= now());

grant select on public.public_active_promotions to anon, authenticated;

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

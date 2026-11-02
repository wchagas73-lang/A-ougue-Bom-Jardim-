-- Registro permanente e append-only da linha do tempo dos pedidos.
-- Cada criação e alteração de status gera um evento no banco, sem sobrescrever eventos anteriores.

create index if not exists order_events_order_created_idx
  on public.order_events (order_id, created_at asc);

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, actor_id, event_type, old_value, new_value, note, created_at)
    values (new.id, auth.uid(), 'order_created', null, new.status, 'Pedido registrado no sistema', coalesce(new.created_at, now()));
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.order_events (order_id, actor_id, event_type, old_value, new_value, note, created_at)
    values (new.id, auth.uid(), 'status_changed', old.status, new.status, 'Status alterado no painel da loja', now());
  end if;

  return new;
end;
$$;

drop trigger if exists orders_log_created_status on public.orders;
create trigger orders_log_created_status
after insert on public.orders
for each row execute function public.log_order_status_event();

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
after update of status on public.orders
for each row
when (old.status is distinct from new.status)
execute function public.log_order_status_event();

-- Backfill mínimo para pedidos antigos que ainda não possuem nenhum evento.
-- Não inventa alterações anteriores que não foram registradas.
insert into public.order_events (order_id, event_type, old_value, new_value, note, created_at)
select o.id, 'order_created', null, o.status,
       'Registro inicial do histórico; alterações anteriores não disponíveis',
       o.created_at
from public.orders o
where not exists (
  select 1 from public.order_events e where e.order_id = o.id
);

-- A tabela já possui RLS e política de leitura/inserção para membros da loja.
-- Não são criadas políticas de UPDATE ou DELETE: eventos antigos não podem ser editados pelo painel.

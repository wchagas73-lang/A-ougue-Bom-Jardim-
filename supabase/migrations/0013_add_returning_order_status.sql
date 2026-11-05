-- Inclui a etapa operacional de retorno de entrega no ciclo de vida dos pedidos.
-- Aplique este arquivo no SQL Editor do projeto Supabase de produção.

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'received',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'awaiting_resolution',
    'returning'
  ));

-- Edição atômica e restrita de itens de pedidos em preparação.
create or replace function public.update_preparing_order_items(p_order_id uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_subtotal numeric(10,2);
  v_fee numeric(10,2);
begin
  if auth.uid() is null or public.current_role() <> 'owner' then
    raise exception 'Somente o proprietário pode editar os itens do pedido.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter pelo menos um produto.';
  end if;
  select store_id, delivery_fee into v_store_id, v_fee
  from public.orders where id = p_order_id and store_id = public.current_store_id()
    and status = 'preparing' for update;
  if v_store_id is null then
    raise exception 'Pedido não encontrado ou não está mais em preparação. A edição foi bloqueada.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) x
    left join public.products p on p.id = (x->>'product_id')::uuid
      and p.store_id = v_store_id and p.active = true and p.available = true
    where p.id is null or coalesce((x->>'quantity')::numeric,0) <= 0
  ) then
    raise exception 'Um dos produtos não está disponível ou possui quantidade inválida.';
  end if;
  select coalesce(sum(p.price * (x->>'quantity')::numeric),0)
    into v_subtotal
  from jsonb_array_elements(p_items) x
  join public.products p on p.id = (x->>'product_id')::uuid
  where p.store_id = v_store_id and p.active = true and p.available = true;
  delete from public.order_items where order_id = p_order_id;
  insert into public.order_items(order_id,product_id,product_name,quantity,unit,unit_price,line_total)
  select p_order_id,p.id,p.name,(x->>'quantity')::numeric,p.unit,p.price,
    round(p.price * (x->>'quantity')::numeric,2)
  from jsonb_array_elements(p_items) x
  join public.products p on p.id = (x->>'product_id')::uuid
  where p.store_id = v_store_id and p.active = true and p.available = true;
  update public.orders set subtotal=v_subtotal,total=v_subtotal+v_fee,updated_at=now()
  where id=p_order_id and store_id=v_store_id and status='preparing';
  insert into public.order_events(order_id,actor_id,event_type,old_value,new_value,note)
  values(p_order_id,auth.uid(),'items_edited',null,null,'Itens, quantidades e valores atualizados pelo proprietário durante a preparação.');
end;
$$;
revoke all on function public.update_preparing_order_items(uuid,jsonb) from public;
grant execute on function public.update_preparing_order_items(uuid,jsonb) to authenticated;

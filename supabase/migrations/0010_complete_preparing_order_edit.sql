-- Edição completa e atômica de pedidos enquanto estiverem em preparação.
alter table public.orders
  add column if not exists delivery_reference text,
  add column if not exists cash_received numeric(10,2) check (cash_received is null or cash_received >= 0),
  add column if not exists change_due numeric(10,2) not null default 0 check (change_due >= 0);

create or replace function public.update_preparing_order_complete(
  p_order_id uuid,
  p_items jsonb,
  p_order_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_fee numeric(10,2);
  v_subtotal numeric(10,2);
  v_total numeric(10,2);
  v_payment text;
  v_cash_received numeric(10,2);
  v_change_due numeric(10,2);
  v_name text;
  v_phone text;
  v_address text;
begin
  if auth.uid() is null or public.current_role() <> 'owner' then
    raise exception 'Somente o proprietário pode editar o pedido.';
  end if;

  if jsonb_typeof(p_order_data) <> 'object'
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 40 then
    raise exception 'Confira os dados e os produtos do pedido.';
  end if;

  v_name := nullif(trim(p_order_data->>'customer_name'), '');
  v_phone := regexp_replace(coalesce(p_order_data->>'customer_phone',''), '\\D', '', 'g');
  v_address := nullif(trim(p_order_data->>'delivery_address'), '');
  v_payment := p_order_data->>'payment_method';

  if v_name is null or length(v_name) > 120
     or length(v_phone) < 10 or length(v_phone) > 13
     or v_address is null or length(v_address) > 500
     or v_payment not in ('pix','cash','debit','credit') then
    raise exception 'Nome, telefone, endereço ou forma de pagamento inválidos.';
  end if;

  select store_id, delivery_fee
    into v_store_id, v_fee
  from public.orders
  where id = p_order_id
    and store_id = public.current_store_id()
    and status = 'preparing'
  for update;

  if v_store_id is null then
    raise exception 'Pedido não encontrado ou não está mais em preparação. A edição foi bloqueada.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) x
    left join public.products p
      on p.id = (x->>'product_id')::uuid
     and p.store_id = v_store_id
     and p.active = true
     and p.available = true
    where p.id is null
       or coalesce((x->>'quantity')::numeric, 0) <= 0
       or coalesce((x->>'quantity')::numeric, 0) > 50
  ) then
    raise exception 'Um produto não está disponível ou possui quantidade inválida.';
  end if;

  select round(coalesce(sum(round(p.price * (x->>'quantity')::numeric, 2)), 0), 2)
    into v_subtotal
  from jsonb_array_elements(p_items) x
  join public.products p
    on p.id = (x->>'product_id')::uuid
   and p.store_id = v_store_id
   and p.active = true
   and p.available = true;

  v_total := round(v_subtotal + coalesce(v_fee,0), 2);
  v_cash_received := nullif(p_order_data->>'cash_received','')::numeric;

  if v_payment = 'cash' and v_cash_received is not null then
    if v_cash_received < v_total then
      raise exception 'O valor recebido precisa ser igual ou maior que o total.';
    end if;
    v_change_due := round(v_cash_received - v_total, 2);
  else
    v_cash_received := null;
    v_change_due := 0;
  end if;

  delete from public.order_items where order_id = p_order_id;

  insert into public.order_items(
    order_id, product_id, product_name, quantity, unit, unit_price, line_total
  )
  select
    p_order_id, p.id, p.name, (x->>'quantity')::numeric, p.unit, p.price,
    round(p.price * (x->>'quantity')::numeric, 2)
  from jsonb_array_elements(p_items) x
  join public.products p
    on p.id = (x->>'product_id')::uuid
   and p.store_id = v_store_id
   and p.active = true
   and p.available = true;

  update public.orders
  set customer_name = v_name,
      customer_phone = v_phone,
      delivery_address = v_address,
      delivery_reference = nullif(trim(coalesce(p_order_data->>'delivery_reference','')), ''),
      customer_notes = nullif(trim(coalesce(p_order_data->>'customer_notes','')), ''),
      payment_method = v_payment,
      cash_received = v_cash_received,
      change_due = v_change_due,
      subtotal = v_subtotal,
      total = v_total,
      updated_at = now()
  where id = p_order_id
    and store_id = v_store_id
    and status = 'preparing';

  insert into public.order_events(order_id, actor_id, event_type, old_value, new_value, note)
  values (
    p_order_id, auth.uid(), 'order_edited', null, null,
    'Dados do cliente, endereço, referência, itens, pagamento, subtotal, total e troco atualizados pelo proprietário.'
  );
end;
$$;

revoke all on function public.update_preparing_order_complete(uuid,jsonb,jsonb) from public;
grant execute on function public.update_preparing_order_complete(uuid,jsonb,jsonb) to authenticated;

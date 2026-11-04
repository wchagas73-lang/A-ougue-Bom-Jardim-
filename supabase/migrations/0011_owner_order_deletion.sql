-- Permite que somente o proprietário exclua pedidos da própria loja.
-- order_items, order_events e payments usam ON DELETE CASCADE na migration inicial.
drop policy if exists "owner deletes own orders" on public.orders;
create policy "owner deletes own orders" on public.orders
for delete to authenticated
using (store_id = public.current_store_id() and public.current_role() = 'owner');

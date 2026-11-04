-- Habilita a transmissão de alterações da tabela de pedidos pelo Supabase Realtime.
-- O painel da loja recebe novos pedidos, alterações e exclusões sem precisar atualizar a página.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;

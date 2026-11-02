-- Corrige as imagens representativas das categorias no catálogo do Açougue Bom Jardim.
-- Uma imagem padronizada por categoria, aplicada a todos os produtos dela.
do $$
declare
  v_store_id uuid;
begin
  select id into v_store_id
  from public.stores
  where slug = 'acougue-bom-jardim'
  limit 1;

  if v_store_id is null then
    raise exception 'Loja acougue-bom-jardim não encontrada em public.stores.';
  end if;

  update public.products p
  set image_url = case
    when c.name = 'Porco' then 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=900'
    when c.name = 'Kit Churrasco' then 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900'
    when c.name = 'Diversos' then 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900'
    else p.image_url
  end,
  updated_at = now()
  from public.categories c
  where p.category_id = c.id
    and p.store_id = v_store_id
    and c.store_id = v_store_id
    and c.name in ('Porco', 'Kit Churrasco', 'Diversos');
end $$;

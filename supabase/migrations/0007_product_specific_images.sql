-- Aplica fotos ilustrativas específicas conforme o nome de cada produto.
-- Mantém nomes, preços, unidades, categorias e promoções sem alterações.
create extension if not exists unaccent;

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
    when unaccent(lower(p.name)) like '%salsicha%' then 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=900'
    when unaccent(lower(p.name)) like '%torresm%' or unaccent(lower(p.name)) like '%torrico%' then 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900'
    when unaccent(lower(p.name)) like '%gordura%' then 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=900'
    when unaccent(lower(p.name)) like '%presunto%' then 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=900'
    when unaccent(lower(p.name)) like '%mussarela%' or unaccent(lower(p.name)) like '%mucarela%' or unaccent(lower(p.name)) like '%queijo%' then 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=900'
    when unaccent(lower(p.name)) like '%massa de pastel%' or unaccent(lower(p.name)) like '%massa de kibe%' then 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=900'
    when unaccent(lower(p.name)) like '%carvao%' then 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900'
    when unaccent(lower(p.name)) like '%pao de alho%' then 'https://images.unsplash.com/photo-1619531040576-f94167406619?w=900'
    when unaccent(lower(p.name)) like '%linguica%' then 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=900'
    when unaccent(lower(p.name)) like '%costelinha%' then 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900'
    when unaccent(lower(p.name)) like '%bacon%' then 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=900'
    when unaccent(lower(p.name)) like '%kit de churrasco%' or unaccent(lower(p.name)) like '%kit churrasco%' then 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900'
    when c.name = 'Porco' then 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=900'
    when c.name = 'Diversos' then 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900'
    else p.image_url
  end,
  updated_at = now()
  from public.categories c
  where p.category_id = c.id
    and p.store_id = v_store_id
    and c.store_id = v_store_id
    and (
      c.name in ('Porco', 'Diversos', 'Kit Churrasco')
      or unaccent(lower(p.name)) like any (array[
        '%salsicha%', '%torresm%', '%torrico%', '%gordura%', '%presunto%',
        '%mussarela%', '%mucarela%', '%queijo%', '%massa de pastel%',
        '%massa de kibe%', '%carvao%', '%pao de alho%', '%linguica%',
        '%costelinha%', '%bacon%', '%kit de churrasco%', '%kit churrasco%'
      ])
    );
end $$;

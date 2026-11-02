-- Catálogo completo do Açougue Bom Jardim, baseado nos prints fornecidos.
-- Atualiza preço/unidade de itens equivalentes e insere somente os que faltam.
create extension if not exists unaccent;

do $$
declare
  v_store_id uuid;
  v_category_id uuid;
  r record;
  v_image text;
begin
  select id into v_store_id from public.stores where slug = 'acougue-bom-jardim' limit 1;
  if v_store_id is null then
    raise exception 'Loja acougue-bom-jardim não encontrada em public.stores.';
  end if;

  insert into public.categories (store_id, name, sort_order, active)
  values
    (v_store_id,'Boi',1,true),
    (v_store_id,'Porco',2,true),
    (v_store_id,'Frango',3,true),
    (v_store_id,'Kit Churrasco',4,true),
    (v_store_id,'Diversos',5,true)
  on conflict (store_id,name) do update set active = true;

  for r in
    select * from (values
    ('Boi','Acém',44.90,'kg'),
    ('Boi','Almôndega de carne',44.90,'kg'),
    ('Boi','Alcatra',63.00,'kg'),
    ('Boi','Bife à milanesa de boi',45.00,'kg'),
    ('Boi','Bife a rolê',44.90,'kg'),
    ('Boi','Contra-filé',66.00,'kg'),
    ('Boi','Chã de Dentro',60.00,'kg'),
    ('Boi','Chã de Fora',56.00,'kg'),
    ('Boi','Capa do coxão mole',46.90,'kg'),
    ('Boi','Capa de filé',44.90,'kg'),
    ('Boi','Cupim',44.90,'kg'),
    ('Boi','Costela bovina sem osso',37.00,'kg'),
    ('Boi','Costela bovina com osso',33.00,'kg'),
    ('Boi','Carne seca',49.99,'kg'),
    ('Boi','Dobradinha',29.99,'kg'),
    ('Boi','Filé mignon',81.99,'kg'),
    ('Boi','Fraldão',47.90,'kg'),
    ('Boi','Fígado de boi',23.99,'kg'),
    ('Boi','Hambúrguer bovino',44.90,'kg'),
    ('Boi','Lagarto',56.00,'kg'),
    ('Boi','Largatinho',47.98,'kg'),
    ('Boi','Linguiça de fraldinha',29.99,'kg'),
    ('Boi','Linguiça de costela',29.99,'kg'),
    ('Boi','Músculo traseiro',47.98,'kg'),
    ('Boi','Músculo de segunda (dianteiro)',44.90,'kg'),
    ('Boi','Moída da casa',29.90,'kg'),
    ('Boi','Mocotó',19.99,'kg'),
    ('Boi','Patinho',60.00,'kg'),
    ('Boi','Paleta',47.98,'kg'),
    ('Boi','Peito bovino',44.90,'kg'),
    ('Boi','Rabada',39.98,'kg'),
    ('Porco','Bacon suíno',44.99,'kg'),
    ('Porco','Bife à milanesa de porco',34.99,'kg'),
    ('Porco','Chispe',11.99,'kg'),
    ('Porco','Costelinha de porco',28.99,'kg'),
    ('Porco','Copa lombo suína',28.99,'kg'),
    ('Porco','Lombo suíno',28.99,'kg'),
    ('Porco','Linguiça suína',28.99,'kg'),
    ('Porco','Linguiça suína fina',28.99,'kg'),
    ('Porco','Orelha suína',11.99,'kg'),
    ('Porco','Pernil',28.99,'kg'),
    ('Porco','Paleta suína',28.99,'kg'),
    ('Porco','Picanha suína',28.99,'kg'),
    ('Porco','Torresmo',28.99,'kg'),
    ('Porco','Toucinho suíno',19.99,'kg'),
    ('Porco','Torresmão',28.99,'kg'),
    ('Frango','Asa de frango',22.99,'kg'),
    ('Frango','Bife de frango à milanesa',34.99,'kg'),
    ('Frango','Coxa',15.99,'kg'),
    ('Frango','Coxinha da asa',22.99,'kg'),
    ('Frango','Coração de frango',37.99,'kg'),
    ('Frango','Frango inteiro',17.99,'kg'),
    ('Frango','Filé do peito de frango',26.99,'kg'),
    ('Frango','Fígado de frango',9.99,'kg'),
    ('Frango','Frango a passarinho',15.99,'kg'),
    ('Frango','Linguiça de frango',28.99,'kg'),
    ('Frango','Moela',16.99,'kg'),
    ('Frango','Peito de frango',26.99,'kg'),
    ('Frango','Sobrecoxa',17.99,'kg'),
    ('Diversos','Carvão',17.99,'un.'),
    ('Diversos','Gordura derretida 1L',17.99,'un.'),
    ('Diversos','Massa de kibe',29.99,'kg'),
    ('Diversos','Massa de pastel',8.99,'un.'),
    ('Diversos','Manteiga da Roça 200g',11.99,'un.'),
    ('Diversos','Pão de alho',9.99,'un.'),
    ('Diversos','Presunto',34.99,'kg'),
    ('Diversos','Queijo minas padrão',26.99,'kg'),
    ('Diversos','Queijo parmesão',69.99,'kg'),
    ('Diversos','Queijo mussarela',59.99,'kg'),
    ('Diversos','Salsicha',15.99,'kg'),
    ('Diversos','Torresmo frito em pote',8.50,'un.'),
    ('Kit Churrasco','Kit de Churrasco 1',140.00,'un.'),
    ('Kit Churrasco','Kit de Churrasco 2',190.00,'un.'),
    ('Kit Churrasco','Kit de Churrasco 3',224.00,'un.'),
    ('Kit Churrasco','Kit de Churrasco 4',280.00,'un.'),
    ('Kit Churrasco','Kit de Churrasco 5',352.00,'un.')
    ) as p(category_name, product_name, product_price, product_unit)
  loop
    select id into v_category_id from public.categories
      where store_id=v_store_id and name=r.category_name limit 1;

    v_image := case
      when r.product_name ilike '%linguiça%' then 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700'
      when r.category_name='Boi' then 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=700'
      when r.category_name='Porco' then 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700'
      when r.category_name='Frango' then 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=700'
      when r.category_name='Kit Churrasco' then 'https://images.unsplash.com/photo-1558030006-450675393462?w=700'
      else 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700'
    end;

    update public.products
      set category_id=v_category_id, price=r.product_price, unit=r.product_unit,
          image_url=coalesce(nullif(image_url,''),v_image), active=true, available=true,
          updated_at=now()
      where store_id=v_store_id
        and regexp_replace(unaccent(lower(trim(name))), '[^a-z0-9]', '', 'g')
          = regexp_replace(unaccent(lower(trim(r.product_name))), '[^a-z0-9]', '', 'g');

    if not exists (
      select 1 from public.products
      where store_id=v_store_id
        and regexp_replace(unaccent(lower(trim(name))), '[^a-z0-9]', '', 'g')
          = regexp_replace(unaccent(lower(trim(r.product_name))), '[^a-z0-9]', '', 'g')
    ) then
      insert into public.products
        (store_id,category_id,name,description,price,unit,image_url,active,available)
      values
        (v_store_id,v_category_id,r.product_name,'',r.product_price,r.product_unit,v_image,true,true);
    end if;
  end loop;
end $$;

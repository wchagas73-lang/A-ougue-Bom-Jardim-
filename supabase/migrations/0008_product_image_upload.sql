-- Armazenamento das fotos dos produtos do Açougue Bom Jardim.
-- Execute uma única vez no Supabase > SQL Editor > New query.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 8388608,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Store owners upload product images" on storage.objects;
create policy "Store owners upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

drop policy if exists "Store owners update product images" on storage.objects;
create policy "Store owners update product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

drop policy if exists "Store owners delete product images" on storage.objects;
create policy "Store owners delete product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = public.current_store_id()::text
  and public.current_role() = 'owner'
);

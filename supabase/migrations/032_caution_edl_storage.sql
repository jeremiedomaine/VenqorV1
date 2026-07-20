-- Vidéos état des lieux (Caution) — bucket privé + signed URLs pour les mariés

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'caution-edl',
  'caution-edl',
  false,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "caution_edl_select_own" on storage.objects;
drop policy if exists "caution_edl_insert_own" on storage.objects;
drop policy if exists "caution_edl_update_own" on storage.objects;
drop policy if exists "caution_edl_delete_own" on storage.objects;

create policy "caution_edl_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'caution-edl'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "caution_edl_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'caution-edl'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "caution_edl_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'caution-edl'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "caution_edl_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'caution-edl'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

-- Template PDF contrat par domaine (Supabase Storage)

alter table public.workspaces
  add column if not exists contrat_template_path text,
  add column if not exists contrat_template_filename text,
  add column if not exists contrat_template_updated_at timestamptz;

comment on column public.workspaces.contrat_template_path is
  'Chemin Storage workspace-contrats/{workspace_id}/contrat.pdf';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-contrats',
  'workspace-contrats',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "workspace_contrats_select_own" on storage.objects;
drop policy if exists "workspace_contrats_insert_own" on storage.objects;
drop policy if exists "workspace_contrats_update_own" on storage.objects;
drop policy if exists "workspace_contrats_delete_own" on storage.objects;

create policy "workspace_contrats_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-contrats'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "workspace_contrats_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-contrats'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "workspace_contrats_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-contrats'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "workspace_contrats_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-contrats'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

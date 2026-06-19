-- Espace mariés : contenu structuré + message par événement + logos

alter table public.events
  add column if not exists message_accueil text not null default '';

alter table public.workspaces
  add column if not exists guide_infos_pratiques text not null default '',
  add column if not exists contact_nom text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists contact_telephone text not null default '';

-- Portail public (lecture seule via token)
create or replace function public.fetch_portal_data(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'workspace', json_build_object(
      'nom_domaine', w.nom_domaine,
      'logo_url', w.logo_url,
      'guide_infos_pratiques', w.guide_infos_pratiques,
      'guide_regles', w.guide_regles,
      'guide_prestataires', w.guide_prestataires,
      'contact_nom', w.contact_nom,
      'contact_email', w.contact_email,
      'contact_telephone', w.contact_telephone
    ),
    'event', json_build_object(
      'nom_des_maries', e.nom_des_maries,
      'date_debut', e.date_debut,
      'date_fin', e.date_fin,
      'statut', e.statut,
      'capacite_hebergement_totale', e.capacite_hebergement_totale,
      'prix_total', e.prix_total,
      'message_accueil', e.message_accueil
    ),
    'payments', coalesce(
      (
        select json_agg(
          json_build_object(
            'label', p.label,
            'montant', p.montant,
            'date_echeance', p.date_echeance,
            'statut', p.statut
          )
          order by p.date_echeance nulls last, p.created_at
        )
        from public.payments p
        where p.event_id = e.id
      ),
      '[]'::json
    )
  )
  into result
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.portal_token = p_token
    and e.statut in ('contrat', 'confirme');

  return result;
end;
$$;

-- Storage : logos des domaines (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "workspace_logos_public_read" on storage.objects;
drop policy if exists "workspace_logos_insert_own" on storage.objects;
drop policy if exists "workspace_logos_update_own" on storage.objects;
drop policy if exists "workspace_logos_delete_own" on storage.objects;

create policy "workspace_logos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'workspace-logos');

create policy "workspace_logos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "workspace_logos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

create policy "workspace_logos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] = (
      select workspace_id::text from public.profiles where id = auth.uid()
    )
  );

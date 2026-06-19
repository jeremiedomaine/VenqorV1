-- Pipeline 3 colonnes : prospect | option | confirme

alter table public.events alter column statut drop default;
alter table public.events alter column statut type text using (
  case statut::text
    when 'lead' then 'prospect'
    when 'visite' then 'prospect'
    when 'contrat' then 'option'
    when 'confirme' then 'confirme'
    else statut::text
  end
);

drop type if exists public.event_status;
create type public.event_status as enum ('prospect', 'option', 'confirme');

alter table public.events
  alter column statut type public.event_status using statut::public.event_status;

alter table public.events alter column statut set default 'prospect';

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
    and e.statut in ('option', 'confirme');

  return result;
end;
$$;

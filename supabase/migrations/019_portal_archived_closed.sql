-- Portail couple : inaccessible si dossier archivé ou clôturé

create or replace function public.fetch_portal_unavailable_reason(p_token uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not exists (
      select 1 from public.events e where e.portal_token = p_token
    ) then 'not_found'
    when exists (
      select 1 from public.events e
      where e.portal_token = p_token and e.archived_at is not null
    ) then 'archived'
    when exists (
      select 1 from public.events e
      where e.portal_token = p_token and e.cloture_at is not null
    ) then 'closed'
    when exists (
      select 1 from public.events e
      where e.portal_token = p_token
        and e.statut not in ('option', 'confirme')
    ) then 'inactive'
    else null
  end;
$$;

grant execute on function public.fetch_portal_unavailable_reason(uuid) to anon, authenticated;

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
      'contact_telephone', w.contact_telephone,
      'mode_paiement_defaut', w.mode_paiement_defaut,
      'iban', w.iban,
      'bic', w.bic,
      'titulaire_compte', w.titulaire_compte,
      'instructions_virement', w.instructions_virement,
      'stripe_active', w.stripe_active
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
            'id', p.id,
            'label', p.label,
            'montant', p.montant,
            'date_echeance', p.date_echeance,
            'statut', p.statut,
            'mode_paiement', p.mode_paiement,
            'reference_virement', p.reference_virement
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
    and e.statut in ('option', 'confirme')
    and e.archived_at is null
    and e.cloture_at is null;

  return result;
end;
$$;

create or replace function public.declare_portal_payment(
  p_token uuid,
  p_payment_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_updated public.payments%rowtype;
begin
  select e.id into v_event_id
  from public.events e
  where e.portal_token = p_token
    and e.statut in ('option', 'confirme')
    and e.archived_at is null
    and e.cloture_at is null;

  if v_event_id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  update public.payments p
  set
    statut = 'declare_paye',
    declared_at = now()
  where p.id = p_payment_id
    and p.event_id = v_event_id
    and p.statut = 'en_attente'
    and p.mode_paiement = 'virement'
  returning * into v_updated;

  if v_updated.id is null then
    return json_build_object('ok', false, 'error', 'invalid_state');
  end if;

  return json_build_object(
    'ok', true,
    'statut', v_updated.statut,
    'declared_at', v_updated.declared_at
  );
end;
$$;

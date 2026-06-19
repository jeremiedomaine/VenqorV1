-- Encaissements V1 : statuts, modes de paiement, coordonnées bancaires

alter type public.payment_status add value if not exists 'declare_paye';

alter table public.workspaces
  add column if not exists mode_paiement_defaut text not null default 'virement'
    check (mode_paiement_defaut in ('virement', 'stripe')),
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists titulaire_compte text,
  add column if not exists instructions_virement text not null default '',
  add column if not exists stripe_active boolean not null default false;

alter table public.payments
  add column if not exists mode_paiement text not null default 'virement'
    check (mode_paiement in ('virement', 'stripe')),
  add column if not exists reference_virement text,
  add column if not exists declared_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists stripe_checkout_session_id text;

-- Portail : données enrichies (IBAN, références, ids paiements)
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
    and e.statut in ('option', 'confirme');

  return result;
end;
$$;

-- Couple déclare un virement depuis le portail
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
    and e.statut in ('option', 'confirme');

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

grant execute on function public.declare_portal_payment(uuid, uuid) to anon, authenticated;

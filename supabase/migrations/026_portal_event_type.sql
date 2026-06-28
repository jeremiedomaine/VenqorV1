-- Expose event type on portal payload for client-facing copy (mariage vs autres).

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
      'type_evenement', e.type_evenement,
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

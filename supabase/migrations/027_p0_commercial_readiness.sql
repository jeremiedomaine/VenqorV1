-- P0 commercial readiness: contact email, relance seed, onboarding fixes

-- ---------------------------------------------------------------------------
-- Seed default relance rules for a workspace (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_relance_rules(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.relance_regles (
    workspace_id,
    preset_key,
    nom,
    active,
    cible,
    declencheur,
    delai_jours,
    email_objet,
    email_intro,
    email_titre,
    email_cta_label,
    types_evenement,
    statuts_evenement
  )
  select
    p_workspace_id,
    v.preset_key,
    v.nom,
    v.active,
    v.cible,
    v.declencheur,
    v.delai_jours,
    v.email_objet,
    v.email_intro,
    v.email_titre,
    v.email_cta_label,
    '{}'::text[],
    '{option,confirme}'::text[]
  from (
    values
      (
        'couple_rappel_echeance',
        'Rappel avant échéance',
        true,
        'couple',
        'echeance_jours_avant',
        7,
        '{domaine} — Rappel : {libelle} à régler',
        E'Bonjour {couple},\n\nVotre échéance {libelle} ({montant}) pour votre événement chez {domaine} arrive le {date_echeance}.\n\nUtilisez votre espace client pour consulter les coordonnées bancaires et déclarer votre virement.',
        'Rappel d''échéance',
        'Accéder à mon espace'
      ),
      (
        'couple_relance_impaye',
        'Relance après échéance',
        true,
        'couple',
        'echeance_jours_apres',
        3,
        '{domaine} — Relance : {libelle} ({montant})',
        E'Bonjour {couple},\n\nSauf erreur de notre part, votre {libelle} de {montant} n''a pas encore été réglé(e). L''échéance était prévue le {date_echeance}.\n\nMerci de régulariser via votre espace client ou de nous contacter à {contact_domaine}.',
        'Relance de paiement',
        'Régler maintenant'
      ),
      (
        'domaine_paiement_retard',
        'Alerte paiement en retard',
        true,
        'domaine',
        'echeance_jours_apres',
        7,
        '{domaine} — Échéance en retard : {couple}',
        E'Bonjour,\n\nL''échéance {libelle} ({montant}) pour {couple} est en retard de {delai_jours} jours (échéance du {date_echeance}).\n\nConsultez le dossier dans Venqor pour relancer le client si besoin.',
        'Paiement en retard',
        'Voir le dossier'
      ),
      (
        'couple_contrat_relance',
        'Relance signature contrat',
        false,
        'couple',
        'contrat_jours_apres',
        7,
        '{domaine} — Rappel : signature de votre contrat',
        E'Bonjour {couple},\n\nVotre contrat de réservation chez {domaine} est en attente de signature.\n\nSi vous n''avez pas reçu l''email Signable, vérifiez vos spams ou contactez-nous à {contact_domaine}.',
        'Signature du contrat',
        'Mon espace client'
      )
  ) as v(
    preset_key,
    nom,
    active,
    cible,
    declencheur,
    delai_jours,
    email_objet,
    email_intro,
    email_titre,
    email_cta_label
  )
  where not exists (
    select 1
    from public.relance_regles r
    where r.workspace_id = p_workspace_id
      and r.preset_key = v.preset_key
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Onboarding: contact email + relance seed
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  workspace_name text;
  owner_email text;
begin
  workspace_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    'Mon Domaine'
  );
  owner_email := coalesce(nullif(trim(new.email), ''), '');

  insert into public.workspaces (nom_domaine, contact_email)
  values (workspace_name, owner_email)
  returning id into new_workspace_id;

  insert into public.profiles (id, workspace_id, full_name)
  values (
    new.id,
    new_workspace_id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), '')
  );

  perform public.seed_default_relance_rules(new_workspace_id);

  return new;
end;
$$;

-- Backfill contact email for existing workspaces
update public.workspaces w
set contact_email = u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.workspace_id = w.id
  and coalesce(w.contact_email, '') = ''
  and coalesce(u.email, '') <> '';

-- Backfill relance rules for existing workspaces
do $$
declare
  ws record;
begin
  for ws in select id from public.workspaces loop
    perform public.seed_default_relance_rules(ws.id);
  end loop;
end $$;

-- Acompte à la signature : timing + email dédié

create type public.acompte_signature_timing as enum (
  'with_contract',
  'after_contract'
);

alter table public.workspaces
  add column if not exists acompte_signature_timing public.acompte_signature_timing not null default 'after_contract',
  add column if not exists automation_acompte_active boolean not null default true,
  add column if not exists email_acompte_objet text not null default '{domaine} — Règlement de votre acompte',
  add column if not exists email_acompte_intro text not null default 'Bonjour {couple},

Merci de régler votre {libelle} ({montant}) pour confirmer votre réservation chez {domaine}. Utilisez le lien sécurisé ci-dessous.';

comment on column public.workspaces.acompte_signature_timing is
  'with_contract = email acompte à l''envoi Yousign ; after_contract = après signature complète';

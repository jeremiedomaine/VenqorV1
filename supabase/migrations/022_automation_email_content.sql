-- Champs éditables pour le contenu des emails (layout Venqor inchangé)

alter table public.workspaces
  add column if not exists email_paiement_titre text not null default 'Règlement de votre solde',
  add column if not exists email_paiement_cta text not null default 'Régler mon solde',
  add column if not exists email_paiement_details text not null default 'Page de paiement sécurisée. Vous y trouverez les coordonnées bancaires et pourrez confirmer votre virement.',
  add column if not exists email_acompte_titre text not null default 'Règlement de votre acompte',
  add column if not exists email_acompte_cta text not null default 'Régler mon acompte',
  add column if not exists email_acompte_details text not null default 'Page de paiement sécurisée. Vous y trouverez les coordonnées bancaires et pourrez confirmer votre virement.';

alter table public.relance_regles
  add column if not exists email_titre text,
  add column if not exists email_cta_label text,
  add column if not exists email_footer_note text;

-- Permettre plusieurs relances du même type (ex. J-7 et J-3)
alter table public.relance_regles
  drop constraint if exists relance_regles_workspace_id_preset_key_key;

-- Remplir titre / CTA depuis les presets existants (via valeurs par défaut côté app au prochain save)

-- Automatisations : emails de demande de paiement

alter table public.workspaces
  add column if not exists automation_paiement_active boolean not null default true,
  add column if not exists email_paiement_objet text not null default '{domaine} — Règlement de votre échéance',
  add column if not exists email_paiement_intro text not null default 'Bonjour {couple},

Votre date est réservée chez {domaine}. Vous pouvez régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.';

alter table public.payments
  add column if not exists payment_request_sent_at timestamptz;

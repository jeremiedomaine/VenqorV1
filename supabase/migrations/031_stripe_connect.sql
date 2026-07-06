-- Stripe Connect (module Caution + futur paiements en ligne)

alter table public.workspaces
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_onboarded_at timestamptz,
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false,
  add column if not exists caution_montant_defaut numeric(12, 2) check (
    caution_montant_defaut is null or caution_montant_defaut > 0
  );

comment on column public.workspaces.stripe_connect_account_id is
  'ID compte Stripe Connect (acct_…) du domaine';
comment on column public.workspaces.caution_montant_defaut is
  'Montant de caution par défaut proposé à la création (€)';

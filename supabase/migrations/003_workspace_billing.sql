-- Règles de facturation par domaine (acompte + solde)
alter table public.workspaces
  add column if not exists facturation_acompte_label text not null default 'Acompte',
  add column if not exists facturation_acompte_pct numeric(5, 2) not null default 30
    check (facturation_acompte_pct >= 0 and facturation_acompte_pct <= 100),
  add column if not exists facturation_acompte_jours integer not null default 0,
  add column if not exists facturation_solde_label text not null default 'Solde',
  add column if not exists facturation_solde_pct numeric(5, 2) not null default 70
    check (facturation_solde_pct >= 0 and facturation_solde_pct <= 100),
  add column if not exists facturation_solde_jours integer not null default -30;

comment on column public.workspaces.facturation_acompte_jours is
  'Jours après génération de l''échéancier pour l''échéance acompte (0 = à la signature)';
comment on column public.workspaces.facturation_solde_jours is
  'Jours par rapport à la date du mariage pour le solde (ex. -30 = 30 jours avant)';

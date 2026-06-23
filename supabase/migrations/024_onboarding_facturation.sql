-- Facturation explicite + fin d'onboarding workspace
alter table public.workspaces
  add column if not exists facturation_configuree boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

comment on column public.workspaces.facturation_configuree is
  'True après validation des règles acompte/solde — débloque la génération auto des échéanciers.';
comment on column public.workspaces.onboarding_completed_at is
  'Horodatage de fin ou abandon de l''assistant de configuration initial.';

-- Domaines existants : conserver le comportement actuel
update public.workspaces
set
  facturation_configuree = true,
  onboarding_completed_at = coalesce(onboarding_completed_at, now())
where onboarding_completed_at is null;

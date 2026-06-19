-- Archivage (prospects perdus) et clôture (dossier terminé, solde réglé)

alter table public.events
  add column if not exists archived_at timestamptz,
  add column if not exists cloture_at timestamptz;

create index if not exists events_archived_at_idx on public.events (archived_at);
create index if not exists events_cloture_at_idx on public.events (cloture_at);

comment on column public.events.archived_at is
  'Dossier retiré du pipeline actif (prospect perdu, annulation).';
comment on column public.events.cloture_at is
  'Dossier confirmé terminé : solde réglé, suivi actif clos.';

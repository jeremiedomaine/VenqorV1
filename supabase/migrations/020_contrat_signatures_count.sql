-- Suivi signatures partielles (1/2 signé)

alter table public.events
  add column if not exists contrat_signatures_done smallint not null default 0,
  add column if not exists contrat_signatures_total smallint not null default 2;

comment on column public.events.contrat_signatures_done is
  'Nombre de signataires ayant signé (webhook signer.done)';
comment on column public.events.contrat_signatures_total is
  'Nombre total de signataires attendus (défaut 2 mariés)';

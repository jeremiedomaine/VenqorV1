-- Signature électronique Yousign (contrat couple)

create type public.contrat_statut as enum (
  'non_envoye',
  'en_cours',
  'signe',
  'refuse',
  'expire'
);

alter table public.events
  add column if not exists yousign_signature_request_id text,
  add column if not exists contrat_statut public.contrat_statut not null default 'non_envoye',
  add column if not exists contrat_envoye_at timestamptz,
  add column if not exists contrat_signe_at timestamptz;

create index if not exists events_yousign_signature_request_id_idx
  on public.events (yousign_signature_request_id)
  where yousign_signature_request_id is not null;

-- Renommer l'identifiant Yousign en identifiant générique e-sign (Signable)
alter table public.events
  rename column yousign_signature_request_id to esign_envelope_id;

alter index if exists events_yousign_signature_request_id_idx
  rename to events_esign_envelope_id_idx;

comment on column public.events.esign_envelope_id is
  'Identifiant d''enveloppe Signable (fingerprint) ou legacy Yousign.';

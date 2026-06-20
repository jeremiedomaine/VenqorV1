-- Zones de signature configurées visuellement (Paramètres > Contrat)

alter table public.workspaces
  add column if not exists contrat_signature_zones jsonb,
  add column if not exists contrat_signature_zones_updated_at timestamptz;

comment on column public.workspaces.contrat_signature_zones is
  'Emplacements Yousign { signer1, signer2 } en points PDF (page, x, y, width, height)';

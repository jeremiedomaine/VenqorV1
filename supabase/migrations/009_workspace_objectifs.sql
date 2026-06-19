-- Objectifs annuels pour le pilotage (remplissage & CA)
alter table public.workspaces
  add column if not exists objectif_dossiers_annuel integer
    check (objectif_dossiers_annuel is null or objectif_dossiers_annuel > 0),
  add column if not exists objectif_ca_annuel numeric(12, 2)
    check (objectif_ca_annuel is null or objectif_ca_annuel > 0);

comment on column public.workspaces.objectif_dossiers_annuel is
  'Nombre de dossiers réalisés visés par an (confirmés + clôturés)';
comment on column public.workspaces.objectif_ca_annuel is
  'Chiffre d''affaires annuel visé en euros';

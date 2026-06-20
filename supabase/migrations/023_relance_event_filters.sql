-- Filtres par type et statut d'événement sur les relances

alter table public.relance_regles
  add column if not exists types_evenement text[] not null default '{}',
  add column if not exists statuts_evenement text[] not null default '{option,confirme}';

comment on column public.relance_regles.types_evenement is
  'Slugs types d''événement éligibles ; tableau vide = tous les types';

comment on column public.relance_regles.statuts_evenement is
  'Statuts dossier éligibles : prospect, option, confirme';

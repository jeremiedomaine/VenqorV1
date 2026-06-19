-- Détails événement : type, couple, adresse, contacts

create type public.event_type as enum ('mariage', 'gite', 'autre');

alter table public.events
  add column if not exists type_evenement public.event_type not null default 'mariage',
  add column if not exists nom_evenement text not null default '',
  add column if not exists marie1_prenom text not null default '',
  add column if not exists marie1_nom text not null default '',
  add column if not exists marie2_prenom text not null default '',
  add column if not exists marie2_nom text not null default '',
  add column if not exists adresse_postale text not null default '',
  add column if not exists email text not null default '',
  add column if not exists telephone text not null default '';

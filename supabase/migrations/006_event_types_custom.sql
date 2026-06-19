-- Types d'événement personnalisables par workspace

alter table public.workspaces
  add column if not exists types_evenement_custom jsonb not null default '[]'::jsonb;

alter table public.events
  alter column type_evenement drop default;

alter table public.events
  alter column type_evenement type text using type_evenement::text;

alter table public.events
  alter column type_evenement set default 'mariage';

drop type if exists public.event_type;

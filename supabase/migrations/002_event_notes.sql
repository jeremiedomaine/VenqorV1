-- Notes internes (visibles gérant uniquement, pas sur le portail)
alter table public.events
  add column if not exists notes_internes text not null default '';

comment on column public.events.notes_internes is 'Notes privées du gérant, non exposées sur le portail mariés';

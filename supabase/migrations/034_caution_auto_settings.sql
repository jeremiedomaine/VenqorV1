-- Automatisation envoi caution Swikly (J-X avant arrivée)

alter table public.workspaces
  add column if not exists caution_auto_active boolean not null default true,
  add column if not exists caution_auto_jours_avant integer not null default 7
    check (caution_auto_jours_avant >= 1 and caution_auto_jours_avant <= 90),
  add column if not exists caution_relance_active boolean not null default true,
  add column if not exists caution_relance_jours_avant integer not null default 3
    check (caution_relance_jours_avant >= 0 and caution_relance_jours_avant <= 60);

comment on column public.workspaces.caution_auto_active is
  'Envoi automatique du lien Swikly X jours avant l''arrivée';
comment on column public.workspaces.caution_auto_jours_avant is
  'Nombre de jours avant l''arrivée pour envoyer le lien Swikly (ex. 7 = J-7)';
comment on column public.workspaces.caution_relance_active is
  'Relance email si empreinte non validée';
comment on column public.workspaces.caution_relance_jours_avant is
  'Nombre de jours avant l''arrivée pour la relance (ex. 3 = J-3)';

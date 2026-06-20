-- Relances email niveau 1 : règles prédéfinies par domaine

alter table public.workspaces
  add column if not exists relances_actives boolean not null default true;

comment on column public.workspaces.relances_actives is
  'Interrupteur global des relances automatiques (hors emails système instantanés)';

create table if not exists public.relance_regles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  preset_key text not null,
  nom text not null,
  active boolean not null default true,
  cible text not null check (cible in ('couple', 'domaine')),
  declencheur text not null check (
    declencheur in (
      'echeance_jours_avant',
      'echeance_jours_apres',
      'contrat_jours_apres'
    )
  ),
  delai_jours integer not null check (delai_jours >= 0 and delai_jours <= 365),
  email_objet text not null,
  email_intro text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, preset_key)
);

create index if not exists relance_regles_workspace_id_idx
  on public.relance_regles (workspace_id);

create table if not exists public.relance_envois (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  relance_regle_id uuid not null references public.relance_regles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete cascade,
  envoye_at timestamptz not null default now()
);

create unique index if not exists relance_envois_dedup_idx
  on public.relance_envois (
    relance_regle_id,
    event_id,
    coalesce(payment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists relance_envois_workspace_id_idx
  on public.relance_envois (workspace_id);

alter table public.relance_regles enable row level security;
alter table public.relance_envois enable row level security;

create policy "relance_regles_select_own"
  on public.relance_regles for select
  using (workspace_id = public.get_user_workspace_id());

create policy "relance_regles_insert_own"
  on public.relance_regles for insert
  with check (workspace_id = public.get_user_workspace_id());

create policy "relance_regles_update_own"
  on public.relance_regles for update
  using (workspace_id = public.get_user_workspace_id());

create policy "relance_regles_delete_own"
  on public.relance_regles for delete
  using (workspace_id = public.get_user_workspace_id());

create policy "relance_envois_select_own"
  on public.relance_envois for select
  using (workspace_id = public.get_user_workspace_id());

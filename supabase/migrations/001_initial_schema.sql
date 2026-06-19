-- Venqor V1 — schéma multi-tenant
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.event_status as enum ('lead', 'visite', 'contrat', 'confirme');
create type public.payment_status as enum ('en_attente', 'paye');

-- ---------------------------------------------------------------------------
-- Workspaces (domaines / lieux)
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  nom_domaine text not null,
  logo_url text,
  guide_regles text not null default '',
  guide_prestataires text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profils gérants (liés à auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create index profiles_workspace_id_idx on public.profiles (workspace_id);

-- ---------------------------------------------------------------------------
-- Événements (mariages)
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  nom_des_maries text not null,
  date_debut date,
  date_fin date,
  statut public.event_status not null default 'lead',
  capacite_hebergement_totale integer not null default 0 check (capacite_hebergement_totale >= 0),
  prix_total numeric(12, 2) not null default 0 check (prix_total >= 0),
  portal_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_workspace_id_idx on public.events (workspace_id);
create index events_statut_idx on public.events (statut);
create index events_portal_token_idx on public.events (portal_token);

-- ---------------------------------------------------------------------------
-- Paiements / échéancier
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  montant numeric(12, 2) not null check (montant >= 0),
  date_echeance date,
  statut public.payment_status not null default 'en_attente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_workspace_id_idx on public.payments (workspace_id);
create index payments_event_id_idx on public.payments (event_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create or replace function public.get_user_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.profiles where id = auth.uid();
$$;

-- Onboarding : création workspace + profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  workspace_name text;
begin
  workspace_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    'Mon Domaine'
  );

  insert into public.workspaces (nom_domaine)
  values (workspace_name)
  returning id into new_workspace_id;

  insert into public.profiles (id, workspace_id, full_name)
  values (
    new.id,
    new_workspace_id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Portail public (lecture seule via token)
create or replace function public.fetch_portal_data(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'workspace', json_build_object(
      'nom_domaine', w.nom_domaine,
      'logo_url', w.logo_url,
      'guide_regles', w.guide_regles,
      'guide_prestataires', w.guide_prestataires
    ),
    'event', json_build_object(
      'nom_des_maries', e.nom_des_maries,
      'date_debut', e.date_debut,
      'date_fin', e.date_fin,
      'statut', e.statut,
      'capacite_hebergement_totale', e.capacite_hebergement_totale,
      'prix_total', e.prix_total
    ),
    'payments', coalesce(
      (
        select json_agg(
          json_build_object(
            'label', p.label,
            'montant', p.montant,
            'date_echeance', p.date_echeance,
            'statut', p.statut
          )
          order by p.date_echeance nulls last, p.created_at
        )
        from public.payments p
        where p.event_id = e.id
      ),
      '[]'::json
    )
  )
  into result
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.portal_token = p_token
    and e.statut in ('contrat', 'confirme');

  return result;
end;
$$;

grant execute on function public.fetch_portal_data(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Workspaces
create policy "workspaces_select_own"
  on public.workspaces for select
  using (id = public.get_user_workspace_id());

create policy "workspaces_update_own"
  on public.workspaces for update
  using (id = public.get_user_workspace_id());

-- Events
create policy "events_select_workspace"
  on public.events for select
  using (workspace_id = public.get_user_workspace_id());

create policy "events_insert_workspace"
  on public.events for insert
  with check (workspace_id = public.get_user_workspace_id());

create policy "events_update_workspace"
  on public.events for update
  using (workspace_id = public.get_user_workspace_id());

create policy "events_delete_workspace"
  on public.events for delete
  using (workspace_id = public.get_user_workspace_id());

-- Payments
create policy "payments_select_workspace"
  on public.payments for select
  using (workspace_id = public.get_user_workspace_id());

create policy "payments_insert_workspace"
  on public.payments for insert
  with check (workspace_id = public.get_user_workspace_id());

create policy "payments_update_workspace"
  on public.payments for update
  using (workspace_id = public.get_user_workspace_id());

create policy "payments_delete_workspace"
  on public.payments for delete
  using (workspace_id = public.get_user_workspace_id());

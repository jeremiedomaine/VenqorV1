-- Suivi des demandes Swikly Caution (callback → statut empreinte)

create table if not exists public.caution_swikly_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sejour_id text not null,
  swikly_request_id text not null,
  swikly_link text,
  deposit_status text,
  last_event text,
  raw_last_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sejour_id),
  unique (swikly_request_id)
);

create index if not exists caution_swikly_requests_workspace_idx
  on public.caution_swikly_requests (workspace_id);

alter table public.caution_swikly_requests enable row level security;

drop policy if exists "caution_swikly_select_own" on public.caution_swikly_requests;
create policy "caution_swikly_select_own"
  on public.caution_swikly_requests for select
  to authenticated
  using (
    workspace_id = (
      select workspace_id from public.profiles where id = auth.uid()
    )
  );

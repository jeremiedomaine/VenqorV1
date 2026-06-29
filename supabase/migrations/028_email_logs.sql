-- Journal des envois email + fiabilité (retries côté app)

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  category text not null,
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  error_message text,
  attempt_count integer not null default 1 check (attempt_count >= 1),
  event_id uuid references public.events (id) on delete set null,
  payment_id uuid references public.payments (id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_workspace_created_idx
  on public.email_logs (workspace_id, created_at desc);

create unique index if not exists email_logs_idempotency_unique_idx
  on public.email_logs (workspace_id, idempotency_key)
  where idempotency_key is not null and status = 'sent';

alter table public.email_logs enable row level security;

create policy "email_logs_select_workspace"
  on public.email_logs for select
  using (workspace_id = public.get_user_workspace_id());

comment on table public.email_logs is
  'Historique des emails système (paiements, relances) pour suivi et débogage.';

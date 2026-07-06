-- Mode produit par workspace (Venqor complet vs Caution seule)
alter table public.workspaces
  add column if not exists product_mode text not null default 'full'
  check (product_mode in ('full', 'caution_only'));

comment on column public.workspaces.product_mode is
  'full = CRM Venqor ; caution_only = module caution dépôt uniquement';

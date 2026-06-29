-- Acompte par défaut : 50 % / 50 % (au lieu de 30 % / 70 %)

alter table public.workspaces
  alter column facturation_acompte_pct set default 50,
  alter column facturation_solde_pct set default 50;

-- Workspaces encore sur l'ancien échéancier type non personnalisé
update public.workspaces
set
  facturation_acompte_pct = 50,
  facturation_solde_pct = 50
where facturation_acompte_pct = 30
  and facturation_solde_pct = 70;

import { NEUTRAL_COPY } from "@/lib/event-copy";

export interface WorkspaceBilling {
  facturation_acompte_label: string;
  facturation_acompte_pct: number;
  facturation_acompte_jours: number;
  facturation_solde_label: string;
  facturation_solde_pct: number;
  facturation_solde_jours: number;
}

export const DEFAULT_BILLING: WorkspaceBilling = {
  facturation_acompte_label: "Acompte",
  facturation_acompte_pct: 50,
  facturation_acompte_jours: 0,
  facturation_solde_label: "Solde",
  facturation_solde_pct: 50,
  facturation_solde_jours: -30,
};

export interface BillingLinePreview {
  label: string;
  montant: number;
  date_echeance: string | null;
  hint: string;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildBillingPreview(
  billing: WorkspaceBilling,
  prixTotal: number,
  dateEvenement: string | null,
): BillingLinePreview[] {
  if (prixTotal <= 0) return [];

  const acompteMontant = Math.round(prixTotal * (billing.facturation_acompte_pct / 100));
  const soldeMontant = prixTotal - acompteMontant;
  const today = new Date();

  const acompteDate = addDays(today, billing.facturation_acompte_jours);
  const soldeDate = dateEvenement
    ? addDays(new Date(dateEvenement), billing.facturation_solde_jours)
    : null;

  return [
    {
      label: billing.facturation_acompte_label,
      montant: acompteMontant,
      date_echeance: acompteDate,
      hint:
        billing.facturation_acompte_jours === 0
          ? "À la signature du contrat"
          : `J+${billing.facturation_acompte_jours} après génération`,
    },
    {
      label: billing.facturation_solde_label,
      montant: soldeMontant,
      date_echeance: soldeDate,
      hint: dateEvenement
        ? billing.facturation_solde_jours === 0
          ? NEUTRAL_COPY.billingSoldeDay
          : billing.facturation_solde_jours < 0
            ? NEUTRAL_COPY.billingSoldeBefore(
                Math.abs(billing.facturation_solde_jours),
              )
            : NEUTRAL_COPY.billingSoldeAfter(billing.facturation_solde_jours)
        : NEUTRAL_COPY.billingDateRequired,
    },
  ];
}

export function billingFromWorkspace(ws: Partial<WorkspaceBilling>): WorkspaceBilling {
  return {
    facturation_acompte_label:
      ws.facturation_acompte_label ?? DEFAULT_BILLING.facturation_acompte_label,
    facturation_acompte_pct: Number(
      ws.facturation_acompte_pct ?? DEFAULT_BILLING.facturation_acompte_pct,
    ),
    facturation_acompte_jours: Number(
      ws.facturation_acompte_jours ?? DEFAULT_BILLING.facturation_acompte_jours,
    ),
    facturation_solde_label:
      ws.facturation_solde_label ?? DEFAULT_BILLING.facturation_solde_label,
    facturation_solde_pct: Number(
      ws.facturation_solde_pct ?? DEFAULT_BILLING.facturation_solde_pct,
    ),
    facturation_solde_jours: Number(
      ws.facturation_solde_jours ?? DEFAULT_BILLING.facturation_solde_jours,
    ),
  };
}

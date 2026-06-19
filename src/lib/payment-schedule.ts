import { billingFromWorkspace } from "@/lib/billing";

export type PaymentPickRow = {
  id: string;
  label: string;
  montant: number;
  statut: string;
  date_echeance: string | null;
  payment_request_sent_at?: string | null;
};

/** Solde = dernière échéance en attente (ou libellé facturation solde). */
export function pickSoldePayment<T extends PaymentPickRow>(
  payments: T[],
  soldeLabel?: string,
): T | undefined {
  const pending = payments.filter((p) => p.statut === "en_attente");
  if (pending.length === 0) return undefined;

  if (soldeLabel) {
    const byLabel = pending.find((p) => p.label === soldeLabel);
    if (byLabel) return byLabel;
  }

  if (pending.length === 1) return pending[0];

  return [...pending].sort((a, b) => {
    if (!a.date_echeance) return 1;
    if (!b.date_echeance) return -1;
    return b.date_echeance.localeCompare(a.date_echeance);
  })[0];
}

/** Acompte = première échéance en attente (ou libellé facturation acompte). */
export function pickAcomptePayment<T extends PaymentPickRow>(
  payments: T[],
  acompteLabel?: string,
): T | undefined {
  const pending = payments.filter((p) => p.statut === "en_attente");
  if (pending.length === 0) return undefined;

  if (acompteLabel) {
    const byLabel = pending.find((p) => p.label === acompteLabel);
    if (byLabel) return byLabel;
  }

  if (pending.length === 1) return pending[0];

  return [...pending].sort((a, b) => {
    if (!a.date_echeance) return -1;
    if (!b.date_echeance) return 1;
    return a.date_echeance.localeCompare(b.date_echeance);
  })[0];
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function isWithinSoldeWindow(
  weddingDate: string | null,
  soldeDaysBefore = 30,
): boolean {
  if (!weddingDate) return false;
  return daysUntil(weddingDate) <= soldeDaysBefore;
}

export function soldeWindowDaysFromWorkspace(workspace: {
  facturation_solde_jours?: number;
}): number {
  const billing = billingFromWorkspace(workspace);
  const offset = billing.facturation_solde_jours;
  return offset <= 0 ? Math.abs(offset) : offset;
}

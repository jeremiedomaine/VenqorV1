import type { Event, Payment } from "@/lib/types";

export type PipelineStepId = "prospect" | "option" | "confirme" | "cloture";

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: "prospect", label: "Demande" },
  { id: "option", label: "Date bloquée" },
  { id: "confirme", label: "Confirmé" },
  { id: "cloture", label: "Clôturé" },
];

export function isActivePipelineEvent(
  event: Pick<Event, "archived_at" | "cloture_at">,
): boolean {
  return !event.archived_at && !event.cloture_at;
}

export function getCurrentPipelineStep(
  event: Pick<Event, "statut" | "cloture_at">,
): PipelineStepId {
  if (event.cloture_at) return "cloture";
  if (event.statut === "confirme") return "confirme";
  if (event.statut === "option") return "option";
  return "prospect";
}

export function getPipelineStepIndex(step: PipelineStepId): number {
  return PIPELINE_STEPS.findIndex((s) => s.id === step);
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

/** Rappel court affiché sous le stepper (champ manquant ou étape en cours). */
export function getPipelineReminder(
  event: Pick<
    Event,
    | "statut"
    | "date_debut"
    | "adresse_postale"
    | "email"
    | "cloture_at"
    | "archived_at"
    | "prix_total"
  >,
  hasDepositPayment: boolean,
): { text: string; tone: "info" | "warning" | "success" | "muted" } | null {
  if (event.archived_at) {
    return { text: "Dossier archivé", tone: "muted" };
  }
  if (event.cloture_at) {
    return { text: "Suivi terminé", tone: "info" };
  }

  if (event.statut === "prospect") {
    if (!hasText(event.date_debut)) {
      return { text: "Date à renseigner", tone: "warning" };
    }
    if (!hasText(event.adresse_postale)) {
      return { text: "Adresse postale à renseigner", tone: "warning" };
    }
    return { text: "Bloquer la date", tone: "info" };
  }

  if (event.statut === "option") {
    if (!hasText(event.email)) {
      return { text: "Email à renseigner", tone: "warning" };
    }
    if (Number(event.prix_total) > 0 && !hasDepositPayment) {
      return { text: "Échéancier à générer", tone: "warning" };
    }
    return { text: "Acompte payé", tone: "info" };
  }

  if (event.statut === "confirme") {
    return { text: "Clôturer le dossier", tone: "info" };
  }

  return null;
}

export function getBalancePayment(
  payments: Payment[],
  depositPayment: Payment | null,
): Payment | null {
  if (payments.length <= 1) {
    return payments[0] === depositPayment ? null : (payments[0] ?? null);
  }
  return (
    payments.find((p) => p.id !== depositPayment?.id) ??
    payments[payments.length - 1] ??
    null
  );
}

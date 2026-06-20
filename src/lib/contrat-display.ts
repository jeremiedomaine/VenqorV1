import type { ContratStatut } from "@/lib/types";
import { CONTRAT_STATUT_LABELS } from "@/lib/types";

export function formatContratStatutLabel(
  statut: ContratStatut,
  signaturesDone = 0,
  signaturesTotal = 2,
): string {
  if (
    statut === "en_cours" &&
    signaturesDone > 0 &&
    signaturesDone < signaturesTotal
  ) {
    return `${signaturesDone}/${signaturesTotal} signé`;
  }

  return CONTRAT_STATUT_LABELS[statut];
}

import type { PaymentMode, Workspace } from "@/lib/types";

export function buildTransferReference(
  eventId: string,
  index: number,
): string {
  const short = eventId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `VEN-${short}-${index + 1}`;
}

export interface WorkspaceEncaissements {
  mode_paiement_defaut: PaymentMode;
  iban: string | null;
  bic: string | null;
  titulaire_compte: string | null;
  instructions_virement: string;
  stripe_active: boolean;
}

export function encaissementsFromWorkspace(
  workspace: Workspace,
): WorkspaceEncaissements {
  return {
    mode_paiement_defaut: workspace.mode_paiement_defaut ?? "virement",
    iban: workspace.iban ?? null,
    bic: workspace.bic ?? null,
    titulaire_compte: workspace.titulaire_compte ?? null,
    instructions_virement: workspace.instructions_virement ?? "",
    stripe_active: workspace.stripe_active ?? false,
  };
}

export function hasVirementConfig(encaissements: WorkspaceEncaissements): boolean {
  return Boolean(encaissements.iban?.trim() && encaissements.titulaire_compte?.trim());
}

import { billingFromWorkspace } from "@/lib/billing";
import { getContratReadiness } from "@/lib/contrat-status";
import { hasVirementConfig, encaissementsFromWorkspace } from "@/lib/payment-utils";
import type { Workspace } from "@/lib/types";

export interface SetupStep {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
}

export interface WorkspaceSetupStatus {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
}

export function computeWorkspaceSetupStatus(
  workspace: Workspace,
): WorkspaceSetupStatus {
  const billing = billingFromWorkspace(workspace);
  const encaissements = encaissementsFromWorkspace(workspace);
  const hasGoals = Boolean(
    workspace.objectif_dossiers_annuel && workspace.objectif_dossiers_annuel > 0,
  );
  const encaissementsReady =
    encaissements.mode_paiement_defaut === "stripe" ||
    hasVirementConfig(encaissements);

  const contrat = getContratReadiness(workspace);

  const steps: SetupStep[] = [
    {
      id: "goals",
      label: "Objectif annuel",
      detail: hasGoals
        ? `${workspace.objectif_dossiers_annuel} dossiers visés`
        : "Non défini",
      done: hasGoals,
      href: "/parametres#objectifs",
    },
    {
      id: "billing",
      label: "Facturation",
      detail: `${billing.facturation_acompte_pct} % / ${billing.facturation_solde_pct} %`,
      done: true,
      href: "/parametres#facturation",
    },
    {
      id: "encaissements",
      label: "Encaissements",
      detail: encaissementsReady
        ? encaissements.mode_paiement_defaut === "virement"
          ? "Virement configuré"
          : "Stripe (bientôt)"
        : "IBAN à renseigner",
      done: encaissementsReady,
      href: "/parametres#encaissements",
    },
    {
      id: "contrat",
      label: "Contrat Yousign",
      detail: contrat.label,
      done: contrat.ready,
      href: "/parametres#contrat",
    },
    {
      id: "types",
      label: "Types d'événement",
      detail:
        workspace.types_evenement_custom.length > 0
          ? `${workspace.types_evenement_custom.length} type${workspace.types_evenement_custom.length > 1 ? "s" : ""} personnalisé${workspace.types_evenement_custom.length > 1 ? "s" : ""}`
          : "Mariage et Autre par défaut",
      done: true,
      href: "/parametres#types-evenement",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
  };
}

export interface WorkspaceGoals {
  objectif_dossiers_annuel: number | null;
  objectif_ca_annuel: number | null;
}

export function goalsFromWorkspace(workspace: Workspace): WorkspaceGoals {
  return {
    objectif_dossiers_annuel: workspace.objectif_dossiers_annuel ?? null,
    objectif_ca_annuel: workspace.objectif_ca_annuel
      ? Number(workspace.objectif_ca_annuel)
      : null,
  };
}

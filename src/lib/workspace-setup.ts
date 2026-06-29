import { billingFromWorkspace } from "@/lib/billing";
import { getContratReadiness } from "@/lib/contrat-status";
import {
  encaissementsFromWorkspace,
  hasVirementConfig,
} from "@/lib/payment-utils";
import type { Workspace } from "@/lib/types";

export interface SetupStep {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
  essential: boolean;
}

export interface DomainReadiness {
  steps: SetupStep[];
  essentialSteps: SetupStep[];
  optionalSteps: SetupStep[];
  essentialCompleted: number;
  essentialTotal: number;
  completedCount: number;
  totalCount: number;
  /** Prêt à créer des dossiers et envoyer contrats / emails. */
  isReadyForDossiers: boolean;
  title: string;
  subtitle: string;
}

export function computeDomainReadiness(workspace: Workspace): DomainReadiness {
  const billing = billingFromWorkspace(workspace);
  const encaissements = encaissementsFromWorkspace(workspace);
  const contrat = getContratReadiness(workspace);

  const contactReady = Boolean(workspace.contact_email?.trim());
  const hasGoals = Boolean(
    workspace.objectif_dossiers_annuel && workspace.objectif_dossiers_annuel > 0,
  );
  const encaissementsReady = hasVirementConfig(encaissements);

  const steps: SetupStep[] = [
    {
      id: "contact",
      label: "Email de contact",
      detail: contactReady
        ? workspace.contact_email
        : "Pour vos notifications et les réponses clients",
      done: contactReady,
      href: "/parametres#domaine",
      essential: true,
    },
    {
      id: "billing",
      label: "Échéancier type",
      detail: workspace.facturation_configuree
        ? `${billing.facturation_acompte_pct} % acompte · ${billing.facturation_solde_pct} % solde`
        : "Acompte et solde à définir",
      done: workspace.facturation_configuree,
      href: "/parametres#facturation",
      essential: true,
    },
    {
      id: "encaissements",
      label: "Coordonnées bancaires",
      detail: encaissementsReady
        ? "IBAN affiché sur la page client"
        : "IBAN à renseigner pour les virements",
      done: encaissementsReady,
      href: "/parametres#encaissements",
      essential: true,
    },
    {
      id: "contrat",
      label: "Contrat Signable",
      detail: contrat.label,
      done: contrat.ready,
      href: "/parametres#contrat",
      essential: true,
    },
    {
      id: "goals",
      label: "Objectifs de saison",
      detail: hasGoals
        ? `${workspace.objectif_dossiers_annuel} dossiers visés`
        : "Optionnel — alimente le pilotage",
      done: hasGoals,
      href: "/parametres#objectifs",
      essential: false,
    },
    {
      id: "types",
      label: "Types d'événement",
      detail:
        workspace.types_evenement_custom.length > 0
          ? `${workspace.types_evenement_custom.length} type${workspace.types_evenement_custom.length > 1 ? "s" : ""} en plus du mariage`
          : "Mariage et Autre événement inclus",
      done: true,
      href: "/parametres#types-evenement",
      essential: false,
    },
  ];

  const essentialSteps = steps.filter((s) => s.essential);
  const optionalSteps = steps.filter((s) => !s.essential);
  const essentialCompleted = essentialSteps.filter((s) => s.done).length;
  const completedCount = steps.filter((s) => s.done).length;
  const isReadyForDossiers = essentialCompleted === essentialSteps.length;

  return {
    steps,
    essentialSteps,
    optionalSteps,
    essentialCompleted,
    essentialTotal: essentialSteps.length,
    completedCount,
    totalCount: steps.length,
    isReadyForDossiers,
    title: isReadyForDossiers
      ? "Prêt pour vos dossiers"
      : "Mise en route du domaine",
    subtitle: isReadyForDossiers
      ? "Vous pouvez accueillir des demandes, envoyer des contrats et des emails de paiement."
      : "Complétez les étapes essentielles avant d'engager vos premiers dossiers.",
  };
}

/** @deprecated Préférer computeDomainReadiness */
export type WorkspaceSetupStatus = DomainReadiness;

export function computeWorkspaceSetupStatus(
  workspace: Workspace,
): DomainReadiness {
  return computeDomainReadiness(workspace);
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

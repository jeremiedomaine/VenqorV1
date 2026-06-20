import type { Workspace } from "@/lib/types";

export type ContratReadiness = {
  ready: boolean;
  label: string;
  detail: string;
};

export function getContratReadiness(workspace: Workspace): ContratReadiness {
  const hasTemplate = Boolean(
    workspace.contrat_template_docx_path || workspace.contrat_template_path,
  );
  const hasSignatures = Boolean(workspace.contrat_signature_zones);

  if (workspace.contrat_template_docx_path && hasSignatures) {
    return {
      ready: true,
      label: "Prêt à l'envoi",
      detail:
        "Votre contrat est configuré. Depuis un dossier en date bloquée, utilisez « Envoyer le contrat ».",
    };
  }

  if (hasTemplate && !hasSignatures) {
    return {
      ready: false,
      label: "Finalisation en cours",
      detail:
        "L'équipe Venqor termine la configuration de votre modèle (signatures).",
    };
  }

  return {
    ready: false,
    label: "Configuration en cours",
    detail:
      "Envoyez votre contrat type à l'équipe Venqor par email — nous préparons le modèle pour vous.",
  };
}

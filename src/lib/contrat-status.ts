import type { Workspace } from "@/lib/types";

export type ContratReadiness = {
  ready: boolean;
  label: string;
  detail: string;
};

export function getContratReadiness(workspace: Workspace): ContratReadiness {
  const hasDocx = Boolean(workspace.contrat_template_docx_path);
  const hasPdf = Boolean(workspace.contrat_template_path);

  if (hasDocx) {
    return {
      ready: true,
      label: "Prêt à l'envoi",
      detail:
        "Votre contrat est configuré avec les tags Signable. Depuis un dossier en date bloquée, utilisez « Envoyer le contrat ».",
    };
  }

  if (hasPdf) {
    return {
      ready: false,
      label: "Modèle PDF uniquement",
      detail:
        "Un modèle Word avec les tags Signable est requis. Contactez l'équipe Venqor pour finaliser la configuration.",
    };
  }

  return {
    ready: false,
    label: "Configuration en cours",
    detail:
      "Envoyez votre contrat type à l'équipe Venqor par email — nous préparons le modèle pour vous.",
  };
}

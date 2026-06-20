export type PortalUnavailableReason =
  | "not_found"
  | "archived"
  | "closed"
  | "inactive";

export function portalUnavailableMessage(
  reason: PortalUnavailableReason,
): { title: string; description: string } {
  switch (reason) {
    case "archived":
      return {
        title: "Espace fermé",
        description:
          "Ce dossier a été archivé par le domaine. L'espace couple n'est plus accessible.",
      };
    case "closed":
      return {
        title: "Dossier clôturé",
        description:
          "Ce mariage est clôturé. L'espace couple n'est plus disponible.",
      };
    case "inactive":
      return {
        title: "Espace indisponible",
        description:
          "Ce lien n'est pas actif pour le moment. Contactez le domaine pour plus d'informations.",
      };
    default:
      return {
        title: "Lien introuvable",
        description:
          "Ce lien est invalide ou a expiré. Vérifiez l'URL ou contactez le domaine.",
      };
  }
}

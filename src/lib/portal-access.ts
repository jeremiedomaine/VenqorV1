import { getEventCopy, NEUTRAL_COPY } from "@/lib/event-copy";

export type PortalUnavailableReason =
  | "not_found"
  | "archived"
  | "closed"
  | "inactive";

export function portalUnavailableMessage(
  reason: PortalUnavailableReason,
  typeEvenement?: string,
): { title: string; description: string } {
  const copy = typeEvenement ? getEventCopy(typeEvenement) : null;

  switch (reason) {
    case "archived":
      return {
        title: "Espace fermé",
        description:
          copy?.portalArchivedMessage ?? NEUTRAL_COPY.portalArchivedMessage,
      };
    case "closed":
      return {
        title: "Dossier clôturé",
        description:
          copy?.portalClosedMessage ??
          "Cet événement est clôturé. L'espace client n'est plus disponible.",
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalUnavailable } from "@/components/portal/portal-unavailable";
import { PortalView } from "@/components/portal/portal-view";
import { loadPortalPage } from "@/lib/load-portal-page";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const result = await loadPortalPage(params.token);

  if (result.status !== "ok") return { title: "Portail" };

  return {
    title: `${result.data.event.nom_des_maries} — ${result.data.workspace.nom_domaine}`,
    description: `Espace privé pour ${result.data.event.nom_des_maries}`,
    robots: { index: false, follow: false },
  };
}

export default async function PortailPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await loadPortalPage(params.token);
  if (result.status === "unavailable") {
    return <PortalUnavailable reason={result.reason} />;
  }

  if (result.status !== "ok") notFound();

  return (
    <PortalView data={result.data} portalToken={params.token} />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalView } from "@/components/portal/portal-view";
import { createClient } from "@/lib/supabase/server";
import type { PortalData } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.rpc("fetch_portal_data", {
    p_token: params.token,
  });

  if (!data) return { title: "Portail" };

  const portal = data as PortalData;
  return {
    title: `${portal.event.nom_des_maries} — ${portal.workspace.nom_domaine}`,
    description: `Espace privé pour ${portal.event.nom_des_maries}`,
    robots: { index: false, follow: false },
  };
}

export default async function PortailPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fetch_portal_data", {
    p_token: params.token,
  });

  if (error || !data) notFound();

  return <PortalView data={data as PortalData} portalToken={params.token} />;
}

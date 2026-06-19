import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalPaymentCheckout } from "@/components/portal/portal-payment-checkout";
import { pickCheckoutPayment } from "@/lib/portal-payment";
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

  if (!data) return { title: "Paiement" };

  const portal = data as PortalData;
  return {
    title: `Paiement — ${portal.event.nom_des_maries}`,
    description: `Régler votre échéance chez ${portal.workspace.nom_domaine}`,
    robots: { index: false, follow: false },
  };
}

export default async function PortailPaiementPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { e?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fetch_portal_data", {
    p_token: params.token,
  });

  if (error || !data) notFound();

  const portal = data as PortalData;
  const payment = pickCheckoutPayment(portal.payments, searchParams.e);

  if (!payment) notFound();

  return (
    <PortalPaymentCheckout
      data={portal}
      portalToken={params.token}
      payment={payment}
    />
  );
}

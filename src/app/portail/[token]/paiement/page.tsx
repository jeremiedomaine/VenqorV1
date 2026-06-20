import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalPaymentCheckout } from "@/components/portal/portal-payment-checkout";
import { PortalUnavailable } from "@/components/portal/portal-unavailable";
import { loadPortalPage } from "@/lib/load-portal-page";
import { pickCheckoutPayment } from "@/lib/portal-payment";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const result = await loadPortalPage(params.token);

  if (result.status !== "ok") return { title: "Paiement" };

  return {
    title: `Paiement — ${result.data.event.nom_des_maries}`,
    description: `Régler votre échéance chez ${result.data.workspace.nom_domaine}`,
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
  const result = await loadPortalPage(params.token);
  if (result.status === "unavailable") {
    return <PortalUnavailable reason={result.reason} />;
  }

  if (result.status !== "ok") notFound();

  const payment = pickCheckoutPayment(result.data.payments, searchParams.e);

  if (!payment) notFound();

  return (
    <PortalPaymentCheckout
      data={result.data}
      portalToken={params.token}
      payment={payment}
    />
  );
}

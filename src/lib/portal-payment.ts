import type { PortalData } from "@/lib/types";

export type PortalPayment = PortalData["payments"][number];

export function pickCheckoutPayment(
  payments: PortalPayment[],
  paymentId?: string,
): PortalPayment | null {
  if (paymentId) {
    const found = payments.find((p) => p.id === paymentId);
    if (found) return found;
  }

  const pending = payments.filter(
    (p) => p.statut === "en_attente" || p.statut === "declare_paye",
  );

  return pending[0] ?? payments[0] ?? null;
}

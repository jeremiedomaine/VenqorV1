import type { SupabaseClient } from "@supabase/supabase-js";
import {
  billingFromWorkspace,
  buildBillingPreview,
  type WorkspaceBilling,
} from "@/lib/billing";
import { buildTransferReference } from "@/lib/payment-utils";

export async function syncAutoPayments(
  supabase: SupabaseClient,
  workspaceId: string,
  eventId: string,
  prixTotal: number,
  dateDebut: string | null,
  options?: {
    force?: boolean;
    customAmounts?: { acompte: number; solde: number };
  },
): Promise<boolean> {
  if (prixTotal <= 0) return false;

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if ((count ?? 0) > 0 && !options?.force) return false;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      "facturation_configuree, facturation_acompte_label, facturation_acompte_pct, facturation_acompte_jours, facturation_solde_label, facturation_solde_pct, facturation_solde_jours, mode_paiement_defaut",
    )
    .eq("id", workspaceId)
    .single();

  if (!workspace?.facturation_configuree) return false;

  const billing = billingFromWorkspace(workspace as WorkspaceBilling);

  let lines: ReturnType<typeof buildBillingPreview>;
  if (options?.customAmounts) {
    const today = new Date();
    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const acompteDate = addDays(today, billing.facturation_acompte_jours);
    const soldeDate = dateDebut
      ? addDays(new Date(dateDebut), billing.facturation_solde_jours)
      : null;

    lines = [
      {
        label: billing.facturation_acompte_label,
        montant: options.customAmounts.acompte,
        date_echeance: acompteDate,
        hint: "",
      },
      {
        label: billing.facturation_solde_label,
        montant: options.customAmounts.solde,
        date_echeance: soldeDate,
        hint: "",
      },
    ];
  } else {
    lines = buildBillingPreview(billing, prixTotal, dateDebut);
  }

  if (options?.force) {
    await supabase.from("payments").delete().eq("event_id", eventId);
  }

  const { error } = await supabase.from("payments").insert(
    lines.map((line, index) => ({
      workspace_id: workspaceId,
      event_id: eventId,
      label: line.label,
      montant: line.montant,
      date_echeance: line.date_echeance,
      statut: "en_attente" as const,
      mode_paiement: "virement" as const,
      reference_virement: buildTransferReference(eventId, index),
    })),
  );

  return !error;
}

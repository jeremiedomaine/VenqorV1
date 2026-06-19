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
  options?: { force?: boolean },
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
      "facturation_acompte_label, facturation_acompte_pct, facturation_acompte_jours, facturation_solde_label, facturation_solde_pct, facturation_solde_jours, mode_paiement_defaut",
    )
    .eq("id", workspaceId)
    .single();

  if (!workspace) return false;

  const billing = billingFromWorkspace(workspace as WorkspaceBilling);
  const lines = buildBillingPreview(billing, prixTotal, dateDebut);
  const mode =
    workspace.mode_paiement_defaut === "stripe" ? "stripe" : "virement";

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
      mode_paiement: mode,
      reference_virement:
        mode === "virement"
          ? buildTransferReference(eventId, index)
          : null,
    })),
  );

  return !error;
}

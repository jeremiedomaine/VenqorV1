"use server";

import { revalidatePath } from "next/cache";
import { notifyPaymentConfirmed, notifyPaymentRejected } from "@/actions/payment-emails";
import { actionError, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { runInBackground } from "@/lib/run-in-background";
import { buildTransferReference } from "@/lib/payment-utils";
import type { PaymentStatus } from "@/lib/types";

async function getWorkspaceId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable");
  return profile.workspace_id;
}

export async function createPayment(formData: FormData): Promise<ActionResult> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const eventId = String(formData.get("event_id"));
  const label = String(formData.get("label") ?? "").trim();
  const montant = Number(formData.get("montant") || 0);

  if (!label) return actionError("Le libellé est obligatoire.");
  if (!Number.isFinite(montant) || montant <= 0) {
    return actionError("Le montant doit être supérieur à 0.");
  }

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { error } = await supabase.from("payments").insert({
    workspace_id: workspaceId,
    event_id: eventId,
    label,
    montant,
    date_echeance: String(formData.get("date_echeance") || null) || null,
    statut: "en_attente",
    mode_paiement: "virement",
    reference_virement: buildTransferReference(eventId, count ?? 0),
  });

  if (error) return actionError("Impossible d'ajouter l'échéance.");
  revalidatePath(`/evenements/${eventId}`);
  return {};
}

export async function updatePaymentStatus(
  paymentId: string,
  eventId: string,
  statut: PaymentStatus,
): Promise<ActionResult> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { statut };

  if (statut === "paye") {
    patch.paid_at = now;
  } else if (statut === "en_attente") {
    patch.paid_at = null;
    patch.declared_at = null;
    patch.confirmed_at = null;
  }

  const { error } = await supabase
    .from("payments")
    .update(patch)
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (error) return actionError("Impossible de mettre à jour le paiement.");
  if (statut === "paye") {
    runInBackground(notifyPaymentConfirmed(paymentId, eventId));
  }
  revalidatePath(`/evenements/${eventId}`);
  return {};
}

export async function markPaymentPaid(
  paymentId: string,
  eventId: string,
): Promise<ActionResult> {
  return updatePaymentStatus(paymentId, eventId, "paye");
}

export async function confirmDeclaredPayment(
  paymentId: string,
  eventId: string,
): Promise<ActionResult> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({
      statut: "paye",
      confirmed_at: now,
      paid_at: now,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .eq("statut", "declare_paye")
    .select("id")
    .maybeSingle();

  if (error) return actionError("Impossible de confirmer le paiement.");
  if (!data) {
    return actionError("Ce paiement n'est plus en attente de confirmation.");
  }

  runInBackground(notifyPaymentConfirmed(paymentId, eventId));
  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/");
  return {};
}

export async function rejectDeclaredPayment(
  paymentId: string,
  eventId: string,
): Promise<ActionResult> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({
      statut: "en_attente",
      rejected_at: now,
      declared_at: null,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .eq("statut", "declare_paye")
    .select("id")
    .maybeSingle();

  if (error) return actionError("Impossible de rejeter la déclaration.");
  if (!data) {
    return actionError("Ce paiement n'est plus en attente de confirmation.");
  }

  runInBackground(notifyPaymentRejected(paymentId, eventId));
  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/");
  return {};
}

export async function deletePayment(
  paymentId: string,
  eventId: string,
): Promise<ActionResult> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (error) return actionError("Impossible de supprimer l'échéance.");
  revalidatePath(`/evenements/${eventId}`);
  return {};
}

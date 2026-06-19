"use server";

import { revalidatePath } from "next/cache";
import { notifyPaymentConfirmed, notifyPaymentRejected } from "@/actions/payment-emails";
import { createClient } from "@/lib/supabase/server";
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

async function getDefaultPaymentMode(workspaceId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("mode_paiement_defaut")
    .eq("id", workspaceId)
    .single();

  return data?.mode_paiement_defaut === "stripe" ? "stripe" : "virement";
}

export async function createPayment(formData: FormData): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const eventId = String(formData.get("event_id"));
  const mode = await getDefaultPaymentMode(workspaceId);

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { error } = await supabase.from("payments").insert({
    workspace_id: workspaceId,
    event_id: eventId,
    label: String(formData.get("label")),
    montant: Number(formData.get("montant") || 0),
    date_echeance: String(formData.get("date_echeance") || null) || null,
    statut: "en_attente",
    mode_paiement: mode,
    reference_virement:
      mode === "virement"
        ? buildTransferReference(eventId, count ?? 0)
        : null,
  });

  if (error) return;
  revalidatePath(`/evenements/${eventId}`);
}

export async function updatePaymentStatus(
  paymentId: string,
  eventId: string,
  statut: PaymentStatus,
): Promise<void> {
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

  if (error) return;
  if (statut === "paye") {
    await notifyPaymentConfirmed(paymentId, eventId);
  }
  revalidatePath(`/evenements/${eventId}`);
}

export async function markPaymentPaid(
  paymentId: string,
  eventId: string,
): Promise<void> {
  await updatePaymentStatus(paymentId, eventId, "paye");
}

export async function confirmDeclaredPayment(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("payments")
    .update({
      statut: "paye",
      confirmed_at: now,
      paid_at: now,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .eq("statut", "declare_paye");

  if (error) return;
  await notifyPaymentConfirmed(paymentId, eventId);
  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/");
}

export async function rejectDeclaredPayment(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("payments")
    .update({
      statut: "en_attente",
      rejected_at: now,
      declared_at: null,
    })
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId)
    .eq("statut", "declare_paye");

  if (error) return;
  await notifyPaymentRejected(paymentId, eventId);
  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/");
}

export async function deletePayment(
  paymentId: string,
  eventId: string,
): Promise<void> {
  const workspaceId = await getWorkspaceId();
  const supabase = createClient();

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("workspace_id", workspaceId);

  if (error) return;
  revalidatePath(`/evenements/${eventId}`);
}

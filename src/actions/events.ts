"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireWorkspaceClient } from "@/lib/workspace-session";
import { parseEventFormData } from "@/lib/event-utils";
import { loadWorkspaceEventTypes } from "@/lib/load-workspace";
import { syncAutoPayments } from "@/lib/sync-payments";
import { notifyPaymentConfirmed } from "@/actions/payment-emails";
import { isEventRangeBlocked } from "@/lib/calendar-events";
import type { EventStatus } from "@/lib/types";

async function loadBlockingEvents(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const { data } = await supabase
    .from("events")
    .select("id, statut, date_debut, date_fin, archived_at, cloture_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .is("cloture_at", null);

  return data ?? [];
}

const DATE_BLOCKED_ERROR =
  "Cette date est déjà bloquée par un dossier en date bloquée ou confirmé.";

function eventPayloadFromForm(
  formData: FormData,
  statut: EventStatus,
  customTypes: Awaited<ReturnType<typeof loadWorkspaceEventTypes>>,
) {
  const parsed = parseEventFormData(formData, customTypes);
  if (!parsed.nom_des_maries) return null;

  return {
    ...parsed,
    statut,
    capacite_hebergement_totale: Number(
      formData.get("capacite_hebergement_totale") || 0,
    ),
  };
}

export async function createEvent(
  formData: FormData,
): Promise<{ error?: string; eventId?: string }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();
  const customTypes = await loadWorkspaceEventTypes();

  const payload = eventPayloadFromForm(formData, "prospect", customTypes);
  if (!payload) return { error: "Informations invalides" };

  if (payload.date_debut) {
    const blockingEvents = await loadBlockingEvents(supabase, workspaceId);
    if (
      isEventRangeBlocked(
        blockingEvents,
        payload.date_debut,
        payload.date_fin,
      )
    ) {
      return { error: DATE_BLOCKED_ERROR };
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      workspace_id: workspaceId,
      type_evenement: payload.type_evenement,
      nom_evenement: payload.nom_evenement,
      nom_des_maries: payload.nom_des_maries,
      marie1_prenom: payload.marie1_prenom,
      marie1_nom: payload.marie1_nom,
      marie2_prenom: payload.marie2_prenom,
      marie2_nom: payload.marie2_nom,
      adresse_postale: payload.adresse_postale,
      email: payload.email,
      telephone: payload.telephone,
      notes_internes: payload.notes_internes,
      statut: "prospect",
      date_debut: payload.date_debut,
      date_fin: payload.date_fin,
      prix_total: payload.prix_total > 0 ? payload.prix_total : 0,
    })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "Création impossible" };

  if (payload.prix_total > 0) {
    await syncAutoPayments(
      supabase,
      workspaceId,
      event.id,
      payload.prix_total,
      payload.date_debut,
      payload.hasCustomSplit
        ? {
            customAmounts: {
              acompte: payload.montantAcompte,
              solde: payload.montantSolde,
            },
          }
        : undefined,
    );
  }

  revalidatePath("/");
  revalidatePath("/evenements");
  return { eventId: event.id };
}

export async function updateEvent(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();
  const eventId = String(formData.get("event_id"));
  const customTypes = await loadWorkspaceEventTypes();

  const { data: existing } = await supabase
    .from("events")
    .select("statut, archived_at, cloture_at")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!existing) return { error: "Événement introuvable" };
  if (existing.archived_at) {
    return { error: "Dossier archivé — restaurez-le pour modifier." };
  }

  const parsed = parseEventFormData(formData, customTypes);
  if (!parsed.nom_des_maries) return { error: "Informations invalides" };

  const statut = existing.statut as EventStatus;

  const payload: Record<string, unknown> = {
    type_evenement: parsed.type_evenement,
    nom_evenement: parsed.nom_evenement,
    nom_des_maries: parsed.nom_des_maries,
    marie1_prenom: parsed.marie1_prenom,
    marie1_nom: parsed.marie1_nom,
    marie2_prenom: parsed.marie2_prenom,
    marie2_nom: parsed.marie2_nom,
    adresse_postale: parsed.adresse_postale,
    email: parsed.email,
    telephone: parsed.telephone,
    notes_internes: parsed.notes_internes,
    date_debut: parsed.date_debut,
    date_fin: parsed.date_fin,
    statut,
    capacite_hebergement_totale: Number(
      formData.get("capacite_hebergement_totale") || 0,
    ),
    prix_total: parsed.prix_total,
  };

  if (statut === "option" || statut === "confirme") {
    if (formData.has("message_accueil")) {
      payload.message_accueil = String(formData.get("message_accueil") ?? "");
    }
  }

  if (statut === "prospect" && parsed.date_debut) {
    const blockingEvents = await loadBlockingEvents(supabase, workspaceId);
    if (
      isEventRangeBlocked(
        blockingEvents,
        parsed.date_debut,
        parsed.date_fin,
        eventId,
      )
    ) {
      return { error: DATE_BLOCKED_ERROR };
    }
  }

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  if (!existing.cloture_at) {
    await syncAutoPayments(
      supabase,
      workspaceId,
      eventId,
      parsed.prix_total,
      parsed.date_debut,
      parsed.hasCustomSplit
        ? {
            customAmounts: {
              acompte: parsed.montantAcompte,
              solde: parsed.montantSolde,
            },
          }
        : undefined,
    );
  }

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return { success: true };
}

export async function archiveEvent(
  eventId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select("archived_at, cloture_at")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event) return { error: "Événement introuvable" };
  if (event.archived_at) return { error: "Ce dossier est déjà archivé" };
  if (event.cloture_at) {
    return { error: "Un dossier clôturé ne peut pas être archivé" };
  }

  const { error } = await supabase
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return { success: true };
}

export async function restoreEvent(
  eventId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { error } = await supabase
    .from("events")
    .update({ archived_at: null })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .not("archived_at", "is", null);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return { success: true };
}

export async function closeEventDossier(
  eventId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select("statut, cloture_at, prix_total, archived_at")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event) return { error: "Événement introuvable" };
  if (event.archived_at) return { error: "Dossier archivé" };
  if (event.cloture_at) return { error: "Ce dossier est déjà clôturé" };
  if (event.statut !== "confirme") {
    return { error: "Seuls les dossiers confirmés peuvent être clôturés" };
  }

  const prixTotal = Number(event.prix_total);

  if (prixTotal > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, statut, label")
      .eq("event_id", eventId)
      .eq("workspace_id", workspaceId);

    if (!payments?.length) {
      return { error: "Générez l'échéancier avant de clôturer le dossier" };
    }

    const unpaid = payments.filter((p) => p.statut !== "paye");
    if (unpaid.length > 0) {
      const labels = unpaid.map((p) => p.label).join(", ");
      return {
        error: `Impossible de clôturer : ${unpaid.length} paiement${unpaid.length > 1 ? "s" : ""} non réglé${unpaid.length > 1 ? "s" : ""} (${labels}). Marquez-les comme payés ou confirmez les virements déclarés.`,
      };
    }
  }

  const { error } = await supabase
    .from("events")
    .update({ cloture_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  revalidatePath("/pilotage");
  return { success: true };
}

export async function blockEventDate(
  eventId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select("statut, prix_total, date_debut, archived_at")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event) return { error: "Événement introuvable" };
  if (event.archived_at) return { error: "Dossier archivé" };
  if (event.statut !== "prospect") {
    return { error: "Seules les demandes en cours peuvent bloquer une date" };
  }
  if (!event.date_debut) {
    return { error: "Renseignez une date d'événement avant de bloquer" };
  }

  const blockingEvents = await loadBlockingEvents(supabase, workspaceId);
  if (
    isEventRangeBlocked(
      blockingEvents,
      event.date_debut,
      event.date_debut,
      eventId,
    )
  ) {
    return { error: DATE_BLOCKED_ERROR };
  }

  const { error } = await supabase
    .from("events")
    .update({ statut: "option" })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  const prixTotal = Number(event.prix_total);
  if (prixTotal > 0) {
    await syncAutoPayments(
      supabase,
      workspaceId,
      eventId,
      prixTotal,
      event.date_debut,
    );
  }

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return { success: true };
}

export async function confirmDepositPaid(
  eventId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select("statut, prix_total, date_debut")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event) return { error: "Événement introuvable" };
  if (event.statut !== "option") {
    return { error: "Seuls les dossiers en date bloquée peuvent être confirmés" };
  }

  const prixTotal = Number(event.prix_total);

  if (prixTotal > 0) {
    let { data: payments } = await supabase
      .from("payments")
      .select("id, statut")
      .eq("event_id", eventId)
      .eq("workspace_id", workspaceId)
      .order("date_echeance", { ascending: true, nullsFirst: false })
      .limit(1);

    if (!payments?.length) {
      await syncAutoPayments(
        supabase,
        workspaceId,
        eventId,
        prixTotal,
        event.date_debut,
      );
      ({ data: payments } = await supabase
        .from("payments")
        .select("id, statut")
        .eq("event_id", eventId)
        .eq("workspace_id", workspaceId)
        .order("date_echeance", { ascending: true, nullsFirst: false })
        .limit(1));
    }

    const deposit = payments?.[0];
    if (!deposit) {
      return { error: "Générez l'échéancier avant de confirmer l'acompte" };
    }

    if (deposit.statut !== "paye") {
      const now = new Date().toISOString();
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ statut: "paye", paid_at: now })
        .eq("id", deposit.id)
        .eq("workspace_id", workspaceId);

      if (paymentError) return { error: paymentError.message };
      await notifyPaymentConfirmed(deposit.id, eventId);
    }
  }

  const { error } = await supabase
    .from("events")
    .update({ statut: "confirme" })
    .eq("id", eventId)
    .eq("workspace_id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${eventId}`);
  return { success: true };
}

export async function regenerateEventPayments(
  eventId: string,
): Promise<ActionResult> {
  const { workspaceId, supabase } = await requireWorkspaceClient();

  const { data: event } = await supabase
    .from("events")
    .select("prix_total, date_debut")
    .eq("id", eventId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!event || Number(event.prix_total) <= 0) {
    return actionError("Renseignez un budget sur le dossier avant de générer l'échéancier.");
  }

  const ok = await syncAutoPayments(
    supabase,
    workspaceId,
    eventId,
    Number(event.prix_total),
    event.date_debut,
    { force: true },
  );

  if (!ok) {
    return actionError("Impossible de générer l'échéancier.");
  }

  revalidatePath(`/evenements/${eventId}`);
  return {};
}

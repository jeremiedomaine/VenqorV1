import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import type { Event, Payment } from "@/lib/types";

const EVENT_PIPELINE_COLUMNS =
  "id, statut, date_debut, date_fin, prix_total, cloture_at, archived_at, nom_evenement, nom_des_maries, notes_internes, marie1_prenom, marie1_nom, marie2_prenom, marie2_nom, type_evenement";

const PAYMENT_STATS_COLUMNS =
  "id, event_id, montant, statut, date_echeance";

export async function loadDashboardStats(selectedYear?: number) {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      events: [] as Event[],
      stats: computeDashboardStats([], [], selectedYear),
    };
  }

  const supabase = createClient();
  const [{ data: events }, { data: payments }] = await Promise.all([
    supabase
      .from("events")
      .select(EVENT_PIPELINE_COLUMNS)
      .eq("workspace_id", auth.workspaceId)
      .is("archived_at", null)
      .order("date_debut", { ascending: true, nullsFirst: false }),
    supabase
      .from("payments")
      .select(PAYMENT_STATS_COLUMNS)
      .eq("workspace_id", auth.workspaceId),
  ]);

  const stats = computeDashboardStats(
    (events ?? []) as Event[],
    (payments ?? []) as Payment[],
    selectedYear,
  );

  return { events: (events ?? []) as Event[], stats };
}

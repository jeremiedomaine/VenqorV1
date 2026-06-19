import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";

const ARCHIVED_COLUMNS =
  "id, statut, date_debut, prix_total, archived_at, nom_evenement, nom_des_maries, notes_internes";

export async function loadArchivedEventCount(): Promise<number> {
  const auth = await getAuthContext();
  if (!auth) return 0;

  const supabase = createClient();
  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", auth.workspaceId)
    .not("archived_at", "is", null);

  return count ?? 0;
}

export async function loadArchivedEvents(): Promise<Event[]> {
  const auth = await getAuthContext();
  if (!auth) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select(ARCHIVED_COLUMNS)
    .eq("workspace_id", auth.workspaceId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  return (data ?? []) as Event[];
}

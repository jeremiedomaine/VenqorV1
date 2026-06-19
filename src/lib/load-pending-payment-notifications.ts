import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

export interface PendingPaymentNotification {
  id: string;
  label: string;
  montant: number;
  declared_at: string | null;
  event_id: string;
  event: {
    id: string;
    nom_des_maries: string;
    nom_evenement: string;
  };
}

export async function loadPendingPaymentNotificationCount(): Promise<number> {
  const auth = await getAuthContext();
  if (!auth) return 0;

  const supabase = createClient();
  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", auth.workspaceId)
    .eq("statut", "declare_paye");

  return count ?? 0;
}

export async function loadPendingPaymentNotifications(): Promise<
  PendingPaymentNotification[]
> {
  const auth = await getAuthContext();
  if (!auth) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, label, montant, declared_at, event_id, events!inner(id, nom_des_maries, nom_evenement)",
    )
    .eq("workspace_id", auth.workspaceId)
    .eq("statut", "declare_paye")
    .order("declared_at", { ascending: false });

  return (data ?? []).map((row) => {
    const event = row.events as unknown as PendingPaymentNotification["event"];
    return {
      id: row.id,
      label: row.label,
      montant: Number(row.montant),
      declared_at: row.declared_at,
      event_id: row.event_id,
      event,
    };
  });
}

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

export async function loadPendingPaymentNotifications(): Promise<
  PendingPaymentNotification[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const { data } = await supabase
    .from("payments")
    .select(
      "id, label, montant, declared_at, event_id, events!inner(id, nom_des_maries, nom_evenement)",
    )
    .eq("workspace_id", profile.workspace_id)
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

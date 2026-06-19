import { createClient } from "@/lib/supabase/server";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import type { Event, Payment } from "@/lib/types";

export async function loadDashboardStats(selectedYear?: number) {
  const supabase = createClient();
  const [{ data: events }, { data: payments }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .is("archived_at", null)
      .order("date_debut", { ascending: true, nullsFirst: false }),
    supabase.from("payments").select("*"),
  ]);

  const stats = computeDashboardStats(
    (events ?? []) as Event[],
    (payments ?? []) as Payment[],
    selectedYear,
  );

  return { events: (events ?? []) as Event[], stats };
}

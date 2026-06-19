import { EventsList } from "@/components/dashboard/events-list";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";
import { SIGNED_EVENT_STATUSES } from "@/lib/types";

export default async function EvenementsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("statut", SIGNED_EVENT_STATUSES)
    .order("date_debut", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dossiers engagés
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {(events ?? []).length} dossier{(events ?? []).length !== 1 ? "s" : ""}{" "}
          engagé{(events ?? []).length !== 1 ? "s" : ""} (dates bloquées &
          confirmés)
        </p>
      </div>

      <EventsList events={(events ?? []) as Event[]} />
    </div>
  );
}

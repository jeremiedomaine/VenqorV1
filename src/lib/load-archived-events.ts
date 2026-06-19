import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";

export async function loadArchivedEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  return (data ?? []) as Event[];
}

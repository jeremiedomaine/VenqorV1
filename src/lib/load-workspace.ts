import { parseCustomEventTypes } from "@/lib/event-types";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import type { CustomEventType } from "@/lib/types";

export async function loadWorkspace() {
  const auth = await getAuthContext();
  if (!auth) return { workspace: null };

  const supabase = createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", auth.workspaceId)
    .single();

  const types_evenement_custom = parseCustomEventTypes(
    workspace?.types_evenement_custom,
  );

  return {
    workspace: workspace
      ? { ...workspace, types_evenement_custom }
      : null,
  };
}

export async function loadWorkspaceEventTypes(): Promise<CustomEventType[]> {
  const auth = await getAuthContext();
  if (!auth) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("types_evenement_custom")
    .eq("id", auth.workspaceId)
    .single();

  return parseCustomEventTypes(data?.types_evenement_custom);
}

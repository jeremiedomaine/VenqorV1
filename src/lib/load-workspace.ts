import { parseCustomEventTypes } from "@/lib/event-types";
import { createClient } from "@/lib/supabase/server";
import type { CustomEventType } from "@/lib/types";

export async function loadWorkspace() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("workspace_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: workspace } = profile
    ? await supabase
        .from("workspaces")
        .select("*")
        .eq("id", profile.workspace_id)
        .single()
    : { data: null };

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
  const { workspace } = await loadWorkspace();
  return workspace?.types_evenement_custom ?? [];
}

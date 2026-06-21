import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceSession } from "@/lib/workspace-session";

export type AuthContext = {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  isVenqorAdmin: boolean;
  isImpersonating: boolean;
};

/** One auth + profile fetch per request (deduped across layout + pages). */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await getWorkspaceSession();
  if (!session) return null;

  const supabase = session.isImpersonating
    ? createServiceClient()
    : createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("nom_domaine")
    .eq("id", session.workspaceId)
    .single();

  return {
    userId: session.userId,
    email: session.email,
    workspaceId: session.workspaceId,
    workspaceName: workspace?.nom_domaine ?? "Mon domaine",
    isVenqorAdmin: session.isVenqorAdmin,
    isImpersonating: session.isImpersonating,
  };
});

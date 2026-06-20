import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isVenqorAdminEmail } from "@/lib/venqor-admin";

export type AuthContext = {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  isVenqorAdmin: boolean;
};

/** One auth + profile fetch per request (deduped across layout + pages). */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id, workspaces(nom_domaine)")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) return null;

  const workspace = profile.workspaces as unknown as {
    nom_domaine: string;
  } | null;

  return {
    userId: user.id,
    email: user.email ?? "",
    workspaceId: profile.workspace_id,
    workspaceName: workspace?.nom_domaine ?? "Mon domaine",
    isVenqorAdmin: isVenqorAdminEmail(user.email),
  };
});

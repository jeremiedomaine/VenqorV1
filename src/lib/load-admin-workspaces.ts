import { createServiceClient } from "@/lib/supabase/service";

export type AdminWorkspaceRow = {
  id: string;
  nom_domaine: string;
  created_at: string;
  manager_email: string | null;
};

export async function loadAdminWorkspaces(): Promise<AdminWorkspaceRow[]> {
  const supabase = createServiceClient();

  const [{ data: workspaces, error: wsError }, { data: profiles, error: pError }] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("id, nom_domaine, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, workspace_id"),
    ]);

  if (wsError) throw new Error(wsError.message);
  if (pError) throw new Error(pError.message);

  const emailByUserId = new Map<string, string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(error.message);

    for (const user of data.users) {
      if (user.email) emailByUserId.set(user.id, user.email);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  const emailByWorkspaceId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    const email = emailByUserId.get(profile.id);
    if (email && !emailByWorkspaceId.has(profile.workspace_id)) {
      emailByWorkspaceId.set(profile.workspace_id, email);
    }
  }

  return (workspaces ?? []).map((workspace) => ({
    id: workspace.id,
    nom_domaine: workspace.nom_domaine,
    created_at: workspace.created_at,
    manager_email: emailByWorkspaceId.get(workspace.id) ?? null,
  }));
}

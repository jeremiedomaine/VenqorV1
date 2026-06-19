import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("*, workspaces(nom_domaine)")
        .eq("id", user.id)
        .single()
    : { data: null };

  const workspaceName =
    (profile?.workspaces as { nom_domaine: string } | null)?.nom_domaine ??
    "Mon domaine";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar workspaceName={workspaceName} />
      <main className="min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

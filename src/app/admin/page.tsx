import { redirect } from "next/navigation";
import { enterWorkspaceAsAdmin } from "@/actions/admin-impersonation";
import { VenqorLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthContext } from "@/lib/auth-context";
import { loadAdminWorkspaces } from "@/lib/load-admin-workspaces";
import { formatDateShort } from "@/lib/portal-utils";

export default async function AdminPage() {
  const auth = await getAuthContext();
  if (!auth?.isVenqorAdmin) redirect("/");

  const workspaces = await loadAdminWorkspaces();

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <VenqorLogo />
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin Venqor
          </h1>
          <p className="text-sm text-slate-500">
            {workspaces.length} domaine{workspaces.length > 1 ? "s" : ""}{" "}
            inscrit{workspaces.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domaine</TableHead>
                <TableHead>Email gérant</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Accès</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-slate-500"
                  >
                    Aucun workspace pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                workspaces.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.nom_domaine}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {row.manager_email ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDateShort(row.created_at) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={enterWorkspaceAsAdmin}>
                        <input
                          type="hidden"
                          name="workspace_id"
                          value={row.id}
                        />
                        <Button type="submit" size="sm">
                          Accéder
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

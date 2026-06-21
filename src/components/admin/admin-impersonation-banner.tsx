import { exitAdminImpersonation } from "@/actions/admin-impersonation";
import { Button } from "@/components/ui/button";

export function AdminImpersonationBanner({
  workspaceName,
}: {
  workspaceName: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#4F46E5]/20 bg-[#4F46E5]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-700">
        Vue admin — espace{" "}
        <span className="font-semibold text-slate-900">{workspaceName}</span>
      </p>
      <form action={exitAdminImpersonation}>
        <Button type="submit" variant="outline" size="sm">
          Retour admin
        </Button>
      </form>
    </div>
  );
}

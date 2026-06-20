import { AutomatisationsHub } from "@/components/automatisations/automatisations-hub";
import {
  automationFromWorkspace,
  depositAutomationFromWorkspace,
} from "@/lib/automation-settings";
import { listEventTypeOptions } from "@/lib/event-types";
import { loadRelanceRulesForWorkspace } from "@/lib/load-relance-rules";
import { loadWorkspace } from "@/lib/load-workspace";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";

export default async function AutomatisationsPage() {
  const { workspace } = await loadWorkspace();

  if (!workspace) {
    return (
      <p className="text-slate-500">
        Workspace introuvable. Vérifiez que les migrations Supabase sont
        appliquées.
      </p>
    );
  }

  const soldeSettings = automationFromWorkspace(workspace);
  const acompteSettings = depositAutomationFromWorkspace(workspace);

  const auth = await getAuthContext();
  const supabase = createClient();
  let relanceRules: Awaited<
    ReturnType<typeof loadRelanceRulesForWorkspace>
  > = [];
  let relancesUnavailable: string | null = null;

  if (auth) {
    try {
      relanceRules = await loadRelanceRulesForWorkspace(
        supabase,
        auth.workspaceId,
      );
    } catch (err) {
      console.error("[automatisations] relance rules load failed", err);
      relancesUnavailable =
        "Les relances ne sont pas encore disponibles. Appliquez la migration Supabase 021_relance_rules.sql puis rechargez la page.";
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Automatisations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configurez vos emails automatiques : contenu personnalisable, mise en
          page Venqor identique pour tous vos messages.
        </p>
      </div>

      <AutomatisationsHub
        workspaceName={workspace.nom_domaine}
        soldeSettings={soldeSettings}
        acompteSettings={acompteSettings}
        relancesActives={workspace.relances_actives ?? true}
        rules={relanceRules}
        relancesUnavailable={relancesUnavailable}
        eventTypeOptions={listEventTypeOptions(workspace.types_evenement_custom)}
      />
    </div>
  );
}

import { DepositAutomationForm } from "@/components/automatisations/deposit-automation-form";
import { PaymentAutomationForm } from "@/components/automatisations/payment-automation-form";
import { RelancesAutomationSection } from "@/components/automatisations/relances-automation-section";
import {
  automationFromWorkspace,
  depositAutomationFromWorkspace,
} from "@/lib/automation-settings";
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
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Automatisations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Emails automatiques liés aux encaissements — sans gestion comptable.
          Le domaine facture de son côté ; Venqor orchestre le paiement.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Email de demande d&apos;acompte
          </h2>
          <p className="text-sm text-slate-500">
            Envoyé au couple pour le règlement de l&apos;acompte, en lien avec
            la signature Yousign. Choisissez si l&apos;email part avec le
            contrat ou une fois les deux signatures reçues.
          </p>
        </div>

        <DepositAutomationForm
          settings={acompteSettings}
          workspaceName={workspace.nom_domaine}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Email de demande de solde
          </h2>
          <p className="text-sm text-slate-500">
            Personnalisez le message envoyé au couple pour le règlement du
            solde (J-30). Le lien mène à la page couple pour payer par virement.
          </p>
        </div>

        <PaymentAutomationForm
          settings={soldeSettings}
          workspaceName={workspace.nom_domaine}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Relances et rappels
          </h2>
          <p className="text-sm text-slate-500">
            Règles prédéfinies pour rappeler le couple ou alerter le domaine
            avant ou après une échéance, ou en cas de contrat non signé.
            Objet et message personnalisables avec variables.
          </p>
        </div>

        {relancesUnavailable ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {relancesUnavailable}
          </p>
        ) : (
          <RelancesAutomationSection
            relancesActives={workspace.relances_actives ?? true}
            rules={relanceRules}
            workspaceName={workspace.nom_domaine}
          />
        )}
      </section>
    </div>
  );
}

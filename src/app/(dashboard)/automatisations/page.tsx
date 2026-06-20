import { DepositAutomationForm } from "@/components/automatisations/deposit-automation-form";
import { PaymentAutomationForm } from "@/components/automatisations/payment-automation-form";
import { loadWorkspace } from "@/lib/load-workspace";
import {
  automationFromWorkspace,
  depositAutomationFromWorkspace,
} from "@/lib/automation-settings";

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

      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6">
        <h3 className="text-sm font-semibold text-slate-800">À venir</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          <li>Relances configurables avant / après échéance (rappels J-7, J+3…)</li>
        </ul>
      </section>
    </div>
  );
}

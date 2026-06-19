import { PaymentAutomationForm } from "@/components/automatisations/payment-automation-form";
import { loadWorkspace } from "@/lib/load-workspace";
import { automationFromWorkspace } from "@/lib/automation-settings";

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

  const settings = automationFromWorkspace(workspace);

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
            Email de demande de paiement
          </h2>
          <p className="text-sm text-slate-500">
            Personnalisez le message envoyé au couple avec un template Venqor.
            Le lien mène à la page couple pour régler l&apos;échéance (virement
            ou déclaration).
          </p>
        </div>

        <PaymentAutomationForm
          settings={settings}
          workspaceName={workspace.nom_domaine}
        />
      </section>

      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6">
        <h3 className="text-sm font-semibold text-slate-800">À venir</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          <li>Relances configurables avant / après échéance</li>
          <li>Email quand le couple déclare un virement (E1)</li>
          <li>Contrat + signature Yousign</li>
        </ul>
      </section>
    </div>
  );
}

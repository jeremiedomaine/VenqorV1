import { BillingSettingsForm } from "@/components/parametres/billing-settings-form";
import { ContratTemplateForm } from "@/components/parametres/contrat-template-form";
import { EncaissementsSettingsForm } from "@/components/parametres/encaissements-settings-form";
import { EventTypesSettings } from "@/components/parametres/event-types-settings";
import { GoalsSettingsForm } from "@/components/parametres/goals-settings-form";
import {
  SettingsSubNavBar,
  SettingsSubNavRail,
} from "@/components/parametres/settings-subnav";
import { SettingsOverview } from "@/components/parametres/settings-overview";
import {
  SettingsInfoBox,
  SettingsSection,
} from "@/components/parametres/settings-section";
import { billingFromWorkspace } from "@/lib/billing";
import { encaissementsFromWorkspace } from "@/lib/payment-utils";
import { loadWorkspace } from "@/lib/load-workspace";
import {
  computeWorkspaceSetupStatus,
  goalsFromWorkspace,
} from "@/lib/workspace-setup";

export default async function ParametresPage() {
  const { workspace } = await loadWorkspace();

  if (!workspace) {
    return (
      <p className="text-slate-500">
        Workspace introuvable. Vérifiez que les migrations Supabase sont
        appliquées.
      </p>
    );
  }

  const billing = billingFromWorkspace(workspace);
  const encaissements = encaissementsFromWorkspace(workspace);
  const setup = computeWorkspaceSetupStatus(workspace);
  const goals = goalsFromWorkspace(workspace);

  return (
    <div className="lg:flex lg:items-start lg:gap-8 xl:gap-10">
      <SettingsSubNavRail />

      <div className="min-w-0 flex-1 space-y-8 pb-12 lg:max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Paramètres
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Règles métier, objectifs et organisation de votre domaine
          </p>
        </div>

        <SettingsSubNavBar />

        <section id="apercu" className="scroll-mt-24 lg:scroll-mt-8">
          <SettingsOverview workspace={workspace} setup={setup} />
        </section>

        <SettingsSection
          id="objectifs"
          title="Objectifs & pilotage"
          description="Fixez vos cibles annuelles — elles alimentent la page Pilotage pour suivre le remplissage de votre saison."
        >
          <GoalsSettingsForm goals={goals} />
        </SettingsSection>

        <SettingsSection
          id="facturation"
          title="Facturation"
          description="Règles appliquées à la génération automatique des échéanciers (acompte et solde)."
        >
          <div className="space-y-6">
            <SettingsInfoBox title="Bon à savoir">
              <p>
                Ces règles s&apos;appliquent lorsque vous saisissez un budget sur
                un dossier <strong>sans échéancier existant</strong>.
              </p>
              <p>
                Les dossiers déjà engagés conservent leur échéancier actuel — une
                modification ici ne les met pas à jour automatiquement.
              </p>
            </SettingsInfoBox>
            <BillingSettingsForm workspace={{ ...billing, id: workspace.id }} />
          </div>
        </SettingsSection>

        <SettingsSection
          id="encaissements"
          title="Encaissements"
          description="Mode de paiement par défaut et coordonnées bancaires affichées sur la page couple."
        >
          <div className="space-y-6">
            <SettingsInfoBox title="Bon à savoir">
              <p>
                En mode <strong>virement</strong>, le couple déclare son paiement
                sur la page couple ; vous confirmez ou rejetez depuis le dossier.
              </p>
              <p>
                Le mode <strong>Stripe</strong> sera disponible prochainement pour
                un encaissement automatique.
              </p>
            </SettingsInfoBox>
            <EncaissementsSettingsForm encaissements={encaissements} />
          </div>
        </SettingsSection>

        <SettingsSection
          id="contrat"
          title="Contrat de réservation"
          description="Modèle PDF signé via Yousign par les deux mariés. Venqor envoie votre document tel quel — sans le rédiger à votre place."
        >
          <div className="space-y-6">
            <SettingsInfoBox title="Bon à savoir">
              <p>
                Uploadez le contrat type de votre domaine (PDF), puis placez
                visuellement les deux zones de signature sur l&apos;aperçu.
              </p>
              <p>
                Choisissez « dernière page » si la longueur du contrat varie
                selon les dossiers — les signatures suivront toujours la fin du
                document.
              </p>
            </SettingsInfoBox>
            <ContratTemplateForm
              hasCustomTemplate={Boolean(workspace.contrat_template_path)}
              filename={workspace.contrat_template_filename}
              updatedAt={workspace.contrat_template_updated_at}
              signatureZones={workspace.contrat_signature_zones}
              signatureZonesUpdatedAt={
                workspace.contrat_signature_zones_updated_at
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          id="types-evenement"
          title="Types d'événement"
          description="Mariage et Autre événement sont toujours disponibles. Ajoutez vos propres types pour les autres activités du domaine."
        >
          <div className="space-y-6">
            <SettingsInfoBox>
              <p>
                Utilisés à la création d&apos;un prospect. Supprimer un type
                personnalisé ne supprime pas les dossiers existants qui
                l&apos;utilisent.
              </p>
            </SettingsInfoBox>
            <EventTypesSettings customTypes={workspace.types_evenement_custom} />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

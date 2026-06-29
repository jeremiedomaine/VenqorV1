import { BillingSettingsForm } from "@/components/parametres/billing-settings-form";
import { DomainContactSettingsForm } from "@/components/parametres/domain-contact-settings-form";
import { ContratDomainStatus } from "@/components/parametres/contrat-domain-status";
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
import { NEUTRAL_COPY } from "@/lib/event-copy";
import { billingFromWorkspace } from "@/lib/billing";
import { getContratReadiness } from "@/lib/contrat-status";
import { encaissementsFromWorkspace } from "@/lib/payment-utils";
import { getAuthContext } from "@/lib/auth-context";
import { loadWorkspace } from "@/lib/load-workspace";
import {
  computeWorkspaceSetupStatus,
  goalsFromWorkspace,
} from "@/lib/workspace-setup";

export const maxDuration = 60;

export default async function ParametresPage() {
  const [{ workspace }, auth] = await Promise.all([
    loadWorkspace(),
    getAuthContext(),
  ]);

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
  const contratStatus = getContratReadiness(workspace);
  const showContratSetup = auth?.isVenqorAdmin ?? false;

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
          id="domaine"
          title="Contact du domaine"
          description="Email et coordonnées affichées sur le portail client et utilisées pour vos notifications."
        >
          <div className="space-y-6">
            <SettingsInfoBox title="Bon à savoir">
              <p>
                Cet email reçoit les alertes quand un client déclare un virement
                et sert d&apos;adresse de réponse sur les emails automatiques.
              </p>
            </SettingsInfoBox>
            <DomainContactSettingsForm
              contactEmail={workspace.contact_email}
              contactNom={workspace.contact_nom}
              contactTelephone={workspace.contact_telephone}
            />
          </div>
        </SettingsSection>

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
          description="Règles appliquées à la génération automatique des échéanciers (acompte et solde). Enregistrez pour activer la facturation sur vos nouveaux dossiers."
        >
          <div className="space-y-6">
            {!workspace.facturation_configuree && (
              <SettingsInfoBox title="Configuration requise">
                <p>
                  Tant que la facturation n&apos;est pas enregistrée, les
                  échéanciers (acompte et solde) ne sont pas générés à la
                  création d&apos;un dossier — même si vous saisissez un prix
                  total.
                </p>
              </SettingsInfoBox>
            )}
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
          description={NEUTRAL_COPY.settingsPortalPage}
        >
          <div className="space-y-6">
            <SettingsInfoBox title="Bon à savoir">
              <p>{NEUTRAL_COPY.settingsPortalDeclare}</p>
            </SettingsInfoBox>
            <EncaissementsSettingsForm encaissements={encaissements} />
          </div>
        </SettingsSection>

        <SettingsSection
          id="contrat"
          title="Contrat de réservation"
          description={
            showContratSetup
              ? "Configuration interne Venqor — modèle et signatures pour ce domaine."
              : NEUTRAL_COPY.settingsContractDescription
          }
        >
          <div className="space-y-6">
            {!showContratSetup && (
              <>
                <SettingsInfoBox title="Bon à savoir">
                  <p>
                    Votre contrat type est préparé avec l&apos;équipe Venqor.{" "}
                    {NEUTRAL_COPY.settingsContractIntro}
                  </p>
                </SettingsInfoBox>
                <ContratDomainStatus status={contratStatus} />
              </>
            )}
            {showContratSetup && (
              <ContratTemplateForm
                hasCustomTemplate={Boolean(workspace.contrat_template_path)}
                hasDocxTemplate={Boolean(workspace.contrat_template_docx_path)}
                templateMode={workspace.contrat_template_mode}
                filename={workspace.contrat_template_filename}
                docxFilename={workspace.contrat_template_docx_filename}
              />
            )}
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
                Utilisés à la création d&apos;une demande. Supprimer un type
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

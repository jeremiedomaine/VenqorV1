import { CoupleHero } from "@/components/portal/couple-hero";
import { EspaceMariesSections } from "@/components/portal/espace-maries-sections";
import { EventDetails } from "@/components/portal/event-details";
import { PaymentProgress } from "@/components/portal/payment-progress";
import { PaymentSchedule } from "@/components/portal/payment-schedule";
import {
  PortalStripePlaceholder,
  PortalVirementSection,
} from "@/components/portal/portal-payments";
import { PortalLogo } from "@/components/portal/portal-logo";
import { WelcomeMessage } from "@/components/portal/welcome-message";
import type { PortalData } from "@/lib/types";

export function PortalView({
  data,
  portalToken,
}: {
  data: PortalData;
  portalToken: string;
}) {
  const { workspace, event, payments } = data;
  const paid = payments
    .filter((p) => p.statut === "paye")
    .reduce((s, p) => s + Number(p.montant), 0);
  const total = payments.reduce((s, p) => s + Number(p.montant), 0);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(0,0,0,0.03) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-6 py-14 md:px-10 md:py-20 lg:max-w-3xl lg:py-24">
        <PortalLogo
          nomDomaine={workspace.nom_domaine}
          logoUrl={workspace.logo_url}
          className="mb-16 md:mb-20"
        />

        <CoupleHero
          nomDesMaries={event.nom_des_maries}
          dateDebut={event.date_debut}
        />

        <div className="mt-16 space-y-8 md:mt-20 md:space-y-10">
          <WelcomeMessage message={event.message_accueil ?? ""} />

          <EventDetails event={event} />

          {payments.length > 0 && (
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:p-10">
              <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
                Échéancier des paiements
              </p>

              <PaymentProgress paid={paid} total={total} />

              <div className="my-10 h-px bg-zinc-100" />

              <PaymentSchedule payments={payments} />
            </section>
          )}

          <PortalVirementSection
            portalToken={portalToken}
            workspace={workspace}
            payments={payments}
          />

          <PortalStripePlaceholder payments={payments} />

          <EspaceMariesSections workspace={workspace} />
        </div>

        <footer className="mt-20 border-t border-zinc-100 pt-10 text-center md:mt-28">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-300">
            Espace mariés privé
          </p>
          <p className="mt-1 text-[11px] text-zinc-300">
            {workspace.nom_domaine}
          </p>
        </footer>
      </div>
    </div>
  );
}

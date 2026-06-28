import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateEvent } from "@/actions/events";
import { ArchiveEventButton } from "@/components/events/archive-event-button";
import { BlockDateButton } from "@/components/events/block-date-button";
import { CloseDossierButton } from "@/components/events/close-dossier-button";
import { ConfirmDepositButton } from "@/components/events/confirm-deposit-button";
import { EventForm } from "@/components/events/event-form";
import { EventPipelineStepper } from "@/components/events/event-pipeline-stepper";
import { EventPortalLink } from "@/components/events/event-portal-link";
import { SendPaymentRequestButton } from "@/components/events/send-payment-request-button";
import { SendContractButton } from "@/components/events/send-contract-button";
import { SendDepositRequestButton } from "@/components/events/send-deposit-request-button";
import { PaymentsSection } from "@/components/events/payments-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { billingFromWorkspace } from "@/lib/billing";
import {
  isWithinSoldeWindow,
  paymentMatchesLabel,
  pickAcomptePayment,
  pickSoldePayment,
  soldeWindowDaysFromWorkspace,
} from "@/lib/payment-schedule";
import { createClient } from "@/lib/supabase/server";
import { getEventTypeLabel } from "@/lib/event-types";
import { loadWorkspace } from "@/lib/load-workspace";
import {
  EVENT_STATUS_LABELS,
  type Event,
  type Payment,
} from "@/lib/types";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: event }, { workspace }] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).single(),
    loadWorkspace(),
  ]);

  const customEventTypes = workspace?.types_evenement_custom ?? [];

  if (!event) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("event_id", params.id)
    .order("date_echeance", { ascending: true, nullsFirst: false });

  const isArchived = Boolean(event.archived_at);
  const isClosed = Boolean(event.cloture_at);
  const isProspect = event.statut === "prospect" && !isArchived && !isClosed;
  const typedEvent = event as Event;
  const paymentList = (payments ?? []) as Payment[];
  const isOption = event.statut === "option" && !isArchived && !isClosed;
  const isConfirme = event.statut === "confirme" && !isArchived && !isClosed;
  const showPortalLink = (isOption || isConfirme) && paymentList.length > 0;
  const billing = workspace ? billingFromWorkspace(workspace) : null;
  const soldeWindowDays = workspace
    ? soldeWindowDaysFromWorkspace(workspace)
    : 30;

  const depositPayment = billing
    ? pickAcomptePayment(
        paymentList,
        billing.facturation_acompte_label,
        billing.facturation_solde_label,
      )
    : paymentList.length > 0
      ? [...paymentList].sort((a, b) => {
          if (!a.date_echeance) return 1;
          if (!b.date_echeance) return -1;
          return a.date_echeance.localeCompare(b.date_echeance);
        })[0]
      : null;
  const soldePayment = billing
    ? pickSoldePayment(
        paymentList,
        billing.facturation_solde_label,
        billing.facturation_acompte_label,
      )
    : pickSoldePayment(paymentList);
  const depositPaid =
    Number(event.prix_total) <= 0 ||
    paymentList.some(
      (p) =>
        p.statut === "paye" &&
        (!billing ||
          paymentMatchesLabel(p.label, billing.facturation_acompte_label)),
    );
  const hasDepositReady =
    depositPaid || (isOption && paymentList.length > 0);
  const withinSoldeWindow = isWithinSoldeWindow(
    event.date_debut,
    soldeWindowDays,
  );
  const showPaymentEmail =
    (isOption || isConfirme) &&
    Boolean(soldePayment) &&
    withinSoldeWindow &&
    !isArchived &&
    !isClosed;

  const acompteTiming = workspace?.acompte_signature_timing ?? "after_contract";
  const showDepositEmail =
    isOption &&
    Boolean(depositPayment) &&
    depositPayment?.statut === "en_attente" &&
    !isArchived &&
    !isClosed;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au pipeline
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {typedEvent.nom_evenement || event.nom_des_maries}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {getEventTypeLabel(
              typedEvent.type_evenement ?? "mariage",
              customEventTypes,
            )}{" "}
            · {EVENT_STATUS_LABELS[event.statut as keyof typeof EVENT_STATUS_LABELS]}
            {isClosed && " · Clôturé"}
            {isArchived && " · Archivé"}
            {event.adresse_postale
              ? ` · ${event.adresse_postale.split("\n")[0]}`
              : ""}
          </p>
        </div>

        <div className="lg:shrink-0">
          <EventPipelineStepper
            event={typedEvent}
            hasDepositPayment={hasDepositReady}
          />
        </div>
      </div>

      {isProspect && (
        <BlockDateButton eventId={event.id} dateDebut={event.date_debut} />
      )}

      {isOption && (
        <ConfirmDepositButton
          eventId={event.id}
          prixTotal={Number(event.prix_total)}
          depositPayment={depositPayment ?? null}
        />
      )}

      {isConfirme && (
        <CloseDossierButton
          eventId={event.id}
          prixTotal={Number(event.prix_total)}
          balancePayment={soldePayment ?? null}
          hasPaymentSchedule={paymentList.length > 0}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm
                event={typedEvent}
                updateEvent={updateEvent}
                customEventTypes={customEventTypes}
                readOnly={isArchived}
              />
            </CardContent>
          </Card>

          <EventPortalLink
            portalToken={typedEvent.portal_token}
            show={showPortalLink}
          />

          {isOption && (
            <SendContractButton
              eventId={event.id}
              coupleEmail={typedEvent.email}
              contratStatut={typedEvent.contrat_statut ?? "non_envoye"}
              contratEnvoyeAt={typedEvent.contrat_envoye_at ?? null}
              contratSigneAt={typedEvent.contrat_signe_at ?? null}
              contratSignaturesDone={typedEvent.contrat_signatures_done ?? 0}
              contratSignaturesTotal={typedEvent.contrat_signatures_total ?? 2}
              hasCustomTemplate={Boolean(workspace?.contrat_template_path)}
            />
          )}

          {showDepositEmail && (
            <SendDepositRequestButton
              eventId={event.id}
              coupleEmail={typedEvent.email}
              hasPendingDeposit
              paymentId={depositPayment?.id}
              timing={acompteTiming}
              contractSigned={typedEvent.contrat_statut === "signe"}
              sentAt={depositPayment?.payment_request_sent_at ?? null}
            />
          )}

          <SendPaymentRequestButton
            eventId={event.id}
            coupleEmail={typedEvent.email}
            hasPendingPayment={showPaymentEmail}
            paymentId={soldePayment?.id}
            soldeWindowDays={soldeWindowDays}
            sentAt={soldePayment?.payment_request_sent_at ?? null}
          />
        </div>

        <PaymentsSection
          eventId={event.id}
          payments={paymentList}
          prixTotal={Number(event.prix_total)}
          readOnly={isArchived || isClosed}
        />
      </div>

      {!isClosed && (
        <ArchiveEventButton eventId={event.id} archived={isArchived} />
      )}
    </div>
  );
}

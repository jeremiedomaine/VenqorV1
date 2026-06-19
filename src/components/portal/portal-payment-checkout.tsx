"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Lock, ShieldCheck } from "lucide-react";
import { declarePortalPayment } from "@/actions/portal-payments";
import { Button } from "@/components/ui/button";
import { capitalizeFirst, formatDateShort } from "@/lib/portal-utils";
import { hasVirementConfig } from "@/lib/payment-utils";
import type { PortalData, PaymentStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type PortalPayment = PortalData["payments"][number];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <p className="mt-1 break-all font-mono text-sm text-zinc-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-800"
        aria-label={`Copier ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function DeclareButton({
  portalToken,
  paymentId,
}: {
  portalToken: string;
  paymentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-zinc-900 text-base font-medium hover:bg-zinc-800"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await declarePortalPayment(portalToken, paymentId);
            if (result.ok) router.refresh();
            else setError(result.error ?? "Une erreur est survenue.");
          })
        }
      >
        {pending ? "Envoi en cours…" : "J'ai effectué le virement"}
      </Button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StatusBanner({ status }: { status: PaymentStatus }) {
  if (status === "paye") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Cette échéance est déjà réglée.</p>
      </div>
    );
  }
  if (status === "declare_paye") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-800">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <p className="text-sm">
          <span className="font-medium">Paiement déclaré</span> — le domaine
          vérifie la réception sur son compte.
        </p>
      </div>
    );
  }
  return null;
}

export function PortalPaymentCheckout({
  data,
  portalToken,
  payment,
}: {
  data: PortalData;
  portalToken: string;
  payment: PortalPayment;
}) {
  const { workspace, event } = data;
  const bankReady = hasVirementConfig(workspace);
  const isStripe = payment.mode_paiement === "stripe";
  const canDeclare =
    payment.statut === "en_attente" && !isStripe && bankReady;

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.08), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10 sm:px-6">
        <header className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-500">
            Paiement sécurisé
          </p>
          <h1 className="mt-3 font-portal text-2xl font-medium text-zinc-900">
            {workspace.nom_domaine}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{event.nom_des_maries}</p>
        </header>

        <main className="flex-1">
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {payment.label}
              </p>
              <p className="mt-2 font-portal text-4xl font-light tabular-nums text-zinc-900">
                {formatCurrency(Number(payment.montant))}
              </p>
              {payment.date_echeance && (
                <p className="mt-2 text-sm text-zinc-500">
                  Échéance ·{" "}
                  {capitalizeFirst(formatDateShort(payment.date_echeance) ?? "")}
                </p>
              )}
            </div>

            <div className="space-y-5 px-6 py-6">
              <StatusBanner status={payment.statut} />

              {isStripe && payment.statut === "en_attente" && (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                  Le paiement par carte sera disponible prochainement. Contactez{" "}
                  {workspace.contact_nom || workspace.nom_domaine}.
                </p>
              )}

              {!isStripe && payment.statut === "en_attente" && (
                <>
                  {!bankReady ? (
                    <p className="text-sm text-zinc-500">
                      Les coordonnées bancaires vous seront communiquées par le
                      domaine.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-zinc-700">
                        Coordonnées pour votre virement
                      </p>
                      <CopyField
                        label="Titulaire"
                        value={workspace.titulaire_compte!}
                      />
                      <CopyField label="IBAN" value={workspace.iban!} />
                      {workspace.bic && (
                        <CopyField label="BIC" value={workspace.bic} />
                      )}
                      {payment.reference_virement && (
                        <CopyField
                          label="Référence à indiquer"
                          value={payment.reference_virement}
                        />
                      )}
                      {workspace.instructions_virement && (
                        <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                          {workspace.instructions_virement}
                        </p>
                      )}
                    </div>
                  )}

                  {canDeclare && (
                    <div className="pt-2">
                      <DeclareButton
                        portalToken={portalToken}
                        paymentId={payment.id}
                      />
                      <p className="mt-3 text-center text-xs text-zinc-400">
                        Cliquez après avoir envoyé le virement depuis votre banque
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Propulsé par Venqor · Paiement géré par le domaine</span>
          </div>
        </main>

        <footer className="mt-10 text-center">
          <Link
            href={`/portail/${portalToken}`}
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
          >
            Voir mon espace complet
          </Link>
        </footer>
      </div>
    </div>
  );
}

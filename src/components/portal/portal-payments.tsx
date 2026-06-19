"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { declarePortalPayment } from "@/actions/portal-payments";
import { Button } from "@/components/ui/button";
import { hasVirementConfig } from "@/lib/payment-utils";
import type { PortalData } from "@/lib/types";
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
    <div className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <p className="mt-1 break-all font-mono text-sm text-zinc-800">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-700"
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

function DeclarePaymentButton({
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
        className="w-full sm:w-auto"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await declarePortalPayment(portalToken, paymentId);
            if (result.ok) {
              router.refresh();
            } else {
              setError(result.error ?? "Une erreur est survenue.");
            }
          })
        }
      >
        {pending ? "Envoi…" : "J'ai effectué le virement"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function PortalVirementSection({
  portalToken,
  workspace,
  payments,
}: {
  portalToken: string;
  workspace: PortalData["workspace"];
  payments: PortalPayment[];
}) {
  const virementPayments = payments.filter(
    (p) => p.mode_paiement === "virement" && p.statut !== "paye",
  );

  if (virementPayments.length === 0) return null;

  const bankReady = hasVirementConfig(workspace);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm md:p-10">
      <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
        Paiement par virement
      </p>

      {!bankReady ? (
        <p className="text-sm text-zinc-500">
          Les coordonnées bancaires seront communiquées par le domaine.
        </p>
      ) : (
        <div className="mb-8 space-y-3">
          <CopyField label="Titulaire" value={workspace.titulaire_compte!} />
          <CopyField label="IBAN" value={workspace.iban!} />
          {workspace.bic && <CopyField label="BIC" value={workspace.bic} />}
          {workspace.instructions_virement && (
            <p className="rounded-lg border border-zinc-100 px-4 py-3 text-sm text-zinc-600">
              {workspace.instructions_virement}
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {virementPayments.map((payment) => (
          <div
            key={payment.id}
            className="rounded-xl border border-zinc-100 p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-zinc-900">{payment.label}</p>
                <p className="mt-1 font-portal text-xl text-zinc-800">
                  {formatCurrency(Number(payment.montant))}
                </p>
                {payment.reference_virement && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Référence à indiquer :{" "}
                    <span className="font-mono text-zinc-700">
                      {payment.reference_virement}
                    </span>
                  </p>
                )}
              </div>
              <span
                className={`self-start rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${
                  payment.statut === "declare_paye"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {payment.statut === "declare_paye"
                  ? "En vérification"
                  : "À régler"}
              </span>
            </div>

            {payment.statut === "en_attente" && bankReady && (
              <div className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
                <DeclarePaymentButton
                  portalToken={portalToken}
                  paymentId={payment.id}
                />
                <p className="text-center">
                  <Link
                    href={`/portail/${portalToken}/paiement?e=${payment.id}`}
                    className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
                  >
                    Ouvrir la page de paiement
                  </Link>
                </p>
              </div>
            )}

            {payment.statut === "declare_paye" && (
              <p className="mt-4 text-sm text-sky-700">
                Paiement déclaré — le domaine va vérifier la réception.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PortalStripePlaceholder({
  payments,
}: {
  payments: PortalPayment[];
}) {
  const stripePending = payments.some(
    (p) => p.mode_paiement === "stripe" && p.statut === "en_attente",
  );

  if (!stripePending) return null;

  return (
    <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 md:p-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
        Paiement en ligne
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Le paiement par carte bancaire sera disponible prochainement. En
        attendant, contactez le domaine pour les modalités de règlement.
      </p>
    </section>
  );
}

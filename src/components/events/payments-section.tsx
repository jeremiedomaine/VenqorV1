"use client";

import { regenerateEventPayments } from "@/actions/events";
import {
  confirmDeclaredPayment,
  createPayment,
  deletePayment,
  markPaymentPaid,
  rejectDeclaredPayment,
  updatePaymentStatus,
} from "@/actions/payments";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncActionByKey } from "@/hooks/use-async-action";
import { NEUTRAL_COPY } from "@/lib/event-copy";
import type { ActionResult } from "@/lib/action-result";
import type { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaymentsSection({
  eventId,
  payments,
  prixTotal,
  readOnly = false,
}: {
  eventId: string;
  payments: Payment[];
  prixTotal: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { isPending, run } = useAsyncActionByKey();
  const [error, setError] = useState<string | null>(null);

  const total = payments.reduce((sum, p) => sum + Number(p.montant), 0);
  const paid = payments
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + Number(p.montant), 0);

  async function runPaymentAction(action: () => Promise<ActionResult | void>) {
    const result = await action();
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Échéancier des paiements</CardTitle>
        <p className="text-sm text-slate-500">
          {formatCurrency(paid)} payé sur {formatCurrency(total)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {readOnly && (
          <p className="text-sm text-slate-500">
            Échéancier en lecture seule — dossier archivé ou clôturé.
          </p>
        )}

        {prixTotal > 0 && !readOnly && (
          <div className="flex flex-col gap-2 rounded-md border border-indigo-100 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Appliquer les règles de facturation du domaine ({formatCurrency(prixTotal)})
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending("regenerate")}
              onClick={() =>
                void run("regenerate", () =>
                  runPaymentAction(() => regenerateEventPayments(eventId)),
                )
              }
            >
              {isPending("regenerate")
                ? "Génération…"
                : payments.length > 0
                  ? "Recalculer l'échéancier"
                  : "Générer l'échéancier"}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun acompte défini.</p>
          ) : (
            payments.map((payment) => {
              const key = payment.id;
              const pending = isPending(key);

              return (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{payment.label}</p>
                    <p className="text-sm text-slate-600">
                      {formatCurrency(Number(payment.montant))}
                      {payment.date_echeance && (
                        <span className="text-slate-400">
                          {" "}
                          · échéance {formatDate(payment.date_echeance)}
                        </span>
                      )}
                    </p>
                    {payment.reference_virement && (
                      <p className="mt-1 text-xs text-slate-500">
                        Réf. virement : {payment.reference_virement}
                      </p>
                    )}
                    {payment.statut === "declare_paye" && payment.declared_at && (
                      <p className="mt-1 text-xs text-sky-700">
                        {NEUTRAL_COPY.paymentDeclaredBy}{" "}
                        {formatDate(payment.declared_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={payment.statut} />
                    {!readOnly && (
                      <>
                        {payment.statut === "declare_paye" && (
                          <>
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() =>
                                void run(key, () =>
                                  runPaymentAction(() =>
                                    confirmDeclaredPayment(payment.id, eventId),
                                  ),
                                )
                              }
                            >
                              {pending ? "…" : "Confirmer"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() =>
                                void run(key, () =>
                                  runPaymentAction(() =>
                                    rejectDeclaredPayment(payment.id, eventId),
                                  ),
                                )
                              }
                            >
                              {pending ? "…" : "Non reçu"}
                            </Button>
                          </>
                        )}
                        {payment.statut === "en_attente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() =>
                              void run(key, () =>
                                runPaymentAction(() =>
                                  markPaymentPaid(payment.id, eventId),
                                ),
                              )
                            }
                          >
                            {pending ? "…" : "Marquer payé"}
                          </Button>
                        )}
                        {payment.statut === "paye" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              void run(key, () =>
                                runPaymentAction(() =>
                                  updatePaymentStatus(
                                    payment.id,
                                    eventId,
                                    "en_attente",
                                  ),
                                ),
                              )
                            }
                          >
                            {pending ? "…" : "Annuler"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          disabled={pending}
                          onClick={() =>
                            void run(key, () =>
                              runPaymentAction(() =>
                                deletePayment(payment.id, eventId),
                              ),
                            )
                          }
                        >
                          {pending ? "…" : "Supprimer"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!readOnly && (
        <form
          action={(fd) =>
            void run("add", () =>
              runPaymentAction(() => createPayment(fd)),
            )
          }
          className="space-y-3 border-t border-slate-200 pt-6"
        >
          <input type="hidden" name="event_id" value={eventId} />
          <p className="text-sm font-medium text-slate-700">Ajouter un acompte</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="label">Libellé</Label>
              <Input
                id="label"
                name="label"
                placeholder="Acompte 1"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="montant">Montant (€)</Label>
              <Input
                id="montant"
                name="montant"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date_echeance">Échéance</Label>
              <Input id="date_echeance" name="date_echeance" type="date" />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending("add")}>
            {isPending("add") ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}

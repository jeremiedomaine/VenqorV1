"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  confirmDeclaredPayment,
  rejectDeclaredPayment,
} from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { useAsyncActionByKey } from "@/hooks/use-async-action";
import { NEUTRAL_COPY } from "@/lib/event-copy";
import type { PendingPaymentNotification } from "@/lib/load-pending-payment-notifications";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PaymentNotificationsBoard({
  notifications,
}: {
  notifications: PendingPaymentNotification[];
}) {
  const router = useRouter();
  const { isPending, run } = useAsyncActionByKey();
  const [error, setError] = useState<string | null>(null);

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">
          Aucun paiement à confirmer
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {NEUTRAL_COPY.paymentNotificationHint}
        </p>
      </div>
    );
  }

  async function runAction(
    key: string,
    action: () => Promise<{ error?: string }>,
  ) {
    const result = await run(key, action);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {notifications.map((item) => {
        const pending = isPending(item.id);

        return (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-sky-100 bg-sky-50/40 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">
                {item.event.nom_evenement || item.event.nom_des_maries}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {item.label} · {formatCurrency(item.montant)}
              </p>
              {item.declared_at && (
                <p className="mt-1 text-xs text-sky-700">
                  Déclaré le {formatDate(item.declared_at)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/evenements/${item.event_id}`}>Voir le dossier</Link>
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  void runAction(item.id, () =>
                    confirmDeclaredPayment(item.id, item.event_id),
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
                  void runAction(item.id, () =>
                    rejectDeclaredPayment(item.id, item.event_id),
                  )
                }
              >
                {pending ? "…" : "Non reçu"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

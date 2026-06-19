"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { blockEventDate } from "@/actions/events";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function BlockDateButton({
  eventId,
  dateDebut,
}: {
  eventId: string;
  dateDebut: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await blockEventDate(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Date bloquée — en attente de l'acompte.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
      <FormFeedback
        error={error}
        success={success}
        onDismiss={() => {
          setError(null);
          setSuccess(null);
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Bloquer la date</p>
          <p className="mt-1 text-sm text-slate-600">
            {dateDebut
              ? `Bloquer la date du ${formatDate(dateDebut)} en attendant l'acompte.`
              : "Indiquez une date sur la fiche, puis bloquez-la pour réserver le créneau."}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleClick}
          disabled={pending || !dateDebut}
          className="shrink-0 gap-2"
        >
          <CalendarCheck className="h-4 w-4" />
          {pending ? "En cours…" : "Bloquer la date"}
        </Button>
      </div>
    </div>
  );
}

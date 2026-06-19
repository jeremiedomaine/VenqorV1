"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { archiveEvent, restoreEvent } from "@/actions/events";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";

export function ArchiveEventButton({
  eventId,
  archived,
}: {
  eventId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  function handleArchive() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await archiveEvent(eventId);
      if (result.error) {
        setError(result.error);
        setConfirmArchive(false);
        return;
      }
      setSuccess("Dossier archivé — il n'apparaît plus dans le pipeline.");
      setConfirmArchive(false);
      router.refresh();
    });
  }

  function handleRestore() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await restoreEvent(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Dossier restauré dans le pipeline.");
      router.refresh();
    });
  }

  if (archived) {
    return (
      <div className="space-y-3">
        <FormFeedback error={error} success={success} onDismiss={() => { setError(null); setSuccess(null); }} />
        <Button
          type="button"
          variant="outline"
          onClick={handleRestore}
          disabled={pending}
          className="gap-2"
        >
          <ArchiveRestore className="h-4 w-4" />
          {pending ? "Restauration…" : "Restaurer le dossier"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <FormFeedback error={error} success={success} onDismiss={() => { setError(null); setSuccess(null); }} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Archiver le dossier</p>
          <p className="mt-1 text-sm text-slate-600">
            Pour un prospect perdu ou une demande abandonnée. Le créneau redevient
            disponible au calendrier.
          </p>
        </div>
        {!confirmArchive ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmArchive(true)}
            className="shrink-0 gap-2 border-slate-300 text-slate-700"
          >
            <Archive className="h-4 w-4" />
            Archiver
          </Button>
        ) : (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmArchive(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={pending}
              className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
            >
              {pending ? "Archivage…" : "Confirmer l'archivage"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

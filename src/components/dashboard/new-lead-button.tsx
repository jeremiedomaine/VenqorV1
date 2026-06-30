"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createEvent } from "@/actions/events";
import { EventFormFields } from "@/components/events/event-form-fields";
import { Button } from "@/components/ui/button";

import type { CustomEventType } from "@/lib/types";
import type { WorkspaceBilling } from "@/lib/billing";

export function NewLeadButton({
  customEventTypes = [],
  blockedDates = [],
  defaultOpen = false,
  billing = null,
  facturationConfiguree = false,
}: {
  customEventTypes?: CustomEventType[];
  blockedDates?: string[];
  defaultOpen?: boolean;
  billing?: WorkspaceBilling | null;
  facturationConfiguree?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blockedDateSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nouveau dossier
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-[8vh]">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative my-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Nouvel événement
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Les détails complets restent modifiables sur la fiche
                  événement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              ref={formRef}
              action={async (formData) => {
                if (pending) return;
                setPending(true);
                setError(null);
                const result = await createEvent(formData);
                if (result.error) {
                  setError(result.error);
                  setPending(false);
                  return;
                }
                if (result.eventId) {
                  setOpen(false);
                  router.push(`/evenements/${result.eventId}`);
                  return;
                }
                formRef.current?.reset();
                setOpen(false);
                setPending(false);
                router.refresh();
              }}
              className="space-y-6"
            >
              <EventFormFields
                mode="create"
                customEventTypes={customEventTypes}
                blockedDates={blockedDateSet}
                billing={billing}
                facturationConfiguree={facturationConfiguree}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="gap-2" disabled={pending}>
                  <Plus className="h-4 w-4" />
                  {pending ? "Création…" : "Ajouter un dossier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { EventFormFields } from "@/components/events/event-form-fields";
import type { CustomEventType, Event } from "@/lib/types";

export function EventForm({
  event,
  updateEvent,
  customEventTypes = [],
  readOnly = false,
}: {
  event: Event;
  updateEvent: (
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  customEventTypes?: CustomEventType[];
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateEvent(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Modifications enregistrées.");
    });
  }

  if (readOnly) {
    return (
      <p className="text-sm text-slate-500">
        Ce dossier est archivé. Restaurez-le pour modifier les informations.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="event_id" value={event.id} />
      <FormFeedback
        error={error}
        success={success}
        onDismiss={() => {
          setError(null);
          setSuccess(null);
        }}
      />
      <EventFormFields
        event={event}
        mode="edit"
        customEventTypes={customEventTypes}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

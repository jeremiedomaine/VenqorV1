"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceGoals } from "@/actions/workspace";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { WorkspaceGoals } from "@/lib/workspace-setup";

export function GoalsSettingsForm({ goals }: { goals: WorkspaceGoals }) {
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [dossiers, setDossiers] = useState(
    goals.objectif_dossiers_annuel?.toString() ?? "",
  );
  const [ca, setCa] = useState(
    goals.objectif_ca_annuel
      ? String(Math.round(goals.objectif_ca_annuel))
      : "",
  );
  const [feedback, setFeedback] = useState<{
    error?: string;
    success?: string;
  }>({});

  function handleSubmit(formData: FormData) {
    setFeedback({});
    void run(async () => {
      const result = await updateWorkspaceGoals(formData);
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      setFeedback({ success: "Objectifs enregistrés." });
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <FormFeedback
        error={feedback.error}
        success={feedback.success}
        onDismiss={() => setFeedback({})}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="objectif_dossiers_annuel">
            Objectif de dossiers par an
          </Label>
          <Input
            id="objectif_dossiers_annuel"
            name="objectif_dossiers_annuel"
            type="number"
            min={1}
            step={1}
            placeholder="Ex. 25"
            value={dossiers}
            onChange={(e) => setDossiers(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Confirmés + clôturés sur l&apos;année — affiché dans le Pilotage.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectif_ca_annuel">Objectif CA annuel (€)</Label>
          <Input
            id="objectif_ca_annuel"
            name="objectif_ca_annuel"
            type="number"
            min={1}
            step={1}
            placeholder="Ex. 400000"
            value={ca}
            onChange={(e) => setCa(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Optionnel — suivi du chiffre d&apos;affaires réalisé vs objectif.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les objectifs"}
        </Button>
        {(dossiers || ca) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600"
            disabled={pending}
            onClick={() => {
              setDossiers("");
              setCa("");
              const fd = new FormData();
              fd.set("objectif_dossiers_annuel", "");
              fd.set("objectif_ca_annuel", "");
              handleSubmit(fd);
            }}
          >
            Effacer les objectifs
          </Button>
        )}
      </div>
    </form>
  );
}

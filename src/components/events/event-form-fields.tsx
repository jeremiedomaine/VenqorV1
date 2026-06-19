"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDateBlocked } from "@/lib/calendar-events";
import {
  isMariageType,
  listEventTypeOptions,
} from "@/lib/event-types";
import {
  type CustomEventType,
  type Event,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventFormFields({
  event,
  mode,
  customEventTypes = [],
  blockedDates,
}: {
  event?: Partial<Event>;
  mode: "create" | "edit";
  customEventTypes?: CustomEventType[];
  blockedDates?: Set<string>;
}) {
  const typeOptions = useMemo(
    () => listEventTypeOptions(customEventTypes),
    [customEventTypes],
  );

  const [type, setType] = useState(
    event?.type_evenement ?? typeOptions[0]?.slug ?? "mariage",
  );
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  const personLabels = useMemo(() => {
    if (isMariageType(type)) {
      return { p1: "Marié(e) 1", p2: "Marié(e) 2" };
    }
    return { p1: "Contact 1", p2: "Contact 2" };
  }, [type]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Type d&apos;événement</Label>
          <Link
            href="/parametres#types-evenement"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un type
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <label
              key={option.slug}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                type === option.slug
                  ? "border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              <input
                type="radio"
                name="type_evenement"
                value={option.slug}
                checked={type === option.slug}
                onChange={() => setType(option.slug)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nom_evenement">Nom de l&apos;événement</Label>
        <Input
          id="nom_evenement"
          name="nom_evenement"
          defaultValue={event?.nom_evenement ?? ""}
          placeholder="Ex : Mariage Laura & Mehdi"
        />
        <p className="text-xs text-slate-500">
          Laissé vide : généré automatiquement à partir des contacts.
        </p>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          {type === "mariage" ? "Les mariés" : "Les contacts"}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {personLabels.p1}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="marie1_prenom"
                placeholder="Prénom"
                defaultValue={event?.marie1_prenom ?? ""}
              />
              <Input
                name="marie1_nom"
                placeholder="Nom"
                defaultValue={event?.marie1_nom ?? ""}
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {personLabels.p2}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="marie2_prenom"
                placeholder="Prénom"
                defaultValue={event?.marie2_prenom ?? ""}
              />
              <Input
                name="marie2_nom"
                placeholder="Nom"
                defaultValue={event?.marie2_nom ?? ""}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="adresse_postale">Adresse postale</Label>
        <Textarea
          id="adresse_postale"
          name="adresse_postale"
          rows={2}
          defaultValue={event?.adresse_postale ?? ""}
          placeholder="Numéro, rue, code postal, ville"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium text-slate-800">Coordonnées</p>
          <p className="text-xs text-slate-500">
            Email et téléphone pour contacter le couple.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Adresse mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={event?.email ?? ""}
            placeholder="exemple@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telephone">Numéro de téléphone</Label>
          <Input
            id="telephone"
            name="telephone"
            type="tel"
            defaultValue={event?.telephone ?? ""}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes_internes">Commentaire</Label>
        <Textarea
          id="notes_internes"
          name="notes_internes"
          rows={3}
          defaultValue={event?.notes_internes ?? ""}
          placeholder="Notes internes, demandes particulières…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date_debut">Date</Label>
          <Input
            id="date_debut"
            name="date_debut"
            type="date"
            defaultValue={event?.date_debut ?? ""}
            onChange={(e) => {
              if (!blockedDates || mode !== "create") {
                setDateWarning(null);
                return;
              }
              setDateWarning(
                isDateBlocked(e.target.value, blockedDates)
                  ? "Cette date est déjà bloquée par un dossier en date bloquée ou confirmé."
                  : null,
              );
            }}
          />
          {dateWarning && (
            <p className="text-xs text-amber-700">{dateWarning}</p>
          )}
        </div>
        {mode === "edit" && (
          <div className="space-y-2">
            <Label htmlFor="date_fin">Date de fin</Label>
            <Input
              id="date_fin"
              name="date_fin"
              type="date"
              defaultValue={event?.date_fin ?? ""}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="montant_acompte">Acompte (€)</Label>
          <Input
            id="montant_acompte"
            name="montant_acompte"
            type="number"
            min={0}
            step="0.01"
            placeholder="1500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="montant_solde">Solde (€)</Label>
          <Input
            id="montant_solde"
            name="montant_solde"
            type="number"
            min={0}
            step="0.01"
            placeholder="3500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prix_total">Total (€)</Label>
          <Input
            id="prix_total"
            name="prix_total"
            type="number"
            min={0}
            step="0.01"
            defaultValue={event?.prix_total ?? ""}
            placeholder="5000"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Renseignez acompte + solde ou le total directement. L&apos;échéancier se
        génère selon vos paramètres de facturation.
      </p>

      {mode === "edit" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacite_hebergement_totale">
              Capacité hébergement
            </Label>
            <Input
              id="capacite_hebergement_totale"
              name="capacite_hebergement_totale"
              type="number"
              min={0}
              defaultValue={event?.capacite_hebergement_totale ?? 0}
            />
          </div>
        </div>
      )}

    </div>
  );
}

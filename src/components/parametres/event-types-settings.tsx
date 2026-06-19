"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  addCustomEventType,
  removeCustomEventType,
} from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUILTIN_EVENT_TYPES } from "@/lib/event-types";
import type { CustomEventType } from "@/lib/types";

export function EventTypesSettings({
  customTypes,
}: {
  customTypes: CustomEventType[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-700">Types inclus</p>
        <ul className="mt-2 space-y-2">
          {Object.entries(BUILTIN_EVENT_TYPES).map(([slug, label]) => (
            <li
              key={slug}
              className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            >
              <span>{label}</span>
              <span className="text-xs text-slate-400">Par défaut</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Vos types</p>
        {customTypes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucun type personnalisé. Ajoutez par exemple « Gîte » ou « Séminaire
            ».
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {customTypes.map((type) => (
              <li
                key={type.slug}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-800">
                  {type.label}
                </span>
                <form
                  action={(fd) => {
                    startTransition(async () => {
                      await removeCustomEventType(fd);
                    });
                  }}
                >
                  <input type="hidden" name="slug" value={type.slug} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-500 hover:text-red-600"
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        action={(fd) => {
          startTransition(async () => {
            await addCustomEventType(fd);
          });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="type_label">Nouveau type</Label>
          <Input
            id="type_label"
            name="label"
            placeholder="Ex : Gîte, Séminaire, Baptême…"
            required
          />
        </div>
        <Button type="submit" className="gap-2 shrink-0" disabled={pending}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </form>
    </div>
  );
}

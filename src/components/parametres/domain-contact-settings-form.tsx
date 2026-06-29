"use client";

import { useState } from "react";
import { updateWorkspaceContact } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";

export function DomainContactSettingsForm({
  contactEmail,
  contactNom,
  contactTelephone,
}: {
  contactEmail: string;
  contactNom: string;
  contactTelephone: string;
}) {
  const [email, setEmail] = useState(contactEmail);
  const [nom, setNom] = useState(contactNom);
  const [telephone, setTelephone] = useState(contactTelephone);
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useAsyncAction();

  function handleSubmit(formData: FormData) {
    setError(null);
    void run(async () => {
      const result = await updateWorkspaceContact(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="contact_email" value={email} />
      <input type="hidden" name="contact_nom" value={nom} />
      <input type="hidden" name="contact_telephone" value={telephone} />

      <div className="space-y-2">
        <Label htmlFor="contact_email">Email de contact</Label>
        <Input
          id="contact_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@votredomaine.fr"
          required
        />
        <p className="text-xs text-slate-500">
          Notifications (déclarations de virement, alertes) et adresse de
          réponse sur les emails clients.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_nom">Nom du contact (optionnel)</Label>
          <Input
            id="contact_nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Équipe réception"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_telephone">Téléphone (optionnel)</Label>
          <Input
            id="contact_telephone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le contact"}
      </Button>
    </form>
  );
}

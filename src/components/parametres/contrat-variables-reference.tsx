import { CONTRAT_VARIABLES } from "@/lib/contrat-variables";

export function ContratVariablesReference() {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-slate-900">
          Variables du modèle Word
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Dans votre contrat Word, insérez les clés ci-dessous entre accolades.
          Exemple :{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            {"{noms_maries}"}
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            {"{date_mariage}"}
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            {"{prix_total}"}
          </code>
          . Venqor remplit automatiquement ces champs à partir de la fiche
          dossier à l&apos;envoi.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4 font-medium">Variable</th>
              <th className="py-2 pr-4 font-medium">Signification</th>
              <th className="py-2 font-medium">Exemple</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CONTRAT_VARIABLES.map((variable) => (
              <tr key={variable.key}>
                <td className="py-2 pr-4 font-mono text-xs text-[#4F46E5]">
                  {`{${variable.key}}`}
                </td>
                <td className="py-2 pr-4 text-slate-700">{variable.label}</td>
                <td className="py-2 text-slate-500">{variable.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

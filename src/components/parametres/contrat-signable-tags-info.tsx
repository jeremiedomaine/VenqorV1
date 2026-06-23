import { SIGNABLE_SIGNATURE_TAGS, SIGNABLE_TAGS_DOCX_HINT } from "@/lib/signable/tags";

export function ContratSignableTagsInfo() {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-5">
      <div>
        <p className="text-sm font-medium text-slate-900">Tags Signable (signatures)</p>
        <p className="mt-1 text-sm text-slate-600">
          Incluez ces marqueurs dans le modèle Word — Signable les détecte à
          l&apos;envoi et place les champs de signature automatiquement.
        </p>
      </div>
      <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">
        <p>{SIGNABLE_SIGNATURE_TAGS.signer1}</p>
        <p>{SIGNABLE_SIGNATURE_TAGS.signer2}</p>
      </div>
      <p className="whitespace-pre-line text-xs text-slate-500">
        {SIGNABLE_TAGS_DOCX_HINT.split("\n\n")[1]}
      </p>
    </div>
  );
}

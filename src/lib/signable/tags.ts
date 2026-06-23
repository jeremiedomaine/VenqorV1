/** Tags Signable à inclure dans le modèle Word (option A). */
export const SIGNABLE_SIGNATURE_TAGS = {
  signer1: "{signature:signer1:Signature+Marié+1}",
  signer2: "{signature:signer2:Signature+Marié+2}",
} as const;

export const SIGNABLE_TAGS_DOCX_HINT = `Placez ces tags dans le modèle Word, à l'emplacement des signatures :

${SIGNABLE_SIGNATURE_TAGS.signer1}
${SIGNABLE_SIGNATURE_TAGS.signer2}

Signable les détecte à la conversion PDF et crée les champs de signature automatiquement.`;

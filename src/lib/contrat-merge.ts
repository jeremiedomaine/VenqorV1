import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export class ContratMergeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContratMergeError";
  }
}

export function mergeDocxTemplate(
  docxBytes: Buffer,
  data: Record<string, string>,
): Buffer {
  let zip: PizZip;
  try {
    zip = new PizZip(docxBytes);
  } catch {
    throw new ContratMergeError("Fichier Word invalide.");
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  try {
    doc.render(data);
  } catch (err) {
    const message =
      err instanceof Error && "properties" in err
        ? String((err as { properties?: { explanation?: string } }).properties?.explanation ?? err.message)
        : err instanceof Error
          ? err.message
          : "Erreur lors de la fusion du modèle Word.";
    throw new ContratMergeError(message);
  }

  return Buffer.from(
    doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }),
  );
}

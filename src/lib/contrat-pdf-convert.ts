export class ContratPdfConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContratPdfConvertError";
  }
}

export function isDocxToPdfConfigured(): boolean {
  return Boolean(process.env.GOTENBERG_URL?.trim());
}

/** Convertit un DOCX en PDF via Gotenberg (LibreOffice). */
export async function convertDocxToPdf(docxBytes: Buffer): Promise<Buffer> {
  const baseUrl = process.env.GOTENBERG_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) {
    throw new ContratPdfConvertError(
      "Conversion DOCX→PDF non configurée (GOTENBERG_URL manquant). Uploadez un PDF d'aperçu ou configurez Gotenberg.",
    );
  }

  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(docxBytes)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "contrat.docx",
  );

  const response = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ContratPdfConvertError(
      `Conversion PDF échouée (${response.status})${detail ? ` : ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const pdf = Buffer.from(await response.arrayBuffer());
  if (pdf.length === 0) {
    throw new ContratPdfConvertError("Conversion PDF : fichier vide.");
  }

  return pdf;
}

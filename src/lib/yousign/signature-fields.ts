import { PDFDocument } from "pdf-lib";

export async function pdfPageCount(bytes: Buffer): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export type YousignSignatureField = {
  document_id: string;
  type: "signature";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Zones de signature empilées en bas de la dernière page (PDF sans ancres). */
export function buildSignatureField(
  documentId: string,
  pageCount: number,
  signerIndex: 0 | 1,
): YousignSignatureField {
  const slots: Array<Pick<YousignSignatureField, "x" | "y" | "width" | "height">> =
    [
      { x: 72, y: 200, width: 220, height: 72 },
      { x: 72, y: 100, width: 220, height: 72 },
    ];

  return {
    document_id: documentId,
    type: "signature",
    page: Math.max(1, pageCount),
    ...slots[signerIndex],
  };
}

import { PDFDocument } from "pdf-lib";
import type { ContratSignatureZones } from "@/lib/contrat-signature-zones";
import { zonesToSignatureSlots } from "@/lib/contrat-signature-zones";
import type { SignatureSlot } from "@/lib/yousign/detect-signature-slots";
import { detectSignatureSlots } from "@/lib/yousign/detect-signature-slots";

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

function slotToField(
  documentId: string,
  slot: SignatureSlot,
): YousignSignatureField {
  return {
    document_id: documentId,
    type: "signature",
    page: slot.page,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
  };
}

export async function buildSignatureFields(
  documentId: string,
  pdfBytes: Buffer,
  workspaceZones?: ContratSignatureZones | null,
): Promise<[YousignSignatureField, YousignSignatureField]> {
  const slots = workspaceZones
    ? await zonesToSignatureSlots(workspaceZones, pdfBytes)
    : await detectSignatureSlots(pdfBytes);

  return [slotToField(documentId, slots[0]), slotToField(documentId, slots[1])];
}

/** @deprecated Préférer buildSignatureFields — conservé pour compatibilité tests. */
export function buildSignatureField(
  documentId: string,
  pageCount: number,
  signerIndex: 0 | 1,
): YousignSignatureField {
  const page = Math.max(1, pageCount);
  const slots: Array<Pick<YousignSignatureField, "x" | "y" | "width" | "height">> =
    [
      { x: 72, y: 110, width: 200, height: 60 },
      { x: 320, y: 110, width: 200, height: 60 },
    ];

  return {
    document_id: documentId,
    type: "signature",
    page,
    ...slots[signerIndex],
  };
}

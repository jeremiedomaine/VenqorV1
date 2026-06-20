import {
  activateSignatureRequest,
  addSigner,
  createSignatureRequest,
  uploadSignableDocument,
  YousignError,
} from "@/lib/yousign/client";
import {
  buildSignatureField,
  pdfPageCount,
} from "@/lib/yousign/signature-fields";

export type ContractSigner = {
  firstName: string;
  lastName: string;
  email: string;
};

export type SendContractInput = {
  eventId: string;
  eventLabel: string;
  signers: [ContractSigner, ContractSigner];
  phoneNumber?: string | null;
  pdfBytes: Buffer;
  pdfFilename: string;
};

export type SendContractResult =
  | { ok: true; signatureRequestId: string }
  | { ok: false; error: string };

/** Deux signataires avec la même adresse : alias +signataire2 pour la boîte commune. */
export function distinctSignerEmails(
  sharedEmail: string,
): [string, string] {
  const trimmed = sharedEmail.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return [trimmed, trimmed];
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  return [trimmed, `${local}+signataire2@${domain}`];
}

export function normalizePhoneForYousign(
  raw: string | null | undefined,
): string | undefined {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return undefined;
  if (digits.startsWith("33") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+33${digits.slice(1)}`;
  }
  if (digits.length >= 9) return `+${digits}`;
  return undefined;
}

export async function sendYousignContract(
  input: SendContractInput,
): Promise<SendContractResult> {
  try {
    const signatureRequestId = await createSignatureRequest(
      `Contrat — ${input.eventLabel}`.slice(0, 120),
    );

    const document = await uploadSignableDocument(
      signatureRequestId,
      input.pdfBytes,
      input.pdfFilename,
    );

    const useManualFields = document.totalAnchors < 2;
    const pageCount = useManualFields
      ? await pdfPageCount(input.pdfBytes)
      : 1;

    const phone = normalizePhoneForYousign(input.phoneNumber);

    for (let i = 0; i < input.signers.length; i++) {
      const signer = input.signers[i];
      const fields = useManualFields
        ? [buildSignatureField(document.id, pageCount, i as 0 | 1)]
        : undefined;

      await addSigner(
        signatureRequestId,
        {
          first_name: signer.firstName,
          last_name: signer.lastName,
          email: signer.email,
          phone_number: phone,
          locale: "fr",
        },
        fields,
      );
    }

    await activateSignatureRequest(signatureRequestId);

    return { ok: true, signatureRequestId };
  } catch (err) {
    if (err instanceof YousignError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof Error) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Envoi Yousign impossible" };
  }
}

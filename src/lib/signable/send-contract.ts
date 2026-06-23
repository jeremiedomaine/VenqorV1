import { formatSignerName } from "@/lib/esign/signers";
import {
  sendSignableEnvelope,
  SignableError,
  type SignableParty,
} from "@/lib/signable/client";

export type ContractSigner = {
  firstName: string;
  lastName: string;
  email: string;
};

export type SendContractInput = {
  eventId: string;
  workspaceId: string;
  eventLabel: string;
  signers: [ContractSigner, ContractSigner];
  pdfBytes: Buffer;
  pdfFilename: string;
};

export type SendContractResult =
  | { ok: true; envelopeFingerprint: string }
  | { ok: false; error: string };

function toParty(signer: ContractSigner): SignableParty {
  return {
    party_name: formatSignerName(signer.firstName, signer.lastName),
    party_email: signer.email,
    party_role: "signer",
  };
}

export async function sendSignableContract(
  input: SendContractInput,
): Promise<SendContractResult> {
  try {
    const result = await sendSignableEnvelope({
      title: `Contrat — ${input.eventLabel}`,
      parties: input.signers.map(toParty) as [SignableParty, SignableParty],
      pdfBytes: input.pdfBytes,
      pdfFilename: input.pdfFilename,
      meta: {
        venqor_event_id: input.eventId,
        venqor_workspace_id: input.workspaceId,
      },
    });

    return { ok: true, envelopeFingerprint: result.envelopeFingerprint };
  } catch (err) {
    if (err instanceof SignableError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof Error) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Envoi Signable impossible" };
  }
}

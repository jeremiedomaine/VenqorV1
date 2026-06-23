import { distinctSignerEmails } from "../src/lib/esign/signers";
import { loadDemoContractPdf } from "../src/lib/contrat/contrat-demo-pdf";
import { sendSignableContract } from "../src/lib/signable/send-contract";

async function main() {
  const [email1, email2] = distinctSignerEmails("test@example.com");
  const pdf = loadDemoContractPdf();

  const result = await sendSignableContract({
    eventId: "00000000-0000-0000-0000-000000000001",
    workspaceId: "00000000-0000-0000-0000-000000000002",
    eventLabel: "Test Venqor",
    pdfBytes: pdf,
    pdfFilename: "contrat-test.pdf",
    signers: [
      { firstName: "Marie", lastName: "Test", email: email1 },
      { firstName: "Jean", lastName: "Test", email: email2 },
    ],
  });

  if (!result.ok) {
    console.error("✗", result.error);
    process.exit(1);
  }

  console.log("✓ Enveloppe Signable:", result.envelopeFingerprint);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

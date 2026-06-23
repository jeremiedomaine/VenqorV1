import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { sendYousignContract } from "../src/lib/yousign/send-contract";
import { loadDemoContractPdf } from "../src/lib/contrat/contrat-demo-pdf";

async function main() {
  const result = await sendYousignContract({
    eventId: "test-event",
    eventLabel: "Test Mariage Demo",
    phoneNumber: "+33600000000",
    pdfBytes: loadDemoContractPdf(),
    pdfFilename: "contrat-test.pdf",
    signers: [
      {
        firstName: "Marie",
        lastName: "Dupont",
        email: "jeremie.thomasse@gmail.com",
      },
      {
        firstName: "Jean",
        lastName: "Martin",
        email: "jeremie.thomasse+signataire2@gmail.com",
      },
    ],
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Contrat de reservation — DEMO Venqor", {
    x: 50,
    y: 780,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Document provisoire pour tests Yousign sandbox.", {
    x: 50,
    y: 750,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText("Les maries signent ci-dessous :", {
    x: 50,
    y: 700,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Signataire 1", {
    x: 50,
    y: 660,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("{{s1|signature|200|80}}", {
    x: 50,
    y: 640,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });
  page.drawText("Signataire 2", {
    x: 50,
    y: 560,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("{{s2|signature|200|80}}", {
    x: 50,
    y: 540,
    size: 12,
    font,
    color: rgb(1, 1, 1),
  });

  const pdfBytes = Buffer.from(await doc.save());
  const outDir = resolve(process.cwd(), "assets");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "contrat-demo.pdf"), pdfBytes);

  const bundledPath = resolve(
    process.cwd(),
    "src/lib/yousign/contrat-demo-pdf.ts",
  );
  const base64 = pdfBytes.toString("base64");
  writeFileSync(
    bundledPath,
    `/** Demo contract PDF bundled for Vercel serverless (generated). */
export const CONTRAT_DEMO_PDF_BASE64 = '${base64}';

export function loadDemoContractPdf(): Buffer {
  return Buffer.from(CONTRAT_DEMO_PDF_BASE64, 'base64');
}
`,
  );

  console.log("✓ assets/contrat-demo.pdf");
  console.log("✓ src/lib/yousign/contrat-demo-pdf.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

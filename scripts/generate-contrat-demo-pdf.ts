import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const line = 14;
  let y = 780;

  function drawTitle(text: string) {
    page.drawText(text, {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.08, 0.09, 0.12),
    });
    y -= 28;
  }

  function drawParagraph(text: string, size = 10, bold = false) {
    const f = bold ? fontBold : font;
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: f,
      color: rgb(0.2, 0.22, 0.28),
      maxWidth: 495,
      lineHeight: line,
    });
    y -= Math.ceil(text.length / 80) * line + 10;
  }

  let page = doc.addPage([595, 842]);

  drawTitle("CONTRAT DE RESERVATION — MARIAGE");
  drawParagraph(
    "Modele Venqor — a remplacer par le PDF de votre domaine (Parametres > Contrat).",
    9,
  );
  y -= 8;

  drawParagraph("ENTRE LES SOUSSIGNES", 11, true);
  drawParagraph(
    "Le domaine [NOM DU DOMAINE], ci-apres « le Prestataire », d'une part,",
  );
  drawParagraph(
    "Et les futurs epoux [NOMS DES MARIES], ci-apres « les Clients », d'autre part.",
  );
  y -= 6;

  drawParagraph("ARTICLE 1 — OBJET", 11, true);
  drawParagraph(
    "Le present contrat a pour objet la reservation du domaine pour la celebration d'un mariage a la date convenue entre les parties.",
  );

  drawParagraph("ARTICLE 2 — DATE ET PRESTATIONS", 11, true);
  drawParagraph(
    "Date de l'evenement, horaires, capacite et prestations incluses : voir devis et fiche dossier Venqor.",
  );

  drawParagraph("ARTICLE 3 — TARIF ET MODALITES DE PAIEMENT", 11, true);
  drawParagraph(
    "Le montant total, l'acompte et le solde sont definis dans l'echeancier Venqor. Les reglements s'effectuent selon les modalites communiquees au couple.",
  );

  drawParagraph("ARTICLE 4 — CONDITIONS GENERALES", 11, true);
  drawParagraph(
    "Annulation, report, assurance, reglement interieur et responsabilites : se reporter aux conditions generales du domaine annexees ou communiquees au Client.",
  );

  y -= 10;
  drawParagraph("SIGNATURES DES CLIENTS", 11, true);
  drawParagraph("Les Clients reconnaissent avoir pris connaissance du present contrat.");

  page.drawText("Signature marié(e) 1", {
    x: margin,
    y: 200,
    size: 10,
    font,
    color: rgb(0.35, 0.37, 0.42),
  });
  page.drawText("{signature:signer1:Signature+Marie+1}", {
    x: margin,
    y: 178,
    size: 9,
    font,
    color: rgb(0.35, 0.37, 0.42),
  });

  page.drawText("Signature marié(e) 2", {
    x: margin,
    y: 120,
    size: 10,
    font,
    color: rgb(0.35, 0.37, 0.42),
  });
  page.drawText("{signature:signer2:Signature+Marie+2}", {
    x: margin,
    y: 98,
    size: 9,
    font,
    color: rgb(0.35, 0.37, 0.42),
  });

  const pdfBytes = Buffer.from(await doc.save());
  const outDir = resolve(process.cwd(), "assets");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "contrat-demo.pdf"), pdfBytes);

  const bundledDir = resolve(process.cwd(), "src/lib/contrat");
  mkdirSync(bundledDir, { recursive: true });
  const bundledPath = resolve(bundledDir, "contrat-demo-pdf.ts");
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
  console.log("✓ src/lib/contrat/contrat-demo-pdf.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Génère un contrat Word de démo avec variables Venqor.
 * Usage: npx tsx scripts/generate-sample-contrat-docx.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

async function main() {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("CONTRAT DE RÉSERVATION — MARIAGE")],
          }),
          new Paragraph({
            children: [
              new TextRun("Domaine : "),
              new TextRun({ text: "{nom_domaine}", bold: true }),
            ],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("LES PARTIES")],
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Entre le domaine ci-dessus et les futurs époux {noms_maries}, domiciliés {adresse}.",
              ),
            ],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("ÉVÉNEMENT")],
          }),
          new Paragraph({
            children: [
              new TextRun("Date du mariage : "),
              new TextRun({ text: "{date_mariage}", bold: true }),
            ],
          }),
          new Paragraph({
            children: [new TextRun("Événement : {nom_evenement}")],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("TARIF")],
          }),
          new Paragraph({
            children: [
              new TextRun("Montant total : "),
              new TextRun({ text: "{prix_total}", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun("{acompte_label} : {acompte_montant} — {solde_label} : {solde_montant}"),
            ],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun("SIGNATURES")],
          }),
          new Paragraph({
            children: [new TextRun("Signature marié(e) 1 : ___________________")],
          }),
          new Paragraph({
            children: [new TextRun("Signature marié(e) 2 : ___________________")],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          new Paragraph({
            children: [
              new TextRun("Contact domaine : {contact_nom} — {contact_email} — {contact_telephone}"),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outDir = resolve(process.cwd(), "assets");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "contrat-sample.docx");
  writeFileSync(outPath, buffer);
  console.log("✓", outPath);
}

main().catch(console.error);

/**
 * Test local fusion DOCX + conversion PDF.
 * Usage: npx tsx scripts/test-contrat-merge.ts [chemin.docx]
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { mergeDocxTemplate } from "../src/lib/contrat-merge";
import { convertDocxToPdf, isDocxToPdfConfigured } from "../src/lib/contrat-pdf-convert";
import { buildSampleContratMergeData } from "../src/lib/contrat-variables";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npx tsx scripts/test-contrat-merge.ts <fichier.docx>");
    process.exit(1);
  }

  const docxBytes = readFileSync(resolve(inputPath));
  const workspace = {
    nom_domaine: "Château Test",
    contact_nom: "Sophie Martin",
    contact_email: "contact@test.fr",
    contact_telephone: "05 56 00 00 00",
    facturation_acompte_label: "Acompte 50 %",
    facturation_acompte_pct: 50,
    facturation_solde_label: "Solde",
    facturation_solde_pct: 50,
  };

  const data = buildSampleContratMergeData(workspace);
  console.log("Variables:", data);

  const merged = mergeDocxTemplate(Buffer.from(docxBytes), data);
  const outDir = resolve(process.cwd(), "tmp/contrat-test");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "merged.docx"), merged);
  console.log("✓ merged.docx →", outDir);

  if (!isDocxToPdfConfigured()) {
    console.log("⚠ GOTENBERG_URL absent — conversion PDF ignorée");
    return;
  }

  const pdf = await convertDocxToPdf(merged);
  writeFileSync(resolve(outDir, "merged.pdf"), pdf);
  console.log("✓ merged.pdf →", outDir);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});

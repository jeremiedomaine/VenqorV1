import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { loadDemoContractPdf } from "../src/lib/yousign/contrat-demo-pdf";
import { detectSignatureSlots } from "../src/lib/yousign/detect-signature-slots";

async function main() {
  const bytes = loadDemoContractPdf();
  const pdf = await getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
  }).promise;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    console.log("Page", p, "size", vp.width, vp.height);
    for (const item of tc.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const t = item.transform;
      console.log(
        JSON.stringify({
          str: item.str,
          x: Math.round(t[4]),
          y: Math.round(t[5]),
          w: Math.round(item.width),
        }),
      );
    }
  }

  console.log("\nDetected slots:", await detectSignatureSlots(bytes));
}

main().catch(console.error);

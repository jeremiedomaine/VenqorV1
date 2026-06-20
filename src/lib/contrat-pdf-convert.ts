export class ContratPdfConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContratPdfConvertError";
  }
}

export function isDocxToPdfConfigured(): boolean {
  return true;
}

function wrapHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 2cm; }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111;
    }
    p { margin: 0.4em 0; }
    h1 { font-size: 16pt; margin: 0 0 1em; }
    h2 { font-size: 12pt; margin: 1.2em 0 0.4em; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

async function convertHtmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer-core");
  const isVercel = Boolean(process.env.VERCEL);

  let executablePath = process.env.CHROME_PATH?.trim();
  let args: string[] = ["--no-sandbox", "--disable-setuid-sandbox"];

  if (isVercel) {
    const chromium = await import("@sparticuz/chromium-min");
    chromium.default.setGraphicsMode = false;
    executablePath = await chromium.default.executablePath();
    args = chromium.default.args;
  } else if (!executablePath) {
    const { existsSync } = await import("fs");
    const candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
    ];
    executablePath = candidates.find((p) => existsSync(p));
  }

  if (!executablePath) {
    throw new ContratPdfConvertError(
      "Chrome introuvable pour la conversion PDF. Installez Chrome ou configurez GOTENBERG_URL.",
    );
  }

  const browser = await puppeteer.default.launch({
    executablePath,
    args,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function convertDocxToPdfViaHtml(docxBytes: Buffer): Promise<Buffer> {
  const mammoth = await import("mammoth");
  const { value: bodyHtml } = await mammoth.default.convertToHtml(
    { buffer: docxBytes },
    { ignoreEmptyParagraphs: false },
  );
  return convertHtmlToPdf(wrapHtmlDocument(bodyHtml));
}

async function convertDocxToPdfViaGotenberg(docxBytes: Buffer): Promise<Buffer> {
  const baseUrl = process.env.GOTENBERG_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) {
    throw new ContratPdfConvertError("GOTENBERG_URL absent");
  }

  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(docxBytes)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "contrat.docx",
  );

  const response = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ContratPdfConvertError(
      `Gotenberg (${response.status})${detail ? `: ${detail.slice(0, 120)}` : ""}`,
    );
  }

  const pdf = Buffer.from(await response.arrayBuffer());
  if (pdf.length === 0) {
    throw new ContratPdfConvertError("Gotenberg : PDF vide.");
  }
  return pdf;
}

/** Convertit un DOCX en PDF (Gotenberg si dispo, sinon Word→HTML→PDF via Chrome). */
export async function convertDocxToPdf(docxBytes: Buffer): Promise<Buffer> {
  if (process.env.GOTENBERG_URL?.trim()) {
    try {
      return await convertDocxToPdfViaGotenberg(docxBytes);
    } catch {
      // Repli Chromium si Gotenberg indisponible
    }
  }

  try {
    return await convertDocxToPdfViaHtml(docxBytes);
  } catch (err) {
    if (err instanceof ContratPdfConvertError) throw err;
    throw new ContratPdfConvertError(
      err instanceof Error ? err.message : "Conversion PDF impossible.",
    );
  }
}

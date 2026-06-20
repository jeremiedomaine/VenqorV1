import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type SignatureSlot = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextHit = {
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  score: number;
  signerIndex: 0 | 1 | null;
};

type RawTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
};

const FIELD_WIDTH = 200;
const FIELD_HEIGHT = 60;
const GAP_BELOW_LABEL = 8;
const PAGE_MARGIN = 40;
const LINE_Y_TOLERANCE = 4;

const SIGNER1_PATTERNS: RegExp[] = [
  /signature\s*(?:de\s+)?(?:la\s+)?(?:mari[ée]e?|épouse|époux|client|signataire|locataire|emprunteur)?\s*(?:\(e\)\s*)?[\s(]*1[\s).-]*/i,
  /(?:mari[ée]e?|épouse|époux|client|signataire)\s*(?:\(e\)\s*)?[\s(]*1[\s).-]*/i,
  /(?:1\s*(?:er|ère|e)\s*(?:mari[ée]|signataire|époux|client))/i,
  /(?:premier|première|1er)\s*(?:mari[ée]|signataire|époux|client)/i,
  /(?:le\s+)?(?:futur\s+)?(?:mari[ée]|époux)\s*[\s:-]*1/i,
];

const SIGNER2_PATTERNS: RegExp[] = [
  /signature\s*(?:de\s+)?(?:la\s+)?(?:mari[ée]e?|épouse|époux|client|signataire|locataire|emprunteur)?\s*(?:\(e\)\s*)?[\s(]*2[\s).-]*/i,
  /(?:mari[ée]e?|épouse|époux|client|signataire)\s*(?:\(e\)\s*)?[\s(]*2[\s).-]*/i,
  /(?:2\s*(?:e|ème|nd)\s*(?:mari[ée]|signataire|époux|client))/i,
  /(?:second|seconde|2e|2ème)\s*(?:mari[ée]|signataire|époux|client)/i,
  /(?:le\s+)?(?:futur\s+)?(?:mari[ée]|époux)\s*[\s:-]*2/i,
];

const GENERIC_SIGNATURE = /signature/i;
const SECTION_HEADER =
  /signatures?(?:\s+(?:des?\s+)?(?:clients?|mari[ée]s?|époux|parties|locataires?|emprunteurs?))?/i;
const UNDERSCORE_LINE = /_{4,}/;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function matchSignerIndex(text: string): 0 | 1 | null {
  const normalized = normalizeText(text);
  if (SIGNER1_PATTERNS.some((p) => p.test(normalized))) return 0;
  if (SIGNER2_PATTERNS.some((p) => p.test(normalized))) return 1;
  return null;
}

function scoreHit(text: string, signerIndex: 0 | 1 | null): number {
  const normalized = normalizeText(text);
  if (signerIndex !== null) return 100;
  if (UNDERSCORE_LINE.test(normalized)) return 40;
  if (GENERIC_SIGNATURE.test(normalized)) return 50;
  if (SECTION_HEADER.test(normalized)) return 10;
  return 0;
}

function mergeLineItems(items: RawTextItem[]): RawTextItem[] {
  if (!items.length) return [];

  const sorted = [...items].sort((a, b) => a.x - b.x);
  const lines: RawTextItem[] = [];
  let current = { ...sorted[0], str: sorted[0].str };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const gap = item.x - (current.x + current.width);
    if (gap <= 14) {
      current.str += item.str.startsWith(" ") ? item.str : ` ${item.str}`;
      current.width = item.x + item.width - current.x;
    } else {
      lines.push(current);
      current = { ...item, str: item.str };
    }
  }
  lines.push(current);
  return lines;
}

async function extractTextHits(pdfBytes: Buffer): Promise<TextHit[]> {
  const pdf = await getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
  }).promise;

  const hits: TextHit[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const str = item.str;
      if (!str.trim()) continue;
      const [,, , , x, y] = item.transform;
      rawItems.push({
        str,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(item.width),
      });
    }

    const byLine = new Map<number, RawTextItem[]>();
    for (const item of rawItems) {
      const lineKey =
        Math.round(item.y / LINE_Y_TOLERANCE) * LINE_Y_TOLERANCE;
      const bucket = byLine.get(lineKey) ?? [];
      bucket.push(item);
      byLine.set(lineKey, bucket);
    }

    for (const lineItems of Array.from(byLine.values())) {
      for (const line of mergeLineItems(lineItems)) {
        const raw = normalizeText(line.str);
        if (!raw) continue;

        const signerIndex = matchSignerIndex(raw);
        const score = scoreHit(raw, signerIndex);
        if (score === 0) continue;

        hits.push({
          page: pageNum,
          text: raw,
          x: line.x,
          y: line.y,
          width: line.width,
          score,
          signerIndex,
        });
      }
    }
  }

  return hits;
}

function hitToSlot(hit: TextHit): SignatureSlot {
  const y = hit.y - FIELD_HEIGHT - GAP_BELOW_LABEL;
  return {
    page: hit.page,
    x: Math.max(PAGE_MARGIN, hit.x),
    y: Math.max(PAGE_MARGIN, y),
    width: Math.min(FIELD_WIDTH, Math.max(160, hit.width + 40)),
    height: FIELD_HEIGHT,
  };
}

function pickBestHits(hits: TextHit[]): TextHit[] {
  const numbered = hits.filter((h) => h.signerIndex !== null);
  const bySigner = new Map<0 | 1, TextHit>();

  for (const hit of numbered.sort((a, b) => b.score - a.score || b.page - a.page)) {
    if (hit.signerIndex === null) continue;
    if (!bySigner.has(hit.signerIndex)) {
      bySigner.set(hit.signerIndex, hit);
    }
  }

  if (bySigner.has(0) && bySigner.has(1)) {
    return [bySigner.get(0)!, bySigner.get(1)!];
  }

  const generic = hits
    .filter(
      (h) =>
        (GENERIC_SIGNATURE.test(h.text) || UNDERSCORE_LINE.test(h.text)) &&
        h.signerIndex === null,
    )
    .sort((a, b) => {
      if (a.page !== b.page) return b.page - a.page;
      if (a.y !== b.y) return b.y - a.y;
      return a.x - b.x;
    });

  if (generic.length >= 2) {
    const lastPage = generic[0].page;
    const onLastPages = generic.filter((h) => h.page >= lastPage - 1);
    if (onLastPages.length >= 2) {
      return pickPairLayout(onLastPages);
    }
  }

  if (bySigner.size === 1) {
    const found = Array.from(bySigner.values())[0];
    const others = generic.filter(
      (h) => h.page === found.page && h !== found && Math.abs(h.y - found.y) > 20,
    );
    if (others.length) {
      const second = others.sort((a, b) => a.x - b.x)[0];
      return found.signerIndex === 0 ? [found, second] : [second, found];
    }
  }

  return [];
}

function pickPairLayout(hits: TextHit[]): TextHit[] {
  const sorted = [...hits].sort((a, b) => {
    if (a.y !== b.y) return b.y - a.y;
    return a.x - b.x;
  });

  const anchor = sorted[0];
  const sameRow = sorted.filter((h) => Math.abs(h.y - anchor.y) <= 8);
  if (sameRow.length >= 2) {
    return sameRow.slice(0, 2).sort((a, b) => a.x - b.x);
  }

  const sameColumn = sorted.filter((h) => Math.abs(h.x - anchor.x) <= 40);
  if (sameColumn.length >= 2) {
    return sameColumn.slice(0, 2).sort((a, b) => b.y - a.y);
  }

  return sorted.slice(0, 2);
}

function fallbackSlots(pageCount: number): [SignatureSlot, SignatureSlot] {
  const page = Math.max(1, pageCount);
  const y = 110;
  return [
    { page, x: 72, y, width: FIELD_WIDTH, height: FIELD_HEIGHT },
    { page, x: 320, y, width: FIELD_WIDTH, height: FIELD_HEIGHT },
  ];
}

/** Détecte deux emplacements signature dans le PDF (libellés « Signature marié 1/2 », etc.). */
export async function detectSignatureSlots(
  pdfBytes: Buffer,
): Promise<[SignatureSlot, SignatureSlot]> {
  let pageCount = 1;
  try {
    const pdf = await getDocument({
      data: new Uint8Array(pdfBytes),
      useSystemFonts: true,
    }).promise;
    pageCount = pdf.numPages;
  } catch {
    return fallbackSlots(pageCount);
  }

  try {
    const hits = await extractTextHits(pdfBytes);
    const picked = pickBestHits(hits);
    if (picked.length === 2) {
      return [hitToSlot(picked[0]), hitToSlot(picked[1])];
    }
  } catch {
    // pdfjs indisponible ou PDF illisible → repli coordonnées
  }

  return fallbackSlots(pageCount);
}

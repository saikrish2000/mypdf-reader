import { pdfjsLib } from '@/lib/pdfjs';

export const COVER_META_VERSION = 2;
const THUMB_WIDTH = 280;
const THUMB_QUALITY = 0.92;
const DETECT_SCAN_WIDTH = 48;

function sampleSpineColor(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  const points = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const [pr, pg, pb] = ctx.getImageData(x, y, 1, 1).data;
    r += pr;
    g += pg;
    b += pb;
  }
  r = Math.round(r / points.length);
  g = Math.round(g / points.length);
  b = Math.round(b / points.length);
  return `hsl(${rgbToHue(r, g, b)} 45% 35%)`;
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === min) return 30;
  const d = max - min;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return Math.round(h);
}

function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 245 && g > 245 && b > 245;
}

function scorePagePixels(data: Uint8ClampedArray): number {
  const hues: number[] = [];
  const sats: number[] = [];
  let nonWhite = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isNearWhite(r, g, b)) continue;
    nonWhite += 1;
    hues.push(rgbToHue(r, g, b));
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    sats.push(max === 0 ? 0 : (max - min) / max);
  }

  if (nonWhite === 0) return 0;

  const nonWhiteRatio = nonWhite / total;
  const hueMean = hues.reduce((a, v) => a + v, 0) / hues.length;
  const satMean = sats.reduce((a, v) => a + v, 0) / sats.length;
  const hueVar = hues.reduce((a, v) => a + (v - hueMean) ** 2, 0) / hues.length;
  const satVar = sats.reduce((a, v) => a + (v - satMean) ** 2, 0) / sats.length;
  const colorVariance = Math.sqrt(hueVar + satVar * 10000);

  return nonWhiteRatio * (1 + colorVariance / 80);
}

export async function renderPdfPageToDataUrl(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  targetWidth: number,
  quality = THUMB_QUALITY,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const thumbViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(thumbViewport.width);
  canvas.height = Math.ceil(thumbViewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;

  return {
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    width: canvas.width,
    height: canvas.height,
  };
}

async function scorePageAsCover(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
): Promise<number> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const scale = DETECT_SCAN_WIDTH / viewport.width;
  const scanViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(scanViewport.width));
  canvas.height = Math.max(1, Math.ceil(scanViewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: scanViewport }).promise;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return scorePagePixels(data);
}

export async function detectCoverPage(pdf: pdfjsLib.PDFDocumentProxy): Promise<number> {
  const scanUntil = Math.min(3, pdf.numPages);
  let bestPage = 1;
  let bestScore = -1;

  for (let p = 1; p <= scanUntil; p++) {
    const score = await scorePageAsCover(pdf, p);
    if (score > bestScore) {
      bestScore = score;
      bestPage = p;
    }
  }

  return bestPage;
}

export type CoverMetadata = {
  thumbnail: string;
  spineColor: string;
  coverPage: number;
  coverMetaVersion: number;
};

export function needsCoverUpdate(meta: {
  coverThumbnail?: string;
  coverPage?: number;
  coverMetaVersion?: number;
} | null | undefined): boolean {
  if (!meta?.coverThumbnail) return true;
  if (!meta.coverPage) return true;
  return (meta.coverMetaVersion ?? 0) < COVER_META_VERSION;
}

export async function generateCoverFromPdfDoc(
  pdf: pdfjsLib.PDFDocumentProxy,
): Promise<CoverMetadata> {
  const coverPage = await detectCoverPage(pdf);
  const page = await pdf.getPage(coverPage);
  const viewport = page.getViewport({ scale: 1 });
  const scale = THUMB_WIDTH / viewport.width;
  const thumbViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(thumbViewport.width);
  canvas.height = Math.ceil(thumbViewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
  const spineColor = sampleSpineColor(ctx, canvas.width, canvas.height);

  return {
    thumbnail: canvas.toDataURL('image/jpeg', THUMB_QUALITY),
    spineColor,
    coverPage,
    coverMetaVersion: COVER_META_VERSION,
  };
}

export async function generateCoverThumbnail(
  file: File,
): Promise<CoverMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  try {
    return await generateCoverFromPdfDoc(pdf);
  } finally {
    pdf.destroy();
  }
}

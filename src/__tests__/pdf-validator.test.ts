import { validatePDFQuality } from '../validators/pdf-quality-validator';
import type { PDFAnalysisResult, BlurAnalysisResult } from '../types';

jest.mock('../pdf-analyzer', () => {
  const original = jest.requireActual('../pdf-analyzer');
  return {
    ...original,
    PDFAnalyzer: class extends original.PDFAnalyzer {
      async analyzePDF(): Promise<PDFAnalysisResult> {
        const fn = (globalThis as any).__mockAnalyzePDF;
        if (fn) return await fn();
        throw new Error('No mock registered');
      }
    },
  };
});

jest.mock('../validators/file-validator', () => ({
  validateFile: () => Promise.resolve({
    ok: true, status: 'pass' as const, score: 100, message: 'Ok', details: { issues: [] },
  }),
}));

function page(o: {
  isBlurry?: boolean; brightness?: number; contrast?: number; minL?: number; maxL?: number;
  w?: number; h?: number; orientation?: 'portrait' | 'landscape' | 'square'; rotation?: number;
  margins?: { top: number; right: number; bottom: number; left: number }; perspectiveScore?: number;
  edges?: string[]; lowText?: boolean; headerPage?: boolean; cert?: boolean;
  cContrast?: number; cBrightness?: number; nonWhite?: number; glare?: number;
}): BlurAnalysisResult {
  const w = o.w ?? 1200; const h = o.h ?? 1600;
  const ps = o.perspectiveScore ?? 85; const edges = o.edges ?? [];
  return {
    isBlurry: o.isBlurry ?? false, confidence: 0.9, method: 'edge',
    metrics: {
      edgeAnalysis: { width: w, height: h, numEdges: 200, avgEdgeWidth: 2, avgEdgeWidthPerc: 0.15 },
      contentAnalysis: {
        isLikelyHeaderPage: o.headerPage ?? false,
        textDensity: o.lowText ? 5 : 30,
        hasLowTextContent: o.lowText ?? false,
        isCertificateDocument: o.cert,
      },
      pdfPageMetrics: {
        pageNumber: 1, width: w, height: h, aspectRatio: w / h,
        orientation: o.orientation ?? 'portrait', rotation: o.rotation ?? 0,
        brightness: o.brightness ?? 180, contrast: o.contrast ?? 55,
        minLuminance: o.minL ?? 20, maxLuminance: o.maxL ?? 245,
        nonWhiteRatio: o.nonWhite ?? 0.15, contentBrightness: o.cBrightness ?? 120,
        contentContrast: o.cContrast ?? 45, glarePixelRatio: o.glare ?? 0.01,
        documentFrame: {
          detected: true,
          marginRatios: o.margins ?? { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
          edgesTouchingBoundary: edges,
          perspectiveScore: ps,
          isLikelyCropped: edges.length > 0,
          hasPerspectiveDistortion: ps < 65,
        },
      },
    },
  };
}

function pdf(p: {
  good?: boolean; scanned?: boolean; analyzed?: number; textLen?: number;
  pages?: BlurAnalysisResult[]; corrupt?: Array<{ page: number; error: string }>;
}): () => Promise<PDFAnalysisResult> {
  return async () => ({
    isQualityGood: p.good ?? true, isScanned: p.scanned ?? false,
    pagesAnalyzed: p.analyzed ?? 1, textLength: p.textLen ?? 500,
    pageResults: p.pages ?? [], corruptedPages: p.corrupt,
  });
}

describe('validatePDFQuality', () => {
  const file = new File(['%PDF-1.4 fake'], 'test.pdf', { type: 'application/pdf' });
  beforeEach(() => { jest.clearAllMocks(); });

  it('fails scanned-blurry.pdf — issues:[blurry] in document mode', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ scanned: true, pages: [page({ isBlurry: true })] });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('blurry'); expect(r.warnings).toContain('scanned_pdf');
  });

  it('passes digital-clear.pdf — low_text_density and cover_page are non-blocking', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ scanned: false, textLen: 5000, pages: [page({ isBlurry: false, brightness: 200, contrast: 60, lowText: true, headerPage: true })] });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(true);
    expect(r.issues).not.toContain('low_text_density');
    expect(r.issues).not.toContain('cover_page');
    expect(r.warnings).toContain('low_text_density');
    expect(r.warnings).toContain('cover_page');
  });

  it('fails low-contrast.pdf for low_contrast (not text-density)', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ contrast: 10, minL: 30, maxL: 220, cContrast: 10 })] });
    const r = await validatePDFQuality(file, { mode: 'general' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('low_contrast'); expect(r.issues).not.toContain('low_text_density');
  });

  it('fails low_text_density in ocr mode', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ lowText: true })] });
    const r = await validatePDFQuality(file, { mode: 'ocr' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('low_text_density');
  });

  it('passes low_text_density in general mode (non-blocking warning)', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ lowText: true })] });
    const r = await validatePDFQuality(file, { mode: 'general' });
    expect(r.ok).toBe(true); expect(r.warnings).toContain('low_text_density');
  });

  it('passes rotated-page.pdf when expectedOrientation is not set', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ orientation: 'landscape', rotation: 90 })] });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(true); expect(r.issues).not.toContain('rotated');
  });

  it('fails rotated-page.pdf with expectedOrientation: portrait', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ orientation: 'landscape', rotation: 90 })] });
    const r = await validatePDFQuality(file, { mode: 'document', expectedOrientation: 'portrait' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('rotated');
  });

  it('fails perspective-document.pdf for perspective_distortion', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ perspectiveScore: 45 })] });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('perspective_distortion');
  });

  it('fails cropped-document.pdf for cropped', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({
      pages: [page({ edges: ['top', 'right'], margins: { top: 0.005, right: 0.005, bottom: 0.1, left: 0.1 } })],
    });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('cropped');
  });

  it('fails dark-page.pdf for too_dark and cropped', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({
      pages: [page({ brightness: 30, contrast: 20, minL: 5, maxL: 80, edges: ['bottom'], margins: { top: 0.1, right: 0.1, bottom: 0.005, left: 0.1 } })],
    });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('too_dark'); expect(r.issues).toContain('cropped');
  });

  it('passes clear white document without false glare', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({
      pages: [page({ brightness: 210, contrast: 55, minL: 20, maxL: 250, glare: 0.02, nonWhite: 0.12, cBrightness: 130, cContrast: 50 })],
    });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(true); expect(r.issues).not.toContain('glare'); expect(r.issues).not.toContain('too_bright');
  });

  it('does not treat mostly white rotated-page.pdf as glare', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({
      scanned: true,
      textLen: 0,
      pages: [
        page({
          w: 1431,
          h: 1324,
          orientation: 'landscape',
          brightness: 253.83583037235488,
          contrast: 16.57719569148106,
          minL: 0,
          maxL: 255,
          nonWhite: 0.005901372500585862,
          cBrightness: 59.088095876934084,
          cContrast: 91.68428084488407,
          glare: 0.9934351783237378,
          margins: {
            top: 0.4093655589123867,
            right: 0.3640810621942697,
            bottom: 0.3995468277945619,
            left: 0.36198462613556953,
          },
          perspectiveScore: 100,
        }),
      ],
    });

    const r = await validatePDFQuality(file, {
      mode: 'general',
      minWidth: 600,
      minHeight: 600,
    });

    expect(r.ok).toBe(true);
    expect(r.issues).not.toContain('glare');
    expect(r.warnings).toContain('scanned_pdf');
    expect(r.pages?.[0].checks.brightness?.ok).toBe(true);
    expect(r.pages?.[0].checks.brightness?.details).toMatchObject({
      glareBackgroundRatioMax: 0.65,
      glareContrastThreshold: 80,
    });
  });

  it('flags localized high-contrast blown highlights as glare', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({
      pages: [
        page({
          brightness: 180,
          contrast: 104,
          minL: 0,
          maxL: 255,
          nonWhite: 0.48,
          cBrightness: 67,
          cContrast: 65,
          glare: 0.22,
        }),
      ],
    });

    const r = await validatePDFQuality(file, { mode: 'document' });

    expect(r.ok).toBe(false);
    expect(r.issues).toContain('glare');
    expect(r.pages?.[0].checks.brightness?.ok).toBe(false);
  });

  it('returns corrupted_pdf for unreadable PDF', async () => {
    (globalThis as any).__mockAnalyzePDF = async () => { throw new Error('Failed to read PDF'); };
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(false); expect(r.issues).toContain('corrupted_pdf');
  });

  it('fails low_resolution when both dimensions are below minimums', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ pages: [page({ w: 500, h: 500 })] });
    const r = await validatePDFQuality(file, { mode: 'document', minWidth: 1000, minHeight: 1000 });
    expect(r.ok).toBe(false); expect(r.issues).toContain('low_resolution');
  });

  it('passes spoofed-pdf.pdf as valid (text signals non-blocking in document mode)', async () => {
    (globalThis as any).__mockAnalyzePDF = pdf({ scanned: false, textLen: 5, pages: [page({ isBlurry: false, lowText: true })] });
    const r = await validatePDFQuality(file, { mode: 'document' });
    expect(r.ok).toBe(true); expect(r.warnings).toContain('low_text_density');
  });
});

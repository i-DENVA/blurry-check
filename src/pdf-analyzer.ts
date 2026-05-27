import { clamp } from './utils';
import { BlurDetector } from './blur-detector';
import { BlurDetectionConfig, PDFAnalysisResult, BlurAnalysisResult } from './types';

export class PDFAnalyzer {
  private blurDetector: BlurDetector;
  private config: BlurDetectionConfig;
  private pdfLib: any = null;
  private loading: boolean = false;

  constructor(config: BlurDetectionConfig = {}) {
    this.config = config;
    this.blurDetector = new BlurDetector(config);
  }

  private calculateRenderedPageMetrics(imageData: ImageData, pageNumber: number, rotation: number): NonNullable<BlurAnalysisResult['metrics']['pdfPageMetrics']> {
    const { data, width, height } = imageData;
    let sum = 0, sumSquares = 0, contentSum = 0, contentSumSquares = 0, contentCount = 0, glarePixelCount = 0;
    let minLuminance = 255, maxLuminance = 0, minX = width, minY = height, maxX = -1, maxY = -1;
    const count = data.length / 4;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const luminance = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
        sum += luminance; sumSquares += luminance * luminance;
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
        if (luminance >= 250) glarePixelCount++;
        if (luminance < 245) { contentSum += luminance; contentSumSquares += luminance * luminance; contentCount++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      }
    }

    const brightness = sum / count;
    const variance = sumSquares / count - brightness * brightness;
    const contrast = Math.sqrt(Math.max(variance, 0));
    const contentBrightness = contentCount > 0 ? contentSum / contentCount : brightness;
    const contentVariance = contentCount > 0 ? contentSumSquares / contentCount - contentBrightness * contentBrightness : variance;
    const contentContrast = Math.sqrt(Math.max(contentVariance, 0));
    const nonWhiteRatio = contentCount / count;
    const glarePixelRatio = glarePixelCount / count;
    const detected = maxX >= minX && maxY >= minY;
    const marginRatios = detected ? { top: minY / height, right: (width - maxX - 1) / width, bottom: (height - maxY - 1) / height, left: minX / width } : { top: 1, right: 1, bottom: 1, left: 1 };
    const edgesTouchingBoundary = Object.entries(marginRatios).filter(([, ratio]) => ratio < 0.015).map(([edge]) => edge);
    const perspectiveScore = this.estimatePerspectiveScore(imageData);
    const aspectRatio = width / Math.max(height, 1);

    return {
      pageNumber, width, height, aspectRatio,
      orientation: aspectRatio > 1.08 ? 'landscape' : aspectRatio < 0.92 ? 'portrait' : 'square',
      rotation, brightness, contrast, minLuminance, maxLuminance, nonWhiteRatio, contentBrightness, contentContrast, glarePixelRatio,
      documentFrame: { detected, marginRatios, edgesTouchingBoundary, perspectiveScore, isLikelyCropped: edgesTouchingBoundary.length > 0, hasPerspectiveDistortion: perspectiveScore < 65 },
    };
  }

  private estimatePerspectiveScore(imageData: ImageData): number {
    const { data, width, height } = imageData;
    const rows: Array<{ left: number; right: number }> = [];
    const rowStep = Math.max(1, Math.floor(height / 40));
    const xStep = Math.max(1, Math.floor(width / 400));

    for (let y = 0; y < height; y += rowStep) {
      let left = -1, right = -1;
      for (let x = 0; x < width; x += xStep) {
        const idx = (y * width + x) * 4;
        const luminance = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
        if (luminance < 245) { if (left === -1) left = x; right = x; }
      }
      if (left >= 0 && right > left) rows.push({ left, right });
    }

    if (rows.length < 8) return 100;

    const quarter = Math.floor(rows.length / 4);
    const topBand = rows.slice(0, Math.max(1, quarter));
    const bottomBand = rows.slice(rows.length - quarter);
    const avgWidth = (items: Array<{ left: number; right: number }>) => items.reduce((s, i) => s + i.right - i.left, 0) / Math.max(items.length, 1);
    const topBottomRatio = Math.min(avgWidth(topBand), avgWidth(bottomBand)) / Math.max(avgWidth(topBand), avgWidth(bottomBand), 1);
    const avgLeft = (items: Array<{ left: number; right: number }>) => items.reduce((s, i) => s + i.left, 0) / Math.max(items.length, 1);
    const leftDrift = Math.abs(avgLeft(topBand) - avgLeft(bottomBand)) / Math.max(width, 1);
    const driftScore = 1 - Math.min(1, leftDrift * 15);
    return Math.round(clamp((topBottomRatio * 0.7 + driftScore * 0.3) * 100));
  }

  private log(message: string, ...args: any[]) { if (this.config.debug) console.log(`[PDFAnalyzer] ${message}`, ...args); }

  private async loadPdfJS(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('PDF.js can only be loaded in browser environments');
    if (this.pdfLib) return;
    if (this.loading) return this.waitForLoad();

    this.loading = true;
    try {
      document.querySelector('#pdfjs-script')?.remove();

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true; script.id = 'pdfjs-script';
        script.onload = () => {
          if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; this.pdfLib = window.pdfjsLib; this.loading = false; resolve(); }
          else { this.loading = false; reject(new Error('PDF.js not available')); }
        };
        script.onerror = () => { this.loading = false; reject(new Error('Failed to load PDF.js')); };
        document.body.appendChild(script);
      });
    } catch (error) { this.loading = false; throw error; }
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => { if (!this.loading) { clearInterval(check); this.pdfLib ? resolve() : reject(new Error('PDF.js failed to load')); } }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('PDF.js loading timeout')); }, 15000);
    });
  }

  private async checkPdfPageQuality(pdf: any, pageNumber: number, maxRenderScale = 2.0): Promise<BlurAnalysisResult> {
    const page = await pdf.getPage(pageNumber);
    const candidateScales = [1.0, 1.5, 2.0];
    const scales = candidateScales.filter((s) => s <= maxRenderScale);
    const results: BlurAnalysisResult[] = [];

    for (const scale of scales) {
      const viewport = page.getViewport({ scale });
      const canvas = this.config.canvas || document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2D context from canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pdfPageMetrics = this.calculateRenderedPageMetrics(imageData, pageNumber, viewport.rotation ?? page.rotate ?? 0);

      const pdfBlurDetector = new BlurDetector({ ...this.config, edgeWidthThreshold: Math.min(this.config.edgeWidthThreshold || 0.5, 0.25), method: 'edge', debug: this.config.debug });
      const result = await pdfBlurDetector.analyzeImage(imageData);
      result.method = `${result.method} (scale ${scale}x)`;
      result.metrics.pdfPageMetrics = pdfPageMetrics;
      results.push(result);
      this.log(`Page ${pageNumber} at ${scale}x scale:`, result);
    }

    const bestResult = results[results.length - 1];
    const blurryCount = results.filter(r => r.isBlurry).length;
    return {
      ...bestResult,
      isBlurry: bestResult.isBlurry,
      confidence: bestResult.confidence,
      method: `Highest-scale analysis (${blurryCount}/${results.length} scales detected blur)`,
      metrics: { ...bestResult.metrics, scaleResults: results.map(r => ({ scale: parseFloat(r.method.match(/scale ([\d.]+)x/)?.[1] || '1'), isBlurry: r.isBlurry, confidence: r.confidence, edgeAnalysis: r.metrics.edgeAnalysis })) },
    };
  }

  private analyzePageContent(textContent: any, pageNumber: number) {
    const textItems = textContent.items || [];
    const totalText = textItems.map((item: any) => item.str).join(' ').trim();
    const textLength = totalText.length;
    const isFirstPage = pageNumber === 1;
    const hasLowTextContent = textLength < 200;
    const textDensity = textLength / Math.max(textItems.length, 1);

    const hasHeaderKeywords = /bill|statement|invoice|report|summary|account|period/i.test(totalText);
    const hasDatePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\w+ \d{1,2}, \d{4}/i.test(totalText);
    const hasAmountPattern = /\$[\d,]+\.?\d*|USD|EUR|GBP/i.test(totalText);
    const hasCertificateKeywords = /certificate|certification|certified|diploma|award|achievement|completion|graduate|license|licence|accredited|qualification/i.test(totalText);
    const hasOfficialLanguage = /hereby|certify|certifies|awarded|granted|presented|conferred|issued|authority|institution|organization/i.test(totalText);
    const isCertificateDocument = hasCertificateKeywords && hasOfficialLanguage;
    const isLikelyHeaderPage = isFirstPage && (hasLowTextContent || (hasHeaderKeywords && hasDatePattern && hasAmountPattern && textLength < 500)) && !isCertificateDocument;

    this.log(`Page ${pageNumber} content analysis: textLength=${textLength}, textDensity=${textDensity.toFixed(1)}, isLikelyHeader=${isLikelyHeaderPage}, isCertificate=${isCertificateDocument}`);
    return { isLikelyHeaderPage, textDensity, hasLowTextContent, isCertificateDocument };
  }

  private async analyzeTextSharpness(pdf: any, pageNumber: number, maxRenderScale = 3.0): Promise<{ textSharpnessScore: number; isTextBlurry: boolean; textMetrics: any }> {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    if (textContent.items.length === 0) return { textSharpnessScore: 0, isTextBlurry: true, textMetrics: { reason: 'No text found' } };

    const scale = Math.min(3.0, maxRenderScale);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context for text analysis');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport, intent: 'print' }).promise;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = this.calculateTextSharpness(imageData, textContent.items);
    this.log(`Page ${pageNumber} text sharpness analysis:`, result);
    return result;
  }

  private calculateTextSharpness(imageData: ImageData, textItems: any[]): { textSharpnessScore: number; isTextBlurry: boolean; textMetrics: any } {
    const { data, width, height } = imageData;
    let totalVariance = 0, sampleCount = 0, edgeIntensity = 0;
    const sampleSize = 5;
    const stride = Math.max(1, Math.floor(Math.min(width, height) / 100));

    for (let y = 0; y < height - sampleSize; y += stride) {
      for (let x = 0; x < width - sampleSize; x += stride) {
        let localSum = 0, localSumSq = 0, localCount = 0, maxGradient = 0;
        for (let dy = 0; dy < sampleSize; dy++) {
          for (let dx = 0; dx < sampleSize; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            localSum += gray; localSumSq += gray * gray; localCount++;
            if (dx < sampleSize - 1 && dy < sampleSize - 1) {
              const rIdx = ((y + dy) * width + (x + dx + 1)) * 4;
              const dIdx = ((y + dy + 1) * width + (x + dx)) * 4;
              const gx = (0.299 * data[rIdx] + 0.587 * data[rIdx + 1] + 0.114 * data[rIdx + 2]) - gray;
              const gy = (0.299 * data[dIdx] + 0.587 * data[dIdx + 1] + 0.114 * data[dIdx + 2]) - gray;
              maxGradient = Math.max(maxGradient, Math.sqrt(gx * gx + gy * gy));
            }
          }
        }
        if (localCount > 0) {
          const mean = localSum / localCount;
          const variance = (localSumSq / localCount) - (mean * mean);
          if (variance > 100) { totalVariance += variance; edgeIntensity += maxGradient; sampleCount++; }
        }
      }
    }

    const avgVariance = sampleCount > 0 ? totalVariance / sampleCount : 0;
    const avgEdgeIntensity = sampleCount > 0 ? edgeIntensity / sampleCount : 0;
    const sharpnessScore = (avgVariance / 1000) + (avgEdgeIntensity / 50);
    const isTextBlurry = sharpnessScore < 0.8;
    return { textSharpnessScore: sharpnessScore, isTextBlurry, textMetrics: { avgVariance, avgEdgeIntensity, sampleCount, threshold: 0.8 } };
  }

  async analyzePDF(file: File, perfOptions?: { maxPages?: number; samplePages?: 'first' | 'all' | 'smart' | number[]; maxRenderScale?: number; timeoutMs?: number }): Promise<PDFAnalysisResult> {
    this.log('Starting PDF analysis for file:', file.name);
    const maxPages = perfOptions?.maxPages ?? Infinity;
    const samplePages = perfOptions?.samplePages ?? 'all';
    const maxRenderScale = perfOptions?.maxRenderScale ?? 2.0;
    const timeoutMs = perfOptions?.timeoutMs ?? 30000;

    if (!this.pdfLib) await this.loadPdfJS();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await this.pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const totalPages = pdf.numPages;
      let extractedText = '', isScanned = false;
      const pageResults: BlurAnalysisResult[] = [], corruptedPages: Array<{ page: number; error: string }> = [];
      let incomplete = false, incompleteReason: string | undefined;

      this.log(`PDF has ${totalPages} pages`);

      let pagesToAnalyze: number[] = [];
      if (Array.isArray(samplePages)) pagesToAnalyze = samplePages.filter(p => p >= 1 && p <= totalPages).slice(0, maxPages);
      else if (samplePages === 'first') pagesToAnalyze = [1];
      else if (samplePages === 'smart') {
        const smart: number[] = [];
        for (let i = 1; i <= totalPages; i++) if (i === 1 || i === totalPages || i % 5 === 0) smart.push(i);
        pagesToAnalyze = smart.slice(0, maxPages);
      } else pagesToAnalyze = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, maxPages);

      if (pagesToAnalyze.length < totalPages && maxPages < totalPages) { incomplete = true; incompleteReason = `Page cap: analyzed ${pagesToAnalyze.length}/${totalPages}`; }
      const skippedPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => !pagesToAnalyze.includes(p));
      const startTime = Date.now();

      for (const i of pagesToAnalyze) {
        if (Date.now() - startTime > timeoutMs) { incomplete = true; incompleteReason = `Timeout: stopped at page ${i}`; break; }
        this.log(`Analyzing page ${i}/${totalPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        if (textContent.items.length === 0) isScanned = true;
        extractedText += textContent.items.map((item: any) => item.str).join(' ');

        try {
          const contentAnalysis = this.analyzePageContent(textContent, i);
          const pageAnalysis = await this.checkPdfPageQuality(pdf, i, maxRenderScale);

          if (textContent.items.length > 0) {
            try {
              const textSharpness = await this.analyzeTextSharpness(pdf, i, maxRenderScale);
              let finalIsBlurry = pageAnalysis.isBlurry || textSharpness.isTextBlurry;
              if (contentAnalysis.isCertificateDocument) { finalIsBlurry = textSharpness.textSharpnessScore < 0.3; this.log(`Page ${i} identified as certificate - lenient blur`); }
              else if (contentAnalysis.isLikelyHeaderPage) { finalIsBlurry = textSharpness.textSharpnessScore < 0.5; this.log(`Page ${i} identified as header/logo - lenient blur`); }

              pageResults.push({ ...pageAnalysis, isBlurry: finalIsBlurry, confidence: Math.max(pageAnalysis.confidence, textSharpness.textSharpnessScore), method: `${pageAnalysis.method} + Text Analysis${contentAnalysis.isCertificateDocument ? ' (Certificate-adjusted)' : contentAnalysis.isLikelyHeaderPage ? ' (Header-adjusted)' : ''}`, metrics: { ...pageAnalysis.metrics, textSharpness, contentAnalysis } });
              this.log(`Page ${i} combined analysis done`);
            } catch (textError) { this.log(`Text analysis failed for page ${i}:`, textError); pageResults.push(pageAnalysis); }
          } else { pageResults.push(pageAnalysis); }
        } catch (error) {
          this.log(`Failed to analyze page ${i}:`, error);
          corruptedPages.push({ page: i, error: error instanceof Error ? error.message : 'Unknown page analysis error' });
        }
      }

      const finalIsScanned = isScanned || extractedText.length < 10;
      this.log(`PDF analysis complete. Scanned: ${finalIsScanned}, Text length: ${extractedText.length}`);

      let isQualityGood = true;
      if (pageResults.length > 0) {
        const blurryPages = pageResults.filter(r => r.isBlurry);
        if (pageResults.length > 1) {
          const nonFirst = pageResults.slice(1);
          const blurryNonFirst = nonFirst.filter(r => r.isBlurry);
          if (pageResults[0].isBlurry && blurryNonFirst.length === 0) { isQualityGood = true; this.log('First page blurry but rest clear - likely false positive'); }
          else if (blurryNonFirst.length >= Math.ceil(nonFirst.length / 2)) isQualityGood = false;
          else isQualityGood = true;
        } else { isQualityGood = blurryPages.length === 0; }
      }

      const result: PDFAnalysisResult = { isQualityGood, isScanned: finalIsScanned, pagesAnalyzed: pagesToAnalyze.length, textLength: extractedText.length, pageResults: pageResults.length ? pageResults : undefined, corruptedPages: corruptedPages.length ? corruptedPages : undefined, incomplete, incompleteReason, totalPages, skippedPages: skippedPages.length ? skippedPages : undefined };
      this.log('Final PDF analysis result:', result);
      return result;
    } catch (error) {
      this.log('PDF analysis failed:', error);
      throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isGoodQuality(file: File): Promise<boolean> { return (await this.analyzePDF(file)).isQualityGood; }
}

import { BlurDetector } from '../blur-detector';
import { getImageDataFromInput } from '../image-utils';
import { resolveMode, presetToMode } from '../mode-config';
import { recommendationsFor, summaryFor } from '../issue-catalog';
import type { IssueCode } from '../issue-catalog';
import { score, statusFor, makeCheck } from '../utils';
import {
  DARK_IMAGE_THRESHOLD, BRIGHT_BACKGROUND_THRESHOLD, READABLE_CONTENT_MIN_RATIO, READABLE_CONTENT_MAX_BRIGHTNESS,
  BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST, CONTENT_AWARE_CONTRAST_THRESHOLD, CONTRAST_READABLE_CONTENT_MIN_CONTRAST,
  DOCUMENT_MAX_LUMINANCE_MIN, DOCUMENT_CONTENT_BRIGHTNESS_MIN, DOCUMENT_CONTENT_MAX_LUMINANCE_MIN,
  GLARE_LUMINANCE_THRESHOLD, GLARE_PIXEL_RATIO_THRESHOLD, BLANK_NON_WHITE_RATIO_MAX, BLANK_CONTRAST_MAX, BLANK_CONTENT_CONTRAST_MAX,
} from '../constants';
import type { BlurAnalysisResult, ImageInput, QualityCheckName, QualityCheckResult, QualityValidationResult, UploadValidationOptions } from '../types';
import { validateFile } from './file-validator';

const GLARE_CONTRAST_THRESHOLD = 80;
const ALL_IMAGE_CHECKS: QualityCheckName[] = ['file', 'format', 'fileSize', 'resolution', 'blur', 'brightness', 'contrast'];

function applyMode(options: UploadValidationOptions) {
  const mode = options.mode ?? presetToMode(options.preset ?? 'general');
  return { ...resolveMode(mode, options.strictness ?? 'medium'), ...options };
}

function pixelMetrics(imageData: ImageData) {
  const { data } = imageData;
  let sum = 0, sumSq = 0, minL = 255, maxL = 0;
  let cSum = 0, cSumSq = 0, cCount = 0, gCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += lum; sumSq += lum * lum;
    minL = Math.min(minL, lum); maxL = Math.max(maxL, lum);
    if (lum >= 250) gCount++;
    if (lum < 245) { cSum += lum; cSumSq += lum * lum; cCount++; }
  }
  const count = data.length / 4;
  const b = sum / count;
  const v = sumSq / count - b * b;
  return {
    brightness: b, contrast: Math.sqrt(Math.max(v, 0)), minLuminance: minL, maxLuminance: maxL,
    contentBrightness: cCount ? cSum / cCount : b,
    contentContrast: cCount ? Math.sqrt(Math.max(cSumSq / cCount - (cSum / cCount) ** 2, 0)) : Math.sqrt(Math.max(v, 0)),
    nonWhiteRatio: cCount / count, glarePixelRatio: gCount / count,
  };
}

function isReadableContent(m: ReturnType<typeof pixelMetrics>) {
  return m.nonWhiteRatio >= READABLE_CONTENT_MIN_RATIO && m.minLuminance < READABLE_CONTENT_MAX_BRIGHTNESS &&
    m.maxLuminance - m.minLuminance > 60 && (m.contrast >= BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST || m.contentContrast >= BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST);
}

function isUnderexposed(m: ReturnType<typeof pixelMetrics>) {
  return m.maxLuminance < DOCUMENT_MAX_LUMINANCE_MIN || (m.contentBrightness < DOCUMENT_CONTENT_BRIGHTNESS_MIN && m.maxLuminance < DOCUMENT_CONTENT_MAX_LUMINANCE_MIN);
}

function hasGlare(m: ReturnType<typeof pixelMetrics>) {
  return m.glarePixelRatio >= GLARE_PIXEL_RATIO_THRESHOLD && m.maxLuminance >= GLARE_LUMINANCE_THRESHOLD && m.contrast >= GLARE_CONTRAST_THRESHOLD;
}

function isBlankContent(m: ReturnType<typeof pixelMetrics>) {
  const nearZero = m.nonWhiteRatio <= BLANK_NON_WHITE_RATIO_MAX || (m.contrast <= BLANK_CONTRAST_MAX && m.contentContrast <= BLANK_CONTENT_CONTRAST_MAX);
  return nearZero && m.minLuminance >= 245;
}

function brightnessIssue(m: ReturnType<typeof pixelMetrics>): IssueCode | undefined {
  if (m.brightness < DARK_IMAGE_THRESHOLD || isUnderexposed(m)) return 'too_dark';
  if (hasGlare(m)) return 'glare';
  if (m.brightness > BRIGHT_BACKGROUND_THRESHOLD && !isReadableContent(m)) return 'too_bright';
  return undefined;
}

function brightnessCheck(m: ReturnType<typeof pixelMetrics>, issue?: IssueCode): QualityCheckResult {
  const ok = !issue;
  const s = !issue ? 100 : issue === 'too_dark' ? (m.brightness / 170) * 100 : ((255 - m.brightness) / 45) * 100;
  return makeCheck(ok, s, !issue
    ? m.brightness > BRIGHT_BACKGROUND_THRESHOLD ? 'Document background is bright but readable.' : 'Brightness looks good.'
    : issue === 'too_dark' ? (isUnderexposed(m) ? 'Document appears underexposed.' : 'Image is too dark.')
    : issue === 'glare' ? 'Document has glare or blown highlights.' : 'Image is too bright.',
    { brightness: m.brightness, contrast: m.contrast, minLuminance: m.minLuminance, maxLuminance: m.maxLuminance,
      nonWhiteRatio: m.nonWhiteRatio, contentBrightness: m.contentBrightness, contentContrast: m.contentContrast,
      glarePixelRatio: m.glarePixelRatio, glarePixelRatioThreshold: GLARE_PIXEL_RATIO_THRESHOLD, glareLuminanceThreshold: GLARE_LUMINANCE_THRESHOLD,
      documentMaxLuminanceMin: DOCUMENT_MAX_LUMINANCE_MIN, documentContentBrightnessMin: DOCUMENT_CONTENT_BRIGHTNESS_MIN, documentContentMaxLuminanceMin: DOCUMENT_CONTENT_MAX_LUMINANCE_MIN });
}

function contrastCheck(m: ReturnType<typeof pixelMetrics>): QualityCheckResult {
  const hasReadable = m.nonWhiteRatio >= READABLE_CONTENT_MIN_RATIO && m.contentBrightness < READABLE_CONTENT_MAX_BRIGHTNESS && m.contentContrast >= CONTRAST_READABLE_CONTENT_MIN_CONTRAST;
  const ok = m.contrast >= CONTENT_AWARE_CONTRAST_THRESHOLD || hasReadable;
  return makeCheck(ok, (m.contrast / 55) * 100,
    ok ? (hasReadable && m.contrast < CONTENT_AWARE_CONTRAST_THRESHOLD ? 'Readable content contrast looks good.' : 'Contrast looks good.') : 'Image has low contrast.',
    { contrast: m.contrast, minLuminance: m.minLuminance, maxLuminance: m.maxLuminance, nonWhiteRatio: m.nonWhiteRatio,
      contentBrightness: m.contentBrightness, contentContrast: m.contentContrast,
      readableContentMinContrast: CONTRAST_READABLE_CONTENT_MIN_CONTRAST, contrastReadableContentMinContrast: CONTRAST_READABLE_CONTENT_MIN_CONTRAST });
}

function checkResolution(imageData: ImageData, minW: number, minH: number, maxW?: number, maxH?: number) {
  const { width: w, height: h } = imageData;
  if (w < minW || h < minH) return { ok: false, msg: 'Image resolution is too low.', details: { width: w, height: h, minWidth: minW, minHeight: minH } };
  if ((maxW && w > maxW) || (maxH && h > maxH)) return { ok: false, msg: 'Image dimensions are larger than allowed.', details: { width: w, height: h, maxWidth: maxW, maxHeight: maxH } };
  return { ok: true, msg: 'Resolution is acceptable.', details: { width: w, height: h, minWidth: minW, minHeight: minH } };
}

function scoreBlur(blur: BlurAnalysisResult, threshold: number, laplaceThreshold: number): QualityCheckResult {
  const ep = blur.metrics.edgeAnalysis?.avgEdgeWidthPerc;
  const lv = blur.metrics.laplacianVariance;
  let s = blur.isBlurry ? 45 : 90;
  if (typeof ep === 'number') s = 100 - (ep / (threshold * 2)) * 100;
  if (typeof lv === 'number') s = typeof ep === 'number' ? Math.max(s, (lv / (laplaceThreshold * 2)) * 100) : (lv / (laplaceThreshold * 2)) * 100;
  if (blur.isBlurry) s = Math.min(s, 59);
  return makeCheck(!blur.isBlurry, s, blur.isBlurry ? 'Image appears blurry.' : 'Sharpness looks good.',
    { confidence: blur.confidence, method: blur.method, edgeWidthPerc: ep, laplacianVariance: lv });
}

export async function validateImageQuality(input: ImageInput, options: UploadValidationOptions = {}): Promise<QualityValidationResult> {
  const opts = applyMode(options);
  const requested = opts.checks ?? ALL_IMAGE_CHECKS;
  const checks: Partial<Record<QualityCheckName, QualityCheckResult>> = {};
  const issues: IssueCode[] = [];

  if (input instanceof File && requested.some(n => ['file', 'format', 'fileSize'].includes(n))) {
    const fc = await validateFile(input, {
      ...opts,
      allowedTypes: opts.allowedTypes ?? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
      allowedExtensions: opts.allowedExtensions ?? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
    });
    checks.file = fc;
    if (fc.details && typeof fc.details === 'object' && 'issues' in fc.details) {
      const fi = (fc.details as Record<string, unknown>).issues as IssueCode[] | undefined;
      if (fi) issues.push(...fi);
    }
    if (requested.includes('format')) checks.format = { ...fc, details: { ...(fc.details as Record<string, unknown>), category: 'format' } };
    if (requested.includes('fileSize')) {
      const maxBytes = opts.maxSizeBytes ?? (opts.maxSizeMB ?? 10) * 1024 * 1024;
      const ok = input.size > 0 && input.size <= maxBytes;
      if (!ok) issues.push('too_large');
      checks.fileSize = makeCheck(ok, ok ? 100 : 50, ok ? 'File size is acceptable.' : 'File is too large.', { size: input.size, maxSizeBytes: maxBytes });
    }
  }

  const imageData = await getImageDataFromInput(input, opts.canvas);
  const m = pixelMetrics(imageData);
  const blank = isBlankContent(m);
  let blurAnalysis: BlurAnalysisResult | undefined;

  if (requested.includes('resolution')) {
    const r = checkResolution(imageData, opts.minWidth ?? 600, opts.minHeight ?? 600, opts.maxWidth, opts.maxHeight);
    if (!r.ok) issues.push('low_resolution');
    checks.resolution = makeCheck(r.ok, r.ok ? 100 : 50, r.msg, r.details);
  }

  if (blank) issues.push('blank_image');

  if (requested.includes('brightness')) {
    const bIssue = blank ? undefined : brightnessIssue(m);
    if (bIssue) issues.push(bIssue);
    checks.brightness = brightnessCheck(m, bIssue);
  }

  if (requested.includes('contrast')) {
    const cc = contrastCheck(m);
    if (!cc.ok && !blank) issues.push('low_contrast');
    checks.contrast = cc;
  }

  if (requested.includes('blur')) {
    blurAnalysis = await new BlurDetector(opts).analyzeImage(imageData);
    const bc = scoreBlur(blurAnalysis, opts.edgeWidthThreshold ?? 0.3, opts.laplacianThreshold ?? 150);
    checks.blur = bc;
    if (!bc.ok && !blank) issues.push('blurry');
  }

  const uniqueIssues = [...new Set(issues)];
  const scored = Object.values(checks).filter(Boolean) as QualityCheckResult[];
  const avg = scored.length ? scored.reduce((sum, c) => sum + c.score, 0) / scored.length : 100;
  const overall = score(avg);
  const minS = opts.minScore ?? 70;
  const ok = uniqueIssues.length === 0 && overall >= minS;

  return {
    valid: ok, ok, status: ok ? 'pass' : overall >= minS ? 'warning' : 'fail',
    score: overall, message: summaryFor(uniqueIssues), type: 'image', checks,
    recommendations: recommendationsFor(uniqueIssues), issues: uniqueIssues, warnings: [],
    width: imageData.width, height: imageData.height, blurAnalysis,
    debugMetrics: {
      mode: options.mode ?? 'general',
      brightness: m.brightness, contrast: m.contrast, minLuminance: m.minLuminance, maxLuminance: m.maxLuminance, minScore: minS,
      nonWhiteRatio: m.nonWhiteRatio, contentContrast: m.contentContrast,
      blank: { detected: blank, blankNonWhiteRatioMax: BLANK_NON_WHITE_RATIO_MAX, blankContrastMax: BLANK_CONTRAST_MAX, blankContentContrastMax: BLANK_CONTENT_CONTRAST_MAX },
      resolvedThresholds: {
        brightness: { documentMaxLuminanceMin: DOCUMENT_MAX_LUMINANCE_MIN, documentContentBrightnessMin: DOCUMENT_CONTENT_BRIGHTNESS_MIN, documentContentMaxLuminanceMin: DOCUMENT_CONTENT_MAX_LUMINANCE_MIN, brightnessReadableContentMinContrast: BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST, glarePixelRatioThreshold: GLARE_PIXEL_RATIO_THRESHOLD, glareLuminanceThreshold: GLARE_LUMINANCE_THRESHOLD },
        contrast: { readableContentMinContrast: CONTRAST_READABLE_CONTENT_MIN_CONTRAST, contrastReadableContentMinContrast: CONTRAST_READABLE_CONTENT_MIN_CONTRAST },
      },
    },
  };
}

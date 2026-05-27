import { score, statusFor, makeCheck } from '../utils';
import {
  DARK_IMAGE_THRESHOLD,
  BRIGHT_BACKGROUND_THRESHOLD,
  READABLE_CONTENT_MIN_RATIO,
  READABLE_CONTENT_MAX_BRIGHTNESS,
  BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST,
  CONTENT_AWARE_CONTRAST_THRESHOLD,
  CONTRAST_READABLE_CONTENT_MIN_CONTRAST,
  DOCUMENT_MAX_LUMINANCE_MIN,
  DOCUMENT_CONTENT_BRIGHTNESS_MIN,
  DOCUMENT_CONTENT_MAX_LUMINANCE_MIN,
  GLARE_LUMINANCE_THRESHOLD,
  GLARE_PIXEL_RATIO_THRESHOLD,
  GLARE_BACKGROUND_RATIO_MAX,
  GLARE_CONTRAST_THRESHOLD,
} from '../constants';
import type { IssueCode } from '../issue-catalog';
import type { ValidationMode } from '../mode-config';
import type {
  PDFAnalysisResult,
  PDFPageValidationResult,
  QualityCheckName,
  QualityCheckResult,
  UploadValidationOptions,
} from '../types';

const TEXT_BLOCKING_MODES: Set<ValidationMode> = new Set(['ocr', 'ai-input']);

export function validatePage(
  pageNumber: number,
  pageResult: NonNullable<PDFAnalysisResult['pageResults']>[number],
  options: UploadValidationOptions,
): PDFPageValidationResult {
  const m = pageResult.metrics.pdfPageMetrics;
  const checks: Partial<Record<QualityCheckName, QualityCheckResult>> = {};
  const issues: IssueCode[] = [];
  const warnings: IssueCode[] = [];
  const minW = options.minWidth ?? 1000;
  const minH = options.minHeight ?? 1000;
  const mode = options.mode ?? 'document';

  if (!m) {
    return {
      page: pageNumber,
      ok: true,
      status: 'pass',
      score: 100,
      issues: [],
      warnings: [],
      checks,
      message: `Page ${pageNumber} — no metrics available.`,
    };
  }

  const resOk = m.width >= minW && m.height >= minH;
  checks.pageResolution = makeCheck(
    resOk,
    resOk ? 100 : (Math.min(m.width, m.height) / Math.min(minW, minH)) * 100,
    resOk ? 'Page resolution is acceptable.' : `Page ${pageNumber} resolution is too low.`,
    { width: m.width, height: m.height, minWidth: minW, minHeight: minH },
  );
  if (!resOk) issues.push('low_resolution');

  const hasReadable =
    m.nonWhiteRatio >= READABLE_CONTENT_MIN_RATIO &&
    m.minLuminance < READABLE_CONTENT_MAX_BRIGHTNESS &&
    m.maxLuminance - m.minLuminance > 60 &&
    (m.contrast >= BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST ||
      m.contentContrast >= BRIGHTNESS_READABLE_CONTENT_MIN_CONTRAST);
  const isUnderexposed =
    m.maxLuminance < DOCUMENT_MAX_LUMINANCE_MIN ||
    (m.contentBrightness < DOCUMENT_CONTENT_BRIGHTNESS_MIN &&
      m.maxLuminance < DOCUMENT_CONTENT_MAX_LUMINANCE_MIN);
  const hasLocalizedGlare =
    m.glarePixelRatio >= GLARE_PIXEL_RATIO_THRESHOLD &&
    m.glarePixelRatio <= GLARE_BACKGROUND_RATIO_MAX &&
    m.maxLuminance >= GLARE_LUMINANCE_THRESHOLD &&
    m.contrast >= GLARE_CONTRAST_THRESHOLD;

  const brightnessIssue: IssueCode | undefined =
    m.brightness < DARK_IMAGE_THRESHOLD || isUnderexposed
      ? 'too_dark'
      : hasLocalizedGlare
        ? 'glare'
        : m.brightness > BRIGHT_BACKGROUND_THRESHOLD && !hasReadable
          ? 'too_bright'
          : undefined;

  checks.brightness = makeCheck(
    !brightnessIssue,
    !brightnessIssue
      ? 100
      : brightnessIssue === 'too_dark'
        ? (m.brightness / 170) * 100
        : ((255 - m.brightness) / 45) * 100,
    !brightnessIssue
      ? m.brightness > BRIGHT_BACKGROUND_THRESHOLD
        ? 'Document background is bright but readable.'
        : 'Brightness looks good.'
      : brightnessIssue === 'too_dark'
        ? isUnderexposed
          ? `Page ${pageNumber} appears underexposed.`
          : `Page ${pageNumber} is too dark.`
        : brightnessIssue === 'glare'
          ? `Page ${pageNumber} has glare or blown highlights.`
          : `Page ${pageNumber} is too bright.`,
    {
      brightness: m.brightness,
      contrast: m.contrast,
      minLuminance: m.minLuminance,
      maxLuminance: m.maxLuminance,
      nonWhiteRatio: m.nonWhiteRatio,
      contentBrightness: m.contentBrightness,
      contentContrast: m.contentContrast,
      glarePixelRatio: m.glarePixelRatio,
      glarePixelRatioThreshold: GLARE_PIXEL_RATIO_THRESHOLD,
      glareBackgroundRatioMax: GLARE_BACKGROUND_RATIO_MAX,
      glareContrastThreshold: GLARE_CONTRAST_THRESHOLD,
    },
  );
  if (brightnessIssue) issues.push(brightnessIssue);

  const hasReadableContrast =
    m.nonWhiteRatio >= READABLE_CONTENT_MIN_RATIO &&
    m.contentBrightness < READABLE_CONTENT_MAX_BRIGHTNESS &&
    m.contentContrast >= CONTRAST_READABLE_CONTENT_MIN_CONTRAST;
  const contrastOk = m.contrast >= CONTENT_AWARE_CONTRAST_THRESHOLD || hasReadableContrast;
  checks.contrast = makeCheck(
    contrastOk,
    (m.contrast / 55) * 100,
    contrastOk
      ? hasReadableContrast && m.contrast < CONTENT_AWARE_CONTRAST_THRESHOLD
        ? 'Readable content contrast looks good.'
        : 'Contrast looks good.'
      : `Page ${pageNumber} has low contrast.`,
    {
      contrast: m.contrast,
      minLuminance: m.minLuminance,
      maxLuminance: m.maxLuminance,
      nonWhiteRatio: m.nonWhiteRatio,
      contentBrightness: m.contentBrightness,
      contentContrast: m.contentContrast,
    },
  );
  if (!contrastOk) issues.push('low_contrast');

  const f = m.documentFrame;
  if (f.isLikelyCropped) issues.push('cropped');
  if (f.hasPerspectiveDistortion) issues.push('perspective_distortion');
  const mobileOk = f.detected && !f.isLikelyCropped && !f.hasPerspectiveDistortion;
  checks.mobileCapture = makeCheck(
    mobileOk,
    mobileOk ? 100 : Math.min(f.perspectiveScore, f.isLikelyCropped ? 55 : 75),
    mobileOk
      ? 'Document frame looks good.'
      : f.isLikelyCropped && f.hasPerspectiveDistortion
        ? `Page ${pageNumber} may have missing edges or perspective distortion.`
        : f.isLikelyCropped
          ? `Page ${pageNumber} may have missing document edges.`
          : `Page ${pageNumber} may have perspective distortion.`,
    {
      detected: f.detected,
      marginRatios: f.marginRatios,
      edgesTouchingBoundary: f.edgesTouchingBoundary,
      perspectiveScore: f.perspectiveScore,
    },
  );

  const exp = options.expectedOrientation;
  const orientOk = !exp || m.orientation === exp || m.orientation === 'square';
  checks.orientation = makeCheck(
    orientOk,
    orientOk ? 100 : 55,
    !exp
      ? 'Page orientation recorded.'
      : orientOk
        ? 'Page orientation looks correct.'
        : `Page ${pageNumber} appears rotated incorrectly.`,
    { orientation: m.orientation, expected: exp, rotation: m.rotation },
  );
  if (!orientOk && exp) issues.push('rotated');

  checks.sharpness = makeCheck(
    !pageResult.isBlurry,
    pageResult.isBlurry ? 45 : 100,
    pageResult.isBlurry ? `Page ${pageNumber} is blurry.` : 'Sharpness looks good.',
    {
      confidence: pageResult.confidence,
      edgeWidthPerc: pageResult.metrics.edgeAnalysis?.avgEdgeWidthPerc,
      textSharpnessScore: pageResult.metrics.textSharpness?.textSharpnessScore,
    },
  );
  if (pageResult.isBlurry) issues.push('blurry');

  const ca = pageResult.metrics.contentAnalysis;
  const hasLowText = ca?.hasLowTextContent ?? false;
  const isCert = ca?.isCertificateDocument ?? false;
  const tdOk = !hasLowText || isCert;
  checks.textDensity = makeCheck(
    tdOk,
    tdOk ? 100 : 65,
    tdOk
      ? 'Text density looks acceptable.'
      : `Page ${pageNumber} has very little extractable text.`,
    { textDensity: ca?.textDensity, hasLowTextContent: hasLowText },
  );
  if (!tdOk) {
    (TEXT_BLOCKING_MODES.has(mode) ? issues : warnings).push('low_text_density');
  }
  if (hasLowText && !isCert && ca?.isLikelyHeaderPage) warnings.push('cover_page');

  const uniqueIssues = [...new Set(issues)];
  const uniqueWarnings = [...new Set(warnings)];
  const scoredChecks = Object.values(checks).filter(Boolean) as QualityCheckResult[];
  const pageScore = scoredChecks.length
    ? score(scoredChecks.reduce((s, c) => s + c.score, 0) / scoredChecks.length)
    : 100;
  const pageOk = uniqueIssues.length === 0 && pageScore >= 70;

  const parts: string[] = [];
  if (pageResult.isBlurry) parts.push('is blurry');
  for (const code of [
    'too_dark',
    'too_bright',
    'glare',
    'low_contrast',
    'low_resolution',
  ] as IssueCode[])
    if (uniqueIssues.includes(code)) parts.push(`has ${code.replace(/_/g, ' ')}`);
  if (uniqueIssues.includes('rotated')) parts.push('appears rotated');
  if (uniqueIssues.includes('cropped')) parts.push('may have missing document edges');
  if (uniqueIssues.includes('perspective_distortion'))
    parts.push('may have perspective distortion');

  return {
    page: pageNumber,
    ok: pageOk,
    status: statusFor(pageOk, pageScore),
    score: pageScore,
    issues: uniqueIssues,
    warnings: uniqueWarnings,
    message: pageOk
      ? `Page ${pageNumber} looks good.`
      : `Page ${pageNumber} ${parts.join(' and ')}.`,
    checks,
    width: m.width,
    height: m.height,
    orientation: m.orientation,
    rotation: m.rotation,
  };
}

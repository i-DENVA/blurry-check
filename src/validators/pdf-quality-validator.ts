import { PDFAnalyzer } from '../pdf-analyzer';
import { resolveMode, presetToMode } from '../mode-config';
import { recommendationsFor, summaryFor } from '../issue-catalog';
import type { IssueCode } from '../issue-catalog';
import { score, statusFor, makeCheck } from '../utils';
import type { BlurDetectionConfig, PDFAnalysisResult, QualityCheckName, QualityCheckResult, QualityValidationResult, UploadValidationOptions } from '../types';
import { validateFile } from './file-validator';
import { validatePage } from './validate-page';

function isBlocking(code: IssueCode): boolean {
  return !['scanned_pdf', 'cover_page'].includes(code);
}

export async function validatePDFQuality(
  file: File,
  options: UploadValidationOptions = {},
  config: BlurDetectionConfig = {},
): Promise<QualityValidationResult> {
  const effectiveMode = options.mode ?? presetToMode(options.preset ?? 'document');
  const defaults = resolveMode(effectiveMode, options.strictness ?? 'medium');
  const opts = { ...defaults, ...options, mode: effectiveMode, strictness: options.strictness };

  const fileCheck = await validateFile(file, { ...opts, allowedTypes: ['application/pdf'], allowedExtensions: ['pdf'] });
  const maxBytes = opts.maxSizeBytes ?? (opts.maxSizeMB ?? 15) * 1024 * 1024;
  const sizeOk = file.size > 0 && file.size <= maxBytes;
  const fileSizeCheck = makeCheck(sizeOk, sizeOk ? 100 : 45, sizeOk ? 'PDF size is acceptable.' : 'PDF too large.', { size: file.size, maxSizeBytes: maxBytes });

  if (!fileCheck.ok) {
    const fi = fileCheck.details && typeof fileCheck.details === 'object' && 'issues' in fileCheck.details
      ? ((fileCheck.details as Record<string, unknown>).issues as IssueCode[] | undefined) ?? [] : [];
    return { valid: false, ok: false, status: 'fail', score: Math.min(fileCheck.score, fileSizeCheck.score), message: summaryFor(fi), type: 'pdf',
      checks: { file: fileCheck, fileSize: fileSizeCheck }, issues: fi, warnings: [], recommendations: recommendationsFor(fi) };
  }

  let pdfAnalysis: PDFAnalysisResult;
  try {
    pdfAnalysis = await new PDFAnalyzer({ ...config, ...opts, edgeWidthThreshold: opts.edgeWidthThreshold, method: opts.method })
      .analyzePDF(file, { maxPages: opts.maxPages, samplePages: opts.samplePages, maxRenderScale: opts.maxRenderScale, timeoutMs: opts.timeoutMs });
  } catch (error) {
    return { valid: false, ok: false, status: 'fail', score: 0, message: summaryFor(['corrupted_pdf']), type: 'pdf',
      checks: { file: fileCheck, fileSize: fileSizeCheck, corruptedPages: makeCheck(false, 0, 'PDF could not be read.', { error: error instanceof Error ? error.message : 'Unknown' }) },
      issues: ['corrupted_pdf'], warnings: [], recommendations: recommendationsFor(['corrupted_pdf']),
      debugMetrics: { error: error instanceof Error ? error.message : 'Unknown' } };
  }

  const pages = (pdfAnalysis.pageResults ?? []).map((pr, i) => validatePage(i + 1, pr, opts));
  const corrupted = pdfAnalysis.corruptedPages ?? [];
  const globalIssues: IssueCode[] = [];
  const globalWarnings: IssueCode[] = [];

  if (!sizeOk) globalIssues.push('too_large');
  if (corrupted.length > 0) globalIssues.push('corrupted_page');
  if (pdfAnalysis.skippedPages?.length) globalIssues.push('corrupted_page');
  if (pdfAnalysis.isScanned) globalWarnings.push('scanned_pdf');

  const allPageIssues = pages.flatMap(p => p.issues);
  const allPageWarnings = pages.flatMap(p => p.warnings ?? []);
  const allIssues = [...new Set([...globalIssues, ...allPageIssues])];
  const allWarnings = [...new Set([...globalWarnings, ...allPageWarnings])];

  const blocking: IssueCode[] = [], nonBlocking: IssueCode[] = [...allWarnings];
  for (const code of allIssues) (isBlocking(code) ? blocking : nonBlocking).push(code);
  const uniqueBlocking = [...new Set(blocking)];
  const uniqueWarnings = [...new Set(nonBlocking)];

  const scannedCheck = makeCheck(true, pdfAnalysis.isScanned ? 80 : 100,
    pdfAnalysis.isScanned ? 'PDF appears to be scanned (informational).' : 'PDF has extractable digital text.',
    { isScanned: pdfAnalysis.isScanned, textLength: pdfAnalysis.textLength });
  const corruptedCheck = makeCheck(corrupted.length === 0, corrupted.length === 0 ? 100 : 35,
    corrupted.length === 0 ? 'All pages were analyzed.' : `${corrupted.length} page${corrupted.length === 1 ? '' : 's'} could not be analyzed.`, { corruptedPages: corrupted });

  const pageAvg = pages.length ? pages.reduce((s, p) => s + p.score, 0) / pages.length : 0;
  const overallScore = score([fileCheck.score, fileSizeCheck.score, scannedCheck.score, corruptedCheck.score, pageAvg].reduce((s, v) => s + v, 0) / 5);
  const minScore = opts.minScore ?? 72;
  const ok = uniqueBlocking.length === 0 && pdfAnalysis.isQualityGood && overallScore >= minScore;

  return {
    valid: ok, ok, status: statusFor(ok, overallScore), score: overallScore, message: summaryFor(uniqueBlocking), type: 'pdf',
    checks: {
      file: fileCheck, fileSize: fileSizeCheck, scanned: scannedCheck, corruptedPages: corruptedCheck,
      sharpness: makeCheck(pages.every(p => !p.issues.includes('blurry')), pages.some(p => p.issues.includes('blurry')) ? 50 : 100, pages.some(p => p.issues.includes('blurry')) ? 'One or more pages are blurry.' : 'Page sharpness looks good.'),
      brightness: makeCheck(pages.every(p => !['too_dark', 'too_bright', 'glare'].some(c => p.issues.includes(c as IssueCode))), pages.some(p => ['too_dark', 'too_bright', 'glare'].some(c => p.issues.includes(c as IssueCode))) ? 60 : 100, pages.some(p => ['too_dark', 'too_bright', 'glare'].some(c => p.issues.includes(c as IssueCode))) ? 'One or more pages have poor brightness.' : 'Brightness looks good.'),
      contrast: makeCheck(pages.every(p => !p.issues.includes('low_contrast')), pages.some(p => p.issues.includes('low_contrast')) ? 60 : 100, pages.some(p => p.issues.includes('low_contrast')) ? 'One or more pages have low contrast.' : 'Contrast looks good.'),
      orientation: makeCheck(pages.every(p => !p.issues.includes('rotated')), pages.some(p => p.issues.includes('rotated')) ? 55 : 100, pages.some(p => p.issues.includes('rotated')) ? 'One or more pages appear rotated.' : 'Page orientation looks correct.'),
      mobileCapture: makeCheck(pages.every(p => !['cropped', 'perspective_distortion'].some(c => p.issues.includes(c as IssueCode))), pages.some(p => ['cropped', 'perspective_distortion'].some(c => p.issues.includes(c as IssueCode))) ? 55 : 100, pages.some(p => ['cropped', 'perspective_distortion'].some(c => p.issues.includes(c as IssueCode))) ? 'One or more pages may have missing edges or perspective distortion.' : 'Document capture framing looks good.'),
      textDensity: makeCheck(pages.every(p => !p.issues.includes('low_text_density')), pages.some(p => p.issues.includes('low_text_density')) ? 65 : 100, pages.some(p => p.issues.includes('low_text_density')) ? 'One or more pages have very little extractable text.' : 'Text density looks acceptable.'),
    },
    recommendations: recommendationsFor([...uniqueBlocking, ...uniqueWarnings]),
    issues: uniqueBlocking, warnings: uniqueWarnings, pages, pdfAnalysis,
    debugMetrics: { minScore, pageAverage: pageAvg, corruptedPages: corrupted, mode: effectiveMode, strictness: opts.strictness, incomplete: pdfAnalysis.incomplete ?? false, incompleteReason: pdfAnalysis.incompleteReason, totalPages: pdfAnalysis.totalPages, skippedPages: pdfAnalysis.skippedPages },
  };
}

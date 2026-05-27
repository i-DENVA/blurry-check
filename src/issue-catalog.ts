export type IssueCode =
  | 'blurry'
  | 'too_dark'
  | 'too_bright'
  | 'glare'
  | 'low_contrast'
  | 'low_resolution'
  | 'too_large'
  | 'invalid_file'
  | 'unsupported_format'
  | 'rotated'
  | 'cropped'
  | 'perspective_distortion'
  | 'low_text_density'
  | 'corrupted_pdf'
  | 'corrupted_page'
  | 'scanned_pdf'
  | 'analysis_error'
  | 'cover_page'
  | 'blank_image';

export type IssueSeverity = 'error' | 'warning';

export interface IssueDefinition {
  code: IssueCode;
  severity: IssueSeverity;
  message: string;
  recommendation: string;
}

export const ISSUE_CATALOG: Record<IssueCode, IssueDefinition> = {
  blurry: {
    code: 'blurry',
    severity: 'error',
    message: 'Image appears blurry.',
    recommendation: 'Hold the camera steady and retake the image.',
  },
  too_dark: {
    code: 'too_dark',
    severity: 'error',
    message: 'Image is too dark.',
    recommendation: 'Use brighter, even lighting.',
  },
  too_bright: {
    code: 'too_bright',
    severity: 'warning',
    message: 'Image is too bright or overexposed.',
    recommendation: 'Avoid direct glare and reduce exposure.',
  },
  glare: {
    code: 'glare',
    severity: 'warning',
    message: 'Document has glare or blown highlights.',
    recommendation:
      'Move away from direct light and retake the document at an angle without reflections.',
  },
  low_contrast: {
    code: 'low_contrast',
    severity: 'warning',
    message: 'Image has low contrast.',
    recommendation: 'Place the subject against a clearer, contrasting background.',
  },
  low_resolution: {
    code: 'low_resolution',
    severity: 'error',
    message: 'Image resolution is too low.',
    recommendation: 'Upload a higher resolution image.',
  },
  too_large: {
    code: 'too_large',
    severity: 'error',
    message: 'File is too large.',
    recommendation: 'Compress the file or reduce the image size before uploading.',
  },
  invalid_file: {
    code: 'invalid_file',
    severity: 'error',
    message: 'File format is not supported or the file is corrupt.',
    recommendation: 'Choose a valid image or PDF file.',
  },
  unsupported_format: {
    code: 'unsupported_format',
    severity: 'error',
    message: 'File type is not allowed.',
    recommendation: 'Upload a supported format (JPG, PNG, WebP, or PDF).',
  },
  rotated: {
    code: 'rotated',
    severity: 'warning',
    message: 'Page appears rotated incorrectly.',
    recommendation: 'Rotate the page so text is upright before uploading.',
  },
  cropped: {
    code: 'cropped',
    severity: 'error',
    message: 'Document edges may be missing from the frame.',
    recommendation: 'Make sure all document edges are visible in the photo.',
  },
  perspective_distortion: {
    code: 'perspective_distortion',
    severity: 'warning',
    message: 'Document has perspective distortion.',
    recommendation: 'Capture the document straight-on, not at an angle.',
  },
  low_text_density: {
    code: 'low_text_density',
    severity: 'warning',
    message: 'Page has very little extractable text.',
    recommendation: 'Ensure the page contains readable text content.',
  },
  corrupted_pdf: {
    code: 'corrupted_pdf',
    severity: 'error',
    message: 'PDF could not be read.',
    recommendation: 'Re-export or rescan the PDF before uploading.',
  },
  corrupted_page: {
    code: 'corrupted_page',
    severity: 'error',
    message: 'PDF has pages that could not be read.',
    recommendation: 'Re-export or rescan the affected pages.',
  },
  scanned_pdf: {
    code: 'scanned_pdf',
    severity: 'warning',
    message: 'PDF appears to be scanned (image-based, no extractable text).',
    recommendation: 'If digital text is needed, provide a text-based PDF.',
  },
  analysis_error: {
    code: 'analysis_error',
    severity: 'error',
    message: 'Analysis could not be completed.',
    recommendation: 'Try again with a different file.',
  },
  cover_page: {
    code: 'cover_page',
    severity: 'warning',
    message: 'Page may be a cover or header page with low text content.',
    recommendation: 'Verify that the cover page content is intentional.',
  },
  blank_image: {
    code: 'blank_image',
    severity: 'error',
    message: 'Image appears blank or empty.',
    recommendation: 'Upload an image with visible content.',
  },
};

const RECOMMENDATION_ORDER: IssueCode[] = [
  'blurry',
  'too_dark',
  'glare',
  'too_bright',
  'low_contrast',
  'low_resolution',
  'rotated',
  'cropped',
  'perspective_distortion',
  'too_large',
  'unsupported_format',
  'invalid_file',
  'corrupted_page',
  'corrupted_pdf',
  'scanned_pdf',
  'low_text_density',
  'cover_page',
  'blank_image',
  'analysis_error',
];

export function recommendationsFor(issues: IssueCode[]): string[] {
  const seen = new Set<string>();
  const recs: string[] = [];
  for (const code of RECOMMENDATION_ORDER) {
    if (!issues.includes(code)) continue;
    const def = ISSUE_CATALOG[code];
    if (seen.has(def.recommendation)) continue;
    seen.add(def.recommendation);
    recs.push(def.recommendation);
  }
  return recs.length > 0 ? recs : ['File is ready to upload.'];
}

export function summaryFor(issues: IssueCode[]): string {
  if (issues.length === 0) return 'File is ready to upload.';
  const messages = issues.map((code) => {
    const def = ISSUE_CATALOG[code];
    return def ? def.message.replace(/\.$/, '') : code.replace(/_/g, ' ');
  });
  if (messages.length === 1) return `${messages[0]}.`;
  const head = messages.slice(0, 2).join(' and ');
  const remaining = messages.length > 2 ? ` (and ${messages.length - 2} more)` : '';
  return `${head}${remaining}.`;
}

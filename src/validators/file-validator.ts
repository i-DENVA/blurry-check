import { FileValidationOptions, QualityCheckResult, QualityStatus } from '../types';
import type { IssueCode } from '../issue-catalog';
import { clamp } from '../utils';

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf',
];
const DEFAULT_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'pdf'];

const SIGNATURES: Array<{ type: string; extensions: string[]; bytes: number[] }> = [
  { type: 'image/jpeg', extensions: ['jpg', 'jpeg'], bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png',  extensions: ['png'],       bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'image/gif',  extensions: ['gif'],       bytes: [0x47, 0x49, 0x46] },
  { type: 'application/pdf', extensions: ['pdf'],  bytes: [0x25, 0x50, 0x44, 0x46] },
  { type: 'image/bmp',  extensions: ['bmp'],       bytes: [0x42, 0x4d] },
  { type: 'image/webp', extensions: ['webp'],      bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function extensionFor(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

async function detectSignature(file: File): Promise<{ type: string; extension: string } | null> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  for (const s of SIGNATURES) {
    if (!s.bytes.every((byte, index) => header[index] === byte)) continue;
    if (s.type === 'image/webp') {
      if (String.fromCharCode(...header.slice(8, 12)) !== 'WEBP') continue;
    }
    return { type: s.type, extension: s.extensions[0] };
  }
  return null;
}

function statusFor(ok: boolean, scoreValue: number): QualityStatus {
  if (ok) return 'pass';
  return scoreValue >= 60 ? 'warning' : 'fail';
}

export async function validateFile(
  file: File,
  options: FileValidationOptions = {},
): Promise<QualityCheckResult> {
  const maxSizeBytes = options.maxSizeBytes ?? (options.maxSizeMB ?? 10) * 1024 * 1024;
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  const allowedExtensions = options.allowedExtensions ?? DEFAULT_ALLOWED_EXTENSIONS;
  const ext = extensionFor(file);
  const issues: IssueCode[] = [];

  const extra: Record<string, unknown> = {
    name: file.name, size: file.size, mimeType: file.type, extension: ext, maxSizeBytes,
  };

  if (file.size <= 0) issues.push('invalid_file');
  if (file.size > maxSizeBytes) issues.push('too_large');

  const typeOk = allowedTypes.length === 0 || allowedTypes.includes(file.type);
  const extOk = allowedExtensions.length === 0 || allowedExtensions.includes(ext);
  if (!typeOk || !extOk) issues.push('unsupported_format');

  if (options.validateMagicBytes ?? true) {
    const signature = await detectSignature(file);
    extra.detectedSignature = signature;
    if (!signature) {
      issues.push('invalid_file');
    } else if (!allowedTypes.includes(signature.type) && !allowedExtensions.includes(signature.extension)) {
      issues.push('unsupported_format');
    }
  }

  const ok = issues.length === 0;
  const scoreVal = ok ? 100 : Math.round(clamp(100 - issues.length * 30, 0, 100));

  return {
    ok,
    status: statusFor(ok, scoreVal),
    score: scoreVal,
    message: ok ? 'File format and size are valid.' : issues.join(' '),
    details: { ...extra, issues },
  };
}

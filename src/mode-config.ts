import { BlurDetectionConfig } from './types';

export type ValidationMode =
  'general' | 'document' | 'receipt' | 'invoice' | 'id-card'
  | 'passport' | 'profile-photo' | 'ocr' | 'ai-input';

export type StrictnessLevel = 'low' | 'medium' | 'high';

export interface ModeDefaults {
  minWidth: number; minHeight: number; maxSizeMB: number; minScore: number;
  method: NonNullable<BlurDetectionConfig['method']>;
  edgeWidthThreshold: number;
  allowedTypes: string[]; allowedExtensions: string[];
  checkOrientation: boolean;
}

export const MODE_CONFIG: Record<ValidationMode, ModeDefaults> = {
  general: { minWidth: 600, minHeight: 600, maxSizeMB: 10, minScore: 70, method: 'both', edgeWidthThreshold: 0.3, allowedTypes: ['image/jpeg','image/png','image/webp','image/gif','image/bmp','application/pdf'], allowedExtensions: ['jpg','jpeg','png','webp','gif','bmp','pdf'], checkOrientation: false },
  document: { minWidth: 1000, minHeight: 1000, maxSizeMB: 15, minScore: 78, method: 'edge', edgeWidthThreshold: 0.25, allowedTypes: ['image/jpeg','image/png','image/webp','application/pdf'], allowedExtensions: ['jpg','jpeg','png','webp','pdf'], checkOrientation: true },
  receipt: { minWidth: 800, minHeight: 800, maxSizeMB: 10, minScore: 72, method: 'edge', edgeWidthThreshold: 0.25, allowedTypes: ['image/jpeg','image/png','image/webp'], allowedExtensions: ['jpg','jpeg','png','webp'], checkOrientation: false },
  invoice: { minWidth: 1000, minHeight: 1000, maxSizeMB: 15, minScore: 78, method: 'edge', edgeWidthThreshold: 0.25, allowedTypes: ['image/jpeg','image/png','image/webp','application/pdf'], allowedExtensions: ['jpg','jpeg','png','webp','pdf'], checkOrientation: true },
  'id-card': { minWidth: 900, minHeight: 600, maxSizeMB: 10, minScore: 80, method: 'edge', edgeWidthThreshold: 0.25, allowedTypes: ['image/jpeg','image/png','image/webp'], allowedExtensions: ['jpg','jpeg','png','webp'], checkOrientation: true },
  passport: { minWidth: 900, minHeight: 600, maxSizeMB: 8, minScore: 82, method: 'edge', edgeWidthThreshold: 0.22, allowedTypes: ['image/jpeg','image/png','image/webp'], allowedExtensions: ['jpg','jpeg','png','webp'], checkOrientation: true },
  'profile-photo': { minWidth: 400, minHeight: 400, maxSizeMB: 8, minScore: 75, method: 'both', edgeWidthThreshold: 0.3, allowedTypes: ['image/jpeg','image/png','image/webp'], allowedExtensions: ['jpg','jpeg','png','webp'], checkOrientation: false },
  ocr: { minWidth: 1200, minHeight: 1200, maxSizeMB: 20, minScore: 80, method: 'edge', edgeWidthThreshold: 0.18, allowedTypes: ['image/jpeg','image/png','image/webp','application/pdf'], allowedExtensions: ['jpg','jpeg','png','webp','pdf'], checkOrientation: true },
  'ai-input': { minWidth: 800, minHeight: 800, maxSizeMB: 15, minScore: 72, method: 'edge', edgeWidthThreshold: 0.3, allowedTypes: ['image/jpeg','image/png','image/webp','application/pdf'], allowedExtensions: ['jpg','jpeg','png','webp','pdf'], checkOrientation: false },
};

const STRICTNESS_MULTIPLIERS: Record<StrictnessLevel, { scoreBump: number; thresholdMultiplier: number; sizeMultiplier: number }> = {
  low: { scoreBump: -8, thresholdMultiplier: 1.4, sizeMultiplier: 1.5 },
  medium: { scoreBump: 0, thresholdMultiplier: 1.0, sizeMultiplier: 1.0 },
  high: { scoreBump: 8, thresholdMultiplier: 0.65, sizeMultiplier: 0.7 },
};

export function resolveMode(mode: ValidationMode, strictness: StrictnessLevel = 'medium'): ModeDefaults {
  const base = MODE_CONFIG[mode];
  const mod = STRICTNESS_MULTIPLIERS[strictness];
  return { ...base, minScore: Math.max(0, Math.min(100, base.minScore + mod.scoreBump)), edgeWidthThreshold: Math.max(0.05, Math.min(2, base.edgeWidthThreshold * mod.thresholdMultiplier)), maxSizeMB: Math.round(base.maxSizeMB * mod.sizeMultiplier) };
}

const PRESET_TO_MODE: Record<string, ValidationMode> = {
  general: 'general', 'profile-photo': 'profile-photo', 'document-scan': 'document',
  receipt: 'receipt', 'id-card': 'id-card',
};

export function presetToMode(preset: string): ValidationMode {
  return PRESET_TO_MODE[preset] ?? 'general';
}

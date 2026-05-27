export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function score(value: number): number {
  return Math.round(clamp(value));
}

import type { QualityStatus, QualityCheckResult } from './types';

export function statusFor(ok: boolean, scoreValue: number): QualityStatus {
  if (ok) return 'pass';
  return scoreValue >= 60 ? 'warning' : 'fail';
}

export function makeCheck(
  ok: boolean,
  scoreValue: number,
  message: string,
  details?: Record<string, unknown>,
): QualityCheckResult {
  const s = score(scoreValue);
  return { ok, status: statusFor(ok, s), score: s, message, details };
}

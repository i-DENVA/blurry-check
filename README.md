# Blurry Check

Browser-side upload quality validation for images and PDFs. Files never leave the device — all analysis runs client-side.

**[Try the Live Demo →](https://i-denva.github.io/blurry-check/)**

## Features

- **Pre-upload Validation** — Check files in the browser before they reach your server
- **Blur Detection** — Sobel edge analysis + OpenCV Laplacian variance
- **PDF Quality** — Multi-page analysis with text sharpness, orientation, document frame detection
- **Brightness & Contrast** — Content-aware checks that handle white document backgrounds
- **Blank Detection** — Catch empty/white images as a single clear issue
- **File Validation** — MIME type, extension, binary magic byte checks
- **Stable Issue Codes** — 19 catalogued issue codes for business logic (`blurry`, `too_dark`, `cropped`, etc.)
- **Non-blocking Warnings** — Scanned PDFs, low text density, cover pages are informational by default
- **Calibrated Modes** — `document`, `ocr`, `passport`, `profile-photo`, `receipt`, `invoice`, `id-card`, `ai-input`, `general`
- **Strictness Levels** — `low`, `medium`, `high` to shift all thresholds
- **Framework Agnostic** — React, Vue, Angular, Qwik, vanilla JS

## Install

```bash
npm install blurry-check
```

## Quick Start

```typescript
import { validateUpload } from 'blurry-check';

const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async (e) => {
  const file = e.target.files[0];

  const result = await validateUpload(file, {
    mode: 'document',
    strictness: 'high',
    minScore: 75,
  });

  if (!result.ok) {
    showError(result.message);        // "Image is blurry and too dark."
    showTips(result.recommendations); // Specific fix suggestions
    return;
  }

  uploadToServer(file);
});
```

## Response Shape

```typescript
{
  valid: false,
  ok: false,
  status: 'fail',
  score: 62,
  message: 'Image appears blurry and Image is too dark.',
  type: 'image',
  issues: ['blurry', 'too_dark'],        // blocking issues
  warnings: [],                           // non-blocking (scanned PDFs, cover pages, etc.)
  checks: {
    blur:      { ok: false, status: 'fail',    score: 42, message: 'Image appears blurry.' },
    brightness:{ ok: false, status: 'fail',    score: 68, message: 'Image is too dark.' },
    contrast:  { ok: true,  status: 'pass',    score: 84, message: 'Contrast looks good.' },
    resolution:{ ok: true,  status: 'pass',    score: 100, message: 'Resolution is acceptable.' },
    file:      { ok: true,  status: 'pass',    score: 100, message: 'File format and size are valid.' },
  },
  recommendations: [
    'Hold the camera steady and retake the image.',
    'Use brighter, even lighting.',
  ],
}
```

## Validation Modes

| Mode | Min Dims | Max Size | Score | Method | Notes |
|---|---|---|---|---|---|
| `general` | 600×600 | 10 MB | 70+ | both | All-purpose |
| `document` | 1000×1000 | 15 MB | 78+ | edge | Orientation check |
| `receipt` | 800×800 | 10 MB | 72+ | edge | |
| `invoice` | 1000×1000 | 15 MB | 78+ | edge | Orientation check |
| `id-card` | 900×600 | 10 MB | 80+ | edge | Landscape expected |
| `passport` | 900×600 | 8 MB | 82+ | edge | Stricter blur |
| `profile-photo` | 400×400 | 8 MB | 75+ | both | Photos |
| `ocr` | 1200×1200 | 20 MB | 80+ | edge | Text density is blocking |
| `ai-input` | 800×800 | 15 MB | 72+ | edge | Relaxed checks |

## Strictness

```typescript
validateUpload(file, { mode: 'document', strictness: 'low' })   // permissive
validateUpload(file, { mode: 'document', strictness: 'medium' }) // default
validateUpload(file, { mode: 'document', strictness: 'high' })   // strict
```

| Level | Effect |
|---|---|
| `low` | -8 min score, 1.4x blur threshold, 1.5x file size |
| `medium` | Mode defaults unchanged |
| `high` | +8 min score, 0.65x blur threshold, 0.7x file size |

## PDF Performance Controls

```typescript
validateUpload(file, {
  mode: 'ocr',
  samplePages: 'smart',   // 'first' | 'all' | 'smart' | number[]
  maxRenderScale: 1.5,    // cap render resolution
  timeoutMs: 10000,       // stop analysis after 10s
});
```

## Issue Codes

19 stable codes for business logic. Blocking issues prevent `ok: true`; warnings are informational.

| Code | Severity | Blocking? |
|---|---|---|
| `blurry` | error | yes |
| `too_dark` | error | yes |
| `too_bright` | warning | yes |
| `glare` | warning | yes |
| `low_contrast` | warning | yes |
| `low_resolution` | error | yes |
| `too_large` | error | yes |
| `invalid_file` | error | yes |
| `unsupported_format` | error | yes |
| `blank_image` | error | yes |
| `rotated` | warning | only when `expectedOrientation` set |
| `cropped` | error | yes |
| `perspective_distortion` | warning | yes |
| `corrupted_pdf` | error | yes |
| `corrupted_page` | error | yes |
| `scanned_pdf` | warning | no (informational) |
| `low_text_density` | warning | only in `ocr` / `ai-input` modes |
| `cover_page` | warning | no (informational) |
| `analysis_error` | error | yes |

## Detection Methods

Three detection methods via the `method` option:

- **`edge`** — Pure canvas Sobel filter. Fast, no external deps. Default for document modes.
- **`laplacian`** — OpenCV.js Laplacian variance. High accuracy. Downloads ~8 MB on first use.
- **`both`** — Runs both; blurry if either detects an issue. Falls back to edge if OpenCV fails.

## API

### BlurryCheck Class

```typescript
import { BlurryCheck } from 'blurry-check';

const checker = new BlurryCheck({ method: 'both', edgeWidthThreshold: 0.3 });

await checker.isImageBlurry(imageInput);                          // boolean
await checker.analyzeImage(imageInput);                           // BlurAnalysisResult
await checker.isPDFGoodQuality(pdfFile);                          // boolean
await checker.analyzePDF(pdfFile, { samplePages: 'smart' });     // PDFAnalysisResult
await checker.validateImage(imageInput, { mode: 'document' });   // QualityValidationResult
await checker.validateUpload(file, { mode: 'document' });         // QualityValidationResult
await checker.analyzeFile(file);                                  // auto-detect image vs PDF
```

### Convenience Functions

```typescript
import { validateUpload, validateImage, isImageBlurry, isPDFGoodQuality, analyzeFile } from 'blurry-check';

await validateUpload(file, { mode: 'document', strictness: 'high' });
await validateImage(imageInput, { mode: 'profile-photo' });
await isImageBlurry(imageFile);
await isPDFGoodQuality(pdfFile);
await analyzeFile(file);
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `ValidationMode` | `'general'` | Calibrated preset |
| `strictness` | `'low' \| 'medium' \| 'high'` | `'medium'` | Shift all thresholds |
| `method` | `'edge' \| 'laplacian' \| 'both'` | `'edge'` | Detection method |
| `edgeWidthThreshold` | `number` | varies by mode | Lower = more sensitive |
| `laplacianThreshold` | `number` | `150` | Higher = more sensitive |
| `minScore` | `number` | varies by mode | Minimum 0-100 score |
| `minWidth` / `minHeight` | `number` | varies by mode | Minimum dimensions |
| `maxSizeMB` | `number` | varies by mode | Max file size |
| `allowedTypes` | `string[]` | varies by mode | Allowed MIME types |
| `expectedOrientation` | `'portrait' \| 'landscape' \| 'square'` | none | When set, rotation blocks upload |
| `samplePages` | `'first' \| 'all' \| 'smart' \| number[]` | `'all'` | PDF page sampling |
| `maxRenderScale` | `number` | `2.0` | Max PDF render resolution |
| `timeoutMs` | `number` | `30000` | PDF analysis timeout |
| `debug` | `boolean` | `false` | Console logging |

## Security & Privacy

All analysis runs client-side in the browser. Files are processed directly in memory via the Canvas API and never sent to a server. In React / Next.js, the validation must run on the client (use `'use client'` directive).

## License

MIT © [Idenva](https://idenva.com)

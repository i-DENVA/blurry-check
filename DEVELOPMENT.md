# Development Guide

## Project Structure

```
blurry-check/
├── src/
│   ├── index.ts                     # Entry point, BlurryCheck class, convenience exports
│   ├── blur-detector.ts             # Edge detection + OpenCV Laplacian blur analysis
│   ├── pdf-analyzer.ts              # PDF.js rendering, page metrics, text sharpness
│   ├── opencv-loader.ts             # Singleton OpenCV.js loader
│   ├── filters.ts                   # Canvas Sobel/luminance/convolution filters
│   ├── image-utils.ts               # ImageData extraction from various inputs
│   ├── utils.ts                     # Shared clamp/score/statusFor/makeCheck helpers
│   ├── constants.ts                 # All threshold constants
│   ├── types.ts                     # TypeScript interfaces
│   ├── issue-catalog.ts             # 19 stable issue codes + messages + recommendations
│   ├── mode-config.ts               # 9 mode presets + 3 strictness levels
│   ├── globals.d.ts                 # Ambient window declarations (cv, pdfjsLib)
│   ├── test-setup.ts                # Jest JSDOM mocks
│   ├── validators/
│   │   ├── file-validator.ts        # MIME, extension, magic-byte checks
│   │   ├── image-quality-validator.ts  # Blur/brightness/contrast/resolution/blank checks
│   │   ├── pdf-quality-validator.ts    # Per-page PDF validation
│   │   └── validate-page.ts         # Single PDF page validation logic
│   └── __tests__/
│       ├── blur-detector.test.ts    # Image validator + BlurDetector tests
│       ├── pdf-validator.test.ts    # PDF validator regression tests
│       └── file-validator.test.ts   # File format + spoofed file tests
├── demo/                            # Next.js demo application
├── lib/                             # Built output (ESM, CJS, UMD)
├── package.json
├── rollup.config.js
├── tsconfig.json
└── jest.config.js
```

## Getting Started

```bash
npm install        # Install deps
npm run build      # Build the package
npm test           # Run all 42 tests
npm run typecheck  # TypeScript compiler check
npm run lint       # ESLint
```

## Development Workflow

1. Make changes to source files in `src/`
2. Run `npm test` to verify
3. Run `npm run build` to rebuild the package
4. Test in demo:

```bash
cp -r lib/* demo/src/lib/   # Copy built package into demo
cd demo && npm run dev       # Start Next.js dev server at localhost:3000
```

## Build Outputs

Built by Rollup:

| Format | File | Usage |
|---|---|---|
| ESM | `lib/index.esm.js` | Modern bundlers (webpack, Vite, etc.) |
| CJS | `lib/index.js` | Node.js |
| UMD | `lib/index.umd.js` | Browser `<script>` tags |

## Testing

Jest with JSDOM environment. 42 tests across 3 suites:

```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npx jest blur-detector      # Specific suite
```

## Architecture

### Detection Pipeline

```
User Input (File / ImageData / HTMLImageElement / HTMLCanvasElement)
  → image-utils.ts: getImageDataFromInput()
  → blur-detector.ts: analyzeImage()
    ├── Edge: luminance → Sobel → edge-width scan
    └── Laplacian: cv.cvtColor → cv.Laplacian → variance
```

### Validation Pipeline

```
User File + Options
  → file-validator.ts: MIME/ext/magic-bytes
  → mode-config.ts: resolve mode + strictness defaults
  → image-quality-validator.ts / pdf-quality-validator.ts:
    ├── Resolution, Brightness, Contrast, Blur, Blank
    └── issue-catalog.ts: stable codes → messages + recommendations
  → QualityValidationResult { ok, score, issues, warnings, checks, recommendations }
```

## Publishing

1. Update version in `package.json`
2. `npm run build && npm test`
3. `npm publish`

## License

MIT

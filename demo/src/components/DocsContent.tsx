'use client'

import { CodeBlock } from './CodeBlock'

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel p-5 sm:p-6 space-y-4">
      <h2 className="text-xl font-black tracking-tight border-b-2 border-[var(--color-border)] pb-3">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--color-muted)]">{title}</h3>
      {children}
    </div>
  )
}

function Table({ rows }: { rows: Array<{ prop: string; type: string; default: string; description?: string }> }) {
  return (
    <div className="overflow-x-auto border-2 border-[var(--color-border)] rounded">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-[var(--color-surface)] border-b-2 border-[var(--color-border)]">
            <th className="text-left p-2 sm:p-3 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs">Property</th>
            <th className="text-left p-2 sm:p-3 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs">Type</th>
            <th className="text-left p-2 sm:p-3 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs">Default</th>
            <th className="text-left p-2 sm:p-3 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs hidden sm:table-cell">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
              <td className="p-2 sm:p-3 font-mono font-bold">{row.prop}</td>
              <td className="p-2 sm:p-3 text-[var(--color-muted)]">{row.type}</td>
              <td className="p-2 sm:p-3 font-mono text-[var(--color-muted)]">{row.default}</td>
              <td className="p-2 sm:p-3 hidden sm:table-cell">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DocsContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Documentation</h1>
        <p className="text-[var(--color-muted)]">
          Everything you need to integrate pre-upload quality validation into your application.
        </p>
      </div>

      <Section id="installation" title="Installation">
        <CodeBlock code={`npm install blurry-check`} />
        <div className="panel-inset p-4 text-sm space-y-2">
          <p className="font-bold uppercase tracking-wider text-xs">Privacy-first design</p>
          <ul className="list-disc pl-4 space-y-1 text-[var(--color-muted)]">
            <li>All analysis runs client-side in the browser.</li>
            <li>Files do not need to leave the user&apos;s device.</li>
            <li>No telemetry, no server uploads, no external file processing.</li>
            <li>React / Next.js usage must run on the client via <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">&apos;use client&apos;</code>.</li>
          </ul>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          The package requires a browser environment with canvas support. For Node.js server-side use, install the
          optional <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">canvas</code> peer dependency.
        </p>
        <CodeBlock code={`npm install canvas  # optional, for Node.js environments`} />
      </Section>

      <Section id="quick-start" title="Quick Start">
        <p className="text-sm">The fastest way to validate an upload before it reaches your server:</p>
        <CodeBlock code={`import { validateUpload } from 'blurry-check'

const input = document.querySelector('input[type="file"]')
input.addEventListener('change', async (e) => {
  const file = e.target.files[0]

  // All analysis runs client-side — the file never leaves the browser
  const result = await validateUpload(file, {
    mode: 'document',
    strictness: 'high',
    minScore: 75,
  })

  if (!result.ok) {
    showError(result.message)          // "Image is blurry and too dark."
    showTips(result.recommendations)   // Specific fix suggestions
    return
  }

  uploadToServer(file)
})`} />
      </Section>

      <Section id="core-modules" title="Core Modules">
        <SubSection title="BlurryCheck">
          <p className="text-sm text-[var(--color-muted)]">The main class. Create one instance and reuse it across multiple file checks.</p>
          <CodeBlock code={`import { BlurryCheck } from 'blurry-check'

const checker = new BlurryCheck({
  method: 'both',
  edgeWidthThreshold: 0.3,
  laplacianThreshold: 150,
  debug: false,
})

const isBlurry = await checker.isImageBlurry(imageFile)
const analysis = await checker.analyzeImage(imageFile)
const pdfResult = await checker.analyzePDF(pdfFile)
const validation = await checker.validateUpload(file, { preset: 'general' })
}`} />
        </SubSection>

        <SubSection title="BlurDetector">
          <p className="text-sm text-[var(--color-muted)]">Low-level blur detection. Exposes edge detection and OpenCV Laplacian methods directly.</p>
          <CodeBlock code={`import { BlurDetector } from 'blurry-check'

const detector = new BlurDetector({ method: 'both' })
const result = await detector.analyzeImage(imageInput)
console.log(result.isBlurry, result.confidence, result.metrics)`} />
        </SubSection>

        <SubSection title="PDFAnalyzer">
          <p className="text-sm text-[var(--color-muted)]">Full PDF quality analysis with multi-scale rendering, text sharpness, and document frame detection.</p>
          <CodeBlock code={`import { PDFAnalyzer } from 'blurry-check'

const analyzer = new PDFAnalyzer({ method: 'edge', edgeWidthThreshold: 0.25 })
const result = await analyzer.analyzePDF(pdfFile)
console.log(result.isQualityGood, result.isScanned, result.pagesAnalyzed)`} />
        </SubSection>

        <SubSection title="Validators">
          <p className="text-sm text-[var(--color-muted)]">High-level upload validation with friendly user feedback.</p>
          <CodeBlock code={`import { validateImage, validateUpload } from 'blurry-check'

// Image-only validation
const imageResult = await validateImage(imageInput, {
  preset: 'profile-photo',
  minWidth: 400,
  minHeight: 400,
})

// Auto-detect image or PDF
const uploadResult = await validateUpload(file, {
  preset: 'document-scan',
  minScore: 75,
})`} />
        </SubSection>
      </Section>

      <Section id="configuration" title="Configuration">
        <p className="text-sm text-[var(--color-muted)]">All available configuration options for <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">BlurryCheck</code> and the validator functions.</p>
        <Table rows={[
          { prop: 'method', type: '"edge" | "laplacian" | "both"', default: '"both"', description: 'Detection method' },
          { prop: 'edgeWidthThreshold', type: 'number', default: '0.3', description: 'Lower = more sensitive to blur' },
          { prop: 'laplacianThreshold', type: 'number', default: '150', description: 'Higher = more sensitive to blur' },
          { prop: 'openCvUrl', type: 'string', default: 'OpenCV CDN', description: 'Custom OpenCV.js URL' },
          { prop: 'canvas', type: 'HTMLCanvasElement', default: 'auto-created', description: 'Custom canvas for processing' },
          { prop: 'debug', type: 'boolean', default: 'false', description: 'Enable console debug logging' },
          { prop: 'minScore', type: 'number', default: '70', description: 'Minimum 0–100 score threshold' },
          { prop: 'minWidth', type: 'number', default: '600', description: 'Minimum image width' },
          { prop: 'minHeight', type: 'number', default: '600', description: 'Minimum image height' },
          { prop: 'maxWidth', type: 'number', default: 'none', description: 'Maximum image width' },
          { prop: 'maxHeight', type: 'number', default: 'none', description: 'Maximum image height' },
          { prop: 'maxSizeMB', type: 'number', default: '10', description: 'Maximum file size in MB' },
          { prop: 'mode', type: 'ValidationMode', default: "'general'", description: 'Calibrated preset for common uploads' },
          { prop: 'strictness', type: '"low" | "medium" | "high"', default: "'medium'", description: 'Shifts all thresholds stricter or more permissive' },
          { prop: 'maxPages', type: 'number', default: 'no limit', description: 'Max pages to analyze in PDFs' },
          { prop: 'samplePages', type: '"first" | "all" | "smart" | number[]', default: '"all"', description: 'Page sampling strategy for large PDFs' },
          { prop: 'maxRenderScale', type: 'number', default: '2.0', description: 'Maximum PDF render scale cap' },
          { prop: 'timeoutMs', type: 'number', default: '30000', description: 'Analysis timeout in milliseconds' },
        ]} />
      </Section>

      <Section id="modes" title="Validation Modes">
        <p className="text-sm text-[var(--color-muted)]">
          Modes apply calibrated defaults for common upload workflows. Use <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">strictness</code> to shift thresholds per mode.
          The deprecated <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">preset</code> option is mapped to the closest mode internally.
        </p>
        <Table rows={[
          { prop: 'general', type: 'mode', default: '—', description: '600×600 min, 10MB, score 70+, method: both' },
          { prop: 'document', type: 'mode', default: '—', description: '1000×1000 min, 15MB, score 78+, method: edge, orientation check' },
          { prop: 'receipt', type: 'mode', default: '—', description: '800×800 min, 10MB, score 72+, method: edge' },
          { prop: 'invoice', type: 'mode', default: '—', description: '1000×1000 min, 15MB, score 78+, method: edge, orientation check' },
          { prop: 'id-card', type: 'mode', default: '—', description: '900×600 min, 10MB, score 80+, method: edge, landscape' },
          { prop: 'passport', type: 'mode', default: '—', description: '900×600 min, 8MB, score 82+, method: edge, threshold 0.22' },
          { prop: 'profile-photo', type: 'mode', default: '—', description: '400×400 min, 8MB, score 75+, jpg/png/webp, method: both' },
          { prop: 'ocr', type: 'mode', default: '—', description: '1200×1200 min, 20MB, score 80+, method: edge, threshold 0.18' },
          { prop: 'ai-input', type: 'mode', default: '—', description: '800×800 min, 15MB, score 72+, method: edge, relaxed checks' },
        ]} />
      </Section>

      <Section id="image-checks" title="Image Checks">
        <p className="text-sm text-[var(--color-muted)]">Each image check returns its own <code className="font-mono font-bold bg-[var(--color-surface)] px-1 rounded">QualityCheckResult</code> with status, score, and a user-facing message.</p>
        <Table rows={[
          { prop: 'blur', type: '', default: '', description: 'Sobel edge analysis or OpenCV Laplacian. Detects blurry and out-of-focus images.' },
          { prop: 'brightness', type: '', default: '', description: 'Luminance mean across all pixels. Ideal range: 80–210. Flags under/overexposure.' },
          { prop: 'contrast', type: '', default: '', description: 'Standard deviation of luminance. Flags washed-out or flat images below 28.' },
          { prop: 'resolution', type: '', default: '', description: 'Enforces min/max width and height. Prevents low-res uploads.' },
          { prop: 'fileSize', type: '', default: '', description: 'Checks file size against maxSizeMB or maxSizeBytes.' },
          { prop: 'format', type: '', default: '', description: 'Validates MIME type, extension, and binary magic bytes.' },
        ]} />
      </Section>

      <Section id="pdf-checks" title="PDF Checks">
        <p className="text-sm text-[var(--color-muted)]">PDF validation includes per-page metrics and document-level checks.</p>
        <Table rows={[
          { prop: 'scanned', type: '', default: '', description: 'Detects whether the PDF is scanned (image-based) or has extractable digital text.' },
          { prop: 'sharpness', type: '', default: '', description: 'Per-page blur analysis using multi-scale rendering and text region sampling.' },
          { prop: 'textDensity', type: '', default: '', description: 'Warns when a page has very little extractable text. Exempts certificate documents.' },
          { prop: 'orientation', type: '', default: '', description: 'Detects portrait vs landscape vs square. Flags unexpected rotations.' },
          { prop: 'corruptedPages', type: '', default: '', description: 'Tracks pages that could not be rendered or analyzed.' },
          { prop: 'mobileCapture', type: '', default: '', description: 'Detects missing document edges and perspective distortion from angled camera shots.' },
          { prop: 'pageResolution', type: '', default: '', description: 'Minimum dimension check per rendered page.' },
          { prop: 'brightness', type: '', default: '', description: 'Per-page luminance analysis.' },
          { prop: 'contrast', type: '', default: '', description: 'Per-page luminance standard deviation.' },
        ]} />
      </Section>

      <Section id="examples" title="Real-World Examples">
        <SubSection title="Profile Photo Upload">
          <CodeBlock code={`import { validateImage } from 'blurry-check'

async function handleProfilePhoto(file: File) {
  // Runs client-side — file never leaves the browser
  const result = await validateImage(file, {
    mode: 'profile-photo',
    strictness: 'high',
    minWidth: 400,
    minHeight: 400,
    maxSizeMB: 8,
  })

  if (!result.ok) {
    return { error: result.message, tips: result.recommendations }
  }

  return { success: true }
}`} />
        </SubSection>

        <SubSection title="Document Scan Upload">
          <CodeBlock code={`import { validateUpload } from 'blurry-check'

async function handleDocument(file: File) {
  const result = await validateUpload(file, {
    mode: 'document',
    strictness: 'high',
    minScore: 78,
  })

  if (!result.ok) {
    return { error: result.message, issues: result.issues }
  }

  return { success: true }
}`} />
        </SubSection>

        <SubSection title="Receipt Upload">
          <CodeBlock code={`import { validateUpload } from 'blurry-check'

async function handleReceipt(file: File) {
  const result = await validateUpload(file, {
    mode: 'receipt',
    strictness: 'medium',
    minScore: 72,
  })

  if (!result.ok) {
    showError(result.message)
    showRecommendations(result.recommendations)
    return
  }

  uploadReceipt(file)
}`} />
        </SubSection>

        <SubSection title="KYC / ID Card">
          <CodeBlock code={`import { validateImage } from 'blurry-check'

async function handleIDCard(file: File) {
  const result = await validateImage(file, {
    mode: 'id-card',
    strictness: 'high',
    minScore: 80,
  })

  if (!result.ok) {
    return { rejected: true, reason: result.message }
  }

  return { accepted: true }
}`} />
        </SubSection>

        <SubSection title="PDF OCR Preflight">
          <CodeBlock code={`import { validateUpload } from 'blurry-check'

async function preflightPDF(file: File) {
  const result = await validateUpload(file, {
    mode: 'ocr',
    strictness: 'high',
    samplePages: 'smart',
    timeoutMs: 10000,
  })

  if (result.type !== 'pdf') {
    return { error: 'Not a PDF file' }
  }

  // Check for issues that would block OCR
  const ocrBlockers = result.issues.filter(i =>
    ['blurry', 'too_dark', 'low_contrast', 'rotated', 'corrupted_page'].includes(i)
  )

  return {
    ready: ocrBlockers.length === 0,
    score: result.score,
    issues: result.issues,
    pages: result.pages,
  }
}`} />
        </SubSection>
      </Section>
    </div>
  )
}

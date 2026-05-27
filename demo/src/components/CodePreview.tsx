'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, X } from 'lucide-react'
import type { QualityValidationResult } from '../lib/types'

interface Props {
  result: QualityValidationResult
  config?: unknown
  onClose: () => void
}

type Tab = 'validateUpload' | 'validateImage' | 'analyzePDF' | 'react'

const TAB_LABELS: Record<Tab, string> = {
  validateUpload: 'validateUpload',
  validateImage: 'validateImage',
  analyzePDF: 'analyzePDF',
  react: 'React Example',
}

const SNIPPETS: Record<Tab, (result?: QualityValidationResult, config?: unknown) => string> = {
  validateUpload: (result) => `import { validateUpload } from 'blurry-check'

// Detect type automatically — works for images and PDFs
// Supports mode (calibrated defaults) and strictness (low/medium/high)
const result = await validateUpload(file, {
  mode: 'document',
  strictness: 'high',
  minScore: 75,
  minWidth: 1000,
  minHeight: 1000,
  maxSizeMB: 10,
})

// Response shape:
${JSON.stringify({
    valid: result?.valid ?? false,
    ok: result?.ok ?? false,
    status: result?.status ?? 'pass',
    score: result?.score ?? 72,
    message: result?.message ?? '...',
    type: result?.type ?? 'image',
    issues: result?.issues ?? [],
    recommendations: result?.recommendations?.slice(0, 2) ?? [],
    checks: Object.keys(result?.checks ?? {}).reduce((acc, k) => {
      const c = result?.checks?.[k as keyof typeof result.checks]
      if (!c) return acc
      return { ...acc, [k]: { ok: c.ok, status: c.status, score: c.score } }
    }, {} as Record<string, unknown>),
  }, null, 2)}`,

  validateImage: (result, config) => {
    const cfg = (config && typeof config === 'object' ? config : {}) as Record<string, unknown>
    const threshold = cfg.edgeWidthThreshold ?? 0.3
    const method = cfg.method ?? 'both'
    return `import { validateImage, BlurryCheck } from 'blurry-check'

// Option 1: Convenience function
const result = await validateImage(imageInput, {
  mode: 'general',
  strictness: 'medium',
  method: '${method}',
  edgeWidthThreshold: ${threshold},
})

// Option 2: Instance-based
const checker = new BlurryCheck({
  method: '${method}',
  edgeWidthThreshold: ${threshold},
})

const result2 = await checker.validateImage(imageInput, {
  mode: 'profile-photo',
  strictness: 'high',
})

// result.ok       — should the file be accepted?
// result.score     — 0–100 quality score
// result.issues    — stable issue codes
// result.checks    — per-metric results`
  },

  analyzePDF: () => `import { BlurryCheck } from 'blurry-check'

const checker = new BlurryCheck({
  method: 'edge',
  edgeWidthThreshold: 0.25,
})

// Full PDF quality analysis
const pdfResult = await checker.analyzePDF(file)

console.log(pdfResult.isQualityGood)  // boolean
console.log(pdfResult.isScanned)      // scanned vs digital
console.log(pdfResult.pagesAnalyzed)  // page count

// Per-page blur results
pdfResult.pageResults?.forEach((page, i) => {
  console.log(\`Page \${i + 1}: \${page.isBlurry ? 'Blurry' : 'Clear'}\`)
})

// Or use the validator for upload gating
const validation = await checker.validateUpload(file, {
  preset: 'document-scan',
  minScore: 75,
})

if (!validation.ok) {
  console.log(validation.recommendations)
}`,

  react: () => `import React, { useState, useCallback } from 'react'
import { validateUpload } from 'blurry-check'
import type { QualityValidationResult } from 'blurry-check'

export function FileUploader() {
  const [result, setResult] = useState<QualityValidationResult | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // All analysis runs client-side — file never leaves the browser
    const validation = await validateUpload(file, {
      mode: 'document',
      strictness: 'high',
      minScore: 75,
      minWidth: 1000,
      minHeight: 1000,
      maxSizeMB: 10,
    })

    setResult(validation)
    setUploading(false)

    if (!validation.ok) {
      alert(validation.message)
      return
    }

    // Proceed with upload...
  }, [])

  return (
    <div>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        disabled={uploading}
      />
      {result && (
        <div>
          <p>Score: {result.score}/100 — {result.message}</p>
          {result.issues.length > 0 && (
            <p>Issues: {result.issues.join(', ')}</p>
          )}
          <ul>
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}`,
}

export default function CodePreview({ result, config, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('validateUpload')
  const [copied, setCopied] = useState(false)

  const code = SNIPPETS[activeTab](result, config)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="code-window w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="code-window-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="code-window-dot" style={{ backgroundColor: '#ef4444' }} />
            <span className="code-window-dot" style={{ backgroundColor: '#eab308' }} />
            <span className="code-window-dot" style={{ backgroundColor: '#22c55e' }} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn-secondary p-1.5" title="Copy code">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="btn-secondary p-1.5" title="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex px-3 pt-3 gap-1 border-b-2 border-[var(--color-border)] bg-[var(--color-surface)]">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-auto flex-1">
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {code}
          </pre>
        </div>
      </div>
    </div>
  )
}

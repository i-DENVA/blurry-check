'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileImage, FileText, Loader2, RefreshCw } from 'lucide-react'
import { BlurryCheck } from '../lib/index.esm.js'
import type { QualityValidationResult } from '../lib/types'
import ConfigPanel, { type ConfigPanelData } from './ConfigPanel'
import ValidationResults from './ValidationResults'

const DEFAULT_CONFIG: ConfigPanelData = {
  mode: 'general', strictness: 'medium', method: 'both',
  edgeWidthThreshold: 0.3, laplacianThreshold: 150, minScore: 72,
  maxSizeMB: 10, minWidth: 600, minHeight: 600, maxRenderScale: 2.0,
  expectedOrientation: 'auto',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadWorkbench() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<QualityValidationResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true)
    try {
      const checker = new BlurryCheck({ method: config.method, edgeWidthThreshold: config.edgeWidthThreshold, laplacianThreshold: config.laplacianThreshold, debug: false })
      const r = await checker.validateUpload(file, {
        mode: config.mode, strictness: config.strictness, minScore: config.minScore,
        minWidth: config.minWidth, minHeight: config.minHeight,
        maxSizeMB: config.maxSizeMB, maxRenderScale: config.maxRenderScale,
        expectedOrientation: config.expectedOrientation === 'auto' ? undefined : config.expectedOrientation as any,
      }) as QualityValidationResult
      setResult(r)
    } catch (error) {
      setResult({ valid: false, ok: false, status: 'fail', score: 0,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: selectedFile?.type.startsWith('image/') ? 'image' : 'pdf',
        checks: {}, recommendations: [], issues: ['analysis_error'], warnings: [] })
    } finally { setIsAnalyzing(false) }
  }, [config])

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file); setResult(null)
    if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file))
    else setPreviewUrl(null)
  }, [])

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { handleFile(file); analyzeFile(file) }
  }, [handleFile, analyzeFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (file) { handleFile(file); analyzeFile(file) }
  }, [handleFile, analyzeFile])

  const isPDF = selectedFile?.type === 'application/pdf' || selectedFile?.name?.toLowerCase().endsWith('.pdf')

  return (
    <section id="workbench" aria-labelledby="demo-heading" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t-[3px] border-[var(--color-border)]">
      <div className="text-center mb-10">
        <h2 id="demo-heading" className="text-2xl sm:text-3xl font-black tracking-tight">Try It Yourself</h2>
        <p className="mt-3 text-[var(--color-muted)]">Upload an image or PDF to see real-time quality validation.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
          <div className={`panel p-8 text-center cursor-pointer transition-colors ${dragOver ? 'bg-[var(--color-surface)]' : ''}`}
            onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
            aria-label="Select a file to analyze">
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleSelect} className="hidden" aria-hidden="true" />
            {isAnalyzing ? (
              <div className="space-y-3"><Loader2 className="w-10 h-10 mx-auto animate-spin" /><p className="font-semibold text-sm">Analyzing...</p></div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-10 h-10 mx-auto opacity-40" />
                <div><span className="btn-primary text-sm">Select a File</span><p className="text-xs text-[var(--color-muted)] mt-2">or drag and drop</p></div>
                <p className="text-xs text-[var(--color-muted)]">JPG, PNG, GIF, BMP, WebP, PDF</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="panel p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded border-2 border-[var(--color-border)] bg-[var(--color-surface)]">
                  {isPDF ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatSize(selectedFile.size)}</p>
                </div>
                {result && <button onClick={() => analyzeFile(selectedFile)} title="Re-check" className="btn-secondary p-2"><RefreshCw className="w-4 h-4" /></button>}
              </div>
              {previewUrl && (
                <div className="mt-3 border-2 border-[var(--color-border)] rounded overflow-hidden bg-[var(--color-surface)]">
                  <img src={previewUrl} alt={`Preview of ${selectedFile.name}`} className="w-full h-48 object-contain" />
                </div>
              )}
            </div>
          )}

          <ConfigPanel
            config={config}
            onChangeMode={v => setConfig(c => ({ ...c, mode: v }))}
            onChange={patch => setConfig(c => ({ ...c, ...patch }))}
          />

          {selectedFile && !isAnalyzing && (
            <button onClick={() => analyzeFile(selectedFile)} className="btn-primary w-full py-3 text-base">
              {result ? 'Re-check File' : 'Analyze File'}
            </button>
          )}
        </div>

        <div>
          {result ? <ValidationResults result={result} config={config} />
            : <div className="panel p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                <svg className="w-12 h-12 opacity-20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9" /><rect x="10" y="7" width="4" height="14" /><rect x="17" y="3" width="4" height="18" /></svg>
                <p className="text-[var(--color-muted)] text-sm">Select a file and click Analyze to see results.</p>
              </div>}
        </div>
      </div>
    </section>
  )
}

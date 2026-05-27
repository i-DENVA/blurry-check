'use client'

import { useState } from 'react'
import { Settings, ChevronDown } from 'lucide-react'

type DetectionMethod = 'edge' | 'laplacian' | 'both'
type Strictness = 'low' | 'medium' | 'high'

export interface ConfigPanelData {
  mode: string
  strictness: Strictness
  method: DetectionMethod
  edgeWidthThreshold: number
  laplacianThreshold: number
  minScore: number
  maxSizeMB: number
  minWidth: number
  minHeight: number
  maxRenderScale: number
  expectedOrientation: string
}

interface Props {
  config: ConfigPanelData
  onChangeMode: (v: string) => void
  onChange: (patch: Partial<ConfigPanelData>) => void
}

const MODES = ['general', 'document', 'receipt', 'invoice', 'id-card', 'passport', 'profile-photo', 'ocr', 'ai-input']

export default function ConfigPanel({ config, onChangeMode, onChange }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel-inset p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-bold">
        <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Configuration</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <Select label="Mode" value={config.mode} onChange={onChangeMode} options={MODES} />
          <Select label="Strictness" value={config.strictness} onChange={v => onChange({ strictness: v as Strictness })} options={['low', 'medium', 'high']} />
          <Select label="Detection Method" value={config.method} onChange={v => onChange({ method: v as DetectionMethod })} options={['edge', 'laplacian', 'both']} />
          <Slider label="Blur Sensitivity" value={config.edgeWidthThreshold} min={0.1} max={2} step={0.1} onChange={v => onChange({ edgeWidthThreshold: v })} unit="" hint="Lower = more sensitive" />
          <Slider label="Laplacian Threshold" value={config.laplacianThreshold} min={50} max={300} step={10} onChange={v => onChange({ laplacianThreshold: v })} unit="" hint="Higher = more sensitive" />
          <Slider label="Minimum Score" value={config.minScore} min={0} max={100} step={1} onChange={v => onChange({ minScore: v })} unit="" />
          <Slider label="Max File Size" value={config.maxSizeMB} min={1} max={50} step={1} onChange={v => onChange({ maxSizeMB: v })} unit=" MB" />
          <Dimension label="Min Width" value={config.minWidth} onChange={v => onChange({ minWidth: v })} />
          <Dimension label="Min Height" value={config.minHeight} onChange={v => onChange({ minHeight: v })} />
          <Slider label="PDF Render Scale" value={config.maxRenderScale} min={1} max={3} step={0.5} onChange={v => onChange({ maxRenderScale: v })} unit="x" hint="Higher = more accurate but slower" />
          <Select label="Expected PDF Orientation" value={config.expectedOrientation} onChange={v => onChange({ expectedOrientation: v })} options={['auto', 'portrait', 'landscape', 'square']} />
        </div>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full p-2 text-sm bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded font-medium">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, unit, hint }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string; hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono font-bold tabular-nums">{typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit ?? ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
      {hint && <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{hint}</p>}
    </div>
  )
}

function Dimension({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1 uppercase tracking-wider">{label}</label>
      <input type="number" min={0} value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full p-2 text-sm bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded font-mono font-bold"       />
    </div>
  )
}


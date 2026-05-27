'use client'

import { ArrowRight } from 'lucide-react'

const BADGES = ['Edge Detection', 'OpenCV Laplacian', 'Multi-page PDF', 'Pre-upload Checks', 'TypeScript', 'Framework Agnostic']

export default function HeroShowcase() {
  const scrollToDemo = () => {
    document.getElementById('workbench')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
          Upload Quality Validation
          <br />
          <span className="text-[var(--color-muted)]">for Images &amp; PDFs</span>
        </h1>

        <p className="text-base sm:text-lg max-w-2xl mx-auto text-[var(--color-muted)] leading-relaxed">
          Browser-side blur detection, sharpness analysis, resolution limits, and format checks —
          <br className="hidden sm:block" />
          validate files before they reach your server.
        </p>

        <div className="pt-4">
          <div className="code-window max-w-lg mx-auto" role="figure" aria-label="Install command">
            <div className="code-window-header">
              <span className="code-window-dot" style={{ backgroundColor: '#ef4444' }} />
              <span className="code-window-dot" style={{ backgroundColor: '#eab308' }} />
              <span className="code-window-dot" style={{ backgroundColor: '#22c55e' }} />
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto">
              <span className="text-[var(--color-muted)]">$ </span>
              <span className="font-semibold">npm install blurry-check</span>
            </div>
          </div>
        </div>

        <ul className="flex flex-wrap justify-center gap-2 pt-2" aria-label="Key features">
          {BADGES.map((badge) => (
            <li key={badge}><span className="badge">{badge}</span></li>
          ))}
        </ul>

        <div className="pt-4">
          <button onClick={scrollToDemo} className="btn-primary text-base px-8 py-3" aria-label="Scroll to interactive demo">
            Try the Demo <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

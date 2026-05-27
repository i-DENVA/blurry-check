'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="code-window my-4">
      <div className="code-window-header flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="code-window-dot" style={{ backgroundColor: '#ef4444' }} />
          <span className="code-window-dot" style={{ backgroundColor: '#eab308' }} />
          <span className="code-window-dot" style={{ backgroundColor: '#22c55e' }} />
        </div>
        <button onClick={handleCopy} className="btn-secondary p-1.5" title="Copy code">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  )
}

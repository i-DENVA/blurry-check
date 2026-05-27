'use client';

import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Code2,
} from 'lucide-react';
import type { QualityValidationResult, QualityCheckResult } from '../lib/types';
import CodePreview from './CodePreview';

interface Props {
  result: QualityValidationResult;
  config?: unknown;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'pass') return <CheckCircle className="w-4 h-4" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4" />;
  return <XCircle className="w-4 h-4" />;
}

function getStatusColor(status: string) {
  if (status === 'pass') return 'pass';
  if (status === 'warning') return 'warning';
  return 'fail';
}

export default function ValidationResults({ result, config }: Props) {
  const [showJSON, setShowJSON] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Record<number, boolean>>({});

  const togglePage = (page: number) => {
    setExpandedPages((prev) => ({ ...prev, [page]: !prev[page] }));
  };

  const checks = Object.entries(result.checks).filter(([_, v]) => v) as [
    string,
    QualityCheckResult,
  ][];

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--color-surface-alt)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={result.ok ? '#84cc16' : result.status === 'warning' ? '#eab308' : '#ef4444'}
                strokeWidth="4"
                strokeDasharray={`${(result.score / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-black text-lg tabular-nums">{result.score}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon status={result.status} />
              <span
                className={`font-extrabold text-sm uppercase tracking-wider ${
                  result.ok
                    ? 'text-[var(--color-success-fg)]'
                    : result.status === 'warning'
                      ? 'text-[var(--color-warning-fg)]'
                      : 'text-[var(--color-error-fg)]'
                }`}
              >
                {result.ok
                  ? 'Ready to Upload'
                  : result.status === 'warning'
                    ? 'Needs Review'
                    : 'Needs Retake'}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium leading-snug">{result.message}</p>
            {result.type && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold">
                {result.type}{' '}
                {result.width && result.height ? `${result.width}×${result.height}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {result.issues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.issues.map((issue) => (
            <span
              key={issue}
              className="badge bg-[var(--color-error-bg)] text-[var(--color-error-fg)] border-[var(--color-error-fg)]"
            >
              {issue.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {'warnings' in result && Array.isArray(result.warnings) && result.warnings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.warnings.map((warning) => (
            <span
              key={warning}
              className="badge bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)] border-[var(--color-warning-fg)]"
            >
              {String(warning).replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {checks.length > 0 && (
        <div className="result-grid">
          {checks.map(([name, check]) => (
            <div key={name} className={`check-card ${getStatusColor(check.status)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold capitalize">
                  {name === 'file' ? 'Format' : name}
                </span>
                <span className="text-xs font-mono font-bold tabular-nums">{check.score}/100</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <StatusIcon status={check.status} />
                <p className="text-xs leading-tight">{check.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="panel p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.pages && result.pages.length > 0 && (
        <div className="panel p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3">
            Page Validation ({result.pages.length} {result.pages.length === 1 ? 'page' : 'pages'})
          </h4>
          <div className="space-y-1">
            {result.pages.map((page) => (
              <div key={page.page}>
                <button
                  onClick={() => togglePage(page.page)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium rounded border-2 border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedPages[page.page] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Page {page.page}</span>
                    {page.orientation && (
                      <span className="text-xs text-[var(--color-muted)] capitalize">
                        {page.orientation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold tabular-nums ${
                        page.ok
                          ? 'text-[var(--color-success-fg)]'
                          : page.status === 'warning'
                            ? 'text-[var(--color-warning-fg)]'
                            : 'text-[var(--color-error-fg)]'
                      }`}
                    >
                      {page.score}/100
                    </span>
                  </div>
                </button>
                {expandedPages[page.page] && (
                  <div className="mt-1 p-3 border-2 border-[var(--color-border)] rounded bg-[var(--color-surface)] space-y-2">
                    <p className="text-xs">{page.message}</p>
                    {page.issues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {page.issues.map((issue) => (
                          <span
                            key={issue}
                            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-error-bg)] text-[var(--color-error-fg)]"
                          >
                            {issue.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {page.width && page.height && (
                      <p className="text-xs text-[var(--color-muted)]">
                        {page.width}×{page.height}{' '}
                        {page.rotation ? `rotated ${page.rotation}°` : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.blurAnalysis?.metrics.edgeAnalysis && (
        <div className="panel p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Blur Details</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[var(--color-muted)]">Edges</span>
              <p className="font-bold">{result.blurAnalysis.metrics.edgeAnalysis.numEdges}</p>
            </div>
            <div className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[var(--color-muted)]">Edge Width</span>
              <p className="font-bold">
                {result.blurAnalysis.metrics.edgeAnalysis.avgEdgeWidthPerc.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {result.pdfAnalysis && (
        <div className="panel p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3">PDF Details</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[var(--color-muted)]">Pages</span>
              <p className="font-bold">{result.pdfAnalysis.pagesAnalyzed}</p>
            </div>
            <div className="p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[var(--color-muted)]">Type</span>
              <p className="font-bold">{result.pdfAnalysis.isScanned ? 'Scanned' : 'Digital'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setShowJSON(!showJSON)} className="btn-secondary text-xs">
          {showJSON ? 'Hide JSON' : 'View Raw JSON'}
        </button>
        <button onClick={() => setShowCode(true)} className="btn-secondary text-xs">
          <Code2 className="w-3.5 h-3.5" /> View Code
        </button>
      </div>

      {showJSON && (
        <div className="code-window overflow-hidden">
          <div className="code-window-header">
            <span className="code-window-dot" style={{ backgroundColor: '#ef4444' }} />
            <span className="code-window-dot" style={{ backgroundColor: '#eab308' }} />
            <span className="code-window-dot" style={{ backgroundColor: '#22c55e' }} />
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {showCode && (
        <CodePreview result={result} config={config} onClose={() => setShowCode(false)} />
      )}
    </div>
  );
}

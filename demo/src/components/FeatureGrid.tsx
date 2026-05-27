import { Eye, FileText, BarChart3, Brain, Sliders, Puzzle } from 'lucide-react';

const FEATURES = [
  {
    icon: Eye,
    title: 'Blur Detection',
    description:
      'Sobel edge analysis and OpenCV Laplacian variance. Catch blurry photos before they enter your pipeline.',
  },
  {
    icon: FileText,
    title: 'PDF Quality',
    description:
      'Per-page rendering at multiple scales. Text sharpness, orientation checks, and document frame analysis.',
  },
  {
    icon: BarChart3,
    title: 'Upload Validation',
    description:
      'Brightness, contrast, resolution, file size, MIME type, and magic-byte checks — all in the browser.',
  },
  {
    icon: Brain,
    title: 'Smart Analysis',
    description:
      'Automatic certificate exemption. First-page leniency for multi-page docs. No false positives from logos.',
  },
  {
    icon: Sliders,
    title: 'Fully Configurable',
    description:
      'Thresholds, detection methods, presets for common upload flows — general, KYC, receipts, and more.',
  },
  {
    icon: Puzzle,
    title: 'Framework Agnostic',
    description:
      'Works with React, Vue, Angular, Qwik, and vanilla JS. Tree-shakeable with zero framework dependencies.',
  },
];

export default function FeatureGrid() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-12">
        <h2 id="features-heading" className="text-2xl sm:text-3xl font-black tracking-tight">
          Everything You Need
        </h2>
        <p className="mt-3 text-[var(--color-muted)] max-w-lg mx-auto">
          A complete pre-upload quality toolkit that runs entirely in the browser.
        </p>
      </div>

      <ul id="features" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="panel p-5 space-y-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded border-2 border-[var(--color-border)] bg-[var(--color-surface)]"
              aria-hidden="true"
            >
              <feature.icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">{feature.title}</h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {feature.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

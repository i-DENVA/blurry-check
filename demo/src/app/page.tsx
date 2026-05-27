import HeroShowcase from '@/components/HeroShowcase';
import FeatureGrid from '@/components/FeatureGrid';
import UploadWorkbench from '@/components/UploadWorkbench';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <header aria-label="Hero">
        <HeroShowcase />
      </header>

      <main>
        <section aria-labelledby="features-heading">
          <FeatureGrid />
        </section>

        <section aria-labelledby="demo-heading">
          <UploadWorkbench />
        </section>
      </main>

      <footer
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center space-y-2 border-t-[3px] border-[var(--color-border)]"
        role="contentinfo"
      >
        <p className="text-sm text-[var(--color-muted)]">
          Maintained by{' '}
          <a
            href="https://idenva.com"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-bold hover:underline"
          >
            Idenva.com
          </a>
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          <a
            href="https://github.com/i-DENVA/blurry-check"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            GitHub
          </a>{' '}
          &middot;{' '}
          <Link href="/docs" className="font-medium hover:underline">
            Documentation
          </Link>
        </p>
      </footer>
    </>
  );
}

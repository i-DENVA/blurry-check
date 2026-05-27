'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Github } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { label: 'Demo', href: '#workbench' },
  { label: 'Docs', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com/i-DENVA/blurry-check', external: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-bg)] border-b-[3px] border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-black tracking-tight font-mono">Blurry Check</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="btn-secondary p-2"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t-2 border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded border-2 border-transparent hover:border-[var(--color-border)] transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium rounded border-2 border-transparent hover:border-[var(--color-border)] transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

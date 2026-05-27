import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import JsonLd from './jsonld';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://blurry-check-demo.vercel.app'),
  title: {
    default: 'Blurry Check — Pre-upload Quality Validation for Images & PDFs',
    template: '%s | Blurry Check',
  },
  description:
    'Browser-side quality validation for images and PDFs. Detect blurry photos, analyze PDF sharpness, enforce resolution limits, validate file formats — all before upload. Framework-agnostic with React, Vue, Angular, and vanilla JS support.',
  keywords: [
    'blur detection',
    'image validation',
    'PDF quality check',
    'upload validation',
    'pre-upload check',
    'blurry image detector',
    'browser blur detection',
    'OpenCV blur',
    'edge detection',
    'Sobel filter',
    'image sharpness',
    'PDF analysis',
    'document quality',
    'OCR preflight',
    'canvas image processing',
    'browser-side validation',
    'TypeScript blur detection',
    'React upload validation',
    'client-side quality check',
  ],
  authors: [{ name: 'Idenva', url: 'https://idenva.com' }],
  creator: 'Idenva',
  publisher: 'Idenva',
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blurry-check-demo.vercel.app',
    siteName: 'Blurry Check',
    title: 'Blurry Check — Pre-upload Quality Validation for Images & PDFs',
    description:
      'Browser-side quality validation for images and PDFs. Detect blurry photos, analyze PDF sharpness, enforce resolution limits — all before upload.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blurry Check — Pre-upload Quality Validation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blurry Check — Pre-upload Quality Validation',
    description:
      'Browser-side quality validation for images and PDFs. Detect blur, validate uploads, and get friendly feedback before files reach your server.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://blurry-check-demo.vercel.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.svg" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta name="google-site-verification" content="" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try { var t = localStorage.getItem('blurry-check-theme'); if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) { document.documentElement.classList.add('dark'); } } catch (_) {}`,
          }}
        />
        <JsonLd />
      </head>
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

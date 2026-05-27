export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Blurry Check',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Browser, Node.js (with canvas polyfill)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Browser-side quality validation for images and PDFs. Detect blurry photos, analyze PDF sharpness, enforce resolution limits, and validate uploads before they reach your server.',
    author: {
      '@type': 'Organization',
      name: 'Idenva',
      url: 'https://idenva.com',
    },
    url: 'https://github.com/i-DENVA/blurry-check',
    codeRepository: 'https://github.com/i-DENVA/blurry-check',
    programmingLanguage: 'TypeScript',
    license: 'https://opensource.org/licenses/MIT',
    featureList: [
      'Pre-upload validation',
      'Blur detection with edge analysis',
      'OpenCV Laplacian variance',
      'PDF multi-page quality analysis',
      'Text sharpness detection',
      'Brightness and contrast checks',
      'Resolution enforcement',
      'File format and magic-byte validation',
      'Dark mode support',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

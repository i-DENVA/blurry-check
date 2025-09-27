# 🔍 Blurry Check

A comprehensive, framework-agnostic blur detection library for images and PDFs. Detect blurry images and low-quality scanned documents with ease across any JavaScript framework including React, Angular, Vue, Qwik, and plain JavaScript.

## ✨ Features

- 🖼️ **Image Blur Detection** - Detect blurry images using advanced edge detection algorithms
- 📄 **PDF Quality Analysis** - Analyze PDF documents for blur and quality issues
- 🧠 **Multiple Detection Methods** - Choose between edge detection, OpenCV Laplacian variance, or both
- ⚙️ **Highly Configurable** - Customize thresholds and detection parameters
- 🌐 **Framework Agnostic** - Works with React, Angular, Vue, Qwik, and vanilla JavaScript
- 📱 **Browser & Node.js** - Supports both browser and server-side environments
- 📊 **Detailed Analytics** - Get comprehensive analysis results with confidence scores
- 🎯 **TypeScript Support** - Full TypeScript definitions included
- 🚀 **Lightweight** - Minimal dependencies, tree-shakeable

## 📦 Installation

```bash
npm install blurry-check
```

Or with yarn:

```bash
yarn add blurry-check
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { BlurryCheck } from 'blurry-check';

// Create an instance
const checker = new BlurryCheck();

// Check if an image is blurry
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  if (file.type.startsWith('image/')) {
    const isBlurry = await checker.isImageBlurry(file);
    console.log('Image is blurry:', isBlurry);
  }
  
  if (file.type === 'application/pdf') {
    const isGoodQuality = await checker.isPDFGoodQuality(file);
    console.log('PDF quality is good:', isGoodQuality);
  }
});
```

### Advanced Configuration

```typescript
import { BlurryCheck } from 'blurry-check';

const checker = new BlurryCheck({
  method: 'both', // Use both edge detection and OpenCV
  edgeWidthThreshold: 0.3, // Lower = more sensitive to blur
  laplacianThreshold: 150, // Higher = more sensitive to blur
  debug: true // Enable debug logging
});

// Get detailed analysis
const analysis = await checker.analyzeImage(imageFile);
console.log('Blur analysis:', analysis);
/*
{
  isBlurry: false,
  confidence: 0.85,
  method: 'both',
  metrics: {
    edgeAnalysis: {
      width: 1920,
      height: 1080,
      numEdges: 1250,
      avgEdgeWidth: 2.3,
      avgEdgeWidthPerc: 0.12
    },
    laplacianVariance: 245.7
  }
}
*/
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | `'edge' \| 'laplacian' \| 'both'` | `'edge'` | Detection method to use |
| `edgeWidthThreshold` | `number` | `0.5` | Threshold for edge detection (0-100) |
| `laplacianThreshold` | `number` | `100` | Threshold for OpenCV Laplacian variance |
| `openCvUrl` | `string` | OpenCV CDN | Custom OpenCV.js URL |
| `canvas` | `HTMLCanvasElement` | auto-created | Canvas element for processing |
| `debug` | `boolean` | `false` | Enable debug logging |

## 📖 API Reference

### BlurryCheck Class

#### Constructor
```typescript
new BlurryCheck(config?: BlurDetectionConfig)
```

#### Methods

##### `isImageBlurry(input)`
Quick check if an image is blurry.

```typescript
async isImageBlurry(
  input: HTMLImageElement | HTMLCanvasElement | File | ImageData
): Promise<boolean>
```

##### `analyzeImage(input)`
Detailed image blur analysis.

```typescript
async analyzeImage(
  input: HTMLImageElement | HTMLCanvasElement | File | ImageData
): Promise<BlurAnalysisResult>
```

##### `isPDFGoodQuality(file)`
Quick PDF quality check.

```typescript
async isPDFGoodQuality(file: File): Promise<boolean>
```

##### `analyzePDF(file)`
Detailed PDF quality analysis.

```typescript
async analyzePDF(file: File): Promise<PDFAnalysisResult>
```

##### `analyzeFile(file, options?)`
Automatically detect file type and analyze.

```typescript
async analyzeFile(
  file: File,
  options?: FileAnalysisOptions
): Promise<BlurAnalysisResult | PDFAnalysisResult>
```

### Convenience Functions

For quick one-off checks without creating an instance:

```typescript
import { isImageBlurry, isPDFGoodQuality, analyzeFile } from 'blurry-check';

// Quick image check
const blurry = await isImageBlurry(imageFile);

// Quick PDF check
const goodQuality = await isPDFGoodQuality(pdfFile);

// Auto-detect file type
const analysis = await analyzeFile(file);
```

## 🌐 Framework Examples

### React

```tsx
import React, { useState } from 'react';
import { BlurryCheck } from 'blurry-check';

const ImageUploader: React.FC = () => {
  const [isBlurry, setIsBlurry] = useState<boolean | null>(null);
  const checker = new BlurryCheck({ debug: true });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blurry = await checker.isImageBlurry(file);
      setIsBlurry(blurry);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {isBlurry !== null && (
        <p>Image is {isBlurry ? 'blurry' : 'clear'}</p>
      )}
    </div>
  );
};
```

### Vue 3

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" accept="image/*" />
    <p v-if="result !== null">
      Image is {{ result ? 'blurry' : 'clear' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BlurryCheck } from 'blurry-check';

const result = ref<boolean | null>(null);
const checker = new BlurryCheck();

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    result.value = await checker.isImageBlurry(file);
  }
};
</script>
```

### Angular

```typescript
import { Component } from '@angular/core';
import { BlurryCheck } from 'blurry-check';

@Component({
  selector: 'app-image-checker',
  template: `
    <input type="file" (change)="onFileChange($event)" accept="image/*">
    <p *ngIf="isBlurry !== null">
      Image is {{ isBlurry ? 'blurry' : 'clear' }}
    </p>
  `
})
export class ImageCheckerComponent {
  isBlurry: boolean | null = null;
  private checker = new BlurryCheck();

  async onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.isBlurry = await this.checker.isImageBlurry(file);
    }
  }
}
```

### Qwik

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { BlurryCheck } from 'blurry-check';

export const ImageChecker = component$(() => {
  const isBlurry = useSignal<boolean | null>(null);
  const checker = new BlurryCheck();

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange$={async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            isBlurry.value = await checker.isImageBlurry(file);
          }
        }}
      />
      {isBlurry.value !== null && (
        <p>Image is {isBlurry.value ? 'blurry' : 'clear'}</p>
      )}
    </div>
  );
});
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/blurry-check/lib/index.umd.js"></script>
</head>
<body>
  <input type="file" id="fileInput" accept="image/*">
  <p id="result"></p>

  <script>
    const checker = new BlurryCheck.default();
    
    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const isBlurry = await checker.isImageBlurry(file);
        document.getElementById('result').textContent = 
          `Image is ${isBlurry ? 'blurry' : 'clear'}`;
      }
    });
  </script>
</body>
</html>
```

## 🔬 Detection Methods

### Edge Detection Method
- **Fast and reliable** - Works entirely in browser without external dependencies
- **Good for most cases** - Effective for general blur detection
- **Lightweight** - No additional library loading required

### OpenCV Laplacian Variance Method
- **High accuracy** - Uses advanced computer vision algorithms
- **Better for subtle blur** - Can detect slight focus issues
- **Requires loading** - Downloads OpenCV.js library (adds ~8MB)

### Combined Method
- **Best accuracy** - Uses both methods for optimal results
- **Confidence scoring** - Provides detailed analysis metrics
- **Fallback support** - Falls back to edge detection if OpenCV fails

## 📊 Understanding Results

### BlurAnalysisResult
```typescript
{
  isBlurry: boolean;           // Whether image is considered blurry
  confidence: number;          // Confidence score (0-1)
  method: string;              // Method used for detection
  metrics: {
    edgeAnalysis?: {
      width: number;           // Image width
      height: number;          // Image height
      numEdges: number;        // Number of edges detected
      avgEdgeWidth: number;    // Average edge width in pixels
      avgEdgeWidthPerc: number; // Average edge width as percentage
    };
    laplacianVariance?: number; // OpenCV variance value
  };
}
```

### PDFAnalysisResult
```typescript
{
  isQualityGood: boolean;      // Whether PDF quality is acceptable
  isScanned: boolean;          // Whether PDF is image-based
  pagesAnalyzed: number;       // Number of pages checked
  textLength: number;          // Amount of extractable text
  pageResults?: BlurAnalysisResult[]; // Per-page analysis results
}
```

## 🎯 Performance Tips

1. **Choose the right method**: Use `'edge'` for speed, `'laplacian'` for accuracy, `'both'` for best results
2. **Reuse instances**: Create one `BlurryCheck` instance and reuse it
3. **Canvas reuse**: Provide your own canvas element to avoid recreation
4. **Batch processing**: Process multiple files with the same instance
5. **OpenCV loading**: Load OpenCV once and reuse across multiple checks

## 🔧 Troubleshooting

### Common Issues

**OpenCV fails to load**
```typescript
// Use custom OpenCV URL or fallback to edge detection
const checker = new BlurryCheck({
  method: 'edge', // Fallback method
  openCvUrl: 'https://your-cdn.com/opencv.js'
});
```

**Canvas errors in Node.js**
```bash
# Install canvas polyfill for Node.js
npm install canvas
```

**Large file processing**
```typescript
// Reduce canvas size for large images
const checker = new BlurryCheck({
  canvas: createSmallCanvas() // Custom smaller canvas
});
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- 🐛 [Report bugs](https://github.com/i-DENVA/blurry-check/issues)
- 💡 [Request features](https://github.com/i-DENVA/blurry-check/issues)
- 📖 [Documentation](https://github.com/i-DENVA/blurry-check#readme)

## 🏢 Maintained by

This package is maintained by **[Idenva](https://idenva.com)** - Advanced document processing and AI solutions.

## 🙏 Acknowledgments

- OpenCV.js for computer vision capabilities
- PDF.js for PDF processing
- Canvas API for image manipulation
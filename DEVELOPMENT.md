# Development Guide

## 🏗️ Project Structure

```
blurry-check-package/
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── blur-detector.ts   # Core blur detection logic
│   ├── pdf-analyzer.ts    # PDF analysis functionality
│   ├── opencv-loader.ts   # OpenCV.js loader utility
│   ├── filters.ts         # Canvas filter utilities
│   ├── types.ts          # TypeScript type definitions
│   └── __tests__/        # Test files
├── lib/                   # Built output (generated)
├── demo/                  # Next.js demo application
├── examples/              # Framework examples
│   ├── vanilla-js.html    # Pure JavaScript example
│   ├── vue-example.vue    # Vue 3 component
│   └── angular-example.ts # Angular component
├── package.json
├── tsconfig.json
├── rollup.config.js
└── README.md
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Development Workflow

1. **Make changes** to source files in `src/`
2. **Run tests** with `npm test`
3. **Build package** with `npm run build`
4. **Test in demo** by running the Next.js demo

### Demo Application

The demo application is located in the `demo/` directory:

```bash
cd demo
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to test the package.

## 📝 Scripts

- `npm run build` - Build the package for distribution
- `npm run dev` - Build in watch mode
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run clean` - Clean build directory

## 🔧 Building

The package is built using Rollup and outputs multiple formats:

- **ESM** (`lib/index.esm.js`) - For modern bundlers
- **CommonJS** (`lib/index.js`) - For Node.js
- **UMD** (`lib/index.umd.js`) - For browsers

## 🧪 Testing

Tests are written using Jest and run in a JSDOM environment:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test blur-detector.test.ts
```

## 📦 Publishing

Before publishing:

1. Update version in `package.json`
2. Run `npm run build`
3. Run `npm test`
4. Update `CHANGELOG.md`
5. Run `npm publish`

## 🔍 Architecture

### Core Components

1. **BlurDetector**: Main blur detection logic
   - Edge detection algorithm
   - OpenCV integration
   - Configuration management

2. **PDFAnalyzer**: PDF quality analysis
   - PDF.js integration
   - Text extraction
   - Page-by-page analysis

3. **OpenCVLoader**: Dynamic OpenCV loading
   - Singleton pattern
   - Error handling
   - Loading state management

4. **Filters**: Canvas image processing
   - Luminance conversion
   - Convolution operations
   - Edge detection filters

### Detection Methods

1. **Edge Detection**: Fast, client-side only
   - Sobel edge detection
   - Edge width analysis
   - Percentage calculation

2. **OpenCV Laplacian**: High accuracy
   - Laplacian variance
   - Computer vision algorithms
   - Requires external library

3. **Combined**: Best of both worlds
   - Fallback mechanism
   - Confidence scoring
   - Multiple metrics

## 🌐 Framework Integration

The package is designed to work with any JavaScript framework:

### React/Next.js
```tsx
import { BlurryCheck } from 'blurry-check';
const checker = new BlurryCheck();
const isBlurry = await checker.isImageBlurry(file);
```

### Vue
```vue
<script setup>
import { BlurryCheck } from 'blurry-check';
const checker = new BlurryCheck();
</script>
```

### Angular
```typescript
import { BlurryCheck } from 'blurry-check';
@Component({ ... })
export class MyComponent {
  private checker = new BlurryCheck();
}
```

### Vanilla JS
```html
<script src="https://unpkg.com/blurry-check/lib/index.umd.js"></script>
<script>
const checker = new BlurryCheck.default();
</script>
```

## 🐛 Troubleshooting

### Common Issues

1. **OpenCV fails to load**
   - Check network connection
   - Try custom OpenCV URL
   - Fall back to edge detection

2. **Canvas errors in Node.js**
   - Install `canvas` package
   - Use server-side detection carefully

3. **Memory issues with large files**
   - Resize images before analysis
   - Use smaller canvas elements
   - Implement file size limits

### Debug Mode

Enable debug logging:

```javascript
const checker = new BlurryCheck({ debug: true });
```

This will log detailed information about:
- Method selection
- Analysis progress
- Performance metrics
- Error details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Update README for user-facing changes

## 📄 License

MIT License - see LICENSE file for details.
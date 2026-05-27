import { BlurDetector } from '../blur-detector';
import { BlurryCheck, validateImage } from '../index';
import { BlurDetectionConfig } from '../types';
import { BLANK_NON_WHITE_RATIO_MAX, BLANK_CONTRAST_MAX } from '../constants';

const mockImageData = new ImageData(100, 100);
mockImageData.data.fill(128);

function createSharpDocumentImageData(): ImageData {
  const width = 800;
  const height = 600;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }

  for (let y = 80; y < 520; y += 40) {
    for (let x = 90; x < 710; x++) {
      for (let thickness = 0; thickness < 3; thickness++) {
        const index = ((y + thickness) * width + x) * 4;
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }

  return new ImageData(data, width, height);
}

function createDimDocumentImageData(): ImageData {
  const width = 800;
  const height = 600;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 102;
    data[i + 1] = 102;
    data[i + 2] = 102;
    data[i + 3] = 255;
  }

  for (let y = 80; y < 520; y += 40) {
    for (let x = 90; x < 710; x++) {
      for (let thickness = 0; thickness < 3; thickness++) {
        const index = ((y + thickness) * width + x) * 4;
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }

  return new ImageData(data, width, height);
}

function createLowContrastDocumentImageData(): ImageData {
  const width = 800;
  const height = 600;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 220;
    data[i + 1] = 220;
    data[i + 2] = 220;
    data[i + 3] = 255;
  }

  for (let y = 80; y < 520; y += 40) {
    for (let x = 90; x < 710; x++) {
      for (let thickness = 0; thickness < 3; thickness++) {
        const index = ((y + thickness) * width + x) * 4;
        data[index] = 185;
        data[index + 1] = 185;
        data[index + 2] = 185;
      }
    }
  }

  return new ImageData(data, width, height);
}

function createGlareDocumentImageData(): ImageData {
  const width = 800;
  const height = 600;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 35;
    data[i + 1] = 35;
    data[i + 2] = 35;
    data[i + 3] = 255;
  }

  for (let y = 80; y < 520; y += 40) {
    for (let x = 90; x < 710; x++) {
      for (let thickness = 0; thickness < 3; thickness++) {
        const index = ((y + thickness) * width + x) * 4;
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }

  for (let y = 0; y < 350; y++) {
    for (let x = 0; x < 350; x++) {
      const dx = x - 175;
      const dy = y - 175;
      if (dx * dx + dy * dy > 175 * 175) continue;
      const index = (y * width + x) * 4;
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
    }
  }

  return new ImageData(data, width, height);
}

const mockCanvas = {
  getContext: jest.fn(() => ({
    createImageData: jest.fn((width: number, height: number) => new ImageData(width, height)),
    getImageData: jest.fn(() => mockImageData),
    drawImage: jest.fn(),
  })),
  width: 100,
  height: 100,
};

const mockFile = new File(['mock content'], 'test.jpg', { type: 'image/jpeg' });

describe('BlurDetector', () => {
  let detector: BlurDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).document = {
      createElement: jest.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas;
        }
        return {
          onload: null,
          onerror: null,
          src: '',
        };
      }),
    };

    detector = new BlurDetector({
      method: 'edge',
      edgeWidthThreshold: 0.5,
      debug: false,
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultDetector = new BlurDetector();
      expect(defaultDetector).toBeInstanceOf(BlurDetector);
    });

    it('should create instance with custom config', () => {
      const config: BlurDetectionConfig = {
        method: 'both',
        edgeWidthThreshold: 1.0,
        laplacianThreshold: 150,
        debug: true,
      };
      const customDetector = new BlurDetector(config);
      expect(customDetector).toBeInstanceOf(BlurDetector);
    });
  });

  describe('analyzeImage', () => {
    it('should analyze ImageData input', async () => {
      const result = await detector.analyzeImage(mockImageData as ImageData);

      expect(result).toHaveProperty('isBlurry');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('metrics');
      expect(typeof result.isBlurry).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.method).toBe('edge');
    });

    it('should handle File input', async () => {
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsDataURL: jest.fn(function (this: any) {
          setTimeout(() => {
            this.onload?.({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        }),
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        width: 100,
        height: 100,
      };

      (global as any).Image = jest.fn(() => mockImage);
      const resultPromise = detector.analyzeImage(mockFile);
      setTimeout(() => {
        mockImage.onload?.();
      }, 10);

      const result = await resultPromise;

      expect(result).toHaveProperty('isBlurry');
      expect(result).toHaveProperty('confidence');
      expect(result.method).toBe('edge');
    });
  });

  describe('isBlurry', () => {
    it('should return boolean result', async () => {
      const result = await detector.isBlurry(mockImageData as ImageData);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('edge detection method', () => {
    it('should use edge detection when method is edge', async () => {
      const edgeDetector = new BlurDetector({ method: 'edge' });
      const result = await edgeDetector.analyzeImage(mockImageData as ImageData);

      expect(result.method).toBe('edge');
      expect(result.metrics.edgeAnalysis).toBeDefined();
      expect(result.metrics.laplacianVariance).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle unsupported input types', async () => {
      const unsupportedInput = { invalid: 'input' } as any;

      await expect(detector.analyzeImage(unsupportedInput)).rejects.toThrow(
        'Unsupported input type',
      );
    });

    it('should handle canvas context errors', async () => {
      const failingCanvas = {
        getContext: jest.fn(() => null),
        width: 100,
        height: 100,
      };

      const failingDetector = new BlurDetector({
        canvas: failingCanvas as any,
      });
      await expect(failingDetector.analyzeImage(mockFile)).rejects.toThrow(
        'Could not get 2D context from canvas',
      );
    });
  });

  describe('configuration', () => {
    it('should respect edgeWidthThreshold setting', async () => {
      const sensitiveDetector = new BlurDetector({
        method: 'edge',
        edgeWidthThreshold: 0.1, // Very sensitive
      });

      const result = await sensitiveDetector.analyzeImage(mockImageData as ImageData);
      expect(result.method).toBe('edge');
    });

    it('should respect debug setting', async () => {
      const debugDetector = new BlurDetector({ debug: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await debugDetector.analyzeImage(mockImageData as ImageData);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('upload validation', () => {
    it('should return friendly validation output for ImageData', async () => {
      const result = await validateImage(mockImageData as ImageData, {
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast', 'blur'],
        minWidth: 50,
        minHeight: 50,
      });

      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('checks');
      expect(result.type).toBe('image');
      expect(result.valid).toBe(result.ok);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.checks.blur).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should expose validation through the BlurryCheck class', async () => {
      const checker = new BlurryCheck({ method: 'edge' });
      const result = await checker.validateImage(mockImageData as ImageData, {
        checks: ['resolution', 'brightness'],
        minWidth: 50,
        minHeight: 50,
      });

      expect(typeof result.ok).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.checks.resolution?.ok).toBe(true);
    });

    it('should pass bright but readable document-style images in general mode', async () => {
      const result = await validateImage(createSharpDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.checks.brightness?.ok).toBe(true);
      expect(result.checks.contrast?.ok).toBe(true);
      expect(result.debugMetrics?.mode).toBe('general');
    });

    it('should let strong Laplacian sharpness rescue edge-width false positives in both mode', async () => {
      const laplacianSpy = jest
        .spyOn(BlurDetector.prototype as any, 'detectBlurOpenCV')
        .mockResolvedValue(339.46327083333335);

      const result = await validateImage(createSharpDocumentImageData(), {
        mode: 'general',
        method: 'both',
        edgeWidthThreshold: 0.2,
        checks: ['resolution', 'brightness', 'contrast', 'blur'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.ok).toBe(true);
      expect(result.issues).not.toContain('blurry');
      expect(result.checks.blur?.ok).toBe(true);
      expect(result.blurAnalysis?.isBlurry).toBe(false);
      expect(result.blurAnalysis?.metrics.edgeAnalysis?.avgEdgeWidthPerc).toBeGreaterThan(0.2);
      expect(result.blurAnalysis?.metrics.laplacianVariance).toBe(339.46327083333335);

      laplacianSpy.mockRestore();
    });

    it('should flag dim document-style images as too dark in general mode', async () => {
      const result = await validateImage(createDimDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toContain('too_dark');
      expect(result.checks.brightness?.ok).toBe(false);
      expect(result.checks.brightness?.message).toBe('Document appears underexposed.');
      expect(result.debugMetrics?.resolvedThresholds).toMatchObject({
        brightness: {
          documentMaxLuminanceMin: 150,
          documentContentBrightnessMin: 115,
        },
      });
    });

    it('should flag weak gray-on-gray document content as low contrast in general mode', async () => {
      const result = await validateImage(createLowContrastDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toContain('low_contrast');
      expect(result.checks.brightness?.ok).toBe(true);
      expect(result.checks.contrast?.ok).toBe(false);
      expect(result.debugMetrics?.resolvedThresholds).toMatchObject({
        contrast: {
          readableContentMinContrast: 35,
          contrastReadableContentMinContrast: 35,
        },
      });
    });

    it('should not treat bright low-contrast document content as overexposed', async () => {
      const result = await validateImage(createLowContrastDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.issues).not.toContain('too_bright');
      expect(result.issues).toContain('low_contrast');
      expect(result.checks.brightness?.ok).toBe(true);
      expect(result.checks.contrast?.ok).toBe(false);
      expect(result.debugMetrics?.resolvedThresholds).toMatchObject({
        brightness: {
          brightnessReadableContentMinContrast: 18,
        },
        contrast: {
          contrastReadableContentMinContrast: 35,
        },
      });
    });

    it('should flag document glare from large saturated highlights', async () => {
      const result = await validateImage(createGlareDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast'],
        minWidth: 600,
        minHeight: 600,
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toContain('glare');
      expect(result.checks.brightness?.ok).toBe(false);
      expect(result.checks.brightness?.message).toBe('Document has glare or blown highlights.');
      expect(result.debugMetrics?.resolvedThresholds).toMatchObject({
        brightness: {
          glarePixelRatioThreshold: 0.08,
          glareLuminanceThreshold: 250,
        },
      });
    });

    it('flags a white/empty image as blank_image in document mode', async () => {
      const blank = new ImageData(600, 400);
      blank.data.fill(255);
      const result = await validateImage(blank, {
        mode: 'document',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast', 'blur'],
        minWidth: 800,
        minHeight: 600,
      });
      expect(result.ok).toBe(false);
      expect(result.issues).toContain('blank_image');
      expect(result.issues).not.toContain('too_bright');
      expect(result.issues).not.toContain('low_contrast');
      expect(result.issues).not.toContain('blurry');
      expect(result.debugMetrics?.blank?.detected).toBe(true);
      expect(result.debugMetrics?.blank?.blankNonWhiteRatioMax).toBe(BLANK_NON_WHITE_RATIO_MAX);
      expect(result.debugMetrics?.blank?.blankContrastMax).toBe(BLANK_CONTRAST_MAX);
    });

    it('reports low_resolution even when blank_image is present', async () => {
      const blank = new ImageData(600, 400);
      blank.data.fill(255);
      const result = await validateImage(blank, {
        mode: 'document',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast', 'blur'],
        minWidth: 1000,
        minHeight: 800,
      });
      expect(result.ok).toBe(false);
      expect(result.issues).toContain('blank_image');
      expect(result.issues).toContain('low_resolution');
      expect(result.issues).not.toContain('too_bright');
      expect(result.issues).not.toContain('low_contrast');
      expect(result.issues).not.toContain('blurry');
    });

    it('treats bright readable document as valid (not blank)', async () => {
      const result = await validateImage(createSharpDocumentImageData(), {
        mode: 'general',
        method: 'edge',
        checks: ['resolution', 'brightness', 'contrast', 'blur'],
        minWidth: 600,
        minHeight: 600,
      });
      expect(result.issues).not.toContain('blank_image');
      expect(result.debugMetrics?.blank?.detected).toBe(false);
    });
  });
});

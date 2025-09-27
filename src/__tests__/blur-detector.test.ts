import { BlurDetector } from '../blur-detector';
import { BlurDetectionConfig } from '../types';

// Mock canvas and image data
const mockImageData = new ImageData(100, 100);
// Fill with gray data
mockImageData.data.fill(128);

const mockCanvas = {
  getContext: jest.fn(() => ({
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
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document.createElement for canvas
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
      // Mock FileReader
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsDataURL: jest.fn(function(this: any) {
          setTimeout(() => {
            this.onload?.({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        }),
      };

      (global as any).FileReader = jest.fn(() => mockFileReader);

      // Mock Image
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        width: 100,
        height: 100,
      };

      (global as any).Image = jest.fn(() => mockImage);

      const resultPromise = detector.analyzeImage(mockFile);
      
      // Simulate image load
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
      
      await expect(detector.analyzeImage(unsupportedInput))
        .rejects.toThrow('Unsupported input type');
    });

    it('should handle canvas context errors', async () => {
      // Mock canvas that fails to get context
      const failingCanvas = {
        getContext: jest.fn(() => null),
        width: 100,
        height: 100,
      };

      const failingDetector = new BlurDetector({
        canvas: failingCanvas as any,
      });

      // Use a File input to trigger canvas context usage
      await expect(failingDetector.analyzeImage(mockFile))
        .rejects.toThrow('Could not get 2D context from canvas');
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
      const debugDetector = new BlurDetector({
        debug: true,
      });

      // Mock console.log to verify debug output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await debugDetector.analyzeImage(mockImageData as ImageData);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
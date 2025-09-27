/**
 * Blurry Check - A comprehensive blur detection library for images and PDFs
 * 
 * @example
 * ```typescript
 * import { BlurryCheck } from 'blurry-check';
 * 
 * const checker = new BlurryCheck({
 *   method: 'both',
 *   edgeWidthThreshold: 0.5,
 *   debug: true
 * });
 * 
 * // Check an image file
 * const isBlurry = await checker.isImageBlurry(imageFile);
 * 
 * // Get detailed analysis
 * const analysis = await checker.analyzeImage(imageFile);
 * 
 * // Check PDF quality
 * const pdfResult = await checker.analyzePDF(pdfFile);
 * ```
 */

export { BlurDetector } from './blur-detector';
export { PDFAnalyzer } from './pdf-analyzer';
export { OpenCVLoader } from './opencv-loader';
export { Filters } from './filters';
export * from './types';

import { BlurDetector } from './blur-detector';
import { PDFAnalyzer } from './pdf-analyzer';
import { 
  BlurDetectionConfig, 
  BlurAnalysisResult, 
  PDFAnalysisResult,
  FileAnalysisOptions 
} from './types';

/**
 * Main BlurryCheck class - simplified interface for blur detection
 */
export class BlurryCheck {
  private blurDetector: BlurDetector;
  private pdfAnalyzer: PDFAnalyzer;
  private config: BlurDetectionConfig;

  constructor(config: BlurDetectionConfig = {}) {
    this.config = {
      edgeWidthThreshold: 0.5,
      laplacianThreshold: 100,
      method: 'edge',
      debug: false,
      ...config
    };

    this.blurDetector = new BlurDetector(this.config);
    this.pdfAnalyzer = new PDFAnalyzer(this.config);
  }

  /**
   * Check if an image is blurry (simple boolean result)
   */
  async isImageBlurry(
    input: HTMLImageElement | HTMLCanvasElement | File | ImageData
  ): Promise<boolean> {
    return this.blurDetector.isBlurry(input);
  }

  /**
   * Analyze an image for blur with detailed metrics
   */
  async analyzeImage(
    input: HTMLImageElement | HTMLCanvasElement | File | ImageData
  ): Promise<BlurAnalysisResult> {
    return this.blurDetector.analyzeImage(input);
  }

  /**
   * Check if a PDF is of good quality (simple boolean result)
   */
  async isPDFGoodQuality(file: File): Promise<boolean> {
    return this.pdfAnalyzer.isGoodQuality(file);
  }

  /**
   * Analyze a PDF for quality and blur with detailed metrics
   */
  async analyzePDF(file: File): Promise<PDFAnalysisResult> {
    return this.pdfAnalyzer.analyzePDF(file);
  }

  /**
   * Analyze any supported file type automatically
   */
  async analyzeFile(
    file: File,
    options: FileAnalysisOptions = {}
  ): Promise<BlurAnalysisResult | PDFAnalysisResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Merge options with instance config
    const mergedConfig = { ...this.config, ...options };

    if (fileExtension === 'pdf') {
      const pdfAnalyzer = new PDFAnalyzer(mergedConfig);
      return pdfAnalyzer.analyzePDF(file);
    }

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
      const blurDetector = new BlurDetector(mergedConfig);
      return blurDetector.analyzeImage(file);
    }

    throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  /**
   * Quick check for any supported file type
   */
  async isFileGoodQuality(
    file: File,
    options: FileAnalysisOptions = {}
  ): Promise<boolean> {
    const result = await this.analyzeFile(file, options);
    
    if ('isQualityGood' in result) {
      return result.isQualityGood; // PDF result
    } else {
      return !result.isBlurry; // Image result
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BlurDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.blurDetector = new BlurDetector(this.config);
    this.pdfAnalyzer = new PDFAnalyzer(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): BlurDetectionConfig {
    return { ...this.config };
  }
}

/**
 * Convenience functions for quick usage
 */

/**
 * Quick check if an image is blurry with default settings
 */
export async function isImageBlurry(
  input: HTMLImageElement | HTMLCanvasElement | File | ImageData,
  config?: BlurDetectionConfig
): Promise<boolean> {
  const checker = new BlurryCheck(config);
  return checker.isImageBlurry(input);
}

/**
 * Quick check if a PDF is of good quality with default settings
 */
export async function isPDFGoodQuality(
  file: File,
  config?: BlurDetectionConfig
): Promise<boolean> {
  const checker = new BlurryCheck(config);
  return checker.isPDFGoodQuality(file);
}

/**
 * Quick analysis of any supported file type with default settings
 */
export async function analyzeFile(
  file: File,
  options?: FileAnalysisOptions
): Promise<BlurAnalysisResult | PDFAnalysisResult> {
  const checker = new BlurryCheck(options);
  return checker.analyzeFile(file, options);
}

// Default export
export default BlurryCheck;
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
import { BlurDetectionConfig, BlurAnalysisResult, PDFAnalysisResult, FileAnalysisOptions } from './types';
/**
 * Main BlurryCheck class - simplified interface for blur detection
 */
export declare class BlurryCheck {
    private blurDetector;
    private pdfAnalyzer;
    private config;
    constructor(config?: BlurDetectionConfig);
    /**
     * Check if an image is blurry (simple boolean result)
     */
    isImageBlurry(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<boolean>;
    /**
     * Analyze an image for blur with detailed metrics
     */
    analyzeImage(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<BlurAnalysisResult>;
    /**
     * Check if a PDF is of good quality (simple boolean result)
     */
    isPDFGoodQuality(file: File): Promise<boolean>;
    /**
     * Analyze a PDF for quality and blur with detailed metrics
     */
    analyzePDF(file: File): Promise<PDFAnalysisResult>;
    /**
     * Analyze any supported file type automatically
     */
    analyzeFile(file: File, options?: FileAnalysisOptions): Promise<BlurAnalysisResult | PDFAnalysisResult>;
    /**
     * Quick check for any supported file type
     */
    isFileGoodQuality(file: File, options?: FileAnalysisOptions): Promise<boolean>;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<BlurDetectionConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): BlurDetectionConfig;
}
/**
 * Convenience functions for quick usage
 */
/**
 * Quick check if an image is blurry with default settings
 */
export declare function isImageBlurry(input: HTMLImageElement | HTMLCanvasElement | File | ImageData, config?: BlurDetectionConfig): Promise<boolean>;
/**
 * Quick check if a PDF is of good quality with default settings
 */
export declare function isPDFGoodQuality(file: File, config?: BlurDetectionConfig): Promise<boolean>;
/**
 * Quick analysis of any supported file type with default settings
 */
export declare function analyzeFile(file: File, options?: FileAnalysisOptions): Promise<BlurAnalysisResult | PDFAnalysisResult>;
export default BlurryCheck;
//# sourceMappingURL=index.d.ts.map
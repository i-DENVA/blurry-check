/**
 * Core blur detection functionality
 */
import { BlurDetectionConfig, BlurAnalysisResult } from './types';
export declare class BlurDetector {
    private config;
    private openCvLoader;
    constructor(config?: BlurDetectionConfig);
    private createCanvas;
    private log;
    /**
     * Analyze image for blur using edge detection method
     */
    private detectEdges;
    private reducedPixels;
    private detectBlur;
    /**
     * Measure blur using edge width analysis
     */
    private measureBlurByEdges;
    /**
     * Detect blur using OpenCV Laplacian variance method
     */
    private detectBlurrinessWithOpenCV;
    /**
     * Convert various input types to ImageData
     */
    private getImageData;
    /**
     * Analyze an image for blur
     */
    analyzeImage(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<BlurAnalysisResult>;
    /**
     * Quick check if an image is blurry (returns boolean only)
     */
    isBlurry(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<boolean>;
}
//# sourceMappingURL=blur-detector.d.ts.map
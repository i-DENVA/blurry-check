export { BlurDetector } from './blur-detector';
export { PDFAnalyzer } from './pdf-analyzer';
export { OpenCVLoader } from './opencv-loader';
export { Filters } from './filters';
export { ISSUE_CATALOG, recommendationsFor, summaryFor } from './issue-catalog';
export type { IssueCode, IssueDefinition, IssueSeverity } from './issue-catalog';
export { MODE_CONFIG, resolveMode, presetToMode } from './mode-config';
export type { ValidationMode, StrictnessLevel } from './mode-config';
export * from './types';
import type { BlurDetectionConfig, BlurAnalysisResult, PDFAnalysisResult, FileAnalysisOptions, ImageInput, QualityValidationResult, UploadValidationOptions, PDFPerformanceOptions } from './types';
export declare class BlurryCheck {
    private blurDetector;
    private pdfAnalyzer;
    private config;
    constructor(config?: BlurDetectionConfig);
    isImageBlurry(input: ImageInput): Promise<boolean>;
    analyzeImage(input: ImageInput): Promise<BlurAnalysisResult>;
    isPDFGoodQuality(file: File): Promise<boolean>;
    analyzePDF(file: File, perfOptions?: PDFPerformanceOptions): Promise<PDFAnalysisResult>;
    analyzeFile(file: File, options?: FileAnalysisOptions): Promise<BlurAnalysisResult | PDFAnalysisResult>;
    validateImage(input: ImageInput, options?: UploadValidationOptions): Promise<QualityValidationResult>;
    validateUpload(file: File, options?: UploadValidationOptions): Promise<QualityValidationResult>;
    isFileGoodQuality(file: File, options?: FileAnalysisOptions): Promise<boolean>;
    updateConfig(newConfig: Partial<BlurDetectionConfig>): void;
    getConfig(): BlurDetectionConfig;
}
export declare function isImageBlurry(input: ImageInput, config?: BlurDetectionConfig): Promise<boolean>;
export declare function isPDFGoodQuality(file: File, config?: BlurDetectionConfig): Promise<boolean>;
export declare function analyzeFile(file: File, options?: FileAnalysisOptions): Promise<BlurAnalysisResult | PDFAnalysisResult>;
export declare function validateImage(input: ImageInput, options?: UploadValidationOptions): Promise<QualityValidationResult>;
export declare function validateUpload(file: File, options?: UploadValidationOptions): Promise<QualityValidationResult>;
export default BlurryCheck;
//# sourceMappingURL=index.d.ts.map
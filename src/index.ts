// Blurry Check — Browser-side upload quality validation for images and PDFs.
// All analysis runs client-side. Files never leave the user's device.

export { BlurDetector } from './blur-detector';
export { PDFAnalyzer } from './pdf-analyzer';
export { OpenCVLoader } from './opencv-loader';
export { Filters } from './filters';
export { ISSUE_CATALOG, recommendationsFor, summaryFor } from './issue-catalog';
export type { IssueCode, IssueDefinition, IssueSeverity } from './issue-catalog';
export { MODE_CONFIG, resolveMode, presetToMode } from './mode-config';
export type { ValidationMode, StrictnessLevel } from './mode-config';
export * from './types';

import { BlurDetector } from './blur-detector';
import { PDFAnalyzer } from './pdf-analyzer';
import { validateImageQuality } from './validators/image-quality-validator';
import { validatePDFQuality } from './validators/pdf-quality-validator';
import { extensionFor } from './validators/file-validator';
import type {
  BlurDetectionConfig,
  FileAnalysisOptions,
  ImageInput,
  UploadValidationOptions,
  PDFPerformanceOptions,
} from './types';

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
      ...config,
    };
    this.blurDetector = new BlurDetector(this.config);
    this.pdfAnalyzer = new PDFAnalyzer(this.config);
  }

  async isImageBlurry(input: ImageInput) {
    return this.blurDetector.isBlurry(input);
  }
  async analyzeImage(input: ImageInput) {
    return this.blurDetector.analyzeImage(input);
  }
  async isPDFGoodQuality(file: File) {
    return this.pdfAnalyzer.isGoodQuality(file);
  }
  async analyzePDF(file: File, perfOptions?: PDFPerformanceOptions) {
    return this.pdfAnalyzer.analyzePDF(file, perfOptions);
  }

  async analyzeFile(file: File, options: FileAnalysisOptions = {}) {
    const ext = extensionFor(file);
    const mergedConfig = { ...this.config, ...options };
    if (ext === 'pdf') return new PDFAnalyzer(mergedConfig).analyzePDF(file);
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext))
      return new BlurDetector(mergedConfig).analyzeImage(file);
    throw new Error(`Unsupported file type: ${ext}`);
  }

  async validateImage(input: ImageInput, options: UploadValidationOptions = {}) {
    return validateImageQuality(input, { ...this.config, ...options });
  }

  async validateUpload(file: File, options: UploadValidationOptions = {}) {
    const ext = extensionFor(file);
    if (file.type === 'application/pdf' || ext === 'pdf')
      return validatePDFQuality(file, { ...options }, this.config);
    return this.validateImage(file, options);
  }

  async isFileGoodQuality(file: File, options: FileAnalysisOptions = {}) {
    const result = await this.analyzeFile(file, options);
    return 'isQualityGood' in result ? result.isQualityGood : !result.isBlurry;
  }

  updateConfig(newConfig: Partial<BlurDetectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.blurDetector = new BlurDetector(this.config);
    this.pdfAnalyzer = new PDFAnalyzer(this.config);
  }

  getConfig(): BlurDetectionConfig {
    return { ...this.config };
  }
}

export async function isImageBlurry(input: ImageInput, config?: BlurDetectionConfig) {
  return new BlurryCheck(config).isImageBlurry(input);
}
export async function isPDFGoodQuality(file: File, config?: BlurDetectionConfig) {
  return new BlurryCheck(config).isPDFGoodQuality(file);
}
export async function analyzeFile(file: File, options?: FileAnalysisOptions) {
  return new BlurryCheck(options).analyzeFile(file, options);
}
export async function validateImage(input: ImageInput, options?: UploadValidationOptions) {
  return new BlurryCheck(options).validateImage(input, options);
}
export async function validateUpload(file: File, options?: UploadValidationOptions) {
  return new BlurryCheck(options).validateUpload(file, options);
}

export default BlurryCheck;

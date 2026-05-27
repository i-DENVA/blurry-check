import type { BlurDetectionConfig, BlurAnalysisResult, ImageInput } from './types';
export declare class BlurDetector {
  private config;
  private openCvLoader;
  constructor(config?: BlurDetectionConfig);
  private log;
  private detectEdges;
  private reducedPixels;
  private detectBlur;
  analyzeImage(input: ImageInput): Promise<BlurAnalysisResult>;
  isBlurry(input: ImageInput): Promise<boolean>;
  private detectBlurOpenCV;
}
//# sourceMappingURL=blur-detector.d.ts.map

import { BlurDetectionConfig, PDFAnalysisResult } from './types';
export declare class PDFAnalyzer {
    private blurDetector;
    private config;
    private pdfLib;
    private loading;
    constructor(config?: BlurDetectionConfig);
    private calculateRenderedPageMetrics;
    private estimatePerspectiveScore;
    private log;
    private loadPdfJS;
    private waitForLoad;
    private checkPdfPageQuality;
    private analyzePageContent;
    private analyzeTextSharpness;
    private calculateTextSharpness;
    analyzePDF(file: File, perfOptions?: {
        maxPages?: number;
        samplePages?: 'first' | 'all' | 'smart' | number[];
        maxRenderScale?: number;
        timeoutMs?: number;
    }): Promise<PDFAnalysisResult>;
    isGoodQuality(file: File): Promise<boolean>;
}
//# sourceMappingURL=pdf-analyzer.d.ts.map
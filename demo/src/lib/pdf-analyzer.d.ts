/**
 * PDF analysis functionality for blur detection
 */
import { BlurDetectionConfig, PDFAnalysisResult } from './types';
declare global {
    interface Window {
        pdfjsLib?: {
            getDocument: (data: {
                data: Uint8Array;
            }) => {
                promise: Promise<any>;
            };
            GlobalWorkerOptions: {
                workerSrc: string;
            };
        };
    }
}
export declare class PDFAnalyzer {
    private blurDetector;
    private config;
    private pdfLib;
    private loading;
    constructor(config?: BlurDetectionConfig);
    private log;
    /**
     * Load PDF.js library dynamically
     */
    private loadPdfJS;
    private waitForLoad;
    /**
     * Check if a PDF page is blurry by rendering it at multiple scales and analyzing quality
     */
    private checkPdfPageQuality;
    /**
     * Analyze page content to detect if it's likely a header/logo page
     */
    private analyzePageContent;
    /**
     * Advanced text sharpness analysis for PDF documents
     */
    private analyzeTextSharpness;
    /**
     * Calculate sharpness specifically for text regions
     */
    private calculateTextSharpness;
    /**
     * Analyze a PDF file for quality and blur
     */
    analyzePDF(file: File): Promise<PDFAnalysisResult>;
    /**
     * Quick check if a PDF is of good quality
     */
    isGoodQuality(file: File): Promise<boolean>;
}
//# sourceMappingURL=pdf-analyzer.d.ts.map
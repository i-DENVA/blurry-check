/**
 * Type definitions for blurry-check package
 */
export interface BlurDetectionConfig {
    /** Threshold for blur detection using edge width method (0-100) */
    edgeWidthThreshold?: number;
    /** Threshold for OpenCV Laplacian variance method */
    laplacianThreshold?: number;
    /** Method to use for blur detection */
    method?: 'edge' | 'laplacian' | 'both';
    /** OpenCV script URL */
    openCvUrl?: string;
    /** Canvas element to use for processing (optional) */
    canvas?: HTMLCanvasElement;
    /** Enable debug logging */
    debug?: boolean;
}
export interface BlurAnalysisResult {
    /** Whether the image is considered blurry */
    isBlurry: boolean;
    /** Confidence score (0-1) */
    confidence: number;
    /** Detailed analysis metrics */
    metrics: {
        /** Edge width analysis result */
        edgeAnalysis?: {
            width: number;
            height: number;
            numEdges: number;
            avgEdgeWidth: number;
            avgEdgeWidthPerc: number;
        };
        /** Laplacian variance (OpenCV method) */
        laplacianVariance?: number;
        /** Text sharpness analysis for PDFs */
        textSharpness?: {
            textSharpnessScore: number;
            isTextBlurry: boolean;
            textMetrics: any;
        };
        /** Multi-scale analysis results for PDFs */
        scaleResults?: Array<{
            scale: number;
            isBlurry: boolean;
            confidence: number;
            edgeAnalysis?: {
                width: number;
                height: number;
                numEdges: number;
                avgEdgeWidth: number;
                avgEdgeWidthPerc: number;
            };
        }>;
        /** Content analysis for smart PDF processing */
        contentAnalysis?: {
            isLikelyHeaderPage: boolean;
            textDensity: number;
            hasLowTextContent: boolean;
        };
    };
    /** Method used for analysis */
    method: string;
}
export interface PDFAnalysisResult {
    /** Whether the PDF quality is acceptable */
    isQualityGood: boolean;
    /** Whether the PDF is scanned (image-based) */
    isScanned: boolean;
    /** Number of pages analyzed */
    pagesAnalyzed: number;
    /** Extracted text length */
    textLength: number;
    /** Per-page blur analysis results */
    pageResults?: BlurAnalysisResult[];
}
export type SupportedFileType = 'image' | 'pdf';
export interface FileAnalysisOptions extends BlurDetectionConfig {
    /** File type to analyze */
    fileType?: SupportedFileType;
}
//# sourceMappingURL=types.d.ts.map
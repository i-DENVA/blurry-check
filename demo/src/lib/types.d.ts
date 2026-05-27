import type { ValidationMode, StrictnessLevel } from './mode-config';
import type { IssueCode } from './issue-catalog';
export type { ValidationMode, StrictnessLevel } from './mode-config';
export type { IssueCode, IssueDefinition, IssueSeverity } from './issue-catalog';
export interface BlurDetectionConfig {
    edgeWidthThreshold?: number;
    laplacianThreshold?: number;
    method?: 'edge' | 'laplacian' | 'both';
    openCvUrl?: string;
    canvas?: HTMLCanvasElement;
    debug?: boolean;
}
export type ImageInput = HTMLImageElement | HTMLCanvasElement | File | ImageData;
export interface BlurAnalysisResult {
    isBlurry: boolean;
    confidence: number;
    metrics: {
        edgeAnalysis?: {
            width: number;
            height: number;
            numEdges: number;
            avgEdgeWidth: number;
            avgEdgeWidthPerc: number;
        };
        laplacianVariance?: number;
        textSharpness?: {
            textSharpnessScore: number;
            isTextBlurry: boolean;
            textMetrics: any;
        };
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
        contentAnalysis?: {
            isLikelyHeaderPage: boolean;
            textDensity: number;
            hasLowTextContent: boolean;
            isCertificateDocument?: boolean;
        };
        pdfPageMetrics?: {
            pageNumber: number;
            width: number;
            height: number;
            aspectRatio: number;
            orientation: 'portrait' | 'landscape' | 'square';
            rotation: number;
            brightness: number;
            contrast: number;
            minLuminance: number;
            maxLuminance: number;
            nonWhiteRatio: number;
            contentBrightness: number;
            contentContrast: number;
            glarePixelRatio: number;
            documentFrame: {
                detected: boolean;
                marginRatios: {
                    top: number;
                    right: number;
                    bottom: number;
                    left: number;
                };
                edgesTouchingBoundary: string[];
                perspectiveScore: number;
                isLikelyCropped: boolean;
                hasPerspectiveDistortion: boolean;
            };
        };
    };
    method: string;
}
export interface PDFAnalysisResult {
    isQualityGood: boolean;
    isScanned: boolean;
    pagesAnalyzed: number;
    textLength: number;
    pageResults?: BlurAnalysisResult[];
    corruptedPages?: Array<{
        page: number;
        error: string;
    }>;
    incomplete?: boolean;
    incompleteReason?: string;
    totalPages?: number;
    skippedPages?: number[];
}
export type SupportedFileType = 'image' | 'pdf';
export interface FileAnalysisOptions extends BlurDetectionConfig {
    fileType?: SupportedFileType;
}
export type QualityCheckName = 'file' | 'blur' | 'brightness' | 'contrast' | 'resolution' | 'format' | 'fileSize' | 'pageResolution' | 'scanned' | 'sharpness' | 'textDensity' | 'orientation' | 'corruptedPages' | 'mobileCapture';
export type QualityStatus = 'pass' | 'warning' | 'fail';
export interface QualityCheckResult {
    ok: boolean;
    status: QualityStatus;
    score: number;
    message: string;
    details?: Record<string, unknown>;
}
export interface FileValidationOptions {
    maxSizeBytes?: number;
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    validateMagicBytes?: boolean;
}
export interface ImageValidationOptions extends BlurDetectionConfig, FileValidationOptions {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    minScore?: number;
    checks?: QualityCheckName[];
}
export interface PDFPerformanceOptions {
    maxPages?: number;
    samplePages?: 'first' | 'all' | 'smart' | number[];
    maxRenderScale?: number;
    timeoutMs?: number;
}
export interface UploadValidationOptions extends ImageValidationOptions, PDFPerformanceOptions {
    mode?: ValidationMode;
    /** @deprecated Use `mode` instead. */
    preset?: 'general' | 'profile-photo' | 'document-scan' | 'receipt' | 'id-card';
    strictness?: StrictnessLevel;
    expectedOrientation?: 'portrait' | 'landscape' | 'square';
}
export interface QualityValidationResult {
    valid: boolean;
    ok: boolean;
    status: QualityStatus;
    score: number;
    message: string;
    type: SupportedFileType;
    checks: Partial<Record<QualityCheckName, QualityCheckResult>>;
    recommendations: string[];
    issues: IssueCode[];
    warnings: IssueCode[];
    pages?: PDFPageValidationResult[];
    width?: number;
    height?: number;
    blurAnalysis?: BlurAnalysisResult;
    pdfAnalysis?: PDFAnalysisResult;
    debugMetrics?: Record<string, unknown>;
}
export interface PDFPageValidationResult {
    page: number;
    ok: boolean;
    status: QualityStatus;
    score: number;
    issues: IssueCode[];
    warnings: IssueCode[];
    message: string;
    checks: Partial<Record<QualityCheckName, QualityCheckResult>>;
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape' | 'square';
    rotation?: number;
}
//# sourceMappingURL=types.d.ts.map
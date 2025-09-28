/**
 * Core blur detection functionality
 */

import { Filters } from './filters';
import { OpenCVLoader } from './opencv-loader';
import { BlurDetectionConfig, BlurAnalysisResult } from './types';

export class BlurDetector {
  private config: Required<BlurDetectionConfig>;
  private openCvLoader: OpenCVLoader;

  constructor(config: BlurDetectionConfig = {}) {
    this.config = {
      edgeWidthThreshold: config.edgeWidthThreshold ?? 0.3,
      laplacianThreshold: config.laplacianThreshold ?? 150,
      method: config.method ?? 'both',
      openCvUrl: config.openCvUrl ?? 'https://docs.opencv.org/4.5.4/opencv.js',
      canvas: config.canvas ?? this.createCanvas(),
      debug: config.debug ?? false
    };

    this.openCvLoader = OpenCVLoader.getInstance(this.config.openCvUrl);
  }

  private createCanvas(): HTMLCanvasElement {
    if (typeof document !== 'undefined') {
      return document.createElement('canvas');
    }
    throw new Error('Canvas not available in this environment');
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[BlurDetector] ${message}`, ...args);
    }
  }

  /**
   * Analyze image for blur using edge detection method
   */
  private detectEdges(imageData: ImageData): ImageData {
    const greyscaled = Filters.luminance(imageData);
    const sobelKernel = Filters.getFloat32Array([1, 0, -1, 2, 0, -2, 1, 0, -1]);
    return Filters.convolve(greyscaled, sobelKernel, true);
  }

  private reducedPixels(imageData: ImageData): Uint8ClampedArray[] {
    const { data: pixels, width } = imageData;
    const rowLen = width * 4;
    const rows: Uint8ClampedArray[] = [];

    for (let y = 0; y < pixels.length; y += rowLen) {
      const row = new Uint8ClampedArray(width);
      let x = 0;
      for (let i = y; i < y + rowLen; i += 4) {
        row[x] = pixels[i];
        x += 1;
      }
      rows.push(row);
    }
    return rows;
  }

  private detectBlur(pixels: Uint8ClampedArray[]): {
    width: number;
    height: number;
    numEdges: number;
    avgEdgeWidth: number;
    avgEdgeWidthPerc: number;
  } {
    const width = pixels[0].length;
    const height = pixels.length;
    let numEdges = 0;
    let sumEdgeWidths = 0;

    for (let y = 0; y < height; y++) {
      let edgeStart = -1;

      for (let x = 0; x < width; x++) {
        const value = pixels[y][x];

        if (edgeStart >= 0 && x > edgeStart) {
          const oldValue = pixels[y][x - 1];
          if (value < oldValue) {
            if (oldValue >= 20) {
              const edgeWidth = x - edgeStart - 1;
              numEdges++;
              sumEdgeWidths += edgeWidth;
            }
            edgeStart = -1;
          }
        }

        if (value === 0) {
          edgeStart = x;
        }
      }
    }

    if (numEdges === 0) {
      return {
        width,
        height,
        numEdges: 0,
        avgEdgeWidth: 0,
        avgEdgeWidthPerc: 0,
      };
    }

    const avgEdgeWidth = sumEdgeWidths / numEdges;
    const avgEdgeWidthPerc = (avgEdgeWidth / width) * 100;

    return {
      width,
      height,
      numEdges,
      avgEdgeWidth,
      avgEdgeWidthPerc,
    };
  }

  /**
   * Measure blur using edge width analysis
   */
  private measureBlurByEdges(imageData: ImageData) {
    const edges = this.detectEdges(imageData);
    const reducedPixelData = this.reducedPixels(edges);
    return this.detectBlur(reducedPixelData);
  }

  /**
   * Detect blur using OpenCV Laplacian variance method
   */
  private async detectBlurrinessWithOpenCV(imageData: ImageData): Promise<number> {
    if (!this.openCvLoader.isLoaded()) {
      await this.openCvLoader.loadOpenCV();
    }

    const cv = this.openCvLoader.getCV();
    
    const mat = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);

    const laplacian = new cv.Mat();
    cv.Laplacian(gray, laplacian, cv.CV_64F);

    const meanStdDev = new cv.Mat();
    const stddev = new cv.Mat();
    cv.meanStdDev(laplacian, meanStdDev, stddev);

    const variance = stddev.data64F[0] ** 2;

    // Cleanup OpenCV matrices
    mat.delete();
    gray.delete();
    laplacian.delete();
    meanStdDev.delete();
    stddev.delete();

    return variance;
  }

  /**
   * Convert various input types to ImageData
   */
  private async getImageData(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<ImageData> {
    if (input instanceof ImageData) {
      return input;
    }

    const canvas = this.config.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    if (input instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(input);
      });
    }

    if (input instanceof HTMLImageElement) {
      canvas.width = input.width;
      canvas.height = input.height;
      ctx.drawImage(input, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (input instanceof HTMLCanvasElement) {
      const srcCtx = input.getContext('2d');
      if (!srcCtx) {
        throw new Error('Could not get 2D context from source canvas');
      }
      return srcCtx.getImageData(0, 0, input.width, input.height);
    }

    throw new Error('Unsupported input type');
  }

  /**
   * Analyze an image for blur
   */
  async analyzeImage(
    input: HTMLImageElement | HTMLCanvasElement | File | ImageData
  ): Promise<BlurAnalysisResult> {
    this.log('Starting blur analysis with method:', this.config.method);

    const imageData = await this.getImageData(input);
    this.log('Image data obtained:', imageData.width, 'x', imageData.height);

    const result: BlurAnalysisResult = {
      isBlurry: false,
      confidence: 0,
      metrics: {},
      method: this.config.method
    };

    try {
      if (this.config.method === 'edge' || this.config.method === 'both') {
        const edgeAnalysis = this.measureBlurByEdges(imageData);
        result.metrics.edgeAnalysis = edgeAnalysis;
        
        const isBlurryByEdge = edgeAnalysis.avgEdgeWidthPerc > this.config.edgeWidthThreshold;
        
        // Additional check for low edge count (often indicates blur in documents/PDFs)
        const hasLowEdgeCount = edgeAnalysis.numEdges < (imageData.width * imageData.height) / 10000;
        const combinedBlurCheck = isBlurryByEdge || hasLowEdgeCount;
        
        this.log('Edge analysis result:', edgeAnalysis, 'isBlurry:', isBlurryByEdge, 'lowEdgeCount:', hasLowEdgeCount, 'combined:', combinedBlurCheck);
        
        if (this.config.method === 'edge') {
          result.isBlurry = combinedBlurCheck;
          result.confidence = Math.min(edgeAnalysis.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1);
        }
      }

      if (this.config.method === 'laplacian' || this.config.method === 'both') {
        try {
          const laplacianVariance = await this.detectBlurrinessWithOpenCV(imageData);
          result.metrics.laplacianVariance = laplacianVariance;
          
          const isBlurryByLaplacian = laplacianVariance < this.config.laplacianThreshold;
          this.log('Laplacian analysis result:', laplacianVariance, 'isBlurry:', isBlurryByLaplacian);
          
          if (this.config.method === 'laplacian') {
            result.isBlurry = isBlurryByLaplacian;
            result.confidence = Math.min(this.config.laplacianThreshold / laplacianVariance, 1);
          }
        } catch (error) {
          this.log('OpenCV analysis failed, falling back to edge detection:', error);
          if (this.config.method === 'laplacian') {
            // Fallback to edge detection
            const edgeAnalysis = this.measureBlurByEdges(imageData);
            result.metrics.edgeAnalysis = edgeAnalysis;
            result.isBlurry = edgeAnalysis.avgEdgeWidthPerc > this.config.edgeWidthThreshold;
            result.confidence = Math.min(edgeAnalysis.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1);
            result.method = 'edge (fallback)';
          }
        }
      }

      if (this.config.method === 'both') {
        const edgeBlurry = result.metrics.edgeAnalysis ? 
          result.metrics.edgeAnalysis.avgEdgeWidthPerc > this.config.edgeWidthThreshold : false;
        const hasLowEdgeCount = result.metrics.edgeAnalysis ? 
          result.metrics.edgeAnalysis.numEdges < (imageData.width * imageData.height) / 10000 : false;
        const combinedEdgeBlurry = edgeBlurry || hasLowEdgeCount;
        
        const laplacianBlurry = result.metrics.laplacianVariance ? 
          result.metrics.laplacianVariance < this.config.laplacianThreshold : false;
        
        // Consider blurry if either method detects blur
        result.isBlurry = combinedEdgeBlurry || laplacianBlurry;
        
        // Calculate combined confidence
        const edgeConfidence = result.metrics.edgeAnalysis ? 
          Math.min(result.metrics.edgeAnalysis.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1) : 0;
        const laplacianConfidence = result.metrics.laplacianVariance ? 
          Math.min(this.config.laplacianThreshold / result.metrics.laplacianVariance, 1) : 0;
        
        result.confidence = Math.max(edgeConfidence, laplacianConfidence);
      }

      this.log('Final analysis result:', result);
      return result;

    } catch (error) {
      this.log('Analysis failed:', error);
      throw new Error(`Blur analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick check if an image is blurry (returns boolean only)
   */
  async isBlurry(input: HTMLImageElement | HTMLCanvasElement | File | ImageData): Promise<boolean> {
    const result = await this.analyzeImage(input);
    return result.isBlurry;
  }
}
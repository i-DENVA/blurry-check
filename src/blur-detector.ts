import { Filters } from './filters';
import { OpenCVLoader } from './opencv-loader';
import { LOW_EDGE_COUNT_DIVISOR } from './constants';
import type { BlurDetectionConfig, BlurAnalysisResult, ImageInput } from './types';
import { createCanvas, getImageDataFromInput } from './image-utils';

export class BlurDetector {
  private config: Required<BlurDetectionConfig>;
  private openCvLoader: OpenCVLoader;

  constructor(config: BlurDetectionConfig = {}) {
    this.config = {
      edgeWidthThreshold: config.edgeWidthThreshold ?? 0.3,
      laplacianThreshold: config.laplacianThreshold ?? 150,
      method: config.method ?? 'both',
      openCvUrl: config.openCvUrl ?? 'https://docs.opencv.org/4.5.4/opencv.js',
      canvas: config.canvas ?? createCanvas(),
      debug: config.debug ?? false,
    };
    this.openCvLoader = OpenCVLoader.getInstance(this.config.openCvUrl);
  }

  private log(message: string, ...args: unknown[]) {
    if (this.config.debug) console.log(`[BlurDetector] ${message}`, ...args);
  }

  private detectEdges(imageData: ImageData): ImageData {
    const grey = Filters.luminance(imageData);
    return Filters.convolve(grey, Filters.getFloat32Array([1, 0, -1, 2, 0, -2, 1, 0, -1]), true);
  }

  private reducedPixels(imageData: ImageData): Uint8ClampedArray[] {
    const { data: pixels, width } = imageData;
    const rowLen = width * 4;
    const rows: Uint8ClampedArray[] = [];
    for (let y = 0; y < pixels.length; y += rowLen) {
      const row = new Uint8ClampedArray(width);
      let x = 0;
      for (let i = y; i < y + rowLen; i += 4) row[x++] = pixels[i];
      rows.push(row);
    }
    return rows;
  }

  private detectBlur(pixels: Uint8ClampedArray[]) {
    const width = pixels[0].length;
    const height = pixels.length;
    let numEdges = 0,
      sumEdgeWidths = 0;
    for (let y = 0; y < height; y++) {
      let edgeStart = -1;
      for (let x = 0; x < width; x++) {
        const val = pixels[y][x];
        if (edgeStart >= 0 && x > edgeStart) {
          if (val < pixels[y][x - 1]) {
            if (pixels[y][x - 1] >= 20) {
              numEdges++;
              sumEdgeWidths += x - edgeStart - 1;
            }
            edgeStart = -1;
          }
        }
        if (val === 0) edgeStart = x;
      }
    }
    if (numEdges === 0) return { width, height, numEdges: 0, avgEdgeWidth: 0, avgEdgeWidthPerc: 0 };
    const avg = sumEdgeWidths / numEdges;
    return { width, height, numEdges, avgEdgeWidth: avg, avgEdgeWidthPerc: (avg / width) * 100 };
  }

  async analyzeImage(input: ImageInput): Promise<BlurAnalysisResult> {
    this.log('Starting blur analysis, method:', this.config.method);
    const imageData = await getImageDataFromInput(input, this.config.canvas);

    const result: BlurAnalysisResult = {
      isBlurry: false,
      confidence: 0,
      metrics: {},
      method: this.config.method,
    };

    try {
      if (this.config.method === 'edge' || this.config.method === 'both') {
        const edge = this.detectBlur(this.reducedPixels(this.detectEdges(imageData)));
        result.metrics.edgeAnalysis = edge;
        const edgeBlurry = edge.avgEdgeWidthPerc > this.config.edgeWidthThreshold;
        const lowEdge =
          edge.numEdges < (imageData.width * imageData.height) / LOW_EDGE_COUNT_DIVISOR;
        const combined = edgeBlurry || lowEdge;
        this.log('Edge result:', edge, 'blurry:', combined);
        if (this.config.method === 'edge') {
          result.isBlurry = combined;
          result.confidence = Math.min(edge.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1);
        }
      }

      if (this.config.method === 'laplacian' || this.config.method === 'both') {
        try {
          const lapVar = await this.detectBlurOpenCV(imageData);
          result.metrics.laplacianVariance = lapVar;
          const lapBlurry = lapVar < this.config.laplacianThreshold;
          this.log('Laplacian:', lapVar, 'blurry:', lapBlurry);
          if (this.config.method === 'laplacian') {
            result.isBlurry = lapBlurry;
            result.confidence = Math.min(this.config.laplacianThreshold / lapVar, 1);
          }
        } catch (e) {
          this.log('OpenCV failed, fallback to edge:', e);
          if (this.config.method === 'laplacian') {
            const edge = this.detectBlur(this.reducedPixels(this.detectEdges(imageData)));
            result.metrics.edgeAnalysis = edge;
            result.isBlurry = edge.avgEdgeWidthPerc > this.config.edgeWidthThreshold;
            result.confidence = Math.min(edge.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1);
            result.method = 'edge (fallback)';
          }
        }
      }

      if (this.config.method === 'both') {
        const e = result.metrics.edgeAnalysis;
        const edgeBlur = e
          ? e.avgEdgeWidthPerc > this.config.edgeWidthThreshold ||
            e.numEdges < (imageData.width * imageData.height) / LOW_EDGE_COUNT_DIVISOR
          : false;
        const hasLaplacian = typeof result.metrics.laplacianVariance === 'number';
        const lapBlur = hasLaplacian
          ? result.metrics.laplacianVariance! < this.config.laplacianThreshold
          : false;
        result.isBlurry = hasLaplacian ? lapBlur : edgeBlur;
        result.confidence = Math.max(
          e ? Math.min(e.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1) : 0,
          result.metrics.laplacianVariance
            ? Math.min(this.config.laplacianThreshold / result.metrics.laplacianVariance, 1)
            : 0,
        );
      }

      this.log('Final:', result);
      return result;
    } catch (error) {
      this.log('Analysis failed:', error);
      throw new Error(
        `Blur analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async isBlurry(input: ImageInput): Promise<boolean> {
    return (await this.analyzeImage(input)).isBlurry;
  }

  private async detectBlurOpenCV(imageData: ImageData): Promise<number> {
    if (!this.openCvLoader.isLoaded()) await this.openCvLoader.loadOpenCV();
    const cv = this.openCvLoader.getCV();
    const mat = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
    const laplacian = new cv.Mat();
    cv.Laplacian(gray, laplacian, cv.CV_64F);
    const mean = new cv.Mat(),
      stddev = new cv.Mat();
    cv.meanStdDev(laplacian, mean, stddev);
    const variance = stddev.data64F[0] ** 2;
    [mat, gray, laplacian, mean, stddev].forEach((m) => m.delete());
    return variance;
  }
}

/**
 * PDF analysis functionality for blur detection
 */

import { BlurDetector } from './blur-detector';
import { BlurDetectionConfig, PDFAnalysisResult, BlurAnalysisResult } from './types';

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (data: { data: Uint8Array }) => { promise: Promise<any> };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
    };
  }
}

export class PDFAnalyzer {
  private blurDetector: BlurDetector;
  private config: BlurDetectionConfig;
  private pdfLib: any = null;
  private loading: boolean = false;

  constructor(config: BlurDetectionConfig = {}) {
    this.config = config;
    this.blurDetector = new BlurDetector(config);
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[PDFAnalyzer] ${message}`, ...args);
    }
  }

  /**
   * Load PDF.js library dynamically
   */
  private async loadPdfJS(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PDF.js can only be loaded in browser environments');
    }

    if (this.pdfLib) {
      return Promise.resolve();
    }

    if (this.loading) {
      return this.waitForLoad();
    }

    this.loading = true;

    try {
      // Remove existing script if any
      const existingScript = document.querySelector('#pdfjs-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.id = 'pdfjs-script';

      const loadPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            this.pdfLib = window.pdfjsLib;
            this.loading = false;
            resolve();
          } else {
            this.loading = false;
            reject(new Error('PDF.js not available after loading'));
          }
        };
        script.onerror = () => {
          this.loading = false;
          reject(new Error('Failed to load PDF.js'));
        };
      });

      document.body.appendChild(script);
      await loadPromise;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!this.loading) {
          clearInterval(checkInterval);
          if (this.pdfLib) {
            resolve();
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        }
      }, 100);

      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('PDF.js loading timeout'));
      }, 15000);
    });
  }

  /**
   * Check if a PDF page is blurry by rendering it at multiple scales and analyzing quality
   */
  private async checkPdfPageQuality(pdf: any, pageNumber: number): Promise<BlurAnalysisResult> {
    const page = await pdf.getPage(pageNumber);
    
    // Test at multiple scales to get more accurate results
    const scales = [1.0, 1.5, 2.0];
    const results: BlurAnalysisResult[] = [];
    
    for (const scale of scales) {
      const viewport = page.getViewport({ scale });
      
      const canvas = this.config.canvas || document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext).promise;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use more sensitive settings for PDFs
      const pdfBlurDetector = new (await import('./blur-detector')).BlurDetector({
        ...this.config,
        edgeWidthThreshold: Math.min(this.config.edgeWidthThreshold || 0.5, 0.25), // More sensitive
        method: 'edge', // Consistent method
        debug: this.config.debug
      });
      
      const result = await pdfBlurDetector.analyzeImage(imageData);
      result.method = `${result.method} (scale ${scale}x)`;
      results.push(result);
      
      this.log(`Page ${pageNumber} at ${scale}x scale:`, result);
    }
    
    // Combine results - if ANY scale shows blur, consider it blurry
    const blurryCount = results.filter(r => r.isBlurry).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    // Use the most detailed result (highest scale) as base
    const bestResult = results[results.length - 1];
    
    return {
      ...bestResult,
      isBlurry: blurryCount > 0, // Any scale showing blur = blurry
      confidence: Math.max(avgConfidence, blurryCount / results.length),
      method: `Multi-scale analysis (${blurryCount}/${results.length} scales detected blur)`,
      metrics: {
        ...bestResult.metrics,
        // Add multi-scale information
        scaleResults: results.map(r => ({
          scale: parseFloat(r.method.match(/scale ([\d.]+)x/)?.[1] || '1'),
          isBlurry: r.isBlurry,
          confidence: r.confidence,
          edgeAnalysis: r.metrics.edgeAnalysis
        }))
      }
    };
  }

  /**
   * Analyze page content to detect if it's likely a header/logo page
   */
  private analyzePageContent(textContent: any, pageNumber: number): {
    isLikelyHeaderPage: boolean;
    textDensity: number;
    hasLowTextContent: boolean;
  } {
    const textItems = textContent.items || [];
    const totalText = textItems.map((item: any) => item.str).join(' ').trim();
    const textLength = totalText.length;
    
    // Page 1 with low text content often contains logos/headers
    const isFirstPage = pageNumber === 1;
    const hasLowTextContent = textLength < 200; // Less than 200 chars suggests header/logo page
    const textDensity = textLength / Math.max(textItems.length, 1); // Avg chars per text item
    
    // Look for header-like patterns
    const hasHeaderKeywords = /bill|statement|invoice|report|summary|account|period/i.test(totalText);
    const hasDatePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\w+ \d{1,2}, \d{4}/i.test(totalText);
    const hasAmountPattern = /\$[\d,]+\.?\d*|USD|EUR|GBP/i.test(totalText);
    
    const isLikelyHeaderPage = isFirstPage && (
      hasLowTextContent || 
      (hasHeaderKeywords && hasDatePattern && hasAmountPattern && textLength < 500)
    );
    
    this.log(`Page ${pageNumber} content analysis: textLength=${textLength}, textDensity=${textDensity.toFixed(1)}, isLikelyHeader=${isLikelyHeaderPage}`);
    
    return {
      isLikelyHeaderPage,
      textDensity,
      hasLowTextContent
    };
  }

  /**
   * Advanced text sharpness analysis for PDF documents
   */
  private async analyzeTextSharpness(pdf: any, pageNumber: number): Promise<{
    textSharpnessScore: number;
    isTextBlurry: boolean;
    textMetrics: any;
  }> {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    if (textContent.items.length === 0) {
      return {
        textSharpnessScore: 0,
        isTextBlurry: true,
        textMetrics: { reason: 'No text found' }
      };
    }

    // Render at high resolution for text analysis
    const viewport = page.getViewport({ scale: 3.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context for text analysis');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render only text (no images) for cleaner analysis
    const renderContext = { 
      canvasContext: context, 
      viewport,
      intent: 'print' // Better text rendering
    };
    await page.render(renderContext).promise;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze text regions for sharpness
    const textSharpness = this.calculateTextSharpness(imageData, textContent.items);
    
    this.log(`Page ${pageNumber} text sharpness analysis:`, textSharpness);
    
    return textSharpness;
  }

  /**
   * Calculate sharpness specifically for text regions
   */
  private calculateTextSharpness(imageData: ImageData, textItems: any[]): {
    textSharpnessScore: number;
    isTextBlurry: boolean;
    textMetrics: any;
  } {
    const { data, width, height } = imageData;
    let totalVariance = 0;
    let sampleCount = 0;
    let edgeIntensity = 0;

    // Sample text regions more intelligently
    const sampleSize = 5; // Size of sampling window
    const stride = Math.max(1, Math.floor(Math.min(width, height) / 100)); // Adaptive stride

    for (let y = 0; y < height - sampleSize; y += stride) {
      for (let x = 0; x < width - sampleSize; x += stride) {
        // Calculate local variance in this region
        let localSum = 0;
        let localSumSq = 0;
        let localCount = 0;
        let maxGradient = 0;

        for (let dy = 0; dy < sampleSize; dy++) {
          for (let dx = 0; dx < sampleSize; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            
            // Convert to grayscale
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            
            localSum += gray;
            localSumSq += gray * gray;
            localCount++;

            // Calculate gradient magnitude for edge detection
            if (dx < sampleSize - 1 && dy < sampleSize - 1) {
              const rightIdx = ((y + dy) * width + (x + dx + 1)) * 4;
              const downIdx = ((y + dy + 1) * width + (x + dx)) * 4;
              
              const rightGray = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
              const downGray = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];
              
              const gradX = rightGray - gray;
              const gradY = downGray - gray;
              const gradient = Math.sqrt(gradX * gradX + gradY * gradY);
              
              maxGradient = Math.max(maxGradient, gradient);
            }
          }
        }

        if (localCount > 0) {
          const mean = localSum / localCount;
          const variance = (localSumSq / localCount) - (mean * mean);
          
          // Weight regions with higher variance (likely text)
          if (variance > 100) { // Threshold for text-like regions
            totalVariance += variance;
            edgeIntensity += maxGradient;
            sampleCount++;
          }
        }
      }
    }

    const avgVariance = sampleCount > 0 ? totalVariance / sampleCount : 0;
    const avgEdgeIntensity = sampleCount > 0 ? edgeIntensity / sampleCount : 0;
    
    // Combined sharpness score
    const sharpnessScore = (avgVariance / 1000) + (avgEdgeIntensity / 50);
    
    // Thresholds based on typical text characteristics
    const isTextBlurry = sharpnessScore < 0.8; // Adjust based on testing
    
    return {
      textSharpnessScore: sharpnessScore,
      isTextBlurry,
      textMetrics: {
        avgVariance,
        avgEdgeIntensity,
        sampleCount,
        threshold: 0.8
      }
    };
  }

  /**
   * Analyze a PDF file for quality and blur
   */
  async analyzePDF(file: File): Promise<PDFAnalysisResult> {
    this.log('Starting PDF analysis for file:', file.name);

    if (!this.pdfLib) {
      await this.loadPdfJS();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await this.pdfLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      let extractedText = '';
      let isScanned = false;
      const pageResults: BlurAnalysisResult[] = [];

      this.log(`PDF has ${pdf.numPages} pages`);

      // Check all pages for text content and quality
      for (let i = 1; i <= pdf.numPages; i++) {
        this.log(`Analyzing page ${i}/${pdf.numPages}`);
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Check if page has text content
        if (textContent.items.length === 0) {
          isScanned = true;
        }

        extractedText += textContent.items.map((item: any) => item.str).join(' ');

        // Analyze page for blur using multiple methods
        try {
          // First, analyze page content to understand its nature
          const contentAnalysis = this.analyzePageContent(textContent, i);
          
          const pageAnalysis = await this.checkPdfPageQuality(pdf, i);
          
          // For text-based PDFs, also do text sharpness analysis
          if (textContent.items.length > 0) {
            try {
              const textSharpness = await this.analyzeTextSharpness(pdf, i);
              
              // Smart blur decision based on content type
              let finalIsBlurry = pageAnalysis.isBlurry || textSharpness.isTextBlurry;
              
              // If this looks like a header/logo page, be more lenient
              if (contentAnalysis.isLikelyHeaderPage) {
                // Only consider blurry if text sharpness is very poor
                finalIsBlurry = textSharpness.textSharpnessScore < 0.5; // More lenient threshold
                this.log(`Page ${i} identified as likely header/logo page - using lenient blur criteria`);
              }
              
              const combinedResult: BlurAnalysisResult = {
                ...pageAnalysis,
                isBlurry: finalIsBlurry,
                confidence: Math.max(pageAnalysis.confidence, textSharpness.textSharpnessScore),
                method: `${pageAnalysis.method} + Text Analysis${contentAnalysis.isLikelyHeaderPage ? ' (Header-adjusted)' : ''}`,
                metrics: {
                  ...pageAnalysis.metrics,
                  textSharpness: textSharpness,
                  contentAnalysis: contentAnalysis
                }
              };
              
              pageResults.push(combinedResult);
              this.log(`Page ${i} combined analysis:`, combinedResult);
            } catch (textError) {
              this.log(`Text analysis failed for page ${i}:`, textError);
              pageResults.push(pageAnalysis);
            }
          } else {
            pageResults.push(pageAnalysis);
          }
          
        } catch (error) {
          this.log(`Failed to analyze page ${i}:`, error);
          // Continue with other pages
        }
      }

      // Determine if PDF is scanned based on text content
      const isTextBased = extractedText.length >= 10;
      const finalIsScanned = isScanned || !isTextBased;

      this.log(`PDF analysis complete. Scanned: ${finalIsScanned}, Text length: ${extractedText.length}`);

      // Determine overall quality with smart logic for first page issues
      let isQualityGood = true;
      
      if (pageResults.length > 0) {
        const blurryPages = pageResults.filter(result => result.isBlurry);
        
        // Smart quality assessment for multi-page documents
        if (pageResults.length > 1) {
          // For multi-page docs, use majority rule but be lenient with first page
          const nonFirstPageResults = pageResults.slice(1);
          const blurryNonFirstPages = nonFirstPageResults.filter(result => result.isBlurry);
          
          // If first page is blurry but rest are clear, likely false positive
          const firstPageBlurry = pageResults[0].isBlurry;
          const restPagesBlurry = blurryNonFirstPages.length > 0;
          
          if (firstPageBlurry && !restPagesBlurry) {
            // First page alone is blurry - likely contains graphics/logos
            this.log('First page marked as blurry but rest are clear - likely false positive due to graphics/logos');
            isQualityGood = true;
          } else if (blurryNonFirstPages.length >= Math.ceil(nonFirstPageResults.length / 2)) {
            // Majority of non-first pages are blurry
            isQualityGood = false;
          } else {
            // Most pages are clear
            isQualityGood = true;
          }
          
          this.log(`Smart quality check: First page blurry: ${firstPageBlurry}, Rest pages blurry: ${blurryNonFirstPages.length}/${nonFirstPageResults.length}, Final decision: ${isQualityGood ? 'Good' : 'Poor'}`);
        } else {
          // Single page - use original logic
          isQualityGood = blurryPages.length === 0;
          this.log(`Single page quality check: ${blurryPages.length}/${pageResults.length} pages are blurry`);
        }
        
        this.log(`PDF type: ${finalIsScanned ? 'Scanned' : 'Text-based'}`);
      }

      const result: PDFAnalysisResult = {
        isQualityGood,
        isScanned: finalIsScanned,
        pagesAnalyzed: pdf.numPages,
        textLength: extractedText.length,
        pageResults: pageResults.length > 0 ? pageResults : undefined
      };

      this.log('Final PDF analysis result:', result);
      return result;

    } catch (error) {
      this.log('PDF analysis failed:', error);
      throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick check if a PDF is of good quality
   */
  async isGoodQuality(file: File): Promise<boolean> {
    const result = await this.analyzePDF(file);
    return result.isQualityGood;
  }
}
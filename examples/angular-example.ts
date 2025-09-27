import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlurryCheck, BlurAnalysisResult, PDFAnalysisResult } from 'blurry-check';

type AnalysisResult = BlurAnalysisResult | PDFAnalysisResult;

interface Config {
  method: 'edge' | 'laplacian' | 'both';
  edgeWidthThreshold: number;
  debug: boolean;
}

@Component({
  selector: 'app-blur-checker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="blur-checker">
      <h2>🔍 Angular Blur Detection Example</h2>
      
      <!-- Configuration Panel -->
      <div class="config-panel">
        <h3>Configuration</h3>
        <div class="config-grid">
          <div class="config-item">
            <label>Detection Method:</label>
            <select [(ngModel)]="config.method" (ngModelChange)="updateChecker()">
              <option value="edge">Edge Detection</option>
              <option value="laplacian">OpenCV Laplacian</option>
              <option value="both">Both Methods</option>
            </select>
          </div>
          
          <div class="config-item">
            <label>Edge Threshold: {{ config.edgeWidthThreshold }}</label>
            <input 
              type="range"
              [(ngModel)]="config.edgeWidthThreshold"
              (ngModelChange)="updateChecker()"
              min="0.1" 
              max="2" 
              step="0.1"
            />
          </div>
          
          <div class="config-item">
            <label>
              <input 
                type="checkbox" 
                [(ngModel)]="config.debug"
                (ngModelChange)="updateChecker()"
              /> 
              Debug Mode
            </label>
          </div>
        </div>
      </div>

      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.dragover]="isDragOver"
        (drop)="handleDrop($event)"
        (dragover)="handleDragOver($event)"
        (dragleave)="isDragOver = false"
      >
        <input 
          #fileInput
          type="file" 
          accept="image/*,.pdf"
          (change)="handleFileChange($event)"
          style="display: none"
        />
        
        <div *ngIf="!isAnalyzing">
          <button (click)="fileInput.click()" class="upload-btn">
            📁 Choose File
          </button>
          <p>or drag and drop here</p>
          <small>Supports: Images (JPG, PNG, GIF, etc.) and PDF files</small>
        </div>
        
        <div *ngIf="isAnalyzing" class="analyzing">
          <div class="spinner"></div>
          <p>Analyzing {{ selectedFile?.name }}...</p>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="result" class="results">
        <div 
          class="result-card"
          [ngClass]="{ 
            'success': isGoodQuality(result), 
            'error': !isGoodQuality(result) 
          }"
        >
          <h3>
            {{ isGoodQuality(result) ? '✅' : '❌' }}
            {{ getResultMessage(result) }}
          </h3>
          
          <div class="result-details">
            <div *ngIf="isImageResult(result)">
              <p><strong>Method:</strong> {{ result.method }}</p>
              <p><strong>Confidence:</strong> {{ (result.confidence * 100).toFixed(1) }}%</p>
            </div>
            
            <div *ngIf="isPDFResult(result)">
              <p><strong>Type:</strong> {{ result.isScanned ? 'Scanned' : 'Text-based' }}</p>
              <p><strong>Pages:</strong> {{ result.pagesAnalyzed }}</p>
              <p><strong>Text Length:</strong> {{ result.textLength }} characters</p>
            </div>
          </div>
        </div>

        <!-- Detailed Metrics -->
        <div *ngIf="result.metrics || (isPDFResult(result) && result.pageResults)" class="metrics">
          <h4>📊 Detailed Analysis</h4>
          
          <div *ngIf="result.metrics?.edgeAnalysis" class="metric-section">
            <h5>Edge Detection Analysis</h5>
            <ul>
              <li>Image size: {{ result.metrics.edgeAnalysis.width }}×{{ result.metrics.edgeAnalysis.height }}</li>
              <li>Edges detected: {{ result.metrics.edgeAnalysis.numEdges }}</li>
              <li>Average edge width: {{ result.metrics.edgeAnalysis.avgEdgeWidth.toFixed(2) }}px</li>
              <li>Edge width percentage: {{ result.metrics.edgeAnalysis.avgEdgeWidthPerc.toFixed(2) }}%</li>
            </ul>
          </div>
          
          <div *ngIf="result.metrics?.laplacianVariance" class="metric-section">
            <h5>OpenCV Laplacian Analysis</h5>
            <ul>
              <li>Variance: {{ result.metrics.laplacianVariance.toFixed(2) }}</li>
            </ul>
          </div>
          
          <div *ngIf="isPDFResult(result) && result.pageResults" class="metric-section">
            <h5>Per-Page Analysis</h5>
            <ul>
              <li 
                *ngFor="let pageResult of result.pageResults; let i = index"
                [ngClass]="{ 'blurry-page': pageResult.isBlurry }"
              >
                Page {{ i + 1 }}: 
                {{ pageResult.isBlurry ? 'Blurry' : 'Clear' }}
                ({{ (pageResult.confidence * 100).toFixed(1) }}% confidence)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- File Preview -->
      <div *ngIf="previewUrl" class="preview">
        <h4>Preview</h4>
        <img [src]="previewUrl" alt="File preview" />
      </div>
    </div>
  `,
  styles: [`
    .blur-checker {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .config-panel {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .config-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .config-item label {
      font-weight: bold;
      font-size: 14px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s ease;
      margin-bottom: 20px;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: #007bff;
      background-color: #f8f9ff;
    }

    .upload-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin-bottom: 10px;
    }

    .upload-btn:hover {
      background: #0056b3;
    }

    .analyzing {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .results {
      margin-bottom: 20px;
    }

    .result-card {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .result-card.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .result-card.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .result-details {
      margin-top: 10px;
      font-size: 14px;
    }

    .metrics {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      font-size: 14px;
    }

    .metric-section {
      margin-bottom: 15px;
    }

    .metric-section h5 {
      margin-bottom: 8px;
      color: #495057;
    }

    .metric-section ul {
      margin: 0;
      padding-left: 20px;
    }

    .blurry-page {
      color: #dc3545;
      font-weight: bold;
    }

    .preview {
      margin-top: 20px;
    }

    .preview img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  `]
})
export class BlurCheckerComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  config: Config = {
    method: 'edge',
    edgeWidthThreshold: 0.5,
    debug: false
  };

  isDragOver = false;
  isAnalyzing = false;
  selectedFile: File | null = null;
  result: AnalysisResult | null = null;
  previewUrl: string | null = null;

  private checker = new BlurryCheck(this.config);

  updateChecker(): void {
    this.checker = new BlurryCheck({ ...this.config });
  }

  handleFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  async processFile(file: File): Promise<void> {
    this.selectedFile = file;
    this.isAnalyzing = true;
    this.result = null;
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }

    try {
      if (file.type === 'application/pdf') {
        this.result = await this.checker.analyzePDF(file);
      } else {
        this.result = await this.checker.analyzeImage(file);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(\`Analysis failed: \${error}\`);
    } finally {
      this.isAnalyzing = false;
    }
  }

  isImageResult(result: AnalysisResult): result is BlurAnalysisResult {
    return 'isBlurry' in result;
  }

  isPDFResult(result: AnalysisResult): result is PDFAnalysisResult {
    return 'isQualityGood' in result;
  }

  isGoodQuality(result: AnalysisResult): boolean {
    if (this.isImageResult(result)) {
      return !result.isBlurry;
    } else {
      return result.isQualityGood;
    }
  }

  getResultMessage(result: AnalysisResult): string {
    if (this.isImageResult(result)) {
      return result.isBlurry ? 'Image is Blurry' : 'Image is Clear';
    } else {
      return result.isQualityGood ? 'PDF Quality is Good' : 'PDF Quality is Poor';
    }
  }
}
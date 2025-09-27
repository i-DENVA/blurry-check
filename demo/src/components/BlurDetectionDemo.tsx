'use client'

import React, { useState, useRef } from 'react'
import { BlurryCheck } from '../lib/index.esm.js'
import type { BlurAnalysisResult, PDFAnalysisResult } from '../lib/types'
import { Upload, FileImage, FileText, CheckCircle, XCircle, BarChart3, Settings, Loader2 } from 'lucide-react'

type AnalysisResult = BlurAnalysisResult | PDFAnalysisResult

interface DemoConfig {
  method: 'edge' | 'laplacian' | 'both'
  edgeWidthThreshold: number
  laplacianThreshold: number
  debug: boolean
}

export default function BlurDetectionDemo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [config, setConfig] = useState<DemoConfig>({
    method: 'edge',
    edgeWidthThreshold: 0.5,
    laplacianThreshold: 100,
    debug: true
  })
  const [showConfig, setShowConfig] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<Array<{ file: string, result: AnalysisResult, timestamp: number }>>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setResult(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    // Auto-analyze
    await analyzeFile(file)
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    
    try {
      // Use more sensitive settings for PDFs
      const pdfConfig = file.type === 'application/pdf' ? {
        ...config,
        edgeWidthThreshold: Math.min(config.edgeWidthThreshold, 0.3), // More sensitive for PDFs
        method: 'edge' as const, // Use edge detection for consistent results
        debug: true // Enable debug logging
      } : config;
      
      const checker = new BlurryCheck(pdfConfig)
      let analysisResult: AnalysisResult
      
      if (file.type === 'application/pdf') {
        console.log('Analyzing PDF with config:', pdfConfig);
        analysisResult = await checker.analyzePDF(file)
        console.log('PDF analysis result:', analysisResult);
      } else {
        analysisResult = await checker.analyzeImage(file)
      }
      
      setResult(analysisResult)
      
      // Add to history
      setAnalysisHistory(prev => [
        { file: file.name, result: analysisResult, timestamp: Date.now() },
        ...prev.slice(0, 4) // Keep last 5 results
      ])
      
    } catch (error) {
      console.error('Analysis failed:', error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
      
      analyzeFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const isImageResult = (result: AnalysisResult): result is BlurAnalysisResult => {
    return 'isBlurry' in result
  }

  const isPDFResult = (result: AnalysisResult): result is PDFAnalysisResult => {
    return 'isQualityGood' in result
  }

  const getResultStatus = (result: AnalysisResult) => {
    if (isImageResult(result)) {
      return result.isBlurry ? 'Blurry' : 'Clear'
    } else {
      return result.isQualityGood ? 'Good Quality' : 'Poor Quality'
    }
  }

  const getResultColor = (result: AnalysisResult) => {
    if (isImageResult(result)) {
      return result.isBlurry ? 'text-red-600' : 'text-green-600'
    } else {
      return result.isQualityGood ? 'text-green-600' : 'text-red-600'
    }
  }

  const getResultIcon = (result: AnalysisResult) => {
    if (isImageResult(result)) {
      return result.isBlurry ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />
    } else {
      return result.isQualityGood ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">
          🔍 Blurry Check Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload images or PDFs to test our advanced blur detection and quality analysis algorithms
        </p>
        <p className="text-sm text-gray-500">
          Maintained by <a href="https://idenva.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">Idenva.com</a>
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showConfig ? 'Hide' : 'Show'} Settings
          </button>
        </div>
        
        {showConfig && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Detection Method</label>
              <select
                value={config.method}
                onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value as any }))}
                className="w-full p-2 border rounded-md text-gray-700"
              >
                <option value="edge">Edge Detection (Fast)</option>
                <option value="laplacian">OpenCV Laplacian (Accurate)</option>
                <option value="both">Both Methods (Best)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Edge Width Threshold: {config.edgeWidthThreshold}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={config.edgeWidthThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, edgeWidthThreshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Lower = more sensitive to blur</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Laplacian Threshold: {config.laplacianThreshold}
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={config.laplacianThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, laplacianThreshold: parseInt(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Higher = more sensitive to blur</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="debug"
                checked={config.debug}
                onChange={(e) => setConfig(prev => ({ ...prev, debug: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="debug" className="text-sm font-medium text-gray-700">Enable Debug Logging</label>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isAnalyzing ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {isAnalyzing ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                <p className="text-blue-600 font-medium">Analyzing file...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-400">
                  Supports: JPG, PNG, GIF, BMP, WebP, PDF
                </p>
              </div>
            )}
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {selectedFile.type.startsWith('image/') ? (
                  <FileImage className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-sm text-gray-500">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-white rounded border"
                />
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Results
              </h3>
              
              <div className={`text-2xl font-bold mb-4 flex items-center gap-2 ${getResultColor(result)}`}>
                {getResultIcon(result)}
                {getResultStatus(result)}
              </div>

              {isImageResult(result) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Method Used</p>
                      <p className="font-medium text-gray-900">{result.method}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="font-medium text-gray-900">{(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  {result.metrics.edgeAnalysis && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Edge Analysis</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>Dimensions: {result.metrics.edgeAnalysis.width}×{result.metrics.edgeAnalysis.height}</div>
                        <div>Edges Found: {result.metrics.edgeAnalysis.numEdges}</div>
                        <div>Avg Edge Width: {result.metrics.edgeAnalysis.avgEdgeWidth.toFixed(2)}px</div>
                        <div>Edge Width %: {result.metrics.edgeAnalysis.avgEdgeWidthPerc.toFixed(2)}%</div>
                      </div>
                    </div>
                  )}

                  {result.metrics.laplacianVariance && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">OpenCV Analysis</h4>
                      <div className="text-sm text-gray-700">
                        Laplacian Variance: {result.metrics.laplacianVariance.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPDFResult(result) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Pages Analyzed</p>
                      <p className="font-medium text-gray-900">{result.pagesAnalyzed}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Document Type</p>
                      <p className="font-medium text-gray-900">{result.isScanned ? 'Scanned' : 'Text-based'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Extracted Text Length</p>
                    <p className="font-medium text-gray-900">{result.textLength} characters</p>
                  </div>

                  {result.pageResults && result.pageResults.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Page-by-Page Analysis</h4>
                      <div className="space-y-2">
                        {result.pageResults.map((pageResult, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">Page {index + 1}</span>
                            <span className={pageResult.isBlurry ? 'text-red-600' : 'text-green-600'}>
                              {pageResult.isBlurry ? 'Blurry' : 'Clear'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analysis History */}
          {analysisHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-gray-500">
              <h3 className="text-xl font-semibold mb-4">Recent Analysis</h3>
              <div className="space-y-3">
                {analysisHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{item.file}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${getResultColor(item.result)}`}>
                      {getResultStatus(item.result)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
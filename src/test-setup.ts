// Jest setup file for DOM testing
import 'jest-environment-jsdom';

// Mock ImageData first
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  
  constructor(data: Uint8ClampedArray | number, width?: number, height?: number) {
    if (typeof data === 'number') {
      this.width = data;
      this.height = width || data;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = data;
      this.width = width || 100;
      this.height = height || 100;
    }
  }
}

// Set global ImageData
global.ImageData = MockImageData as any;

// Mock canvas and 2D context for testing
const mockCanvas = {
  getContext: jest.fn(() => ({
    createImageData: jest.fn((width: number, height: number) => new MockImageData(width, height)),
    getImageData: jest.fn((_x: number, _y: number, width: number, height: number) => new MockImageData(width, height)),
    drawImage: jest.fn(),
  })),
  width: 100,
  height: 100,
};

// Mock document.createElement for canvas
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {
      src: '',
      onload: null,
      onerror: null,
    };
  }),
});

// Mock global objects that might be needed
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  width = 100;
  height = 100;
} as any;

global.FileReader = class {
  onload: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | ArrayBuffer | null = null;
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,test';
      this.onload?.({ target: { result: this.result } });
    }, 0);
  }
  
  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      this.onload?.({ target: { result: this.result } });
    }, 0);
  }
} as any;
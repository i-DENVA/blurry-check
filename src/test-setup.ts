// Jest setup file for DOM testing
import 'jest-environment-jsdom';

// Mock canvas and 2D context for testing
const mockCanvas = {
  getContext: jest.fn(() => ({
    createImageData: jest.fn(),
    getImageData: jest.fn(),
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
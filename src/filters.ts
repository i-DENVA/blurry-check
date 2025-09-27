/**
 * Canvas filter utilities for image processing
 */

export interface ImageFilters {
  getFloat32Array(len: number | number[]): Float32Array | number[];
  createImageData(w: number, h: number): ImageData;
  luminance(pixels: ImageData): ImageData;
  convolve(pixels: ImageData, weights: Float32Array | number[], opaque: boolean): ImageData;
  gaussianBlur(pixels: ImageData, diameter: number): ImageData;
}

const createCanvas = (): HTMLCanvasElement => {
  if (typeof document !== 'undefined') {
    return document.createElement('canvas');
  }
  // For Node.js environments, you would need canvas polyfill
  throw new Error('Canvas not available in this environment');
};

export const Filters: ImageFilters = {
  getFloat32Array(len: number | number[]): Float32Array | number[] {
    if (Array.isArray(len)) return len.slice(0);
    return new Float32Array(len);
  },

  createImageData(w: number, h: number): ImageData {
    const context = createCanvas().getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    return context.createImageData(w, h);
  },

  luminance(pixels: ImageData): ImageData {
    const output = this.createImageData(pixels.width, pixels.height);
    const dst = output.data;
    const d = pixels.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // CIE luminance for RGB
      const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      dst[i] = dst[i + 1] = dst[i + 2] = v;
      dst[i + 3] = d[i + 3];
    }
    return output;
  },

  convolve(pixels: ImageData, weights: Float32Array | number[], opaque: boolean): ImageData {
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = pixels.data;
    const sw = pixels.width;
    const sh = pixels.height;
    const w = sw;
    const h = sh;
    const output = this.createImageData(w, h);
    const dst = output.data;
    const alphaFac = opaque ? 1 : 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstOff = (y * w + x) * 4;
        let r = 0,
          g = 0,
          b = 0,
          a = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = Math.min(sh - 1, Math.max(0, y + cy - halfSide));
            const scx = Math.min(sw - 1, Math.max(0, x + cx - halfSide));
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
            a += src[srcOff + 3] * wt;
          }
        }

        dst[dstOff] = r;
        dst[dstOff + 1] = g;
        dst[dstOff + 2] = b;
        dst[dstOff + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  },

  gaussianBlur(pixels: ImageData, diameter: number): ImageData {
    diameter = Math.abs(diameter);
    if (diameter <= 1) return pixels;

    const radius = diameter / 2;
    const len = Math.ceil(diameter) + (1 - (Math.ceil(diameter) % 2));
    const weights = this.getFloat32Array(len);

    // Calculate Gaussian weights
    const rho = (radius + 0.5) / 3;
    const rhoSq = rho * rho;
    const gaussianFactor = 1 / Math.sqrt(2 * Math.PI * rhoSq);
    const rhoFactor = -1 / (2 * rho * rho);
    const middle = Math.floor(len / 2);

    let wsum = 0;
    for (let i = 0; i < len; i++) {
      const x = i - middle;
      const gx = gaussianFactor * Math.exp(x * x * rhoFactor);
      if (weights instanceof Float32Array) {
        weights[i] = gx;
      } else {
        weights[i] = gx;
      }
      wsum += gx;
    }

    // Normalize weights
    for (let i = 0; i < weights.length; i++) {
      if (weights instanceof Float32Array) {
        weights[i] /= wsum;
      } else {
        weights[i] /= wsum;
      }
    }

    // Apply horizontal and vertical blur
    const firstPass = this.convolve(pixels, weights, true);
    return this.convolve(firstPass, weights, true);
  }
};
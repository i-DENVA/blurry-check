import { createCanvas } from './image-utils';

export const Filters = {
  getFloat32Array(len: number | number[]): Float32Array | number[] {
    if (Array.isArray(len)) return len.slice(0);
    return new Float32Array(len);
  },

  createImageData(w: number, h: number): ImageData {
    const ctx = createCanvas().getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    return ctx.createImageData(w, h);
  },

  luminance(pixels: ImageData): ImageData {
    const output = this.createImageData(pixels.width, pixels.height);
    const dst = output.data;
    const d = pixels.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
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
        let r = 0, g = 0, b = 0, a = 0;
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
};

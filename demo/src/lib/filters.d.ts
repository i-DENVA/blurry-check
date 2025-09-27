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
export declare const Filters: ImageFilters;
//# sourceMappingURL=filters.d.ts.map
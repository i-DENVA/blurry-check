export declare const Filters: {
    getFloat32Array(len: number | number[]): Float32Array | number[];
    createImageData(w: number, h: number): ImageData;
    luminance(pixels: ImageData): ImageData;
    convolve(pixels: ImageData, weights: Float32Array | number[], opaque: boolean): ImageData;
};
//# sourceMappingURL=filters.d.ts.map
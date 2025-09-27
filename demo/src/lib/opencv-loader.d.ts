/**
 * OpenCV loader utility for dynamic loading of OpenCV.js
 */
declare global {
    interface Window {
        cv?: any;
    }
}
export declare class OpenCVLoader {
    private static instance;
    private loading;
    private loaded;
    private openCvUrl;
    constructor(openCvUrl?: string);
    static getInstance(openCvUrl?: string): OpenCVLoader;
    loadOpenCV(): Promise<void>;
    private waitForLoad;
    isLoaded(): boolean;
    getCV(): any;
}
//# sourceMappingURL=opencv-loader.d.ts.map
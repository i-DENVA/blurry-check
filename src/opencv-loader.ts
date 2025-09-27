/**
 * OpenCV loader utility for dynamic loading of OpenCV.js
 */

declare global {
  interface Window {
    cv?: any;
  }
}

export class OpenCVLoader {
  private static instance: OpenCVLoader;
  private loading: boolean = false;
  private loaded: boolean = false;
  private openCvUrl: string;

  constructor(openCvUrl: string = 'https://docs.opencv.org/4.5.4/opencv.js') {
    this.openCvUrl = openCvUrl;
  }

  static getInstance(openCvUrl?: string): OpenCVLoader {
    if (!OpenCVLoader.instance) {
      OpenCVLoader.instance = new OpenCVLoader(openCvUrl);
    }
    return OpenCVLoader.instance;
  }

  async loadOpenCV(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('OpenCV.js can only be loaded in browser environments');
    }

    // If OpenCV is already loaded
    if (this.loaded && window.cv) {
      return Promise.resolve();
    }

    // If currently loading, wait for it
    if (this.loading) {
      return this.waitForLoad();
    }

    this.loading = true;

    try {
      // Remove existing script if any
      const existingScript = document.querySelector('#opencv-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      const script = document.createElement('script');
      script.src = this.openCvUrl;
      script.async = true;
      script.id = 'opencv-script';

      const loadPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
          // Check for OpenCV initialization
          const checkInterval = setInterval(() => {
            if (window.cv) {
              clearInterval(checkInterval);
              this.loaded = true;
              this.loading = false;
              resolve();
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            this.loading = false;
            reject(new Error('OpenCV loading timeout'));
          }, 10000);
        };
        
        script.onerror = () => {
          this.loading = false;
          reject(new Error('Failed to load OpenCV'));
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
          if (this.loaded && window.cv) {
            resolve();
          } else {
            reject(new Error('OpenCV failed to load'));
          }
        }
      }, 100);

      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('OpenCV loading timeout'));
      }, 15000);
    });
  }

  isLoaded(): boolean {
    return this.loaded && typeof window !== 'undefined' && !!window.cv;
  }

  getCV(): any {
    if (!this.isLoaded()) {
      throw new Error('OpenCV is not loaded. Call loadOpenCV() first.');
    }
    return window.cv;
  }
}
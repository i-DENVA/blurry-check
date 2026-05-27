export class OpenCVLoader {
  private static instance: OpenCVLoader;
  private loading = false;
  private loaded = false;
  private openCvUrl: string;

  constructor(openCvUrl = 'https://docs.opencv.org/4.5.4/opencv.js') {
    this.openCvUrl = openCvUrl;
  }

  static getInstance(openCvUrl?: string): OpenCVLoader {
    if (!OpenCVLoader.instance) OpenCVLoader.instance = new OpenCVLoader(openCvUrl);
    return OpenCVLoader.instance;
  }

  async loadOpenCV(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('OpenCV.js requires a browser environment');
    if (this.loaded && window.cv) return;

    const existing = document.querySelector('#opencv-script') as HTMLScriptElement | null;
    if (existing && window.cv) {
      this.loaded = true;
      return;
    }
    if (existing && !window.cv) {
      this.loading = true;
      try {
        await waitForExistingScript(existing);
        this.loaded = true;
        this.loading = false;
      } catch {
        existing.remove();
        this.loading = false;
      }
    }

    if (this.loaded && window.cv) return;
    if (this.loading) return this.waitForLoad();

    this.loading = true;
    const script = document.createElement('script');
    script.src = this.openCvUrl;
    script.async = true;
    script.id = 'opencv-script';

    try {
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          const check = setInterval(() => {
            if (window.cv) {
              clearInterval(check);
              this.loaded = true;
              this.loading = false;
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            this.loading = false;
            reject(new Error('OpenCV loading timeout'));
          }, 10000);
        };
        script.onerror = () => {
          this.loading = false;
          reject(new Error('Failed to load OpenCV'));
        };
        document.body.appendChild(script);
      });
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (!this.loading) {
          clearInterval(check);
          if (this.loaded && window.cv) resolve();
          else reject(new Error('OpenCV failed to load'));
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('OpenCV loading timeout'));
      }, 15000);
    });
  }

  isLoaded(): boolean {
    return this.loaded && typeof window !== 'undefined' && !!window.cv;
  }

  getCV(): any {
    if (!this.isLoaded()) throw new Error('OpenCV is not loaded. Call loadOpenCV() first.');
    return window.cv;
  }
}

function waitForExistingScript(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cv) return resolve();
    script.addEventListener(
      'load',
      () => {
        const check = setInterval(() => {
          if (window.cv) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          reject(new Error('OpenCV init timeout'));
        }, 10000);
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error('OpenCV script failed')), {
      once: true,
    });
  });
}

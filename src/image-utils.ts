export function createCanvas(): HTMLCanvasElement {
  if (typeof document !== 'undefined') return document.createElement('canvas');
  throw new Error('Canvas not available in this environment');
}

export async function getImageDataFromInput(
  input: any,
  canvas?: HTMLCanvasElement,
): Promise<ImageData> {
  const c = canvas ?? createCanvas();
  if (input instanceof ImageData) return input;

  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  if (input instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          c.width = img.width;
          c.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, c.width, c.height));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  }

  if (input instanceof HTMLImageElement) {
    c.width = input.naturalWidth || input.width;
    c.height = input.naturalHeight || input.height;
    ctx.drawImage(input, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  }

  if (input instanceof HTMLCanvasElement) {
    const srcCtx = input.getContext('2d');
    if (!srcCtx) throw new Error('Could not get 2D context from source canvas');
    return srcCtx.getImageData(0, 0, input.width, input.height);
  }

  throw new Error('Unsupported input type');
}

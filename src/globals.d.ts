declare global {
  interface Window {
    cv?: any;
    pdfjsLib?: {
      getDocument: (data: { data: Uint8Array }) => { promise: Promise<any> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

export {};

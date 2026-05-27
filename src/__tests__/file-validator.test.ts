import { validateFile } from '../validators/file-validator';

const origBlobSlice = Blob.prototype.slice;
beforeAll(() => { Blob.prototype.slice = function (this: Blob, start?: number, end?: number, contentType?: string) { const blob = origBlobSlice.call(this, start, end, contentType); return Object.defineProperty(blob, 'arrayBuffer', { value: () => Promise.resolve(new ArrayBuffer(0)), writable: true, configurable: true }); }; });
afterAll(() => { Blob.prototype.slice = origBlobSlice; });

function makeFile(name: string, mimeType: string, _header?: number[], size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: mimeType });
}

describe('validateFile — spoofed and edge cases', () => {
  it('passes legitimate PDF without magic bytes check', async () => { const file = makeFile('document.pdf', 'application/pdf'); const result = await validateFile(file, { validateMagicBytes: false }); expect(result.ok).toBe(true); expect(result.score).toBe(100); });
  it('passes spoofed-pdf.pdf when MIME and extension are both valid (magic bytes off)', async () => { const file = makeFile('spoofed-pdf.pdf', 'application/pdf'); const result = await validateFile(file, { validateMagicBytes: false }); expect(result.ok).toBe(true); expect(result.status).toBe('pass'); });
  it('passes spoofed-image.jpg when MIME and extension are both valid (magic bytes off)', async () => { const file = makeFile('spoofed-image.jpg', 'image/jpeg'); const result = await validateFile(file, { validateMagicBytes: false }); expect(result.ok).toBe(true); expect(result.status).toBe('pass'); });
  it('fails when extension is not allowed even with valid MIME', async () => { const file = makeFile('bad.xyz', 'image/jpeg'); const result = await validateFile(file, { validateMagicBytes: false }); expect(result.ok).toBe(false); expect(result.message).toContain('unsupported_format'); });
  it('fails for empty file', async () => { const file = new File([], 'empty.pdf', { type: 'application/pdf' }); const result = await validateFile(file, { validateMagicBytes: false }); expect(result.ok).toBe(false); expect(result.message).toContain('invalid_file'); });
  it('fails for file exceeding size limit', async () => { const file = new File([new Uint8Array(20 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' }); const result = await validateFile(file, { validateMagicBytes: false, maxSizeMB: 5 }); expect(result.ok).toBe(false); expect(result.message).toContain('too_large'); });
  it('respects custom allowedTypes', async () => { const file = makeFile('photo.jpg', 'image/jpeg'); const result = await validateFile(file, { validateMagicBytes: false, allowedTypes: ['application/pdf'] }); expect(result.ok).toBe(false); expect(result.message).toContain('unsupported_format'); });
  it('passes when allowedTypes is empty (any type allowed)', async () => { const file = makeFile('anything.xyz', 'application/x-custom'); const result = await validateFile(file, { validateMagicBytes: false, allowedTypes: [], allowedExtensions: [] }); expect(result.ok).toBe(true); expect(result.score).toBe(100); });
});

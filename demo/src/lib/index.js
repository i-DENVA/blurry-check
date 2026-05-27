'use strict';
function e() {
  if ('undefined' != typeof document) return document.createElement('canvas');
  throw new Error('Canvas not available in this environment');
}
async function t(t, n) {
  const i = null != n ? n : e();
  if (t instanceof ImageData) return t;
  const o = i.getContext('2d');
  if (!o) throw new Error('Could not get 2D context from canvas');
  if (t instanceof File)
    return new Promise((e, n) => {
      const a = new FileReader();
      (a.onload = (t) => {
        var a;
        const s = new Image();
        (s.onload = () => {
          (i.width = s.width),
            (i.height = s.height),
            o.drawImage(s, 0, 0),
            e(o.getImageData(0, 0, i.width, i.height));
        }),
          (s.onerror = n),
          (s.src = null === (a = t.target) || void 0 === a ? void 0 : a.result);
      }),
        (a.onerror = n),
        a.readAsDataURL(t);
    });
  if (t instanceof HTMLImageElement)
    return (
      (i.width = t.naturalWidth || t.width),
      (i.height = t.naturalHeight || t.height),
      o.drawImage(t, 0, 0),
      o.getImageData(0, 0, i.width, i.height)
    );
  if (t instanceof HTMLCanvasElement) {
    const e = t.getContext('2d');
    if (!e) throw new Error('Could not get 2D context from source canvas');
    return e.getImageData(0, 0, t.width, t.height);
  }
  throw new Error('Unsupported input type');
}
Object.defineProperty(exports, '__esModule', { value: !0 });
const n = {
  getFloat32Array: (e) => (Array.isArray(e) ? e.slice(0) : new Float32Array(e)),
  createImageData(t, n) {
    const i = e().getContext('2d');
    if (!i) throw new Error('Could not get 2D context');
    return i.createImageData(t, n);
  },
  luminance(e) {
    const t = this.createImageData(e.width, e.height),
      n = t.data,
      i = e.data;
    for (let e = 0; e < i.length; e += 4) {
      const t = 0.2126 * i[e] + 0.7152 * i[e + 1] + 0.0722 * i[e + 2];
      (n[e] = n[e + 1] = n[e + 2] = t), (n[e + 3] = i[e + 3]);
    }
    return t;
  },
  convolve(e, t, n) {
    const i = Math.round(Math.sqrt(t.length)),
      o = Math.floor(i / 2),
      a = e.data,
      s = e.width,
      r = e.height,
      l = s,
      c = r,
      d = this.createImageData(l, c),
      h = d.data,
      g = n ? 1 : 0;
    for (let e = 0; e < c; e++)
      for (let n = 0; n < l; n++) {
        const c = 4 * (e * l + n);
        let d = 0,
          m = 0,
          u = 0,
          p = 0;
        for (let l = 0; l < i; l++)
          for (let c = 0; c < i; c++) {
            const h =
                4 *
                (Math.min(r - 1, Math.max(0, e + l - o)) * s +
                  Math.min(s - 1, Math.max(0, n + c - o))),
              g = t[l * i + c];
            (d += a[h] * g), (m += a[h + 1] * g), (u += a[h + 2] * g), (p += a[h + 3] * g);
          }
        (h[c] = d), (h[c + 1] = m), (h[c + 2] = u), (h[c + 3] = p + g * (255 - p));
      }
    return d;
  },
};
class i {
  constructor(e = 'https://docs.opencv.org/4.5.4/opencv.js') {
    (this.loading = !1), (this.loaded = !1), (this.openCvUrl = e);
  }
  static getInstance(e) {
    return i.instance || (i.instance = new i(e)), i.instance;
  }
  async loadOpenCV() {
    if ('undefined' == typeof window) throw new Error('OpenCV.js requires a browser environment');
    if (this.loaded && window.cv) return;
    const e = document.querySelector('#opencv-script');
    if (e && window.cv) return void (this.loaded = !0);
    if (e && !window.cv) {
      this.loading = !0;
      try {
        await (function (e) {
          return new Promise((t, n) => {
            if (window.cv) return t();
            e.addEventListener(
              'load',
              () => {
                const e = setInterval(() => {
                  window.cv && (clearInterval(e), t());
                }, 100);
                setTimeout(() => {
                  clearInterval(e), n(new Error('OpenCV init timeout'));
                }, 1e4);
              },
              { once: !0 },
            ),
              e.addEventListener('error', () => n(new Error('OpenCV script failed')), { once: !0 });
          });
        })(e),
          (this.loaded = !0),
          (this.loading = !1);
      } catch (t) {
        e.remove(), (this.loading = !1);
      }
    }
    if (this.loaded && window.cv) return;
    if (this.loading) return this.waitForLoad();
    this.loading = !0;
    const t = document.createElement('script');
    (t.src = this.openCvUrl), (t.async = !0), (t.id = 'opencv-script');
    try {
      await new Promise((e, n) => {
        (t.onload = () => {
          const t = setInterval(() => {
            window.cv && (clearInterval(t), (this.loaded = !0), (this.loading = !1), e());
          }, 100);
          setTimeout(() => {
            clearInterval(t), (this.loading = !1), n(new Error('OpenCV loading timeout'));
          }, 1e4);
        }),
          (t.onerror = () => {
            (this.loading = !1), n(new Error('Failed to load OpenCV'));
          }),
          document.body.appendChild(t);
      });
    } catch (e) {
      throw ((this.loading = !1), e);
    }
  }
  async waitForLoad() {
    return new Promise((e, t) => {
      const n = setInterval(() => {
        this.loading ||
          (clearInterval(n),
          this.loaded && window.cv ? e() : t(new Error('OpenCV failed to load')));
      }, 100);
      setTimeout(() => {
        clearInterval(n), t(new Error('OpenCV loading timeout'));
      }, 15e3);
    });
  }
  isLoaded() {
    return this.loaded && 'undefined' != typeof window && !!window.cv;
  }
  getCV() {
    if (!this.isLoaded()) throw new Error('OpenCV is not loaded. Call loadOpenCV() first.');
    return window.cv;
  }
}
const o = 235,
  a = 0.001,
  s = 190,
  r = 35,
  l = 150,
  c = 115,
  d = 170,
  h = 250,
  g = 0.08;
class m {
  constructor(t = {}) {
    var n, o, a, s, r, l;
    (this.config = {
      edgeWidthThreshold: null !== (n = t.edgeWidthThreshold) && void 0 !== n ? n : 0.3,
      laplacianThreshold: null !== (o = t.laplacianThreshold) && void 0 !== o ? o : 150,
      method: null !== (a = t.method) && void 0 !== a ? a : 'both',
      openCvUrl:
        null !== (s = t.openCvUrl) && void 0 !== s ? s : 'https://docs.opencv.org/4.5.4/opencv.js',
      canvas: null !== (r = t.canvas) && void 0 !== r ? r : e(),
      debug: null !== (l = t.debug) && void 0 !== l && l,
    }),
      (this.openCvLoader = i.getInstance(this.config.openCvUrl));
  }
  log(e, ...t) {
    this.config.debug && console.log(`[BlurDetector] ${e}`, ...t);
  }
  detectEdges(e) {
    const t = n.luminance(e);
    return n.convolve(t, n.getFloat32Array([1, 0, -1, 2, 0, -2, 1, 0, -1]), !0);
  }
  reducedPixels(e) {
    const { data: t, width: n } = e,
      i = 4 * n,
      o = [];
    for (let e = 0; e < t.length; e += i) {
      const a = new Uint8ClampedArray(n);
      let s = 0;
      for (let n = e; n < e + i; n += 4) a[s++] = t[n];
      o.push(a);
    }
    return o;
  }
  detectBlur(e) {
    const t = e[0].length,
      n = e.length;
    let i = 0,
      o = 0;
    for (let a = 0; a < n; a++) {
      let n = -1;
      for (let s = 0; s < t; s++) {
        const t = e[a][s];
        n >= 0 &&
          s > n &&
          t < e[a][s - 1] &&
          (e[a][s - 1] >= 20 && (i++, (o += s - n - 1)), (n = -1)),
          0 === t && (n = s);
      }
    }
    if (0 === i) return { width: t, height: n, numEdges: 0, avgEdgeWidth: 0, avgEdgeWidthPerc: 0 };
    const a = o / i;
    return { width: t, height: n, numEdges: i, avgEdgeWidth: a, avgEdgeWidthPerc: (a / t) * 100 };
  }
  async analyzeImage(e) {
    this.log('Starting blur analysis, method:', this.config.method);
    const n = await t(e, this.config.canvas),
      i = { isBlurry: !1, confidence: 0, metrics: {}, method: this.config.method };
    try {
      if ('edge' === this.config.method || 'both' === this.config.method) {
        const e = this.detectBlur(this.reducedPixels(this.detectEdges(n)));
        i.metrics.edgeAnalysis = e;
        const t = e.avgEdgeWidthPerc > this.config.edgeWidthThreshold,
          o = e.numEdges < (n.width * n.height) / 1e4,
          a = t || o;
        this.log('Edge result:', e, 'blurry:', a),
          'edge' === this.config.method &&
            ((i.isBlurry = a),
            (i.confidence = Math.min(e.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1)));
      }
      if ('laplacian' === this.config.method || 'both' === this.config.method)
        try {
          const e = await this.detectBlurOpenCV(n);
          i.metrics.laplacianVariance = e;
          const t = e < this.config.laplacianThreshold;
          this.log('Laplacian:', e, 'blurry:', t),
            'laplacian' === this.config.method &&
              ((i.isBlurry = t), (i.confidence = Math.min(this.config.laplacianThreshold / e, 1)));
        } catch (e) {
          if (
            (this.log('OpenCV failed, fallback to edge:', e), 'laplacian' === this.config.method)
          ) {
            const e = this.detectBlur(this.reducedPixels(this.detectEdges(n)));
            (i.metrics.edgeAnalysis = e),
              (i.isBlurry = e.avgEdgeWidthPerc > this.config.edgeWidthThreshold),
              (i.confidence = Math.min(e.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1)),
              (i.method = 'edge (fallback)');
          }
        }
      if ('both' === this.config.method) {
        const e = i.metrics.edgeAnalysis,
          t =
            !!e &&
            (e.avgEdgeWidthPerc > this.config.edgeWidthThreshold ||
              e.numEdges < (n.width * n.height) / 1e4),
          o = 'number' == typeof i.metrics.laplacianVariance,
          a = !!o && i.metrics.laplacianVariance < this.config.laplacianThreshold;
        (i.isBlurry = o ? a : t),
          (i.confidence = Math.max(
            e ? Math.min(e.avgEdgeWidthPerc / this.config.edgeWidthThreshold, 1) : 0,
            i.metrics.laplacianVariance
              ? Math.min(this.config.laplacianThreshold / i.metrics.laplacianVariance, 1)
              : 0,
          ));
      }
      return this.log('Final:', i), i;
    } catch (e) {
      throw (
        (this.log('Analysis failed:', e),
        new Error(`Blur analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`))
      );
    }
  }
  async isBlurry(e) {
    return (await this.analyzeImage(e)).isBlurry;
  }
  async detectBlurOpenCV(e) {
    this.openCvLoader.isLoaded() || (await this.openCvLoader.loadOpenCV());
    const t = this.openCvLoader.getCV(),
      n = t.matFromImageData(e),
      i = new t.Mat();
    t.cvtColor(n, i, t.COLOR_RGBA2GRAY, 0);
    const o = new t.Mat();
    t.Laplacian(i, o, t.CV_64F);
    const a = new t.Mat(),
      s = new t.Mat();
    t.meanStdDev(o, a, s);
    const r = s.data64F[0] ** 2;
    return [n, i, o, a, s].forEach((e) => e.delete()), r;
  }
}
function u(e, t = 0, n = 100) {
  return Math.max(t, Math.min(n, e));
}
function p(e) {
  return Math.round(u(e));
}
function f(e, t) {
  return e ? 'pass' : t >= 60 ? 'warning' : 'fail';
}
function y(e, t, n, i) {
  const o = p(t);
  return { ok: e, status: f(e, o), score: o, message: n, details: i };
}
class w {
  constructor(e = {}) {
    (this.pdfLib = null), (this.loading = !1), (this.config = e), (this.blurDetector = new m(e));
  }
  calculateRenderedPageMetrics(e, t, n) {
    const { data: i, width: o, height: a } = e;
    let s = 0,
      r = 0,
      l = 0,
      c = 0,
      d = 0,
      h = 0,
      g = 255,
      m = 0,
      u = o,
      p = a,
      f = -1,
      y = -1;
    const w = i.length / 4;
    for (let e = 0; e < a; e++)
      for (let t = 0; t < o; t++) {
        const n = 4 * (e * o + t),
          a = 0.2126 * i[n] + 0.7152 * i[n + 1] + 0.0722 * i[n + 2];
        (s += a),
          (r += a * a),
          (g = Math.min(g, a)),
          (m = Math.max(m, a)),
          a >= 250 && h++,
          a < 245 &&
            ((l += a),
            (c += a * a),
            d++,
            (u = Math.min(u, t)),
            (p = Math.min(p, e)),
            (f = Math.max(f, t)),
            (y = Math.max(y, e)));
      }
    const v = s / w,
      x = r / w - v * v,
      b = Math.sqrt(Math.max(x, 0)),
      P = d > 0 ? l / d : v,
      M = d > 0 ? c / d - P * P : x,
      C = Math.sqrt(Math.max(M, 0)),
      k = d / w,
      _ = h / w,
      S = f >= u && y >= p,
      B = S
        ? { top: p / a, right: (o - f - 1) / o, bottom: (a - y - 1) / a, left: u / o }
        : { top: 1, right: 1, bottom: 1, left: 1 },
      L = Object.entries(B)
        .filter(([, e]) => e < 0.015)
        .map(([e]) => e),
      D = this.estimatePerspectiveScore(e),
      T = o / Math.max(a, 1);
    return {
      pageNumber: t,
      width: o,
      height: a,
      aspectRatio: T,
      orientation: T > 1.08 ? 'landscape' : T < 0.92 ? 'portrait' : 'square',
      rotation: n,
      brightness: v,
      contrast: b,
      minLuminance: g,
      maxLuminance: m,
      nonWhiteRatio: k,
      contentBrightness: P,
      contentContrast: C,
      glarePixelRatio: _,
      documentFrame: {
        detected: S,
        marginRatios: B,
        edgesTouchingBoundary: L,
        perspectiveScore: D,
        isLikelyCropped: L.length > 0,
        hasPerspectiveDistortion: D < 65,
      },
    };
  }
  estimatePerspectiveScore(e) {
    const { data: t, width: n, height: i } = e,
      o = [],
      a = Math.max(1, Math.floor(i / 40)),
      s = Math.max(1, Math.floor(n / 400));
    for (let e = 0; e < i; e += a) {
      let i = -1,
        a = -1;
      for (let o = 0; o < n; o += s) {
        const s = 4 * (e * n + o);
        0.2126 * t[s] + 0.7152 * t[s + 1] + 0.0722 * t[s + 2] < 245 &&
          (-1 === i && (i = o), (a = o));
      }
      i >= 0 && a > i && o.push({ left: i, right: a });
    }
    if (o.length < 8) return 100;
    const r = Math.floor(o.length / 4),
      l = o.slice(0, Math.max(1, r)),
      c = o.slice(o.length - r),
      d = (e) => e.reduce((e, t) => e + t.right - t.left, 0) / Math.max(e.length, 1),
      h = Math.min(d(l), d(c)) / Math.max(d(l), d(c), 1),
      g = (e) => e.reduce((e, t) => e + t.left, 0) / Math.max(e.length, 1),
      m = Math.abs(g(l) - g(c)) / Math.max(n, 1),
      p = 1 - Math.min(1, 15 * m);
    return Math.round(u(100 * (0.7 * h + 0.3 * p)));
  }
  log(e, ...t) {
    this.config.debug && console.log(`[PDFAnalyzer] ${e}`, ...t);
  }
  async loadPdfJS() {
    var e;
    if ('undefined' == typeof window)
      throw new Error('PDF.js can only be loaded in browser environments');
    if (!this.pdfLib) {
      if (this.loading) return this.waitForLoad();
      this.loading = !0;
      try {
        null === (e = document.querySelector('#pdfjs-script')) || void 0 === e || e.remove(),
          await new Promise((e, t) => {
            const n = document.createElement('script');
            (n.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
              (n.async = !0),
              (n.id = 'pdfjs-script'),
              (n.onload = () => {
                window.pdfjsLib
                  ? ((window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'),
                    (this.pdfLib = window.pdfjsLib),
                    (this.loading = !1),
                    e())
                  : ((this.loading = !1), t(new Error('PDF.js not available')));
              }),
              (n.onerror = () => {
                (this.loading = !1), t(new Error('Failed to load PDF.js'));
              }),
              document.body.appendChild(n);
          });
      } catch (e) {
        throw ((this.loading = !1), e);
      }
    }
  }
  async waitForLoad() {
    return new Promise((e, t) => {
      const n = setInterval(() => {
        this.loading ||
          (clearInterval(n), this.pdfLib ? e() : t(new Error('PDF.js failed to load')));
      }, 100);
      setTimeout(() => {
        clearInterval(n), t(new Error('PDF.js loading timeout'));
      }, 15e3);
    });
  }
  async checkPdfPageQuality(e, t, n = 2) {
    var i, o;
    const a = await e.getPage(t),
      s = [1, 1.5, 2].filter((e) => e <= n),
      r = [];
    for (const e of s) {
      const n = a.getViewport({ scale: e }),
        s = this.config.canvas || document.createElement('canvas'),
        l = s.getContext('2d');
      if (!l) throw new Error('Could not get 2D context from canvas');
      (s.width = n.width),
        (s.height = n.height),
        await a.render({ canvasContext: l, viewport: n }).promise;
      const c = l.getImageData(0, 0, s.width, s.height),
        d = this.calculateRenderedPageMetrics(
          c,
          t,
          null !== (o = null !== (i = n.rotation) && void 0 !== i ? i : a.rotate) && void 0 !== o
            ? o
            : 0,
        ),
        h = new m({
          ...this.config,
          edgeWidthThreshold: Math.min(this.config.edgeWidthThreshold || 0.5, 0.25),
          method: 'edge',
          debug: this.config.debug,
        }),
        g = await h.analyzeImage(c);
      (g.method = `${g.method} (scale ${e}x)`),
        (g.metrics.pdfPageMetrics = d),
        r.push(g),
        this.log(`Page ${t} at ${e}x scale:`, g);
    }
    const l = r[r.length - 1],
      c = r.filter((e) => e.isBlurry).length;
    return {
      ...l,
      isBlurry: l.isBlurry,
      confidence: l.confidence,
      method: `Highest-scale analysis (${c}/${r.length} scales detected blur)`,
      metrics: {
        ...l.metrics,
        scaleResults: r.map((e) => {
          var t;
          return {
            scale: parseFloat(
              (null === (t = e.method.match(/scale ([\d.]+)x/)) || void 0 === t ? void 0 : t[1]) ||
                '1',
            ),
            isBlurry: e.isBlurry,
            confidence: e.confidence,
            edgeAnalysis: e.metrics.edgeAnalysis,
          };
        }),
      },
    };
  }
  analyzePageContent(e, t) {
    const n = e.items || [],
      i = n
        .map((e) => e.str)
        .join(' ')
        .trim(),
      o = i.length,
      a = 1 === t,
      s = o < 200,
      r = o / Math.max(n.length, 1),
      l = /bill|statement|invoice|report|summary|account|period/i.test(i),
      c = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\w+ \d{1,2}, \d{4}/i.test(i),
      d = /\$[\d,]+\.?\d*|USD|EUR|GBP/i.test(i),
      h =
        /certificate|certification|certified|diploma|award|achievement|completion|graduate|license|licence|accredited|qualification/i.test(
          i,
        ),
      g =
        /hereby|certify|certifies|awarded|granted|presented|conferred|issued|authority|institution|organization/i.test(
          i,
        ),
      m = h && g,
      u = a && (s || (l && c && d && o < 500)) && !m;
    return (
      this.log(
        `Page ${t} content analysis: textLength=${o}, textDensity=${r.toFixed(1)}, isLikelyHeader=${u}, isCertificate=${m}`,
      ),
      { isLikelyHeaderPage: u, textDensity: r, hasLowTextContent: s, isCertificateDocument: m }
    );
  }
  async analyzeTextSharpness(e, t, n = 3) {
    const i = await e.getPage(t),
      o = await i.getTextContent();
    if (0 === o.items.length)
      return { textSharpnessScore: 0, isTextBlurry: !0, textMetrics: { reason: 'No text found' } };
    const a = Math.min(3, n),
      s = i.getViewport({ scale: a }),
      r = document.createElement('canvas'),
      l = r.getContext('2d');
    if (!l) throw new Error('Could not get 2D context for text analysis');
    (r.width = s.width),
      (r.height = s.height),
      await i.render({ canvasContext: l, viewport: s, intent: 'print' }).promise;
    const c = l.getImageData(0, 0, r.width, r.height),
      d = this.calculateTextSharpness(c, o.items);
    return this.log(`Page ${t} text sharpness analysis:`, d), d;
  }
  calculateTextSharpness(e, t) {
    const { data: n, width: i, height: o } = e;
    let a = 0,
      s = 0,
      r = 0;
    const l = Math.max(1, Math.floor(Math.min(i, o) / 100));
    for (let e = 0; e < o - 5; e += l)
      for (let t = 0; t < i - 5; t += l) {
        let o = 0,
          l = 0,
          c = 0,
          d = 0;
        for (let a = 0; a < 5; a++)
          for (let s = 0; s < 5; s++) {
            const r = 4 * ((e + a) * i + (t + s)),
              h = 0.299 * n[r] + 0.587 * n[r + 1] + 0.114 * n[r + 2];
            if (((o += h), (l += h * h), c++, s < 4 && a < 4)) {
              const o = 4 * ((e + a) * i + (t + s + 1)),
                r = 4 * ((e + a + 1) * i + (t + s)),
                l = 0.299 * n[o] + 0.587 * n[o + 1] + 0.114 * n[o + 2] - h,
                c = 0.299 * n[r] + 0.587 * n[r + 1] + 0.114 * n[r + 2] - h;
              d = Math.max(d, Math.sqrt(l * l + c * c));
            }
          }
        if (c > 0) {
          const e = o / c,
            t = l / c - e * e;
          t > 100 && ((a += t), (r += d), s++);
        }
      }
    const c = s > 0 ? a / s : 0,
      d = s > 0 ? r / s : 0,
      h = c / 1e3 + d / 50;
    return {
      textSharpnessScore: h,
      isTextBlurry: h < 0.8,
      textMetrics: { avgVariance: c, avgEdgeIntensity: d, sampleCount: s, threshold: 0.8 },
    };
  }
  async analyzePDF(e, t) {
    var n, i, o, a;
    this.log('Starting PDF analysis for file:', e.name);
    const s = null !== (n = null == t ? void 0 : t.maxPages) && void 0 !== n ? n : 1 / 0,
      r = null !== (i = null == t ? void 0 : t.samplePages) && void 0 !== i ? i : 'all',
      l = null !== (o = null == t ? void 0 : t.maxRenderScale) && void 0 !== o ? o : 2,
      c = null !== (a = null == t ? void 0 : t.timeoutMs) && void 0 !== a ? a : 3e4;
    this.pdfLib || (await this.loadPdfJS());
    try {
      const t = await e.arrayBuffer(),
        n = await this.pdfLib.getDocument({ data: new Uint8Array(t) }).promise,
        i = n.numPages;
      let o = '',
        a = !1;
      const d = [],
        h = [];
      let g,
        m = !1;
      this.log(`PDF has ${i} pages`);
      let u = [];
      if (Array.isArray(r)) u = r.filter((e) => e >= 1 && e <= i).slice(0, s);
      else if ('first' === r) u = [1];
      else if ('smart' === r) {
        const e = [];
        for (let t = 1; t <= i; t++) (1 !== t && t !== i && t % 5 != 0) || e.push(t);
        u = e.slice(0, s);
      } else u = Array.from({ length: i }, (e, t) => t + 1).slice(0, s);
      u.length < i && s < i && ((m = !0), (g = `Page cap: analyzed ${u.length}/${i}`));
      const p = Array.from({ length: i }, (e, t) => t + 1).filter((e) => !u.includes(e)),
        f = Date.now();
      for (const e of u) {
        if (Date.now() - f > c) {
          (m = !0), (g = `Timeout: stopped at page ${e}`);
          break;
        }
        this.log(`Analyzing page ${e}/${i}`);
        const t = await n.getPage(e),
          s = await t.getTextContent();
        0 === s.items.length && (a = !0), (o += s.items.map((e) => e.str).join(' '));
        try {
          const t = this.analyzePageContent(s, e),
            i = await this.checkPdfPageQuality(n, e, l);
          if (s.items.length > 0)
            try {
              const o = await this.analyzeTextSharpness(n, e, l);
              let a = i.isBlurry || o.isTextBlurry;
              t.isCertificateDocument
                ? ((a = o.textSharpnessScore < 0.3),
                  this.log(`Page ${e} identified as certificate - lenient blur`))
                : t.isLikelyHeaderPage &&
                  ((a = o.textSharpnessScore < 0.5),
                  this.log(`Page ${e} identified as header/logo - lenient blur`)),
                d.push({
                  ...i,
                  isBlurry: a,
                  confidence: Math.max(i.confidence, o.textSharpnessScore),
                  method: `${i.method} + Text Analysis${t.isCertificateDocument ? ' (Certificate-adjusted)' : t.isLikelyHeaderPage ? ' (Header-adjusted)' : ''}`,
                  metrics: { ...i.metrics, textSharpness: o, contentAnalysis: t },
                }),
                this.log(`Page ${e} combined analysis done`);
            } catch (t) {
              this.log(`Text analysis failed for page ${e}:`, t), d.push(i);
            }
          else d.push(i);
        } catch (t) {
          this.log(`Failed to analyze page ${e}:`, t),
            h.push({
              page: e,
              error: t instanceof Error ? t.message : 'Unknown page analysis error',
            });
        }
      }
      const y = a || o.length < 10;
      this.log(`PDF analysis complete. Scanned: ${y}, Text length: ${o.length}`);
      let w = !0;
      if (d.length > 0) {
        const e = d.filter((e) => e.isBlurry);
        if (d.length > 1) {
          const e = d.slice(1),
            t = e.filter((e) => e.isBlurry);
          d[0].isBlurry && 0 === t.length
            ? ((w = !0), this.log('First page blurry but rest clear - likely false positive'))
            : (w = !(t.length >= Math.ceil(e.length / 2)));
        } else w = 0 === e.length;
      }
      const v = {
        isQualityGood: w,
        isScanned: y,
        pagesAnalyzed: u.length,
        textLength: o.length,
        pageResults: d.length ? d : void 0,
        corruptedPages: h.length ? h : void 0,
        incomplete: m,
        incompleteReason: g,
        totalPages: i,
        skippedPages: p.length ? p : void 0,
      };
      return this.log('Final PDF analysis result:', v), v;
    } catch (e) {
      throw (
        (this.log('PDF analysis failed:', e),
        new Error(`PDF analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`))
      );
    }
  }
  async isGoodQuality(e) {
    return (await this.analyzePDF(e)).isQualityGood;
  }
}
const v = {
    blurry: {
      code: 'blurry',
      severity: 'error',
      message: 'Image appears blurry.',
      recommendation: 'Hold the camera steady and retake the image.',
    },
    too_dark: {
      code: 'too_dark',
      severity: 'error',
      message: 'Image is too dark.',
      recommendation: 'Use brighter, even lighting.',
    },
    too_bright: {
      code: 'too_bright',
      severity: 'warning',
      message: 'Image is too bright or overexposed.',
      recommendation: 'Avoid direct glare and reduce exposure.',
    },
    glare: {
      code: 'glare',
      severity: 'warning',
      message: 'Document has glare or blown highlights.',
      recommendation:
        'Move away from direct light and retake the document at an angle without reflections.',
    },
    low_contrast: {
      code: 'low_contrast',
      severity: 'warning',
      message: 'Image has low contrast.',
      recommendation: 'Place the subject against a clearer, contrasting background.',
    },
    low_resolution: {
      code: 'low_resolution',
      severity: 'error',
      message: 'Image resolution is too low.',
      recommendation: 'Upload a higher resolution image.',
    },
    too_large: {
      code: 'too_large',
      severity: 'error',
      message: 'File is too large.',
      recommendation: 'Compress the file or reduce the image size before uploading.',
    },
    invalid_file: {
      code: 'invalid_file',
      severity: 'error',
      message: 'File format is not supported or the file is corrupt.',
      recommendation: 'Choose a valid image or PDF file.',
    },
    unsupported_format: {
      code: 'unsupported_format',
      severity: 'error',
      message: 'File type is not allowed.',
      recommendation: 'Upload a supported format (JPG, PNG, WebP, or PDF).',
    },
    rotated: {
      code: 'rotated',
      severity: 'warning',
      message: 'Page appears rotated incorrectly.',
      recommendation: 'Rotate the page so text is upright before uploading.',
    },
    cropped: {
      code: 'cropped',
      severity: 'error',
      message: 'Document edges may be missing from the frame.',
      recommendation: 'Make sure all document edges are visible in the photo.',
    },
    perspective_distortion: {
      code: 'perspective_distortion',
      severity: 'warning',
      message: 'Document has perspective distortion.',
      recommendation: 'Capture the document straight-on, not at an angle.',
    },
    low_text_density: {
      code: 'low_text_density',
      severity: 'warning',
      message: 'Page has very little extractable text.',
      recommendation: 'Ensure the page contains readable text content.',
    },
    corrupted_pdf: {
      code: 'corrupted_pdf',
      severity: 'error',
      message: 'PDF could not be read.',
      recommendation: 'Re-export or rescan the PDF before uploading.',
    },
    corrupted_page: {
      code: 'corrupted_page',
      severity: 'error',
      message: 'PDF has pages that could not be read.',
      recommendation: 'Re-export or rescan the affected pages.',
    },
    scanned_pdf: {
      code: 'scanned_pdf',
      severity: 'warning',
      message: 'PDF appears to be scanned (image-based, no extractable text).',
      recommendation: 'If digital text is needed, provide a text-based PDF.',
    },
    analysis_error: {
      code: 'analysis_error',
      severity: 'error',
      message: 'Analysis could not be completed.',
      recommendation: 'Try again with a different file.',
    },
    cover_page: {
      code: 'cover_page',
      severity: 'warning',
      message: 'Page may be a cover or header page with low text content.',
      recommendation: 'Verify that the cover page content is intentional.',
    },
    blank_image: {
      code: 'blank_image',
      severity: 'error',
      message: 'Image appears blank or empty.',
      recommendation: 'Upload an image with visible content.',
    },
  },
  x = [
    'blurry',
    'too_dark',
    'glare',
    'too_bright',
    'low_contrast',
    'low_resolution',
    'rotated',
    'cropped',
    'perspective_distortion',
    'too_large',
    'unsupported_format',
    'invalid_file',
    'corrupted_page',
    'corrupted_pdf',
    'scanned_pdf',
    'low_text_density',
    'cover_page',
    'blank_image',
    'analysis_error',
  ];
function b(e) {
  const t = new Set(),
    n = [];
  for (const i of x) {
    if (!e.includes(i)) continue;
    const o = v[i];
    t.has(o.recommendation) || (t.add(o.recommendation), n.push(o.recommendation));
  }
  return n.length > 0 ? n : ['File is ready to upload.'];
}
function P(e) {
  if (0 === e.length) return 'File is ready to upload.';
  const t = e.map((e) => {
    const t = v[e];
    return t ? t.message.replace(/\.$/, '') : e.replace(/_/g, ' ');
  });
  if (1 === t.length) return `${t[0]}.`;
  return `${t.slice(0, 2).join(' and ')}${t.length > 2 ? ` (and ${t.length - 2} more)` : ''}.`;
}
const M = {
    general: {
      minWidth: 600,
      minHeight: 600,
      maxSizeMB: 10,
      minScore: 70,
      method: 'both',
      edgeWidthThreshold: 0.3,
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'application/pdf',
      ],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'pdf'],
      checkOrientation: !1,
    },
    document: {
      minWidth: 1e3,
      minHeight: 1e3,
      maxSizeMB: 15,
      minScore: 78,
      method: 'edge',
      edgeWidthThreshold: 0.25,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      checkOrientation: !0,
    },
    receipt: {
      minWidth: 800,
      minHeight: 800,
      maxSizeMB: 10,
      minScore: 72,
      method: 'edge',
      edgeWidthThreshold: 0.25,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      checkOrientation: !1,
    },
    invoice: {
      minWidth: 1e3,
      minHeight: 1e3,
      maxSizeMB: 15,
      minScore: 78,
      method: 'edge',
      edgeWidthThreshold: 0.25,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      checkOrientation: !0,
    },
    'id-card': {
      minWidth: 900,
      minHeight: 600,
      maxSizeMB: 10,
      minScore: 80,
      method: 'edge',
      edgeWidthThreshold: 0.25,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      checkOrientation: !0,
    },
    passport: {
      minWidth: 900,
      minHeight: 600,
      maxSizeMB: 8,
      minScore: 82,
      method: 'edge',
      edgeWidthThreshold: 0.22,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      checkOrientation: !0,
    },
    'profile-photo': {
      minWidth: 400,
      minHeight: 400,
      maxSizeMB: 8,
      minScore: 75,
      method: 'both',
      edgeWidthThreshold: 0.3,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      checkOrientation: !1,
    },
    ocr: {
      minWidth: 1200,
      minHeight: 1200,
      maxSizeMB: 20,
      minScore: 80,
      method: 'edge',
      edgeWidthThreshold: 0.18,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      checkOrientation: !0,
    },
    'ai-input': {
      minWidth: 800,
      minHeight: 800,
      maxSizeMB: 15,
      minScore: 72,
      method: 'edge',
      edgeWidthThreshold: 0.3,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      checkOrientation: !1,
    },
  },
  C = {
    low: { scoreBump: -8, thresholdMultiplier: 1.4, sizeMultiplier: 1.5 },
    medium: { scoreBump: 0, thresholdMultiplier: 1, sizeMultiplier: 1 },
    high: { scoreBump: 8, thresholdMultiplier: 0.65, sizeMultiplier: 0.7 },
  };
function k(e, t = 'medium') {
  const n = M[e],
    i = C[t];
  return {
    ...n,
    minScore: Math.max(0, Math.min(100, n.minScore + i.scoreBump)),
    edgeWidthThreshold: Math.max(0.05, Math.min(2, n.edgeWidthThreshold * i.thresholdMultiplier)),
    maxSizeMB: Math.round(n.maxSizeMB * i.sizeMultiplier),
  };
}
const _ = {
  general: 'general',
  'profile-photo': 'profile-photo',
  'document-scan': 'document',
  receipt: 'receipt',
  'id-card': 'id-card',
};
function S(e) {
  var t;
  return null !== (t = _[e]) && void 0 !== t ? t : 'general';
}
const B = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'],
  L = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'pdf'],
  D = [
    { type: 'image/jpeg', extensions: ['jpg', 'jpeg'], bytes: [255, 216, 255] },
    { type: 'image/png', extensions: ['png'], bytes: [137, 80, 78, 71] },
    { type: 'image/gif', extensions: ['gif'], bytes: [71, 73, 70] },
    { type: 'application/pdf', extensions: ['pdf'], bytes: [37, 80, 68, 70] },
    { type: 'image/bmp', extensions: ['bmp'], bytes: [66, 77] },
    { type: 'image/webp', extensions: ['webp'], bytes: [82, 73, 70, 70] },
  ];
function T(e) {
  var t;
  return (null === (t = e.name.split('.').pop()) || void 0 === t ? void 0 : t.toLowerCase()) || '';
}
function z(e, t) {
  return e ? 'pass' : t >= 60 ? 'warning' : 'fail';
}
async function E(e, t = {}) {
  var n, i, o, a, s;
  const r =
      null !== (n = t.maxSizeBytes) && void 0 !== n
        ? n
        : 1024 * (null !== (i = t.maxSizeMB) && void 0 !== i ? i : 10) * 1024,
    l = null !== (o = t.allowedTypes) && void 0 !== o ? o : B,
    c = null !== (a = t.allowedExtensions) && void 0 !== a ? a : L,
    d = T(e),
    h = [],
    g = { name: e.name, size: e.size, mimeType: e.type, extension: d, maxSizeBytes: r };
  e.size <= 0 && h.push('invalid_file'), e.size > r && h.push('too_large');
  const m = 0 === l.length || l.includes(e.type),
    p = 0 === c.length || c.includes(d);
  if (
    ((m && p) || h.push('unsupported_format'),
    null === (s = t.validateMagicBytes) || void 0 === s || s)
  ) {
    const t = await (async function (e) {
      const t = new Uint8Array(await e.slice(0, 12).arrayBuffer());
      for (const e of D)
        if (
          e.bytes.every((e, n) => t[n] === e) &&
          ('image/webp' !== e.type || 'WEBP' === String.fromCharCode(...t.slice(8, 12)))
        )
          return { type: e.type, extension: e.extensions[0] };
      return null;
    })(e);
    (g.detectedSignature = t),
      t
        ? l.includes(t.type) || c.includes(t.extension) || h.push('unsupported_format')
        : h.push('invalid_file');
  }
  const f = 0 === h.length,
    y = f ? 100 : Math.round(u(100 - 30 * h.length, 0, 100));
  return {
    ok: f,
    status: z(f, y),
    score: y,
    message: f ? 'File format and size are valid.' : h.join(' '),
    details: { ...g, issues: h },
  };
}
const W = ['file', 'format', 'fileSize', 'resolution', 'blur', 'brightness', 'contrast'];
function F(e) {
  return e.maxLuminance < l || (e.contentBrightness < c && e.maxLuminance < d);
}
function j(e) {
  return e.brightness < 50 || F(e)
    ? 'too_dark'
    : (function (e) {
          return e.glarePixelRatio >= g && e.maxLuminance >= h && e.contrast >= 80;
        })(e)
      ? 'glare'
      : e.brightness > o &&
          !(function (e) {
            return (
              e.nonWhiteRatio >= a &&
              e.minLuminance < s &&
              e.maxLuminance - e.minLuminance > 60 &&
              (e.contrast >= 18 || e.contentContrast >= 18)
            );
          })(e)
        ? 'too_bright'
        : void 0;
}
async function R(e, n = {}) {
  var i, u, f, w, v, x, M, C, _, B, L;
  const D = (function (e) {
      var t, n, i;
      return {
        ...k(
          null !== (t = e.mode) && void 0 !== t
            ? t
            : S(null !== (n = e.preset) && void 0 !== n ? n : 'general'),
          null !== (i = e.strictness) && void 0 !== i ? i : 'medium',
        ),
        ...e,
      };
    })(n),
    T = null !== (i = D.checks) && void 0 !== i ? i : W,
    z = {},
    R = [];
  if (e instanceof File && T.some((e) => ['file', 'format', 'fileSize'].includes(e))) {
    const t = await E(e, {
      ...D,
      allowedTypes:
        null !== (u = D.allowedTypes) && void 0 !== u
          ? u
          : ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'],
      allowedExtensions:
        null !== (f = D.allowedExtensions) && void 0 !== f
          ? f
          : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
    });
    if (((z.file = t), t.details && 'object' == typeof t.details && 'issues' in t.details)) {
      const e = t.details.issues;
      e && R.push(...e);
    }
    if (
      (T.includes('format') && (z.format = { ...t, details: { ...t.details, category: 'format' } }),
      T.includes('fileSize'))
    ) {
      const t =
          null !== (w = D.maxSizeBytes) && void 0 !== w
            ? w
            : 1024 * (null !== (v = D.maxSizeMB) && void 0 !== v ? v : 10) * 1024,
        n = e.size > 0 && e.size <= t;
      n || R.push('too_large'),
        (z.fileSize = y(n, n ? 100 : 50, n ? 'File size is acceptable.' : 'File is too large.', {
          size: e.size,
          maxSizeBytes: t,
        }));
    }
  }
  const I = await t(e, D.canvas),
    $ = (function (e) {
      const { data: t } = e;
      let n = 0,
        i = 0,
        o = 255,
        a = 0,
        s = 0,
        r = 0,
        l = 0,
        c = 0;
      for (let e = 0; e < t.length; e += 4) {
        const d = 0.2126 * t[e] + 0.7152 * t[e + 1] + 0.0722 * t[e + 2];
        (n += d),
          (i += d * d),
          (o = Math.min(o, d)),
          (a = Math.max(a, d)),
          d >= 250 && c++,
          d < 245 && ((s += d), (r += d * d), l++);
      }
      const d = t.length / 4,
        h = n / d,
        g = i / d - h * h;
      return {
        brightness: h,
        contrast: Math.sqrt(Math.max(g, 0)),
        minLuminance: o,
        maxLuminance: a,
        contentBrightness: l ? s / l : h,
        contentContrast: l
          ? Math.sqrt(Math.max(r / l - (s / l) ** 2, 0))
          : Math.sqrt(Math.max(g, 0)),
        nonWhiteRatio: l / d,
        glarePixelRatio: c / d,
      };
    })(I),
    A = (function (e) {
      return (
        (e.nonWhiteRatio <= 0.005 || (e.contrast <= 2 && e.contentContrast <= 2)) &&
        e.minLuminance >= 245
      );
    })($);
  let O;
  if (T.includes('resolution')) {
    const e = (function (e, t, n, i, o) {
      const { width: a, height: s } = e;
      return a < t || s < n
        ? {
            ok: !1,
            msg: 'Image resolution is too low.',
            details: { width: a, height: s, minWidth: t, minHeight: n },
          }
        : (i && a > i) || (o && s > o)
          ? {
              ok: !1,
              msg: 'Image dimensions are larger than allowed.',
              details: { width: a, height: s, maxWidth: i, maxHeight: o },
            }
          : {
              ok: !0,
              msg: 'Resolution is acceptable.',
              details: { width: a, height: s, minWidth: t, minHeight: n },
            };
    })(
      I,
      null !== (x = D.minWidth) && void 0 !== x ? x : 600,
      null !== (M = D.minHeight) && void 0 !== M ? M : 600,
      D.maxWidth,
      D.maxHeight,
    );
    e.ok || R.push('low_resolution'), (z.resolution = y(e.ok, e.ok ? 100 : 50, e.msg, e.details));
  }
  if ((A && R.push('blank_image'), T.includes('brightness'))) {
    const e = A ? void 0 : j($);
    e && R.push(e),
      (z.brightness = (function (e, t) {
        return y(
          !t,
          t
            ? 'too_dark' === t
              ? (e.brightness / 170) * 100
              : ((255 - e.brightness) / 45) * 100
            : 100,
          t
            ? 'too_dark' === t
              ? F(e)
                ? 'Document appears underexposed.'
                : 'Image is too dark.'
              : 'glare' === t
                ? 'Document has glare or blown highlights.'
                : 'Image is too bright.'
            : e.brightness > o
              ? 'Document background is bright but readable.'
              : 'Brightness looks good.',
          {
            brightness: e.brightness,
            contrast: e.contrast,
            minLuminance: e.minLuminance,
            maxLuminance: e.maxLuminance,
            nonWhiteRatio: e.nonWhiteRatio,
            contentBrightness: e.contentBrightness,
            contentContrast: e.contentContrast,
            glarePixelRatio: e.glarePixelRatio,
            glarePixelRatioThreshold: g,
            glareLuminanceThreshold: h,
            documentMaxLuminanceMin: l,
            documentContentBrightnessMin: c,
            documentContentMaxLuminanceMin: d,
          },
        );
      })($, e));
  }
  if (T.includes('contrast')) {
    const e = (function (e) {
      const t = e.nonWhiteRatio >= a && e.contentBrightness < s && e.contentContrast >= r,
        n = e.contrast >= 22 || t;
      return y(
        n,
        (e.contrast / 55) * 100,
        n
          ? t && e.contrast < 22
            ? 'Readable content contrast looks good.'
            : 'Contrast looks good.'
          : 'Image has low contrast.',
        {
          contrast: e.contrast,
          minLuminance: e.minLuminance,
          maxLuminance: e.maxLuminance,
          nonWhiteRatio: e.nonWhiteRatio,
          contentBrightness: e.contentBrightness,
          contentContrast: e.contentContrast,
          readableContentMinContrast: r,
          contrastReadableContentMinContrast: r,
        },
      );
    })($);
    e.ok || A || R.push('low_contrast'), (z.contrast = e);
  }
  if (T.includes('blur')) {
    O = await new m(D).analyzeImage(I);
    const e = (function (e, t, n) {
      var i;
      const o = null === (i = e.metrics.edgeAnalysis) || void 0 === i ? void 0 : i.avgEdgeWidthPerc,
        a = e.metrics.laplacianVariance;
      let s = e.isBlurry ? 45 : 90;
      return (
        'number' == typeof o && (s = 100 - (o / (2 * t)) * 100),
        'number' == typeof a &&
          (s = 'number' == typeof o ? Math.max(s, (a / (2 * n)) * 100) : (a / (2 * n)) * 100),
        e.isBlurry && (s = Math.min(s, 59)),
        y(!e.isBlurry, s, e.isBlurry ? 'Image appears blurry.' : 'Sharpness looks good.', {
          confidence: e.confidence,
          method: e.method,
          edgeWidthPerc: o,
          laplacianVariance: a,
        })
      );
    })(
      O,
      null !== (C = D.edgeWidthThreshold) && void 0 !== C ? C : 0.3,
      null !== (_ = D.laplacianThreshold) && void 0 !== _ ? _ : 150,
    );
    (z.blur = e), e.ok || A || R.push('blurry');
  }
  const V = [...new Set(R)],
    H = Object.values(z).filter(Boolean),
    U = p(H.length ? H.reduce((e, t) => e + t.score, 0) / H.length : 100),
    G = null !== (B = D.minScore) && void 0 !== B ? B : 70,
    q = 0 === V.length && U >= G;
  return {
    valid: q,
    ok: q,
    status: q ? 'pass' : U >= G ? 'warning' : 'fail',
    score: U,
    message: P(V),
    type: 'image',
    checks: z,
    recommendations: b(V),
    issues: V,
    warnings: [],
    width: I.width,
    height: I.height,
    blurAnalysis: O,
    debugMetrics: {
      mode: null !== (L = n.mode) && void 0 !== L ? L : 'general',
      brightness: $.brightness,
      contrast: $.contrast,
      minLuminance: $.minLuminance,
      maxLuminance: $.maxLuminance,
      minScore: G,
      nonWhiteRatio: $.nonWhiteRatio,
      contentContrast: $.contentContrast,
      blank: {
        detected: A,
        blankNonWhiteRatioMax: 0.005,
        blankContrastMax: 2,
        blankContentContrastMax: 2,
      },
      resolvedThresholds: {
        brightness: {
          documentMaxLuminanceMin: l,
          documentContentBrightnessMin: c,
          documentContentMaxLuminanceMin: d,
          brightnessReadableContentMinContrast: 18,
          glarePixelRatioThreshold: g,
          glareLuminanceThreshold: h,
        },
        contrast: { readableContentMinContrast: r, contrastReadableContentMinContrast: r },
      },
    },
  };
}
const I = new Set(['ocr', 'ai-input']);
function $(e) {
  return !['scanned_pdf', 'cover_page'].includes(e);
}
async function A(e, t = {}, n = {}) {
  var i, m, u, v, x, M, C, _, B, L, D;
  const T =
      null !== (i = t.mode) && void 0 !== i
        ? i
        : S(null !== (m = t.preset) && void 0 !== m ? m : 'document'),
    z = {
      ...k(T, null !== (u = t.strictness) && void 0 !== u ? u : 'medium'),
      ...t,
      mode: T,
      strictness: t.strictness,
    },
    W = await E(e, { ...z, allowedTypes: ['application/pdf'], allowedExtensions: ['pdf'] }),
    F =
      null !== (v = z.maxSizeBytes) && void 0 !== v
        ? v
        : 1024 * (null !== (x = z.maxSizeMB) && void 0 !== x ? x : 15) * 1024,
    j = e.size > 0 && e.size <= F,
    R = y(j, j ? 100 : 45, j ? 'PDF size is acceptable.' : 'PDF too large.', {
      size: e.size,
      maxSizeBytes: F,
    });
  if (!W.ok) {
    const e =
      W.details &&
      'object' == typeof W.details &&
      'issues' in W.details &&
      null !== (M = W.details.issues) &&
      void 0 !== M
        ? M
        : [];
    return {
      valid: !1,
      ok: !1,
      status: 'fail',
      score: Math.min(W.score, R.score),
      message: P(e),
      type: 'pdf',
      checks: { file: W, fileSize: R },
      issues: e,
      warnings: [],
      recommendations: b(e),
    };
  }
  let A;
  try {
    A = await new w({
      ...n,
      ...z,
      edgeWidthThreshold: z.edgeWidthThreshold,
      method: z.method,
    }).analyzePDF(e, {
      maxPages: z.maxPages,
      samplePages: z.samplePages,
      maxRenderScale: z.maxRenderScale,
      timeoutMs: z.timeoutMs,
    });
  } catch (e) {
    return {
      valid: !1,
      ok: !1,
      status: 'fail',
      score: 0,
      message: P(['corrupted_pdf']),
      type: 'pdf',
      checks: {
        file: W,
        fileSize: R,
        corruptedPages: y(!1, 0, 'PDF could not be read.', {
          error: e instanceof Error ? e.message : 'Unknown',
        }),
      },
      issues: ['corrupted_pdf'],
      warnings: [],
      recommendations: b(['corrupted_pdf']),
      debugMetrics: { error: e instanceof Error ? e.message : 'Unknown' },
    };
  }
  const O = (null !== (C = A.pageResults) && void 0 !== C ? C : []).map((e, t) =>
      (function (e, t, n) {
        var i, m, u, w, v, x, b;
        const P = t.metrics.pdfPageMetrics,
          M = {},
          C = [],
          k = [],
          _ = null !== (i = n.minWidth) && void 0 !== i ? i : 1e3,
          S = null !== (m = n.minHeight) && void 0 !== m ? m : 1e3,
          B = null !== (u = n.mode) && void 0 !== u ? u : 'document';
        if (!P)
          return {
            page: e,
            ok: !0,
            status: 'pass',
            score: 100,
            issues: [],
            warnings: [],
            checks: M,
            message: `Page ${e} — no metrics available.`,
          };
        const L = P.width >= _ && P.height >= S;
        (M.pageResolution = y(
          L,
          L ? 100 : (Math.min(P.width, P.height) / Math.min(_, S)) * 100,
          L ? 'Page resolution is acceptable.' : `Page ${e} resolution is too low.`,
          { width: P.width, height: P.height, minWidth: _, minHeight: S },
        )),
          L || C.push('low_resolution');
        const D =
            P.nonWhiteRatio >= a &&
            P.minLuminance < s &&
            P.maxLuminance - P.minLuminance > 60 &&
            (P.contrast >= 18 || P.contentContrast >= 18),
          T = P.maxLuminance < l || (P.contentBrightness < c && P.maxLuminance < d),
          z =
            P.glarePixelRatio >= g &&
            P.glarePixelRatio <= 0.65 &&
            P.maxLuminance >= h &&
            P.contrast >= 80,
          E =
            P.brightness < 50 || T
              ? 'too_dark'
              : z
                ? 'glare'
                : P.brightness > o && !D
                  ? 'too_bright'
                  : void 0;
        (M.brightness = y(
          !E,
          E
            ? 'too_dark' === E
              ? (P.brightness / 170) * 100
              : ((255 - P.brightness) / 45) * 100
            : 100,
          E
            ? 'too_dark' === E
              ? T
                ? `Page ${e} appears underexposed.`
                : `Page ${e} is too dark.`
              : 'glare' === E
                ? `Page ${e} has glare or blown highlights.`
                : `Page ${e} is too bright.`
            : P.brightness > o
              ? 'Document background is bright but readable.'
              : 'Brightness looks good.',
          {
            brightness: P.brightness,
            contrast: P.contrast,
            minLuminance: P.minLuminance,
            maxLuminance: P.maxLuminance,
            nonWhiteRatio: P.nonWhiteRatio,
            contentBrightness: P.contentBrightness,
            contentContrast: P.contentContrast,
            glarePixelRatio: P.glarePixelRatio,
            glarePixelRatioThreshold: g,
            glareBackgroundRatioMax: 0.65,
            glareContrastThreshold: 80,
          },
        )),
          E && C.push(E);
        const W = P.nonWhiteRatio >= a && P.contentBrightness < s && P.contentContrast >= r,
          F = P.contrast >= 22 || W;
        (M.contrast = y(
          F,
          (P.contrast / 55) * 100,
          F
            ? W && P.contrast < 22
              ? 'Readable content contrast looks good.'
              : 'Contrast looks good.'
            : `Page ${e} has low contrast.`,
          {
            contrast: P.contrast,
            minLuminance: P.minLuminance,
            maxLuminance: P.maxLuminance,
            nonWhiteRatio: P.nonWhiteRatio,
            contentBrightness: P.contentBrightness,
            contentContrast: P.contentContrast,
          },
        )),
          F || C.push('low_contrast');
        const j = P.documentFrame;
        j.isLikelyCropped && C.push('cropped'),
          j.hasPerspectiveDistortion && C.push('perspective_distortion');
        const R = j.detected && !j.isLikelyCropped && !j.hasPerspectiveDistortion;
        M.mobileCapture = y(
          R,
          R ? 100 : Math.min(j.perspectiveScore, j.isLikelyCropped ? 55 : 75),
          R
            ? 'Document frame looks good.'
            : j.isLikelyCropped && j.hasPerspectiveDistortion
              ? `Page ${e} may have missing edges or perspective distortion.`
              : j.isLikelyCropped
                ? `Page ${e} may have missing document edges.`
                : `Page ${e} may have perspective distortion.`,
          {
            detected: j.detected,
            marginRatios: j.marginRatios,
            edgesTouchingBoundary: j.edgesTouchingBoundary,
            perspectiveScore: j.perspectiveScore,
          },
        );
        const $ = n.expectedOrientation,
          A = !$ || P.orientation === $ || 'square' === P.orientation;
        (M.orientation = y(
          A,
          A ? 100 : 55,
          $
            ? A
              ? 'Page orientation looks correct.'
              : `Page ${e} appears rotated incorrectly.`
            : 'Page orientation recorded.',
          { orientation: P.orientation, expected: $, rotation: P.rotation },
        )),
          !A && $ && C.push('rotated'),
          (M.sharpness = y(
            !t.isBlurry,
            t.isBlurry ? 45 : 100,
            t.isBlurry ? `Page ${e} is blurry.` : 'Sharpness looks good.',
            {
              confidence: t.confidence,
              edgeWidthPerc:
                null === (w = t.metrics.edgeAnalysis) || void 0 === w ? void 0 : w.avgEdgeWidthPerc,
              textSharpnessScore:
                null === (v = t.metrics.textSharpness) || void 0 === v
                  ? void 0
                  : v.textSharpnessScore,
            },
          )),
          t.isBlurry && C.push('blurry');
        const O = t.metrics.contentAnalysis,
          V = null !== (x = null == O ? void 0 : O.hasLowTextContent) && void 0 !== x && x,
          H = null !== (b = null == O ? void 0 : O.isCertificateDocument) && void 0 !== b && b,
          U = !V || H;
        (M.textDensity = y(
          U,
          U ? 100 : 65,
          U ? 'Text density looks acceptable.' : `Page ${e} has very little extractable text.`,
          { textDensity: null == O ? void 0 : O.textDensity, hasLowTextContent: V },
        )),
          U || (I.has(B) ? C : k).push('low_text_density'),
          V && !H && (null == O ? void 0 : O.isLikelyHeaderPage) && k.push('cover_page');
        const G = [...new Set(C)],
          q = [...new Set(k)],
          Q = Object.values(M).filter(Boolean),
          N = Q.length ? p(Q.reduce((e, t) => e + t.score, 0) / Q.length) : 100,
          J = 0 === G.length && N >= 70,
          Y = [];
        t.isBlurry && Y.push('is blurry');
        for (const e of ['too_dark', 'too_bright', 'glare', 'low_contrast', 'low_resolution'])
          G.includes(e) && Y.push(`has ${e.replace(/_/g, ' ')}`);
        return (
          G.includes('rotated') && Y.push('appears rotated'),
          G.includes('cropped') && Y.push('may have missing document edges'),
          G.includes('perspective_distortion') && Y.push('may have perspective distortion'),
          {
            page: e,
            ok: J,
            status: f(J, N),
            score: N,
            issues: G,
            warnings: q,
            message: J ? `Page ${e} looks good.` : `Page ${e} ${Y.join(' and ')}.`,
            checks: M,
            width: P.width,
            height: P.height,
            orientation: P.orientation,
            rotation: P.rotation,
          }
        );
      })(t + 1, e, z),
    ),
    V = null !== (_ = A.corruptedPages) && void 0 !== _ ? _ : [],
    H = [],
    U = [];
  j || H.push('too_large'),
    V.length > 0 && H.push('corrupted_page'),
    (null === (B = A.skippedPages) || void 0 === B ? void 0 : B.length) && H.push('corrupted_page'),
    A.isScanned && U.push('scanned_pdf');
  const G = O.flatMap((e) => e.issues),
    q = O.flatMap((e) => {
      var t;
      return null !== (t = e.warnings) && void 0 !== t ? t : [];
    }),
    Q = [...new Set([...H, ...G])],
    N = [],
    J = [...[...new Set([...U, ...q])]];
  for (const e of Q) ($(e) ? N : J).push(e);
  const Y = [...new Set(N)],
    K = [...new Set(J)],
    X = y(
      !0,
      A.isScanned ? 80 : 100,
      A.isScanned
        ? 'PDF appears to be scanned (informational).'
        : 'PDF has extractable digital text.',
      { isScanned: A.isScanned, textLength: A.textLength },
    ),
    Z = y(
      0 === V.length,
      0 === V.length ? 100 : 35,
      0 === V.length
        ? 'All pages were analyzed.'
        : `${V.length} page${1 === V.length ? '' : 's'} could not be analyzed.`,
      { corruptedPages: V },
    ),
    ee = O.length ? O.reduce((e, t) => e + t.score, 0) / O.length : 0,
    te = p([W.score, R.score, X.score, Z.score, ee].reduce((e, t) => e + t, 0) / 5),
    ne = null !== (L = z.minScore) && void 0 !== L ? L : 72,
    ie = 0 === Y.length && A.isQualityGood && te >= ne;
  return {
    valid: ie,
    ok: ie,
    status: f(ie, te),
    score: te,
    message: P(Y),
    type: 'pdf',
    checks: {
      file: W,
      fileSize: R,
      scanned: X,
      corruptedPages: Z,
      sharpness: y(
        O.every((e) => !e.issues.includes('blurry')),
        O.some((e) => e.issues.includes('blurry')) ? 50 : 100,
        O.some((e) => e.issues.includes('blurry'))
          ? 'One or more pages are blurry.'
          : 'Page sharpness looks good.',
      ),
      brightness: y(
        O.every((e) => !['too_dark', 'too_bright', 'glare'].some((t) => e.issues.includes(t))),
        O.some((e) => ['too_dark', 'too_bright', 'glare'].some((t) => e.issues.includes(t)))
          ? 60
          : 100,
        O.some((e) => ['too_dark', 'too_bright', 'glare'].some((t) => e.issues.includes(t)))
          ? 'One or more pages have poor brightness.'
          : 'Brightness looks good.',
      ),
      contrast: y(
        O.every((e) => !e.issues.includes('low_contrast')),
        O.some((e) => e.issues.includes('low_contrast')) ? 60 : 100,
        O.some((e) => e.issues.includes('low_contrast'))
          ? 'One or more pages have low contrast.'
          : 'Contrast looks good.',
      ),
      orientation: y(
        O.every((e) => !e.issues.includes('rotated')),
        O.some((e) => e.issues.includes('rotated')) ? 55 : 100,
        O.some((e) => e.issues.includes('rotated'))
          ? 'One or more pages appear rotated.'
          : 'Page orientation looks correct.',
      ),
      mobileCapture: y(
        O.every((e) => !['cropped', 'perspective_distortion'].some((t) => e.issues.includes(t))),
        O.some((e) => ['cropped', 'perspective_distortion'].some((t) => e.issues.includes(t)))
          ? 55
          : 100,
        O.some((e) => ['cropped', 'perspective_distortion'].some((t) => e.issues.includes(t)))
          ? 'One or more pages may have missing edges or perspective distortion.'
          : 'Document capture framing looks good.',
      ),
      textDensity: y(
        O.every((e) => !e.issues.includes('low_text_density')),
        O.some((e) => e.issues.includes('low_text_density')) ? 65 : 100,
        O.some((e) => e.issues.includes('low_text_density'))
          ? 'One or more pages have very little extractable text.'
          : 'Text density looks acceptable.',
      ),
    },
    recommendations: b([...Y, ...K]),
    issues: Y,
    warnings: K,
    pages: O,
    pdfAnalysis: A,
    debugMetrics: {
      minScore: ne,
      pageAverage: ee,
      corruptedPages: V,
      mode: T,
      strictness: z.strictness,
      incomplete: null !== (D = A.incomplete) && void 0 !== D && D,
      incompleteReason: A.incompleteReason,
      totalPages: A.totalPages,
      skippedPages: A.skippedPages,
    },
  };
}
class O {
  constructor(e = {}) {
    (this.config = {
      edgeWidthThreshold: 0.5,
      laplacianThreshold: 100,
      method: 'edge',
      debug: !1,
      ...e,
    }),
      (this.blurDetector = new m(this.config)),
      (this.pdfAnalyzer = new w(this.config));
  }
  async isImageBlurry(e) {
    return this.blurDetector.isBlurry(e);
  }
  async analyzeImage(e) {
    return this.blurDetector.analyzeImage(e);
  }
  async isPDFGoodQuality(e) {
    return this.pdfAnalyzer.isGoodQuality(e);
  }
  async analyzePDF(e, t) {
    return this.pdfAnalyzer.analyzePDF(e, t);
  }
  async analyzeFile(e, t = {}) {
    const n = T(e),
      i = { ...this.config, ...t };
    if ('pdf' === n) return new w(i).analyzePDF(e);
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(n)) return new m(i).analyzeImage(e);
    throw new Error(`Unsupported file type: ${n}`);
  }
  async validateImage(e, t = {}) {
    return R(e, { ...this.config, ...t });
  }
  async validateUpload(e, t = {}) {
    const n = T(e);
    return 'application/pdf' === e.type || 'pdf' === n
      ? A(e, { ...t }, this.config)
      : this.validateImage(e, t);
  }
  async isFileGoodQuality(e, t = {}) {
    const n = await this.analyzeFile(e, t);
    return 'isQualityGood' in n ? n.isQualityGood : !n.isBlurry;
  }
  updateConfig(e) {
    (this.config = { ...this.config, ...e }),
      (this.blurDetector = new m(this.config)),
      (this.pdfAnalyzer = new w(this.config));
  }
  getConfig() {
    return { ...this.config };
  }
}
(exports.BlurDetector = m),
  (exports.BlurryCheck = O),
  (exports.Filters = n),
  (exports.ISSUE_CATALOG = v),
  (exports.MODE_CONFIG = M),
  (exports.OpenCVLoader = i),
  (exports.PDFAnalyzer = w),
  (exports.analyzeFile = async function (e, t) {
    return new O(t).analyzeFile(e, t);
  }),
  (exports.default = O),
  (exports.isImageBlurry = async function (e, t) {
    return new O(t).isImageBlurry(e);
  }),
  (exports.isPDFGoodQuality = async function (e, t) {
    return new O(t).isPDFGoodQuality(e);
  }),
  (exports.presetToMode = S),
  (exports.recommendationsFor = b),
  (exports.resolveMode = k),
  (exports.summaryFor = P),
  (exports.validateImage = async function (e, t) {
    return new O(t).validateImage(e, t);
  }),
  (exports.validateUpload = async function (e, t) {
    return new O(t).validateUpload(e, t);
  });
//# sourceMappingURL=index.js.map

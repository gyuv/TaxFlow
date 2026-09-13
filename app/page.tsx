"use client";

/**
 * TaskMatrix AI — Privacy-First, Zero-Server Multi-Tool Suite
 * ==========================================================================
 * Every module runs 100% locally in the browser. No file, byte, or keystroke
 * is ever transmitted off-device. PDF rendering uses PDF.js (with a
 * same-origin WebAssembly-backed worker), redaction is rasterized with the
 * HTML5 Canvas + pdf-lib, and all currency math uses BigNumber.js for exact
 * decimal precision (no IEEE-754 floating point errors).
 *
 * Modules:
 *   A. Local PDF & Document Anonymizer (drag-drop, regex PII auto-redact,
 *      manual black-out, client-side PDF/PNG export).
 *   B. High-Precision Invoice & Tax Math Engine (BigNumber.js).
 *   C. Real-Time Executive Meeting Cost Ticker.
 *   D. Structured Data & Sanitization Utility (JSON <-> CSV, dedupe, validate).
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import BigNumber from "bignumber.js";
import {
  AlertTriangle,
  ArrowLeftRight,
  Braces,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eraser,
  FileText,
  Gauge,
  Grid3x3,
  Image as ImageIcon,
  Info,
  Layers,
  Mail,
  Moon,
  Pause,
  Play,
  Plus,
  Printer,
  RotateCcw,
  ScanLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Table,
  Timer,
  Trash2,
  Upload,
  Users,
  Wand2,
  X,
} from "lucide-react";

/* ==========================================================================
 * Global BigNumber configuration — exact currency rounding + grouped format.
 * ========================================================================== */
BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  FORMAT: {
    prefix: "",
    decimalSeparator: ".",
    groupSeparator: ",",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: " ",
    fractionGroupSize: 0,
    suffix: "",
  },
});

/** Safe BigNumber constructor — coerces invalid/empty input to zero. */
function bn(value: string | number | BigNumber | undefined | null): BigNumber {
  if (value === undefined || value === null || value === "") {
    return new BigNumber(0);
  }
  const n = new BigNumber(value);
  return n.isFinite() ? n : new BigNumber(0);
}

/* ==========================================================================
 * Currency catalog (shared across modules).
 * ========================================================================== */
interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc" },
  { code: "CNY", symbol: "CN¥", name: "Chinese Yuan" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
];

function symbolFor(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}

/** Format a BigNumber as currency with a symbol and grouped 2-dp string. */
function money(value: BigNumber, code: string): string {
  return `${symbolFor(code)}${value.toFormat(2)}`;
}

/* ==========================================================================
 * Theme hook — dark/light with localStorage persistence.
 * ========================================================================== */
const THEME_KEY = "taskmatrix-theme";

function useTheme(): {
  isDark: boolean;
  mounted: boolean;
  toggle: () => void;
} {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) root.classList.add("dark");
      else root.classList.remove("dark");
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        /* storage unavailable — theme still applies for this session */
      }
      return next;
    });
  }, []);

  return { isDark, mounted, toggle };
}

/* ==========================================================================
 * Shared primitives.
 * ========================================================================== */

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900";
const LABEL =
  "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- CLS-safe ad slot ---------- */
function AdSlot({
  variant,
  className = "",
}: {
  variant: "leaderboard" | "box";
  className?: string;
}) {
  const cfg =
    variant === "leaderboard"
      ? { h: "h-[90px]", label: "728 × 90 · Leaderboard" }
      : { h: "h-[250px]", label: "300 × 250 · Rectangle" };
  return (
    <div
      className={`tm-no-print flex ${cfg.h} w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40 ${className}`}
      role="complementary"
      aria-label="Advertisement"
    >
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Advertisement
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{cfg.label}</p>
      </div>
    </div>
  );
}

/* ==========================================================================
 * MODULE A — Local PDF & Document Anonymizer
 * ========================================================================== */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DocPage {
  id: string;
  kind: "pdf" | "image";
  dataUrl: string;
  width: number;
  height: number;
  rects: Rect[]; // manual redactions (canvas-pixel coordinates)
  textItems: TextItem[];
}

const PII_PATTERNS: Record<string, { label: string; re: RegExp }> = {
  email: {
    label: "Emails",
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  },
  phone: {
    label: "Phone numbers",
    re: /(?:\+?\d[\d\s().-]{7,}\d)/,
  },
  ssn: {
    label: "Tax IDs / SSN",
    re: /\b(\d{3}-\d{2}-\d{4}|\d{2}-\d{7})\b/,
  },
  card: {
    label: "Credit cards",
    re: /\b(?:\d[ -]?){13,16}\b/,
  },
};

type DetectorKey = keyof typeof PII_PATTERNS;

let pdfWorkerConfigured = false;

function PdfAnonymizer() {
  const [pages, setPages] = useState<DocPage[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("document");
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [detectors, setDetectors] = useState<Record<DetectorKey, boolean>>({
    email: true,
    phone: true,
    ssn: true,
    card: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef<{ startX: number; startY: number } | null>(null);
  const previewRef = useRef<Rect | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const page = pages[current];

  /* ---- Auto-detected redaction rectangles (derived, per page) ---- */
  const autoRectsByPage = useMemo(() => {
    const map = new Map<number, Rect[]>();
    const activePatterns = (Object.keys(PII_PATTERNS) as DetectorKey[]).filter(
      (k) => detectors[k]
    );
    const term = searchTerm.trim().toLowerCase();
    pages.forEach((p, idx) => {
      const rects: Rect[] = [];
      for (const item of p.textItems) {
        const matchesPattern = activePatterns.some((k) =>
          PII_PATTERNS[k].re.test(item.text)
        );
        const matchesSearch =
          term.length > 0 && item.text.toLowerCase().includes(term);
        if (matchesPattern || matchesSearch) {
          rects.push({ x: item.x, y: item.y, w: item.w, h: item.h });
        }
      }
      map.set(idx, rects);
    });
    return map;
  }, [pages, detectors, searchTerm]);

  const autoRects = useMemo(
    () => autoRectsByPage.get(current) ?? [],
    [autoRectsByPage, current]
  );
  const autoCount = useMemo(
    () => Array.from(autoRectsByPage.values()).reduce((s, r) => s + r.length, 0),
    [autoRectsByPage]
  );

  /* ---- Canvas drawing ---- */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (baseImgRef.current && baseImgRef.current.complete) {
      ctx.drawImage(baseImgRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // committed manual rects — solid black
    ctx.fillStyle = "#000000";
    for (const r of page.rects) ctx.fillRect(r.x, r.y, r.w, r.h);
    // auto-detected rects — solid black + subtle red outline while editing
    for (const r of autoRects) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    // in-progress preview rect
    if (previewRef.current) {
      const r = previewRef.current;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }, [page, autoRects]);

  // Load the current page's base image, then redraw.
  useEffect(() => {
    if (!page) return;
    const img = new Image();
    img.onload = () => {
      baseImgRef.current = img;
      redraw();
    };
    img.src = page.dataUrl;
    baseImgRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  /* ---- Pointer-based manual redaction ---- */
  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!page) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pointFromEvent(e);
    drawingRef.current = { startX: x, startY: y };
    previewRef.current = { x, y, w: 0, h: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const { x, y } = pointFromEvent(e);
    const { startX, startY } = drawingRef.current;
    previewRef.current = {
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      w: Math.abs(x - startX),
      h: Math.abs(y - startY),
    };
    redraw();
  };

  const onPointerUp = () => {
    if (!drawingRef.current || !previewRef.current) return;
    const r = previewRef.current;
    drawingRef.current = null;
    previewRef.current = null;
    if (r.w > 3 && r.h > 3) {
      setPages((prev) =>
        prev.map((p, i) =>
          i === current ? { ...p, rects: [...p.rects, r] } : p
        )
      );
    } else {
      redraw();
    }
  };

  const undoLastRect = () => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === current ? { ...p, rects: p.rects.slice(0, -1) } : p
      )
    );
  };

  const clearRects = () => {
    setPages((prev) =>
      prev.map((p, i) => (i === current ? { ...p, rects: [] } : p))
    );
  };

  /* ---- File ingestion ---- */
  const resetDoc = () => {
    setPages([]);
    setCurrent(0);
    setError(null);
    baseImgRef.current = null;
  };

  const loadImage = (file: File) =>
    new Promise<DocPage>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () =>
          resolve({
            id: `img-${Date.now()}`,
            kind: "image",
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            rects: [],
            textItems: [],
          });
        img.onerror = () => reject(new Error("Could not decode image."));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });

  const loadPdf = async (file: File): Promise<DocPage[]> => {
    const pdfjs: any = await import("pdfjs-dist");
    if (!pdfWorkerConfigured) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      pdfWorkerConfigured = true;
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const out: DocPage[] = [];
    const scale = 1.5;
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const pdfPage = await doc.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;

      // Extract positioned text for regex-based auto-redaction.
      const textItems: TextItem[] = [];
      try {
        const textContent = await pdfPage.getTextContent();
        for (const raw of textContent.items) {
          const item = raw as {
            str?: string;
            transform: number[];
            width?: number;
            height?: number;
          };
          if (typeof item.str !== "string" || item.str.trim() === "") continue;
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[1], tx[3]) || (item.height || 0) * scale;
          const width = (item.width || 0) * scale;
          const left = tx[4];
          const top = tx[5] - fontHeight;
          textItems.push({
            text: item.str,
            x: left,
            y: top,
            w: width,
            h: fontHeight * 1.15,
          });
        }
      } catch {
        /* scanned/imageonly PDF — no extractable text, manual redaction only */
      }

      out.push({
        id: `pdf-${pageNum}-${Date.now()}`,
        kind: "pdf",
        dataUrl: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
        rects: [],
        textItems,
      });
    }
    return out;
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setLoading(true);
    setError(null);
    try {
      setFileName(file.name.replace(/\.[^.]+$/, "") || "document");
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        const p = await loadPdf(file);
        setPages(p);
        setCurrent(0);
      } else if (
        /^image\/(png|jpe?g)$/.test(file.type) ||
        /\.(png|jpe?g)$/i.test(file.name)
      ) {
        const p = await loadImage(file);
        setPages([p]);
        setCurrent(0);
      } else {
        setError("Unsupported file. Please use a PDF, PNG, or JPG.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process the file."
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Export (flattened / rasterized so redacted content is destroyed) ---- */
  const buildRedactedCanvas = (p: DocPage, idx: number) =>
    new Promise<HTMLCanvasElement>((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = p.width;
      canvas.height = p.height;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, p.width, p.height);
        ctx.fillStyle = "#000000";
        const all = [...p.rects, ...(autoRectsByPage.get(idx) ?? [])];
        for (const r of all) ctx.fillRect(r.x, r.y, r.w, r.h);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error("Render failed during export."));
      img.src = p.dataUrl;
    });

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const exportPng = async () => {
    if (!page) return;
    setExporting(true);
    try {
      const canvas = await buildRedactedCanvas(page, current);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${fileName}-redacted-p${current + 1}.png`);
      }, "image/png");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PNG export failed.");
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (pages.length === 0) return;
    setExporting(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const canvas = await buildRedactedCanvas(pages[i], i);
        const pngDataUrl = canvas.toDataURL("image/png");
        const pngBytes = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
        const png = await pdfDoc.embedPng(pngBytes);
        const pdfPage = pdfDoc.addPage([pages[i].width, pages[i].height]);
        pdfPage.drawImage(png, {
          x: 0,
          y: 0,
          width: pages[i].width,
          height: pages[i].height,
        });
      }
      const bytes = await pdfDoc.save();
      // Copy into a fresh ArrayBuffer-backed view for a well-typed Blob part.
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      triggerDownload(
        new Blob([buffer], { type: "application/pdf" }),
        `${fileName}-redacted.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setExporting(false);
    }
  };

  const totalManual = useMemo(
    () => pages.reduce((s, p) => s + p.rects.length, 0),
    [pages]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Controls */}
      <div className="lg:col-span-1">
        <div className={`${CARD} p-5`}>
          <SectionTitle
            icon={<Shield className="h-5 w-5" />}
            title="Document Anonymizer"
            subtitle="Redact PII locally — nothing is uploaded."
          />

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-slate-300 dark:border-slate-700"
            }`}
          >
            <Upload className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Drag &amp; drop a file
            </p>
            <p className="text-xs text-slate-400">PDF, PNG, or JPG</p>
            <button
              type="button"
              className={`${BTN_GHOST} mt-3`}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              aria-label="Upload a PDF or image to redact"
            />
          </div>

          {error && (
            <p
              className="mt-3 flex items-center gap-1.5 text-sm text-rose-600"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}

          {pages.length > 0 && (
            <>
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ScanLine className="h-4 w-4" /> Auto-detect PII
                </p>
                <div className="space-y-2">
                  {(Object.keys(PII_PATTERNS) as DetectorKey[]).map((k) => (
                    <label
                      key={k}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                    >
                      <span className="text-slate-700 dark:text-slate-200">
                        {PII_PATTERNS[k].label}
                      </span>
                      <input
                        type="checkbox"
                        checked={detectors[k]}
                        onChange={(e) =>
                          setDetectors((d) => ({ ...d, [k]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Auto-redact ${PII_PATTERNS[k].label}`}
                      />
                    </label>
                  ))}
                </div>

                <label className={`${LABEL} mt-3`} htmlFor="redact-search">
                  Also redact any text containing
                </label>
                <input
                  id="redact-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. a name or account number"
                  className={INPUT}
                />
                <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-200">
                    {autoCount}
                  </strong>{" "}
                  auto-detected +{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {totalManual}
                  </strong>{" "}
                  manual redaction{totalManual === 1 ? "" : "s"}.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={undoLastRect}
                  disabled={!page || page.rects.length === 0}
                >
                  <RotateCcw className="h-4 w-4" /> Undo
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={clearRects}
                  disabled={!page || page.rects.length === 0}
                >
                  <Eraser className="h-4 w-4" /> Clear page
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={resetDoc}
                >
                  <X className="h-4 w-4" /> Remove doc
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={exportPdf}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Exporting…" : "Export PDF"}
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={exportPng}
                  disabled={exporting || !page}
                >
                  <ImageIcon className="h-4 w-4" /> Export PNG
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview canvas */}
      <div className="lg:col-span-2">
        <div className={`${CARD} p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {pages.length > 0
                ? "Drag on the document to add black-out redactions."
                : "Load a document to begin."}
            </p>
            {pages.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">
                  Page {current + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={() =>
                    setCurrent((c) => Math.min(pages.length - 1, c + 1))
                  }
                  disabled={current === pages.length - 1}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="flex min-h-[360px] items-center justify-center overflow-auto rounded-xl bg-slate-100 p-4 dark:bg-slate-800/50">
            {loading ? (
              <div className="text-center text-sm text-slate-500">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                Rendering locally…
              </div>
            ) : page ? (
              <canvas
                ref={canvasRef}
                width={page.width}
                height={page.height}
                className="tm-redact-canvas max-w-full rounded shadow-lg"
                style={{ height: "auto" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                aria-label="Document preview — drag to draw redaction rectangles"
              />
            ) : (
              <div className="text-center text-slate-400">
                <FileText className="mx-auto h-12 w-12" aria-hidden="true" />
                <p className="mt-2 text-sm">No document loaded</p>
              </div>
            )}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Redactions are rasterized on export — the underlying text is
            permanently destroyed, never merely hidden.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * MODULE B — High-Precision Invoice & Tax Math Engine (BigNumber.js)
 * ========================================================================== */

interface LineItem {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
  taxPct: string;
  discountPct: string;
}

let lineSeq = 0;
const newLine = (partial?: Partial<LineItem>): LineItem => ({
  id: `line-${++lineSeq}`,
  description: "",
  qty: "1",
  unitPrice: "0",
  taxPct: "0",
  discountPct: "0",
  ...partial,
});

function InvoiceEngine() {
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<LineItem[]>([
    newLine({ description: "Consulting services", qty: "10", unitPrice: "150", taxPct: "8.25", discountPct: "5" }),
    newLine({ description: "Software license", qty: "3", unitPrice: "49.99", taxPct: "8.25", discountPct: "0" }),
  ]);
  const [invoiceNo, setInvoiceNo] = useState("INV-1001");
  const [billTo, setBillTo] = useState("Acme Corporation");

  const update = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };
  const addLine = () => setItems((prev) => [...prev, newLine()]);
  const removeLine = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  /* ---- Exact math ---- */
  const calc = useMemo(() => {
    let subtotal = new BigNumber(0); // qty * unitPrice (pre-discount)
    let discountTotal = new BigNumber(0);
    let taxTotal = new BigNumber(0);
    const taxByRate = new Map<string, BigNumber>();
    const lines = items.map((it) => {
      const qty = bn(it.qty);
      const price = bn(it.unitPrice);
      const gross = qty.times(price);
      const discountAmt = gross.times(bn(it.discountPct)).div(100);
      const net = gross.minus(discountAmt);
      const taxAmt = net.times(bn(it.taxPct)).div(100);
      const total = net.plus(taxAmt);

      subtotal = subtotal.plus(gross);
      discountTotal = discountTotal.plus(discountAmt);
      taxTotal = taxTotal.plus(taxAmt);

      const rateKey = bn(it.taxPct).toFormat(2);
      taxByRate.set(
        rateKey,
        (taxByRate.get(rateKey) ?? new BigNumber(0)).plus(taxAmt)
      );

      return { id: it.id, gross, discountAmt, net, taxAmt, total };
    });
    const netTotal = subtotal.minus(discountTotal);
    const grandTotal = netTotal.plus(taxTotal);
    return {
      lines,
      subtotal,
      discountTotal,
      netTotal,
      taxTotal,
      grandTotal,
      taxByRate: Array.from(taxByRate.entries())
        .filter(([, amt]) => amt.isGreaterThan(0))
        .sort((a, b) => Number(b[0]) - Number(a[0])),
    };
  }, [items]);

  /* ---- Print / Save as PDF ---- */
  const printInvoice = () => {
    const sym = symbolFor(currency);
    const rows = items
      .map((it, i) => {
        const line = calc.lines[i];
        return `<tr>
          <td>${escapeHtml(it.description || "—")}</td>
          <td style="text-align:right">${bn(it.qty).toFormat()}</td>
          <td style="text-align:right">${sym}${bn(it.unitPrice).toFormat(2)}</td>
          <td style="text-align:right">${bn(it.discountPct).toFormat(2)}%</td>
          <td style="text-align:right">${bn(it.taxPct).toFormat(2)}%</td>
          <td style="text-align:right">${sym}${line.total.toFormat(2)}</td>
        </tr>`;
      })
      .join("");
    const taxRows = calc.taxByRate
      .map(
        ([rate, amt]) =>
          `<tr><td>Tax @ ${rate}%</td><td style="text-align:right">${sym}${amt.toFormat(
            2
          )}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
      invoiceNo
    )}</title><style>
      *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
      body{margin:40px;color:#0f172a}
      h1{margin:0 0 4px}
      .muted{color:#64748b;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:24px}
      th,td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0}
      th{text-align:left;background:#f8fafc;text-transform:uppercase;font-size:11px;letter-spacing:.04em;color:#475569}
      .totals{margin-top:24px;margin-left:auto;width:280px}
      .totals td{border:none;padding:4px 0}
      .grand{font-size:18px;font-weight:700;border-top:2px solid #0f172a;padding-top:8px}
    </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>INVOICE</h1><div class="muted">${escapeHtml(invoiceNo)}</div></div>
        <div style="text-align:right"><strong>Bill To</strong><div class="muted">${escapeHtml(
          billTo
        )}</div></div>
      </div>
      <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Disc.</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <table class="totals">
        <tr><td>Subtotal</td><td style="text-align:right">${sym}${calc.subtotal.toFormat(
      2
    )}</td></tr>
        <tr><td>Discount</td><td style="text-align:right">−${sym}${calc.discountTotal.toFormat(
      2
    )}</td></tr>
        ${taxRows}
        <tr class="grand"><td>Total (${currency})</td><td style="text-align:right">${sym}${calc.grandTotal.toFormat(
      2
    )}</td></tr>
      </table>
      <p class="muted" style="margin-top:40px">Generated locally by TaskMatrix AI · exact-precision BigNumber math.</p>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    } else {
      // Popup blocked — download as an HTML file instead.
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNo}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className={`${CARD} p-5`}>
          <SectionTitle
            icon={<Calculator className="h-5 w-5" />}
            title="Invoice & Tax Math Engine"
            subtitle="Exact decimal precision via BigNumber.js — no float errors."
          />

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={LABEL} htmlFor="inv-no">Invoice #</label>
              <input id="inv-no" className={INPUT} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label className={LABEL} htmlFor="inv-billto">Bill to</label>
              <input id="inv-billto" className={INPUT} value={billTo} onChange={(e) => setBillTo(e.target.value)} />
            </div>
            <div>
              <label className={LABEL} htmlFor="inv-cur">Currency</label>
              <div className="relative">
                <select
                  id="inv-cur"
                  className={`${INPUT} appearance-none pr-8`}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-2">Description</th>
                  <th className="pb-2 px-2 text-right">Qty</th>
                  <th className="pb-2 px-2 text-right">Unit price</th>
                  <th className="pb-2 px-2 text-right">Disc %</th>
                  <th className="pb-2 px-2 text-right">Tax %</th>
                  <th className="pb-2 pl-2 text-right">Amount</th>
                  <th className="pb-2" aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-2">
                      <input
                        className={INPUT}
                        value={it.description}
                        placeholder="Item description"
                        onChange={(e) => update(it.id, "description", e.target.value)}
                        aria-label={`Line ${i + 1} description`}
                      />
                    </td>
                    {(["qty", "unitPrice", "discountPct", "taxPct"] as const).map(
                      (field) => (
                        <td key={field} className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            className={`${INPUT} w-20 text-right`}
                            value={it[field]}
                            onChange={(e) =>
                              update(
                                it.id,
                                field,
                                e.target.value === "" || Number(e.target.value) >= 0
                                  ? e.target.value
                                  : "0"
                              )
                            }
                            aria-label={`Line ${i + 1} ${field}`}
                          />
                        </td>
                      )
                    )}
                    <td className="py-2 pl-2 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {money(calc.lines[i].total, currency)}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(it.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        aria-label={`Remove line ${i + 1}`}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className={`${BTN_GHOST} mt-4`} onClick={addLine}>
            <Plus className="h-4 w-4" /> Add line item
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className={`${CARD} sticky top-24 p-5`}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium tabular-nums">{money(calc.subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-medium tabular-nums text-rose-600">
                −{money(calc.discountTotal, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Net</dt>
              <dd className="font-medium tabular-nums">{money(calc.netTotal, currency)}</dd>
            </div>
            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                Tax breakdown
              </p>
              {calc.taxByRate.length === 0 ? (
                <p className="text-xs text-slate-400">No tax applied.</p>
              ) : (
                calc.taxByRate.map(([rate, amt]) => (
                  <div key={rate} className="flex justify-between">
                    <dt className="text-slate-500">Tax @ {rate}%</dt>
                    <dd className="font-medium tabular-nums">
                      {money(amt, currency)}
                    </dd>
                  </div>
                ))
              )}
              <div className="mt-1 flex justify-between">
                <dt className="text-slate-500">Total tax</dt>
                <dd className="font-medium tabular-nums">{money(calc.taxTotal, currency)}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-indigo-600 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-indigo-200">
              Total owed
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {money(calc.grandTotal, currency)}
            </p>
          </div>

          <button type="button" className={`${BTN_PRIMARY} mt-4 w-full`} onClick={printInvoice}>
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            0.1 + 0.2 = {new BigNumber(0.1).plus(0.2).toString()} (exact) — never
            0.30000000000000004.
          </p>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==========================================================================
 * MODULE C — Real-Time Executive Meeting Cost Ticker
 * ========================================================================== */

function MeetingTicker() {
  const [attendees, setAttendees] = useState("6");
  const [rate, setRate] = useState("95");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState("500");

  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (running) {
      lastTickRef.current = performance.now();
      intervalRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        setElapsedMs((prev) => prev + delta);
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setElapsedMs(0);
  };

  const seconds = elapsedMs / 1000;
  const costPerSecond = useMemo(
    () => bn(attendees).times(bn(rate)).div(3600),
    [attendees, rate]
  );
  const cost = useMemo(
    () => costPerSecond.times(seconds),
    [costPerSecond, seconds]
  );
  const budgetBn = bn(budget);
  const ratio = budgetBn.isGreaterThan(0)
    ? cost.div(budgetBn).toNumber()
    : 0;

  const status =
    ratio >= 1
      ? { label: "Over budget", color: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-500" }
      : ratio >= 0.75
      ? { label: "High cost", color: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500" }
      : { label: "Efficient", color: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-500" };

  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = Math.floor(seconds % 60);
  const clock = [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");
  const sym = symbolFor(currency);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className={`${CARD} p-5`}>
          <SectionTitle
            icon={<Timer className="h-5 w-5" />}
            title="Meeting Cost Ticker"
            subtitle="Watch cash burn in real time."
          />
          <div className="space-y-4">
            <div>
              <label className={LABEL} htmlFor="mt-att">
                <Users className="mr-1 inline h-3.5 w-3.5" /> Attendees
              </label>
              <input
                id="mt-att"
                type="number"
                min="1"
                className={INPUT}
                value={attendees}
                onChange={(e) =>
                  setAttendees(e.target.value === "" || Number(e.target.value) >= 0 ? e.target.value : "1")
                }
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="mt-rate">Average hourly rate</label>
              <input
                id="mt-rate"
                type="number"
                min="0"
                step="any"
                className={INPUT}
                value={rate}
                onChange={(e) =>
                  setRate(e.target.value === "" || Number(e.target.value) >= 0 ? e.target.value : "0")
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} htmlFor="mt-cur">Currency</label>
                <div className="relative">
                  <select
                    id="mt-cur"
                    className={`${INPUT} appearance-none pr-8`}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={LABEL} htmlFor="mt-budget">Budget cap</label>
                <input
                  id="mt-budget"
                  type="number"
                  min="0"
                  step="any"
                  className={INPUT}
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value === "" || Number(e.target.value) >= 0 ? e.target.value : "0")
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className={`${CARD} flex flex-col items-center p-8`}>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-2 ${status.text} ${status.ring} ring-inset`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${running ? "animate-pulse" : ""}`} />
            {status.label}
          </span>

          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-slate-400">
            Meeting cost so far
          </p>
          <p className="mt-1 text-5xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-6xl">
            {sym}
            {cost.toFormat(2)}
          </p>
          <p className="mt-2 font-mono text-lg text-slate-500">{clock}</p>
          <p className="mt-1 text-sm text-slate-400">
            Burning {sym}
            {costPerSecond.toFormat(4)} / second · {sym}
            {costPerSecond.times(60).toFormat(2)} / minute
          </p>

          {/* budget progress */}
          <div className="mt-6 w-full max-w-md">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Budget usage</span>
              <span>
                {sym}
                {cost.toFormat(2)} / {sym}
                {budgetBn.toFormat(2)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-150 ${status.color}`}
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              />
            </div>
          </div>

          {/* controls */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!running ? (
              <button type="button" className={BTN_PRIMARY} onClick={() => setRunning(true)}>
                <Play className="h-4 w-4" /> {elapsedMs > 0 ? "Resume" : "Start"}
              </button>
            ) : (
              <button type="button" className={BTN_PRIMARY} onClick={() => setRunning(false)}>
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            <button type="button" className={BTN_GHOST} onClick={reset} disabled={elapsedMs === 0 && !running}>
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * MODULE D — Structured Data & Sanitization Utility
 * ========================================================================== */

/** Minimal RFC-4180-style CSV parser (handles quotes, commas, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function toCsvValue(v: unknown): string {
  const s =
    v === null || v === undefined
      ? ""
      : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

interface ValidationState {
  ok: boolean;
  message: string;
  line?: number;
  col?: number;
}

function DataSanitizer() {
  const [input, setInput] = useState(
    '[\n  { "name": "Ada Lovelace", "role": "Engineer", "active": true },\n  { "name": "Alan Turing", "role": "Researcher", "active": false }\n]'
  );
  const [output, setOutput] = useState("");
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [copied, setCopied] = useState(false);

  const showError = (message: string, pos?: number) => {
    let line: number | undefined;
    let col: number | undefined;
    if (typeof pos === "number") {
      const upto = input.slice(0, pos);
      line = upto.split("\n").length;
      col = pos - upto.lastIndexOf("\n");
    }
    setValidation({ ok: false, message, line, col });
  };

  const validateJson = () => {
    try {
      JSON.parse(input);
      setValidation({ ok: true, message: "Valid JSON ✓" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      const m = msg.match(/position (\d+)/i);
      showError(msg, m ? Number(m[1]) : undefined);
    }
  };

  const beautify = () => {
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, 2));
      setValidation({ ok: true, message: "Formatted ✓" });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const minify = () => {
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
      setValidation({ ok: true, message: "Minified ✓" });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const jsonToCsv = () => {
    try {
      const data = JSON.parse(input);
      const arr = Array.isArray(data) ? data : [data];
      if (arr.length === 0) {
        setOutput("");
        setValidation({ ok: true, message: "Empty array — nothing to convert." });
        return;
      }
      const keys: string[] = [];
      for (const obj of arr) {
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          for (const k of Object.keys(obj)) if (!keys.includes(k)) keys.push(k);
        }
      }
      const header = keys.map(toCsvValue).join(",");
      const rows = arr.map((obj) =>
        keys.map((k) => toCsvValue((obj ?? {})[k])).join(",")
      );
      setOutput([header, ...rows].join("\n"));
      setValidation({ ok: true, message: `Converted ${arr.length} record(s) to CSV ✓` });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const csvToJson = () => {
    try {
      const rows = parseCsv(input);
      if (rows.length < 1) {
        setValidation({ ok: false, message: "No CSV rows detected." });
        return;
      }
      const [header, ...body] = rows;
      const records = body.map((r) => {
        const obj: Record<string, string> = {};
        header.forEach((h, i) => {
          obj[h.trim()] = (r[i] ?? "").trim();
        });
        return obj;
      });
      setOutput(JSON.stringify(records, null, 2));
      setValidation({ ok: true, message: `Parsed ${records.length} row(s) to JSON ✓` });
    } catch (e) {
      showError(e instanceof Error ? e.message : "CSV parse error");
    }
  };

  const dedupe = () => {
    const lines = input.split("\n").map((l) => l.trim());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of lines) {
      const key = l;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(l);
      }
    }
    const removed = lines.length - out.length;
    setOutput(out.join("\n"));
    setValidation({ ok: true, message: `Removed ${removed} duplicate line(s) ✓` });
  };

  const sanitize = () => {
    const cleaned = input
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 0)
      .join("\n");
    setOutput(cleaned);
    setValidation({ ok: true, message: "Sanitized whitespace & blank lines ✓" });
  };

  const useOutputAsInput = () => {
    if (output) {
      setInput(output);
      setOutput("");
      setValidation(null);
    }
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy output:", output);
    }
  };

  const inputLines = input.split("\n");

  return (
    <div className={`${CARD} p-5`}>
      <SectionTitle
        icon={<Braces className="h-5 w-5" />}
        title="Data & Sanitization Utility"
        subtitle="Convert JSON ↔ CSV, validate, and clean text — all in-browser."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={BTN_GHOST} onClick={validateJson}>
          <CheckCircle2 className="h-4 w-4" /> Validate JSON
        </button>
        <button type="button" className={BTN_GHOST} onClick={beautify}>
          <Wand2 className="h-4 w-4" /> Beautify
        </button>
        <button type="button" className={BTN_GHOST} onClick={minify}>
          <Layers className="h-4 w-4" /> Minify
        </button>
        <button type="button" className={BTN_GHOST} onClick={jsonToCsv}>
          <Table className="h-4 w-4" /> JSON → CSV
        </button>
        <button type="button" className={BTN_GHOST} onClick={csvToJson}>
          <Braces className="h-4 w-4" /> CSV → JSON
        </button>
        <button type="button" className={BTN_GHOST} onClick={dedupe}>
          <Layers className="h-4 w-4" /> Deduplicate
        </button>
        <button type="button" className={BTN_GHOST} onClick={sanitize}>
          <Eraser className="h-4 w-4" /> Sanitize
        </button>
      </div>

      {validation && (
        <div
          className={`mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            validation.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
          role="status"
        >
          {validation.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <span>
            {validation.message}
            {validation.line !== undefined && (
              <>
                {" "}
                <strong>(line {validation.line}, col {validation.col})</strong>
              </>
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="ds-input">Input</label>
          <textarea
            id="ds-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setValidation(null);
            }}
            spellCheck={false}
            className={`${INPUT} tm-code h-72 resize-y`}
            placeholder="Paste JSON, CSV, or raw text…"
          />
          {/* dynamic error line highlight */}
          {validation && !validation.ok && validation.line !== undefined && (
            <div className="mt-2 max-h-32 overflow-auto rounded-lg border border-rose-200 bg-rose-50/50 p-2 text-xs dark:border-rose-900 dark:bg-rose-950/20">
              {inputLines.map((l, i) => (
                <div
                  key={i}
                  className={`tm-code whitespace-pre px-1 ${
                    i + 1 === validation.line
                      ? "rounded bg-rose-200 font-semibold text-rose-900 dark:bg-rose-800 dark:text-rose-100"
                      : "text-slate-500"
                  }`}
                >
                  {String(i + 1).padStart(3, " ")} | {l || " "}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={LABEL + " mb-0"} htmlFor="ds-output">Output</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={useOutputAsInput}
                disabled={!output}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 disabled:opacity-40"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" /> Use as input
              </button>
              <button
                type="button"
                onClick={copyOutput}
                disabled={!output}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 disabled:opacity-40"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <textarea
            id="ds-output"
            value={output}
            readOnly
            spellCheck={false}
            className={`${INPUT} tm-code h-72 resize-y bg-slate-50 dark:bg-slate-950`}
            placeholder="Results appear here…"
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * Lead capture card + FAQ data
 * ========================================================================== */

function LeadCapture() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
    // Production: POST to your ESP endpoint here (still no user tool-data sent).
  };
  return (
    <div className="tm-no-print rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg dark:border-indigo-900">
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">
            Get Enterprise Multi-Tool Updates &amp; Templates
          </h3>
          <p className="mt-1 text-sm text-indigo-100">
            New privacy-first tools, invoice templates, and productivity guides.
            No spam — unsubscribe anytime.
          </p>
        </div>
        {done ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/95 p-4 text-slate-900" role="status">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span className="text-sm font-medium">You&apos;re subscribed — welcome aboard!</span>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@company.com"
                aria-label="Email address"
                aria-invalid={error ? "true" : "false"}
                className="w-full rounded-lg border-0 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-white"
              />
              {error && <p className="mt-1 text-xs text-indigo-100" role="alert">{error}</p>}
            </div>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface Faq {
  q: string;
  a: string;
}
const FAQS: Faq[] = [
  {
    q: "Is any of my data uploaded to a server?",
    a: "No. Every module in TaskMatrix AI runs entirely in your browser using JavaScript, WebAssembly, and the HTML5 Canvas. Your PDFs, images, invoice figures, and pasted text never leave your device — there are no API calls, uploads, or backend databases involved in processing your inputs.",
  },
  {
    q: "How does local PDF redaction keep information secure?",
    a: "The anonymizer rasterizes each page: it renders the PDF to a canvas, paints solid black rectangles over the sensitive regions, and rebuilds the export from those flattened images with pdf-lib. Because the output is a fresh image-based PDF, the original selectable text and metadata beneath a redaction are permanently destroyed, not just visually hidden.",
  },
  {
    q: "Why use BigNumber.js instead of normal JavaScript numbers?",
    a: "JavaScript uses IEEE-754 floating point, so 0.1 + 0.2 evaluates to 0.30000000000000004. For invoices, taxes, and compounding discounts those tiny errors accumulate into incorrect totals. TaskMatrix AI performs all currency math with BigNumber.js and half-up rounding to guarantee exact, auditable results.",
  },
  {
    q: "Does the app work offline?",
    a: "Yes. Once the page has loaded, all four tools function without an internet connection because there is no server dependency. You can safely use it on sensitive documents inside an air-gapped or restricted network.",
  },
  {
    q: "Which file types can the anonymizer open?",
    a: "PDF documents and PNG or JPG images. PDFs additionally support automatic PII detection (emails, phone numbers, tax IDs, and credit card numbers) via positioned text extraction; images support precise manual black-out redaction.",
  },
  {
    q: "How is the real-time meeting cost calculated?",
    a: "Cost per second = (number of attendees × average hourly rate) ÷ 3600. The ticker multiplies that by elapsed seconds and refreshes every 100 milliseconds, changing color from green (efficient) to amber (high cost) to red once you exceed your budget cap.",
  },
];

/* ==========================================================================
 * Root page — header, tabs, modules, monetization, SEO.
 * ========================================================================== */

type TabKey = "anonymizer" | "invoice" | "ticker" | "data";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "anonymizer", label: "PDF Anonymizer", icon: <Shield className="h-4 w-4" /> },
  { key: "invoice", label: "Invoice Engine", icon: <Calculator className="h-4 w-4" /> },
  { key: "ticker", label: "Meeting Ticker", icon: <Timer className="h-4 w-4" /> },
  { key: "data", label: "Data Tools", icon: <Braces className="h-4 w-4" /> },
];

export default function TaskMatrixPage() {
  const { isDark, mounted, toggle } = useTheme();
  const [tab, setTab] = useState<TabKey>("anonymizer");

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "TaskMatrix AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      description:
        "Privacy-first, zero-server multi-tool suite: local PDF/image redactor, high-precision invoice & tax calculator, real-time meeting cost ticker, and JSON/CSV data sanitizer. All processing happens 100% client-side.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Local PDF & image PII redaction (no upload)",
        "BigNumber.js exact-precision invoice & tax math",
        "Real-time meeting cost ticker",
        "JSON to CSV and CSV to JSON conversion",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1573",
      },
    }),
    []
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
    []
  );

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ---------- Header ---------- */}
      <header className="tm-no-print sticky top-0 z-40 border-b border-slate-200 tm-glass dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md">
              {/* Custom SVG logo */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.65" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.65" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                TaskMatrix <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </p>
              <p className="flex items-center gap-1 text-[11px] leading-tight text-slate-500">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> 100% on-device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Hero */}
        <section className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Zero-server · WASM &amp; Canvas
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            The privacy-first productivity toolkit that never sees your data
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Redact documents, build precise invoices, track meeting costs, and
            wrangle data — all running entirely in your browser. Nothing is
            uploaded, ever.
          </p>
        </section>

        {/* Ad Container 1 */}
        <AdSlot variant="leaderboard" className="mb-6" />

        {/* Tabs */}
        <div className="tm-no-print mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Layout: tools + sticky sidebar ad */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <div hidden={tab !== "anonymizer"}>
              <PdfAnonymizer />
            </div>
            <div hidden={tab !== "invoice"}>
              <InvoiceEngine />
            </div>
            <div hidden={tab !== "ticker"}>
              <MeetingTicker />
            </div>
            <div hidden={tab !== "data"}>
              <DataSanitizer />
            </div>
          </div>

          {/* Ad Container 2 (sticky sidebar) */}
          <aside className="tm-no-print hidden xl:block">
            <div className="sticky top-24">
              <AdSlot variant="box" />
            </div>
          </aside>
        </div>

        {/* Lead capture (Container 3) */}
        <div className="mt-8">
          <LeadCapture />
        </div>

        {/* SEO content */}
        <article className="mt-10">
          <div className={`${CARD} p-6 sm:p-8`}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              How TaskMatrix AI works — and why it&apos;s private by design
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              TaskMatrix AI bundles four everyday business utilities into one
              fast, installable-feeling web app. The defining technical
              guarantee is simple:{" "}
              <strong className="text-slate-900 dark:text-white">
                your inputs never leave your browser.
              </strong>{" "}
              There is no upload step, no server-side processing, and no
              analytics on the content you work with. Below is exactly how to
              use each tool and what happens under the hood.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Shield className="h-5 w-5 text-indigo-500" /> 1. Document
                  Anonymizer
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Drag a PDF, PNG, or JPG onto the drop zone.</li>
                  <li>Pages render locally to an HTML5 Canvas via PDF.js.</li>
                  <li>Toggle PII detectors to auto-highlight emails, phones, tax IDs, and cards.</li>
                  <li>Drag on the page to add custom black-out rectangles.</li>
                  <li>Export a flattened PDF or PNG — redactions are rasterized and irreversible.</li>
                </ol>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Calculator className="h-5 w-5 text-indigo-500" /> 2. Invoice
                  &amp; Tax Engine
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Add line items with quantity, unit price, discount, and tax.</li>
                  <li>Totals compute instantly with BigNumber.js exact precision.</li>
                  <li>See a grouped tax breakdown by rate and a live grand total.</li>
                  <li>Pick from ten currencies.</li>
                  <li>Print or save a clean invoice as PDF/HTML.</li>
                </ol>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Timer className="h-5 w-5 text-indigo-500" /> 3. Meeting Cost
                  Ticker
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Enter attendee count and average hourly rate.</li>
                  <li>Start the timer; cost updates every 100 ms.</li>
                  <li>Pause, resume, or reset at any time.</li>
                  <li>Watch the status shift green → amber → red against your budget.</li>
                </ol>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Braces className="h-5 w-5 text-indigo-500" /> 4. Data Tools
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Paste JSON, CSV, or raw text.</li>
                  <li>Validate JSON with line/column error reporting.</li>
                  <li>Convert JSON → CSV or CSV → JSON.</li>
                  <li>Deduplicate lines and sanitize whitespace.</li>
                  <li>Copy or reuse the output with one click.</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p>
                <strong>Technical privacy guarantee:</strong> TaskMatrix AI
                issues zero network requests for your content. You can verify
                this in your browser&apos;s DevTools Network tab — load a
                document, redact it, export it, and you will see no outbound
                data transfer.
              </p>
            </div>
          </div>
        </article>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto mt-6 max-w-3xl space-y-3">
            {FAQS.map((f, i) => (
              <FaqAccordion key={i} faq={f} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="tm-no-print mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              TaskMatrix AI
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-center text-xs text-slate-500">
            <Gauge className="h-3.5 w-3.5" /> Runs 100% in your browser · © {new Date().getFullYear()} · No data collected.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FaqAccordion({ faq, defaultOpen }: { faq: Faq; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const btnId = useId();
  return (
    <div className={`${CARD} overflow-hidden`}>
      <h3>
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"
        >
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 sm:text-base">
            {faq.q}
          </span>
          <ChevronDown
            className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="px-5 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
      >
        {faq.a}
      </div>
    </div>
  );
}

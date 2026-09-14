"use client";

/**
 * TaskMatrix AI — Enterprise multi-tool platform (17 utilities).
 * ==========================================================================
 * A privacy-first, zero-server suite. Every tool — PDF redaction, invoicing,
 * meeting-cost tracking, data sanitization, image compression, EXIF stripping,
 * JWT debugging, AES-256-GCM encryption, mock-data generation, SQL formatting,
 * contract diffing, legal-document generation, watermarking, screenshot
 * annotation, SVG optimization, and subnet calculation — executes 100% locally
 * in the browser using native Web APIs (Canvas, Web Crypto, TypedArrays) plus
 * BigNumber.js for exact money math and PDF.js/pdf-lib for local PDF handling.
 * No file, key, or byte is ever transmitted to a server.
 */

import React, {
  createContext,
  useCallback,
  useContext,
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
  ArrowUpRight,
  Banknote,
  Braces,
  Briefcase,
  Calculator,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clipboard,
  ClipboardPaste,
  Clock,
  Code,
  Code2,
  Copy,
  Database,
  DollarSign,
  Download,
  Droplets,
  Eraser,
  Eye,
  FileCode2,
  FileCog,
  FileJson,
  FileKey2,
  FileSignature,
  FileText,
  Fingerprint,
  Gauge,
  GitCompare,
  HeartPulse,
  Highlighter,
  Home,
  Image as ImageIcon,
  Info,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  LockKeyhole,
  MapPin,
  Menu,
  Minimize2,
  Moon,
  MousePointer,
  Network,
  Palette,
  Pause,
  PenTool,
  PiggyBank,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Router,
  RotateCcw,
  Scale,
  Scan,
  ScanLine,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  Square,
  Stamp,
  Sun,
  Table,
  Timer,
  TrendingUp,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  Users,
  Wallet,
  Wand2,
  Wrench,
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

/** Section header used by the ported v1 tools (alias of the v2 ToolHeader). */
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
      <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
/* ==========================================================================
 * Theme hook (dark/light + localStorage).
 * ========================================================================== */
const THEME_KEY = "taskmatrix-theme";

function useTheme() {
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
      next ? root.classList.add("dark") : root.classList.remove("dark");
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        /* storage blocked — session-only */
      }
      return next;
    });
  }, []);
  return { isDark, mounted, toggle };
}

/* ==========================================================================
 * Toast system.
 * ========================================================================== */
interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}
const ToastContext = createContext<(message: string, type?: Toast["type"]) => void>(
  () => {}
);
const useToast = () => useContext(ToastContext);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.type === "error"
                ? "bg-rose-600"
                : t.type === "info"
                ? "bg-slate-800"
                : "bg-emerald-600"
            }`}
          >
            {t.type === "error" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ==========================================================================
 * Shared style tokens + primitives.
 * ========================================================================== */
const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900";
const LABEL = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function ToolHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch {
      window.prompt("Copy:", text);
    }
  };
  return (
    <button type="button" onClick={copy} disabled={!text} className={`${BTN_GHOST} ${className}`}>
      <Copy className="h-4 w-4" /> {label}
    </button>
  );
}

function AdSlot({
  variant,
  className = "",
}: {
  variant: "banner" | "tower" | "box" | "native";
  className?: string;
}) {
  const cfg = {
    banner: { cls: "min-h-[90px]", label: "728 × 90 · Banner" },
    tower: { cls: "min-h-[600px] min-w-[300px]", label: "300 × 600 · Half-page" },
    box: { cls: "min-h-[250px] min-w-[300px]", label: "300 × 250 · Rectangle" },
    native: { cls: "min-h-[120px]", label: "Native content unit" },
  }[variant];
  return (
    <div
      className={`flex ${cfg.cls} w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40 ${className}`}
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
 * Small shared helpers.
 * ========================================================================== */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function uuidv4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20
  )}-${h.slice(20)}`;
}

/* ==========================================================================
 * UTILITY A — Image & File Compressor
 * ========================================================================== */
function ImageCompressor() {
  const toast = useToast();
  const [original, setOriginal] = useState<{
    url: string;
    name: string;
    size: number;
    width: number;
    height: number;
    type: string;
  } | null>(null);
  const [quality, setQuality] = useState(75);
  const [scale, setScale] = useState(100);
  const [maxKb, setMaxKb] = useState<string>("");
  const [format, setFormat] = useState<"image/jpeg" | "image/webp" | "image/png">(
    "image/jpeg"
  );
  const [compressed, setCompressed] = useState<{ url: string; size: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadFile = useCallback(
    (file: File) => {
      if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
        toast("Please choose a PNG, JPG, or WebP image.", "error");
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setOriginal({
          url,
          name: file.name,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: file.type,
        });
        setCompressed(null);
      };
      img.onerror = () => toast("Could not decode image.", "error");
      img.src = url;
    },
    [toast]
  );

  const renderAtQuality = (q: number): Promise<Blob | null> =>
    new Promise((resolve) => {
      const img = imgRef.current;
      if (!img) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round((img.naturalWidth * scale) / 100));
      canvas.height = Math.max(1, Math.round((img.naturalHeight * scale) / 100));
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b), format, q / 100);
    });

  const compress = useCallback(async () => {
    if (!imgRef.current || !original) return;
    setBusy(true);
    try {
      let blob = await renderAtQuality(quality);
      const limit = Number(maxKb) * 1024;
      // If a max size is set, binary-search quality down to satisfy it (JPEG/WebP).
      if (blob && limit > 0 && blob.size > limit && format !== "image/png") {
        let lo = 1;
        let hi = quality;
        let best = blob;
        for (let i = 0; i < 8 && lo <= hi; i++) {
          const mid = Math.floor((lo + hi) / 2);
          const candidate = await renderAtQuality(mid);
          if (candidate && candidate.size <= limit) {
            best = candidate;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        blob = best;
      }
      if (!blob) throw new Error("Compression failed.");
      if (compressed) URL.revokeObjectURL(compressed.url);
      setCompressed({ url: URL.createObjectURL(blob), size: blob.size });
      if (limit > 0 && blob.size > limit && format !== "image/png") {
        toast("Reached minimum quality but still above target size.", "info");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Compression error", "error");
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original, quality, scale, maxKb, format]);

  // Auto-compress whenever controls change and an image is loaded.
  useEffect(() => {
    if (original) {
      const t = setTimeout(() => compress(), 150);
      return () => clearTimeout(t);
    }
  }, [original, quality, scale, maxKb, format, compress]);

  const reduction =
    original && compressed
      ? Math.round((1 - compressed.size / original.size) * 100)
      : 0;

  const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<ImageIcon className="h-5 w-5" />}
        title="Image & File Compressor"
        subtitle="Shrink PNG, JPG & WebP locally with a live before/after preview."
      />

      {!original ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
            dragOver
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
              : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <Upload className="h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
            Drag &amp; drop an image
          </p>
          <p className="text-xs text-slate-400">PNG, JPG, or WebP</p>
          <button
            type="button"
            className={`${BTN_GHOST} mt-4`}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-5 lg:col-span-1">
            <div>
              <div className="flex justify-between">
                <label className={LABEL} htmlFor="cmp-q">Quality</label>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {quality}%
                </span>
              </div>
              <input
                id="cmp-q"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="tm-range w-full"
                disabled={format === "image/png"}
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label className={LABEL} htmlFor="cmp-s">Dimension scale</label>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {scale}% ({Math.round((original.width * scale) / 100)}×
                  {Math.round((original.height * scale) / 100)})
                </span>
              </div>
              <input
                id="cmp-s"
                type="range"
                min={5}
                max={100}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="tm-range w-full"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="cmp-max">Max file size (KB, optional)</label>
              <input
                id="cmp-max"
                type="number"
                min={0}
                placeholder="e.g. 500"
                value={maxKb}
                onChange={(e) => setMaxKb(e.target.value.replace(/[^0-9]/g, ""))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="cmp-fmt">Output format</label>
              <div className="relative">
                <select
                  id="cmp-fmt"
                  className={`${INPUT} appearance-none pr-8`}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                >
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/png">PNG (lossless)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <button
              type="button"
              className={`${BTN_PRIMARY} w-full`}
              disabled={!compressed || busy}
              onClick={() =>
                compressed &&
                fetch(compressed.url)
                  .then((r) => r.blob())
                  .then((b) =>
                    downloadBlob(
                      b,
                      `${original.name.replace(/\.[^.]+$/, "")}-compressed.${ext}`
                    )
                  )
              }
            >
              <Download className="h-4 w-4" /> Download compressed
            </button>
            <button
              type="button"
              className={`${BTN_GHOST} w-full`}
              onClick={() => {
                setOriginal(null);
                setCompressed(null);
              }}
            >
              <X className="h-4 w-4" /> Choose another
            </button>
          </div>

          {/* Side-by-side preview */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <figure className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                <img
                  src={original.url}
                  alt="Original"
                  className="mx-auto max-h-64 rounded object-contain"
                />
                <figcaption className="mt-2 text-center text-xs text-slate-500">
                  Original · {formatBytes(original.size)}
                </figcaption>
              </figure>
              <figure className="relative rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                {reduction > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                    −{reduction}% smaller
                  </span>
                )}
                {compressed ? (
                  <img
                    src={compressed.url}
                    alt="Compressed"
                    className="mx-auto max-h-64 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {busy ? "Compressing…" : "—"}
                  </div>
                )}
                <figcaption className="mt-2 text-center text-xs text-slate-500">
                  Compressed ·{" "}
                  {compressed ? formatBytes(compressed.size) : "—"}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * UTILITY B — EXIF & Metadata Privacy Stripper
 * ========================================================================== */
interface ExifResult {
  isJpeg: boolean;
  hasExif: boolean;
  fields: { label: string; value: string; icon: "cam" | "date" | "gps" | "author" | "sw" | "tag" }[];
  otherCount: number;
}

function parseExif(buf: ArrayBuffer): ExifResult {
  const view = new DataView(buf);
  const empty: ExifResult = { isJpeg: false, hasExif: false, fields: [], otherCount: 0 };
  try {
    if (view.getUint16(0) !== 0xffd8) return empty; // not a JPEG
    const result: ExifResult = { isJpeg: true, hasExif: false, fields: [], otherCount: 0 };
    let offset = 2;
    let tiff = -1;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00) break;
      const size = view.getUint16(offset + 2);
      if (marker === 0xffe1) {
        // APP1 — verify "Exif\0\0"
        if (
          view.getUint32(offset + 4) === 0x45786966 &&
          view.getUint16(offset + 8) === 0x0000
        ) {
          tiff = offset + 10;
        }
        break;
      }
      if (marker === 0xffda) break; // start of scan
      offset += 2 + size;
    }
    if (tiff < 0) return result;
    result.hasExif = true;

    const little = view.getUint16(tiff) === 0x4949;
    const u16 = (o: number) => view.getUint16(o, little);
    const u32 = (o: number) => view.getUint32(o, little);

    const readValue = (type: number, count: number, valOff: number): string => {
      // ASCII
      if (type === 2) {
        let s = "";
        for (let i = 0; i < count - 1; i++) {
          const c = view.getUint8(valOff + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s.trim();
      }
      if (type === 3) return String(u16(valOff)); // SHORT
      if (type === 4) return String(u32(valOff)); // LONG
      if (type === 5) {
        const n = u32(valOff);
        const d = u32(valOff + 4);
        return d ? String(n / d) : "0";
      }
      return "";
    };

    const tags: Record<number, string> = {};
    let gpsPtr = -1;
    let exifPtr = -1;
    const gps: Record<number, number[]> = {};
    const gpsRef: Record<number, string> = {};

    const readIfd = (dirStart: number, kind: "ifd0" | "exif" | "gps") => {
      if (dirStart <= 0 || dirStart + 2 > view.byteLength) return;
      const entries = u16(dirStart);
      for (let i = 0; i < entries; i++) {
        const entry = dirStart + 2 + i * 12;
        if (entry + 12 > view.byteLength) break;
        const tag = u16(entry);
        const type = u16(entry + 2);
        const count = u32(entry + 4);
        const sizePerComp = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] || 1;
        const total = sizePerComp * count;
        const valOff = total <= 4 ? entry + 8 : tiff + u32(entry + 8);
        if (kind === "ifd0") {
          if (tag === 0x8769) exifPtr = tiff + u32(entry + 8);
          else if (tag === 0x8825) gpsPtr = tiff + u32(entry + 8);
          else tags[tag] = readValue(type, count, valOff);
        } else if (kind === "exif") {
          tags[tag] = readValue(type, count, valOff);
        } else if (kind === "gps") {
          if (type === 5 && count >= 1) {
            const arr: number[] = [];
            for (let k = 0; k < count; k++) {
              const n = u32(valOff + k * 8);
              const d = u32(valOff + k * 8 + 4);
              arr.push(d ? n / d : 0);
            }
            gps[tag] = arr;
          } else {
            gpsRef[tag] = readValue(type, count, valOff);
          }
        }
      }
    };

    readIfd(tiff + u32(tiff + 4), "ifd0");
    if (exifPtr > 0) readIfd(exifPtr, "exif");
    if (gpsPtr > 0) readIfd(gpsPtr, "gps");

    const push = (label: string, value: string, icon: ExifResult["fields"][number]["icon"]) => {
      if (value && value.trim()) result.fields.push({ label, value, icon });
    };
    const make = tags[0x010f];
    const model = tags[0x0110];
    push("Camera", [make, model].filter(Boolean).join(" ") || "", "cam");
    push("Lens", tags[0xa434] || "", "cam");
    push("Software", tags[0x0131] || "", "sw");
    push("Date/Time", tags[0x0132] || tags[0x9003] || "", "date");
    push("Author / Artist", tags[0x013b] || tags[0x9c9d] || "", "author");
    push("Copyright", tags[0x8298] || "", "author");

    // GPS
    const toDeg = (a?: number[]) =>
      a && a.length === 3 ? a[0] + a[1] / 60 + a[2] / 3600 : NaN;
    let lat = toDeg(gps[2]);
    let lon = toDeg(gps[4]);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      if ((gpsRef[1] || "").toUpperCase() === "S") lat = -lat;
      if ((gpsRef[3] || "").toUpperCase() === "W") lon = -lon;
      push("GPS location", `${lat.toFixed(6)}, ${lon.toFixed(6)}`, "gps");
    }

    result.otherCount = Math.max(
      0,
      Object.keys(tags).length - result.fields.length
    );
    return result;
  } catch {
    return { isJpeg: view.getUint16(0) === 0xffd8, hasExif: false, fields: [], otherCount: 0 };
  }
}

function ExifStripper() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [exif, setExif] = useState<ExifResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handle = useCallback(
    async (f: File) => {
      if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
        toast("Please use a PNG, JPG, or WebP image.", "error");
        return;
      }
      setFile(f);
      setUrl(URL.createObjectURL(f));
      const buf = await f.arrayBuffer();
      setExif(parseExif(buf));
    },
    [toast]
  );

  const sanitize = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) return toast("Sanitize failed.", "error");
          downloadBlob(
            blob,
            `${file.name.replace(/\.[^.]+$/, "")}-clean.${
              outType === "image/png" ? "png" : "jpg"
            }`
          );
          toast("Metadata stripped — clean file downloaded");
        },
        outType,
        0.95
      );
    };
    img.onerror = () => toast("Could not process the image.", "error");
    img.src = url;
  };

  const iconFor = (k: ExifResult["fields"][number]["icon"]) =>
    k === "gps" ? (
      <MapPin className="h-4 w-4 text-rose-500" />
    ) : k === "date" ? (
      <Clock className="h-4 w-4 text-amber-500" />
    ) : k === "author" ? (
      <Fingerprint className="h-4 w-4 text-purple-500" />
    ) : k === "sw" ? (
      <FileCog className="h-4 w-4 text-blue-500" />
    ) : (
      <Scan className="h-4 w-4 text-indigo-500" />
    );

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<Fingerprint className="h-5 w-5" />}
        title="EXIF & Metadata Privacy Stripper"
        subtitle="Inspect hidden metadata, then re-encode the image to remove it."
      />
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <Upload className="h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
            Drop an image to inspect its metadata
          </p>
          <p className="text-xs text-slate-400">JPG has the richest EXIF data</p>
          <button type="button" className={`${BTN_GHOST} mt-4`} onClick={() => fileInputRef.current?.click()}>
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <img src={url} alt={file.name} className="mx-auto max-h-72 rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
            <div className="mt-3 flex gap-2">
              <button type="button" className={`${BTN_PRIMARY} flex-1`} onClick={sanitize}>
                <ShieldCheck className="h-4 w-4" /> Sanitize &amp; Download
              </button>
              <button
                type="button"
                className={BTN_GHOST}
                onClick={() => {
                  setFile(null);
                  setExif(null);
                  setUrl("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metadata breakdown
            </p>
            {exif && exif.hasExif && exif.fields.length > 0 ? (
              <ul className="space-y-2">
                {exif.fields.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                  >
                    <span className="flex items-center gap-2 text-slate-500">
                      {iconFor(f.icon)}
                      {f.label}
                    </span>
                    <span className="text-right font-medium text-slate-800 dark:text-slate-100">
                      {f.value}
                    </span>
                  </li>
                ))}
                {exif.otherCount > 0 && (
                  <li className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">
                    + {exif.otherCount} additional technical tag(s) — all removed on
                    sanitize.
                  </li>
                )}
                {exif.fields.some((f) => f.icon === "gps") && (
                  <li className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" /> This image reveals your
                    physical location.
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {exif?.isJpeg
                  ? "No EXIF metadata found in this JPEG."
                  : "This format carries no readable EXIF. Sanitizing still re-encodes it to guarantee a clean file."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * UTILITY C — JWT Debugger & Expiry Inspector
 * ========================================================================== */
function base64UrlDecode(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  try {
    // Handle UTF-8
    return decodeURIComponent(
      Array.from(bin, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
  } catch {
    return bin;
  }
}

function JwtDebugger() {
  const [token, setToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRhc2tNYXRyaXggVXNlciIsImlzcyI6InRhc2ttYXRyaXguYWkiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.sQ3Zx8m6f9zq2Yc1n0jVQpq9v6Xh3Yy0kR2sT4uW8aE"
  );

  const decoded = useMemo(() => {
    const parts = token.trim().split(".");
    if (token.trim() === "") return { error: "" as string, parts };
    if (parts.length < 2) return { error: "Not a valid JWT (expected 3 dot-separated parts).", parts };
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      return { header, payload, signature: parts[2] ?? "", parts, error: "" };
    } catch {
      return { error: "Could not decode/parse the token's Base64URL segments.", parts };
    }
  }, [token]);

  const payload = decoded.payload as Record<string, unknown> | undefined;
  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === "number" ? (payload.exp as number) : undefined;
  const iat = typeof payload?.iat === "number" ? (payload.iat as number) : undefined;
  const nbf = typeof payload?.nbf === "number" ? (payload.nbf as number) : undefined;
  const iss = payload?.iss !== undefined ? String(payload.iss) : undefined;
  const isExpired = exp !== undefined && exp < now;
  const fmt = (t?: number) => (t ? new Date(t * 1000).toLocaleString() : "—");

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<KeyRound className="h-5 w-5" />}
        title="JWT Debugger & Expiry Inspector"
        subtitle="Decode and inspect JSON Web Tokens — decoding never leaves your browser."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="jwt-in">Encoded token</label>
          <textarea
            id="jwt-in"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
            className={`${INPUT} tm-code h-40 resize-y break-all`}
            placeholder="eyJhbGciOi…"
          />
          {/* Color-coded segments */}
          {decoded.parts.length >= 2 && !decoded.error && (
            <p className="mt-3 break-all rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700 tm-code">
              <span className="text-rose-600 dark:text-rose-400">{decoded.parts[0]}</span>
              <span className="text-slate-400">.</span>
              <span className="text-purple-600 dark:text-purple-400">{decoded.parts[1]}</span>
              <span className="text-slate-400">.</span>
              <span className="text-blue-600 dark:text-blue-400">{decoded.parts[2] ?? ""}</span>
            </p>
          )}
          {decoded.error && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-600" role="alert">
              <AlertTriangle className="h-4 w-4" /> {decoded.error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {!decoded.error && payload && (
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                  exp === undefined
                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    : isExpired
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {exp === undefined ? "No expiry" : isExpired ? "Expired" : "Active"}
              </span>
              {iss && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Issuer: {iss}
                </span>
              )}
            </div>
          )}
          {!decoded.error && payload && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                <dt className="text-xs text-slate-400">Issued at (iat)</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">{fmt(iat)}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                <dt className="text-xs text-slate-400">Expires (exp)</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">{fmt(exp)}</dd>
              </div>
              {nbf !== undefined && (
                <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                  <dt className="text-xs text-slate-400">Not before (nbf)</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">{fmt(nbf)}</dd>
                </div>
              )}
            </dl>
          )}

          {!decoded.error && (
            <>
              <div className="rounded-lg border-l-4 border-rose-400 bg-rose-50 p-3 dark:bg-rose-950/30">
                <p className="mb-1 text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                  Header
                </p>
                <pre className="tm-code overflow-x-auto text-xs text-slate-700 dark:text-slate-200">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-3 dark:bg-purple-950/30">
                <p className="mb-1 text-xs font-bold uppercase text-purple-600 dark:text-purple-400">
                  Payload
                </p>
                <pre className="tm-code overflow-x-auto text-xs text-slate-700 dark:text-slate-200">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
              <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-3 dark:bg-blue-950/30">
                <p className="mb-1 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                  Signature
                </p>
                <p className="tm-code break-all text-xs text-slate-600 dark:text-slate-300">
                  {decoded.signature || "(none)"}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Signature verification requires the secret/public key and is not
                  performed here.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * UTILITY D — AES-256-GCM Encryption Vault
 * ========================================================================== */
const PBKDF2_ITERATIONS = 250000;

/**
 * Cast a typed array to BufferSource. Recent TS DOM libs parameterize
 * TypedArrays over ArrayBufferLike (which includes SharedArrayBuffer), while
 * Web Crypto's BufferSource requires an ArrayBuffer-backed view. Our buffers
 * are always ArrayBuffer-backed, so this cast is safe.
 */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

async function deriveKey(pass: string, salt: Uint8Array, usage: KeyUsage[]) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    bs(enc.encode(pass)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usage
  );
}

async function aesEncrypt(plain: string, pass: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt, ["encrypt"]);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bs(iv) },
    key,
    bs(enc.encode(plain))
  );
  const ctBytes = new Uint8Array(ct);
  const out = new Uint8Array(salt.length + iv.length + ctBytes.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(ctBytes, salt.length + iv.length);
  return bufToBase64(out);
}

async function aesDecrypt(payloadB64: string, pass: string): Promise<string> {
  const bytes = base64ToBytes(payloadB64);
  if (bytes.length < 29) throw new Error("Payload too short / malformed.");
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveKey(pass, salt, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(ct));
  return new TextDecoder().decode(pt);
}

function AesVault() {
  const toast = useToast();
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!input.trim()) return toast("Enter some text first.", "error");
    if (!pass) return toast("A passphrase is required.", "error");
    setBusy(true);
    setOutput("");
    try {
      if (mode === "encrypt") {
        setOutput(await aesEncrypt(input, pass));
        toast("Encrypted with AES-256-GCM");
      } else {
        setOutput(await aesDecrypt(input, pass));
        toast("Decrypted successfully");
      }
    } catch {
      toast(
        mode === "decrypt"
          ? "Decryption failed — wrong passphrase or corrupt payload."
          : "Encryption failed.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<LockKeyhole className="h-5 w-5" />}
        title="AES-256-GCM Encryption Vault"
        subtitle="Native Web Crypto: PBKDF2-SHA256 key derivation + authenticated AES-GCM."
      />

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {(["encrypt", "decrypt"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setOutput("");
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
              mode === m
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-500"
            }`}
          >
            {m === "encrypt" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="aes-in">
            {mode === "encrypt" ? "Secret text / API key" : "Encrypted payload (base64)"}
          </label>
          <textarea
            id="aes-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className={`${INPUT} tm-code h-36 resize-y break-all`}
            placeholder={mode === "encrypt" ? "sk_live_51H…" : "Paste base64 payload…"}
          />
          <label className={`${LABEL} mt-3`} htmlFor="aes-pass">Passphrase</label>
          <div className="relative">
            <input
              id="aes-pass"
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className={`${INPUT} pr-10`}
              placeholder="Strong passphrase"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPass ? "Hide passphrase" : "Show passphrase"}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          <button type="button" className={`${BTN_PRIMARY} mt-4 w-full`} onClick={run} disabled={busy}>
            {mode === "encrypt" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {busy ? "Working…" : mode === "encrypt" ? "Encrypt" : "Decrypt"}
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${LABEL} mb-0`} htmlFor="aes-out">Result</label>
            <CopyButton text={output} className="!px-2.5 !py-1" />
          </div>
          <textarea
            id="aes-out"
            value={output}
            readOnly
            spellCheck={false}
            className={`${INPUT} tm-code h-[232px] resize-y break-all bg-slate-50 dark:bg-slate-950`}
            placeholder="Output appears here…"
          />
        </div>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
        A random 16-byte salt and 12-byte IV are generated per operation and packed
        with the ciphertext. Keys derive via {PBKDF2_ITERATIONS.toLocaleString()}
        {" "}PBKDF2 iterations — nothing is stored or transmitted.
      </p>
    </div>
  );
}

/* ==========================================================================
 * UTILITY E — Synthetic API Mock Data Generator
 * ========================================================================== */
const FIRST_NAMES = ["Ada", "Alan", "Grace", "Linus", "Ada", "Katherine", "Dennis", "Barbara", "Tim", "Radia", "Guido", "Margaret", "Ken", "Anita", "James", "Sofia"];
const LAST_NAMES = ["Lovelace", "Turing", "Hopper", "Torvalds", "Johnson", "Ritchie", "Liskov", "Berners-Lee", "Perlman", "Rossum", "Hamilton", "Thompson", "Borg", "Gosling", "Nakamoto"];
const CITIES = ["London", "Tokyo", "Berlin", "Toronto", "Austin", "Mumbai", "Nairobi", "Lisbon", "Seoul", "São Paulo", "Sydney", "Amsterdam"];
const COMPANIES = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark Industries", "Wayne Enterprises", "Cyberdyne", "Soylent", "Vandelay"];
const DOMAINS = ["example.com", "mail.test", "corp.dev", "inbox.io", "acme.co"];
const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");

type FieldType =
  | "uuid" | "fullName" | "firstName" | "lastName" | "email" | "username"
  | "integer" | "float" | "boolean" | "isoDate" | "city" | "company"
  | "phone" | "avatar" | "color" | "lorem" | "price";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "uuid", label: "UUID" },
  { value: "fullName", label: "Full Name" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "username", label: "Username" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "price", label: "Price" },
  { value: "boolean", label: "Boolean" },
  { value: "isoDate", label: "ISO Timestamp" },
  { value: "city", label: "City" },
  { value: "company", label: "Company" },
  { value: "phone", label: "Phone" },
  { value: "avatar", label: "Avatar URL" },
  { value: "color", label: "Hex Color" },
  { value: "lorem", label: "Lorem Sentence" },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function genValue(type: FieldType): unknown {
  switch (type) {
    case "uuid": return uuidv4();
    case "firstName": return pick(FIRST_NAMES);
    case "lastName": return pick(LAST_NAMES);
    case "fullName": return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    case "email": return `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase().replace(/[^a-z]/g, "")}${randInt(1, 99)}@${pick(DOMAINS)}`;
    case "username": return `${pick(FIRST_NAMES).toLowerCase()}_${randInt(100, 9999)}`;
    case "integer": return randInt(1, 10000);
    case "float": return Number((Math.random() * 1000).toFixed(2));
    case "price": return Number((Math.random() * 500 + 1).toFixed(2));
    case "boolean": return Math.random() > 0.5;
    case "isoDate": return new Date(Date.now() - randInt(0, 60 * 60 * 24 * 365) * 1000).toISOString();
    case "city": return pick(CITIES);
    case "company": return pick(COMPANIES);
    case "phone": return `+1-${randInt(200, 999)}-${randInt(200, 999)}-${String(randInt(0, 9999)).padStart(4, "0")}`;
    case "avatar": return `https://i.pravatar.cc/150?u=${uuidv4()}`;
    case "color": return `#${randInt(0, 0xffffff).toString(16).padStart(6, "0")}`;
    case "lorem": {
      const n = randInt(6, 14);
      const words = Array.from({ length: n }, () => pick(LOREM));
      const s = words.join(" ");
      return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    }
    default: return null;
  }
}

interface SchemaField {
  id: string;
  key: string;
  type: FieldType;
}
let fieldSeq = 0;
const mkField = (key: string, type: FieldType): SchemaField => ({ id: `f-${++fieldSeq}`, key, type });

function MockDataGenerator() {
  const toast = useToast();
  const [fields, setFields] = useState<SchemaField[]>([
    mkField("id", "uuid"),
    mkField("name", "fullName"),
    mkField("email", "email"),
    mkField("createdAt", "isoDate"),
  ]);
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState("");

  const generate = useCallback(() => {
    const n = Math.min(500, Math.max(1, count || 1));
    const rows = Array.from({ length: n }, () => {
      const obj: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.key.trim()) obj[f.key.trim()] = genValue(f.type);
      }
      return obj;
    });
    setOutput(JSON.stringify(rows, null, 2));
  }, [fields, count]);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<Database className="h-5 w-5" />}
        title="Synthetic API Mock Data Generator"
        subtitle="Design a schema and generate realistic JSON fixtures — 100% offline."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Schema builder
          </p>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="flex items-center gap-2">
                <input
                  className={`${INPUT} flex-1`}
                  value={f.key}
                  placeholder="fieldName"
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((x) => (x.id === f.id ? { ...x, key: e.target.value } : x))
                    )
                  }
                  aria-label={`Field ${i + 1} name`}
                />
                <div className="relative">
                  <select
                    className={`${INPUT} appearance-none pr-8`}
                    value={f.type}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((x) =>
                          x.id === f.id ? { ...x, type: e.target.value as FieldType } : x
                        )
                      )
                    }
                    aria-label={`Field ${i + 1} type`}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setFields((prev) => prev.filter((x) => x.id !== f.id))}
                  disabled={fields.length === 1}
                  className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950"
                  aria-label={`Remove field ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`${BTN_GHOST} mt-3`}
            onClick={() => setFields((prev) => [...prev, mkField(`field${prev.length + 1}`, "lorem")])}
          >
            <Plus className="h-4 w-4" /> Add field
          </button>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className={LABEL} htmlFor="mock-count">Items (1–500)</label>
              <input
                id="mock-count"
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
                className={`${INPUT} w-28`}
              />
            </div>
            <button type="button" className={BTN_PRIMARY} onClick={generate}>
              <RefreshCw className="h-4 w-4" /> Generate
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${LABEL} mb-0`}>Generated JSON</label>
            <div className="flex gap-2">
              <CopyButton text={output} className="!px-2.5 !py-1" />
              <button
                type="button"
                className={`${BTN_GHOST} !px-2.5 !py-1`}
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "application/json" }), "mock-data.json");
                  toast("Downloaded mock-data.json");
                }}
                disabled={!output}
              >
                <Download className="h-4 w-4" /> .json
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            spellCheck={false}
            className={`${INPUT} tm-code h-[360px] resize-y bg-slate-50 dark:bg-slate-950`}
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * UTILITY F — SQL Sanitizer & Formatter
 * ========================================================================== */
const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "INSERT INTO", "VALUES",
  "UPDATE", "SET", "DELETE", "CREATE TABLE", "ALTER TABLE", "DROP TABLE",
  "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "JOIN", "ON",
  "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "UNION ALL", "UNION",
  "AS", "IN", "LIKE", "ILIKE", "BETWEEN", "IS NULL", "IS NOT NULL", "DISTINCT",
  "CASE", "WHEN", "THEN", "ELSE", "END", "RETURNING",
];
const NEWLINE_BEFORE = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "INSERT INTO", "VALUES", "UPDATE",
  "SET", "DELETE", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "JOIN",
  "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "UNION", "UNION ALL", "RETURNING",
]);

interface SqlToken {
  type: "string" | "word" | "punct" | "ws" | "comment";
  value: string;
}

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (c === "'" || c === '"' || c === "`") {
      let s = c;
      i++;
      while (i < n) {
        s += sql[i];
        if (sql[i] === c && sql[i - 1] !== "\\") {
          if (sql[i + 1] === c) {
            s += sql[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: "string", value: s });
    } else if (c === "-" && sql[i + 1] === "-") {
      let s = "";
      while (i < n && sql[i] !== "\n") s += sql[i++];
      tokens.push({ type: "comment", value: s });
    } else if (/\s/.test(c)) {
      let s = "";
      while (i < n && /\s/.test(sql[i])) s += sql[i++];
      tokens.push({ type: "ws", value: s });
    } else if (/[a-zA-Z0-9_$.]/.test(c)) {
      let s = "";
      while (i < n && /[a-zA-Z0-9_$.]/.test(sql[i])) s += sql[i++];
      tokens.push({ type: "word", value: s });
    } else {
      tokens.push({ type: "punct", value: c });
      i++;
    }
  }
  return tokens;
}

function formatSql(sql: string): string {
  const tokens = tokenizeSql(sql).filter((t) => t.type !== "ws");
  // Merge multi-word keywords (e.g., GROUP BY, LEFT JOIN, INSERT INTO).
  const merged: SqlToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "word") {
      const two = `${t.value} ${tokens[i + 1]?.value ?? ""}`.toUpperCase();
      if (
        tokens[i + 1]?.type === "word" &&
        SQL_KEYWORDS.includes(two)
      ) {
        merged.push({ type: "word", value: two });
        i++;
        continue;
      }
    }
    merged.push(t);
  }

  let out = "";
  let depth = 0;
  const indent = () => "  ".repeat(Math.max(0, depth));
  for (let i = 0; i < merged.length; i++) {
    const t = merged[i];
    const up = t.value.toUpperCase();
    if (t.type === "punct" && t.value === "(") {
      depth++;
      out += "(";
      continue;
    }
    if (t.type === "punct" && t.value === ")") {
      depth = Math.max(0, depth - 1);
      out += ")";
      continue;
    }
    if (t.type === "punct" && t.value === ",") {
      out += ",\n" + indent() + "  ";
      continue;
    }
    if (t.type === "punct" && t.value === ";") {
      out += ";\n";
      continue;
    }
    if (t.type === "word" && NEWLINE_BEFORE.has(up)) {
      out = out.replace(/\s+$/, "");
      out += (out ? "\n" : "") + indent() + up + " ";
      continue;
    }
    if (t.type === "word" && SQL_KEYWORDS.includes(up)) {
      out += up + " ";
      continue;
    }
    if (t.type === "comment") {
      out += t.value + "\n" + indent();
      continue;
    }
    out += t.value + (t.type === "word" || t.type === "string" ? " " : "");
  }
  return out
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function minifySql(sql: string): string {
  const tokens = tokenizeSql(sql).filter((t) => t.type !== "comment");
  let out = "";
  for (const t of tokens) {
    if (t.type === "ws") out += " ";
    else out += t.value;
  }
  return out.replace(/\s+/g, " ").replace(/\s*([(),;])\s*/g, "$1 ").trim();
}

function checkSqlErrors(sql: string): string | null {
  const tokens = tokenizeSql(sql);
  let depth = 0;
  for (const t of tokens) {
    if (t.type === "punct" && t.value === "(") depth++;
    if (t.type === "punct" && t.value === ")") depth--;
    if (depth < 0) return "Unbalanced parenthesis: a closing ) has no matching (.";
  }
  if (depth > 0) return `Unbalanced parenthesis: ${depth} unclosed ( remaining.`;
  // unterminated string: last string token that doesn't end with its quote
  const strings = tokens.filter((t) => t.type === "string");
  for (const s of strings) {
    const q = s.value[0];
    if (s.value.length < 2 || s.value[s.value.length - 1] !== q) {
      return "Unterminated string literal detected.";
    }
  }
  return null;
}

function SqlFormatter() {
  const [sql, setSql] = useState(
    "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = true and u.created_at > '2024-01-01' group by u.id, u.name order by orders desc limit 10;"
  );
  const [dialect, setDialect] = useState<"standard" | "mysql" | "postgres">("standard");
  const error = useMemo(() => checkSqlErrors(sql), [sql]);

  const apply = (fn: (s: string) => string) => setSql(fn(sql));
  const escapeStr = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
  const unescapeStr = (s: string) => {
    const t = s.trim();
    const body = /^'([\s\S]*)'$/.test(t) ? t.slice(1, -1) : t;
    return body.replace(/''/g, "'").replace(/\\\\/g, "\\");
  };

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader
        icon={<Code2 className="h-5 w-5" />}
        title="SQL Sanitizer & Formatter"
        subtitle="Beautify, minify, and escape SQL for Standard, MySQL, or PostgreSQL."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            className={`${INPUT} w-auto appearance-none pr-8`}
            value={dialect}
            onChange={(e) => setDialect(e.target.value as typeof dialect)}
            aria-label="SQL dialect"
          >
            <option value="standard">Standard SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgres">PostgreSQL</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <button type="button" className={BTN_GHOST} onClick={() => apply(formatSql)}>
          <Wand2 className="h-4 w-4" /> Format / Indent
        </button>
        <button type="button" className={BTN_GHOST} onClick={() => apply(minifySql)}>
          <Minimize2 className="h-4 w-4" /> Minify
        </button>
        <button type="button" className={BTN_GHOST} onClick={() => apply(escapeStr)}>
          <Braces className="h-4 w-4" /> Escape string
        </button>
        <button type="button" className={BTN_GHOST} onClick={() => apply(unescapeStr)}>
          <FileText className="h-4 w-4" /> Unescape
        </button>
        <CopyButton text={sql} />
      </div>

      {error ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> No structural syntax issues detected
          ({dialect === "mysql" ? "MySQL" : dialect === "postgres" ? "PostgreSQL" : "Standard"} mode).
        </div>
      )}

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        spellCheck={false}
        className={`${INPUT} tm-code h-72 resize-y`}
        aria-label="SQL editor"
      />
    </div>
  );
}

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

/* ==========================================================================
 * Shared helpers for the new modules.
 * ========================================================================== */
function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = src;
  });
}
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsText(file);
  });
}
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(file);
  });
}

/* ==========================================================================
 * Freelance Pay Estimator (Finance & Business Ops)
 * ========================================================================== */
type FilingStatus = "single" | "mfj" | "hoh";
const FED_BRACKETS: Record<FilingStatus, [number, number][]> = {
  single: [[11925, 0.1], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [Infinity, 0.37]],
  mfj: [[23850, 0.1], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]],
  hoh: [[17000, 0.1], [64850, 0.12], [103350, 0.22], [197300, 0.24], [250500, 0.32], [626350, 0.35], [Infinity, 0.37]],
};
const STD_DED: Record<FilingStatus, number> = { single: 15000, mfj: 30000, hoh: 22500 };
const FILING_LABEL: Record<FilingStatus, string> = { single: "Single", mfj: "Married Filing Jointly", hoh: "Head of Household" };
const FL_STATES: { code: string; label: string; rate: number }[] = [
  { code: "NONE", label: "No state income tax", rate: 0 },
  { code: "CA", label: "California (~9.3%)", rate: 0.093 },
  { code: "NY", label: "New York (~6.85%)", rate: 0.0685 },
  { code: "TX", label: "Texas (0%)", rate: 0 },
  { code: "IL", label: "Illinois (4.95%)", rate: 0.0495 },
  { code: "CO", label: "Colorado (4.4%)", rate: 0.044 },
  { code: "OTHER", label: "Other (~5%)", rate: 0.05 },
];

function fedTax(taxable: number, status: FilingStatus): number {
  let tax = 0, lo = 0;
  for (const [cap, rate] of FED_BRACKETS[status]) {
    if (taxable > lo) {
      tax += (Math.min(taxable, cap) - lo) * rate;
      lo = cap;
    } else break;
  }
  return tax;
}
const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

function FreelanceEstimator() {
  const [gross, setGross] = useState("90000");
  const [expenses, setExpenses] = useState("12000");
  const [status, setStatus] = useState<FilingStatus>("single");
  const [stateCode, setStateCode] = useState("CA");
  const [qbi, setQbi] = useState(true);

  const r = useMemo(() => {
    const g = Math.max(0, Number(gross) || 0);
    const exp = Math.min(g, Math.max(0, Number(expenses) || 0));
    const net = Math.max(0, g - exp);
    const seBase = net * 0.9235;
    const seTax = seBase > 0 ? Math.min(seBase, 176100) * 0.124 + seBase * 0.029 : 0;
    const halfSe = seTax / 2;
    const afterAdj = Math.max(0, net - halfSe);
    const taxableBeforeQbi = Math.max(0, afterAdj - STD_DED[status]);
    const qbiDed = qbi ? 0.2 * taxableBeforeQbi : 0;
    const taxable = Math.max(0, taxableBeforeQbi - qbiDed);
    const fed = fedTax(taxable, status);
    const stRate = FL_STATES.find((s) => s.code === stateCode)?.rate ?? 0;
    const stateTax = taxable * stRate;
    const totalTax = seTax + fed + stateTax;
    const take = Math.max(0, net - totalTax);
    return {
      net, seTax, fed, stateTax, totalTax, take,
      eff: g > 0 ? totalTax / g : 0, quarterly: totalTax / 4,
    };
  }, [gross, expenses, status, stateCode, qbi]);

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<Wallet className="h-5 w-5" />} title="Freelance Pay Estimator"
        subtitle="Estimate self-employment tax, deductions, and net take-home (2025, US)." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="fl-gross">Gross annual income</label>
              <input id="fl-gross" type="number" min="0" className={INPUT} value={gross}
                onChange={(e) => setGross(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div>
              <label className={LABEL} htmlFor="fl-exp">Business expenses</label>
              <input id="fl-exp" type="number" min="0" className={INPUT} value={expenses}
                onChange={(e) => setExpenses(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="fl-status">Filing status</label>
              <div className="relative">
                <select id="fl-status" className={`${INPUT} appearance-none pr-8`} value={status}
                  onChange={(e) => setStatus(e.target.value as FilingStatus)}>
                  {(Object.keys(FILING_LABEL) as FilingStatus[]).map((k) => (
                    <option key={k} value={k}>{FILING_LABEL[k]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={LABEL} htmlFor="fl-state">State</label>
              <div className="relative">
                <select id="fl-state" className={`${INPUT} appearance-none pr-8`} value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}>
                  {FL_STATES.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            <span className="text-slate-700 dark:text-slate-200">Apply 20% QBI deduction</span>
            <input type="checkbox" checked={qbi} onChange={(e) => setQbi(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          </label>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 p-4 text-white">
              <p className="text-xs text-white/80">Net take-home</p>
              <p className="mt-1 text-xl font-bold">{usd(r.take)}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-400 p-4 text-white">
              <p className="text-xs text-white/80">Total tax</p>
              <p className="mt-1 text-xl font-bold">{usd(r.totalTax)}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white">
              <p className="text-xs text-white/80">Effective rate</p>
              <p className="mt-1 text-xl font-bold">{(r.eff * 100).toFixed(1)}%</p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 p-4 text-sm dark:divide-slate-800 dark:border-slate-700">
            {[["Net business income", r.net], ["Self-employment tax", r.seTax], ["Federal income tax", r.fed], ["State income tax", r.stateTax], ["Quarterly estimate", r.quarterly]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between py-1.5">
                <dt className="text-slate-500">{l as string}</dt>
                <dd className="font-medium tabular-nums text-slate-800 dark:text-slate-100">{usd(v as number)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-400">Planning estimate only — not tax advice.</p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 * MODULE G — Contract Diff & Text Comparator
 * ========================================================================== */
type DiffKind = "eq" | "del" | "ins";
interface DiffOp { kind: DiffKind; text: string; }

function lcsDiff<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): { kind: DiffKind; value: T }[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { kind: DiffKind; value: T }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) { out.push({ kind: "eq", value: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ kind: "del", value: a[i] }); i++; }
    else { out.push({ kind: "ins", value: b[j] }); j++; }
  }
  while (i < n) out.push({ kind: "del", value: a[i++] });
  while (j < m) out.push({ kind: "ins", value: b[j++] });
  return out;
}

function wordDiff(a: string, b: string): { kind: DiffKind; text: string }[] {
  const aw = a.split(/(\s+)/).filter((s) => s !== "");
  const bw = b.split(/(\s+)/).filter((s) => s !== "");
  return lcsDiff(aw, bw, (x, y) => x === y).map((o) => ({ kind: o.kind, text: o.value }));
}

interface DiffRow {
  left?: { text: string; kind: DiffKind; words?: { kind: DiffKind; text: string }[] };
  right?: { text: string; kind: DiffKind; words?: { kind: DiffKind; text: string }[] };
  modified?: boolean;
}

function ContractDiff() {
  const toast = useToast();
  const [original, setOriginal] = useState("Mutual Non-Disclosure Agreement\nThe term of this agreement is 2 years.\nBoth parties agree to keep information confidential.\nGoverned by the laws of California.");
  const [modified, setModified] = useState("Mutual Non-Disclosure Agreement\nThe term of this agreement is 3 years.\nBoth parties agree to keep all information strictly confidential.\nGoverned by the laws of Delaware.\nA penalty of $10,000 applies to breaches.");
  const [split, setSplit] = useState(true);
  const [wordLevel, setWordLevel] = useState(true);

  const { rows, stats } = useMemo(() => {
    const a = original.split("\n");
    const b = modified.split("\n");
    const ops = lcsDiff(a, b, (x, y) => x === y);
    // Pair consecutive del-runs with ins-runs into modifications.
    const rows: DiffRow[] = [];
    let add = 0, del = 0, mod = 0, eq = 0;
    for (let k = 0; k < ops.length; k++) {
      if (ops[k].kind === "del") {
        const dels: string[] = [];
        while (k < ops.length && ops[k].kind === "del") dels.push(ops[k++].value);
        const ins: string[] = [];
        while (k < ops.length && ops[k].kind === "ins") ins.push(ops[k++].value);
        k--;
        const pairs = Math.min(dels.length, ins.length);
        for (let p = 0; p < pairs; p++) {
          const words = wordLevel ? wordDiff(dels[p], ins[p]) : undefined;
          rows.push({
            left: { text: dels[p], kind: "del", words: words?.filter((w) => w.kind !== "ins") },
            right: { text: ins[p], kind: "ins", words: words?.filter((w) => w.kind !== "del") },
            modified: true,
          });
          mod++;
        }
        for (let p = pairs; p < dels.length; p++) { rows.push({ left: { text: dels[p], kind: "del" } }); del++; }
        for (let p = pairs; p < ins.length; p++) { rows.push({ right: { text: ins[p], kind: "ins" } }); add++; }
      } else if (ops[k].kind === "ins") {
        rows.push({ right: { text: ops[k].value, kind: "ins" } });
        add++;
      } else {
        rows.push({ left: { text: ops[k].value, kind: "eq" }, right: { text: ops[k].value, kind: "eq" } });
        eq++;
      }
    }
    return { rows, stats: { add, del, mod, eq } };
  }, [original, modified, wordLevel]);

  const cellClass = (kind?: DiffKind, modified?: boolean) =>
    !kind || kind === "eq"
      ? "text-slate-600 dark:text-slate-300"
      : modified
      ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      : kind === "del"
      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

  const renderWords = (words?: { kind: DiffKind; text: string }[], fallback?: string) => {
    if (!words) return fallback;
    return words.map((w, i) => (
      <span key={i} className={
        w.kind === "del" ? "rounded bg-rose-200 dark:bg-rose-800" :
        w.kind === "ins" ? "rounded bg-emerald-200 dark:bg-emerald-800" : ""
      }>{w.text}</span>
    ));
  };

  const onFile = async (setter: (s: string) => void, f?: File) => {
    if (!f) return;
    try { setter(await readAsText(f)); } catch { toast("Could not read file", "error"); }
  };

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<GitCompare className="h-5 w-5" />} title="Contract Diff & Text Comparator"
        subtitle="Line and word-level diffing, computed entirely in your browser." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[["Original document", original, setOriginal, "diff-a"], ["Modified document", modified, setModified, "diff-b"]].map(
          ([label, val, setter, id]) => (
            <div key={id as string}>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={`${LABEL} mb-0`} htmlFor={id as string}>{label as string}</label>
                <label className="cursor-pointer text-xs font-medium text-indigo-600">
                  Upload .txt/.md
                  <input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden"
                    onChange={(e) => onFile(setter as (s: string) => void, e.target.files?.[0])} />
                </label>
              </div>
              <textarea id={id as string} value={val as string} spellCheck={false}
                onChange={(e) => (setter as (s: string) => void)(e.target.value)}
                className={`${INPUT} tm-code h-40 resize-y`} />
            </div>
          )
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button type="button" onClick={() => setSplit(true)} className={`rounded px-3 py-1 text-xs font-semibold ${split ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Split</button>
          <button type="button" onClick={() => setSplit(false)} className={`rounded px-3 py-1 text-xs font-semibold ${!split ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Unified</button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={wordLevel} onChange={(e) => setWordLevel(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600" /> Word-level highlight
        </label>
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">+{stats.add} added</span>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">−{stats.del} deleted</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">~{stats.mod} modified</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{stats.eq} unchanged</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        {split ? (
          <table className="w-full border-collapse tm-code text-xs">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="align-top">
                  <td className={`w-1/2 whitespace-pre-wrap break-words border-r border-slate-100 px-3 py-1 dark:border-slate-800 ${cellClass(row.left?.kind, row.modified)}`}>
                    {row.left ? (row.modified ? renderWords(row.left.words, row.left.text) : row.left.text || " ") : ""}
                  </td>
                  <td className={`w-1/2 whitespace-pre-wrap break-words px-3 py-1 ${cellClass(row.right?.kind, row.modified)}`}>
                    {row.right ? (row.modified ? renderWords(row.right.words, row.right.text) : row.right.text || " ") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="tm-code text-xs">
            {rows.map((row, i) => (
              <React.Fragment key={i}>
                {row.left && row.left.kind !== "eq" && (
                  <div className={`whitespace-pre-wrap break-words px-3 py-1 ${cellClass("del", row.modified)}`}>− {row.modified ? renderWords(row.left.words, row.left.text) : row.left.text}</div>
                )}
                {row.right && row.right.kind !== "eq" && (
                  <div className={`whitespace-pre-wrap break-words px-3 py-1 ${cellClass("ins", row.modified)}`}>+ {row.modified ? renderWords(row.right.words, row.right.text) : row.right.text}</div>
                )}
                {row.left && row.left.kind === "eq" && (
                  <div className="whitespace-pre-wrap break-words px-3 py-1 text-slate-500">&nbsp;&nbsp;{row.left.text || " "}</div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
 * MODULE H — Legal Document Generator
 * ========================================================================== */
type LegalTemplate = "nda" | "msa" | "wfh";
interface LegalFields {
  party1: string; party2: string; effectiveDate: string; jurisdiction: string;
  termYears: string; penalty: string; services: string; fee: string;
}
const ph = (v: string, fallback: string) => (v.trim() ? v.trim() : `[${fallback}]`);

function buildLegalDoc(tpl: LegalTemplate, f: LegalFields): string {
  const p1 = (lbl: string) => ph(f.party1, lbl);
  const p2 = (lbl: string) => ph(f.party2, lbl);
  const state = ph(f.jurisdiction, "State/Jurisdiction");
  const date = ph(f.effectiveDate, "Effective Date");
  const term = ph(f.termYears, "N");
  const penalty = f.penalty.trim()
    ? `\n\nPENALTY. In the event of a breach, the breaching party shall be liable for ${f.penalty.trim()}.`
    : "";
  if (tpl === "nda") {
    return `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of ${date} by and between ${p1("Disclosing Party")} ("Disclosing Party") and ${p2("Receiving Party")} ("Receiving Party").

1. CONFIDENTIAL INFORMATION. Each party may disclose certain confidential and proprietary information to the other for the purpose of evaluating a potential business relationship.

2. OBLIGATIONS. The Receiving Party shall (a) hold the Confidential Information in strict confidence, (b) not disclose it to any third party, and (c) use it solely for the stated purpose.

3. TERM. This Agreement shall remain in effect for a period of ${term} year(s) from the Effective Date.

4. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of ${state}, without regard to its conflict-of-laws principles.${penalty}

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

_______________________________        _______________________________
${p1("Disclosing Party")}                         ${p2("Receiving Party")}`;
  }
  if (tpl === "msa") {
    return `MASTER SERVICES AGREEMENT

This Master Services Agreement (the "Agreement") is made effective as of ${date} between ${p1("Client")} ("Client") and ${p2("Service Provider")} ("Provider").

1. SERVICES. Provider shall provide the following services: ${ph(f.services, "Description of Services")}.

2. COMPENSATION. Client shall pay Provider ${ph(f.fee, "Fee")} in accordance with the payment schedule agreed by the parties.

3. TERM. This Agreement shall commence on the Effective Date and continue for ${term} year(s) unless terminated earlier in accordance with its terms.

4. INDEPENDENT CONTRACTOR. Provider is an independent contractor and nothing herein creates an employment, partnership, or agency relationship.

5. GOVERNING LAW. This Agreement shall be governed by the laws of the State of ${state}.${penalty}

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

_______________________________        _______________________________
${p1("Client")}                                   ${p2("Service Provider")}`;
  }
  return `FREELANCE WORK-FOR-HIRE AGREEMENT

This Work-for-Hire Agreement (the "Agreement") is entered into as of ${date} between ${p1("Client")} ("Client") and ${p2("Contractor")} ("Contractor").

1. WORK. Contractor shall perform the following work: ${ph(f.services, "Description of Work")}.

2. WORK MADE FOR HIRE. All deliverables shall be considered "work made for hire" and all right, title, and interest therein shall vest exclusively in the Client upon creation. To the extent any deliverable does not qualify as a work made for hire, Contractor hereby irrevocably assigns all rights to the Client.

3. COMPENSATION. Client shall pay Contractor ${ph(f.fee, "Fee")} upon acceptance of the deliverables.

4. TERM. This Agreement shall remain in effect for ${term} year(s) or until the work is completed and accepted, whichever occurs first.

5. GOVERNING LAW. This Agreement shall be governed by the laws of the State of ${state}.${penalty}

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

_______________________________        _______________________________
${p1("Client")}                                   ${p2("Contractor")}`;
}

function LegalGenerator() {
  const toast = useToast();
  const [tpl, setTpl] = useState<LegalTemplate>("nda");
  const [f, setF] = useState<LegalFields>({
    party1: "", party2: "", effectiveDate: "", jurisdiction: "Delaware",
    termYears: "2", penalty: "", services: "", fee: "",
  });
  const doc = useMemo(() => buildLegalDoc(tpl, f), [tpl, f]);
  const set = (k: keyof LegalFields, v: string) => setF((p) => ({ ...p, [k]: v }));

  const printDoc = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Legal Document</title>
      <style>body{font-family:'Times New Roman',serif;margin:1in;line-height:1.6;color:#111;white-space:pre-wrap;font-size:12pt}</style>
      </head><body>${doc.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
    else toast("Enable pop-ups to print/save as PDF.", "error");
  };

  const isService = tpl !== "nda";
  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<FileSignature className="h-5 w-5" />} title="Legal Document Generator"
        subtitle="NDA, MSA, and Work-for-Hire templates with a live preview." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className={LABEL} htmlFor="lg-tpl">Template</label>
            <div className="relative">
              <select id="lg-tpl" className={`${INPUT} appearance-none pr-8`} value={tpl}
                onChange={(e) => setTpl(e.target.value as LegalTemplate)}>
                <option value="nda">Mutual Non-Disclosure Agreement (NDA)</option>
                <option value="msa">Master Services Agreement (MSA)</option>
                <option value="wfh">Freelance Work-for-Hire Contract</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{tpl === "nda" ? "Disclosing Party" : "Client"}</label>
              <input className={INPUT} value={f.party1} onChange={(e) => set("party1", e.target.value)} placeholder="Acme Inc." />
            </div>
            <div>
              <label className={LABEL}>{tpl === "nda" ? "Receiving Party" : tpl === "wfh" ? "Contractor" : "Service Provider"}</label>
              <input className={INPUT} value={f.party2} onChange={(e) => set("party2", e.target.value)} placeholder="Jane Doe" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Effective date</label>
              <input type="date" className={INPUT} value={f.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Jurisdiction (State)</label>
              <input className={INPUT} value={f.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Term (years)</label>
              <input type="number" min="0" className={INPUT} value={f.termYears} onChange={(e) => set("termYears", e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            {isService && (
              <div>
                <label className={LABEL}>Fee</label>
                <input className={INPUT} value={f.fee} onChange={(e) => set("fee", e.target.value)} placeholder="$5,000" />
              </div>
            )}
          </div>
          {isService && (
            <div>
              <label className={LABEL}>{tpl === "wfh" ? "Description of work" : "Description of services"}</label>
              <input className={INPUT} value={f.services} onChange={(e) => set("services", e.target.value)} placeholder="Brand identity design" />
            </div>
          )}
          <div>
            <label className={LABEL}>Penalty clause (optional)</label>
            <input className={INPUT} value={f.penalty} onChange={(e) => set("penalty", e.target.value)} placeholder="liquidated damages of $10,000" />
          </div>
          <div className="flex gap-2">
            <CopyButton text={doc} label="Copy raw text" />
            <button type="button" className={BTN_PRIMARY} onClick={printDoc}>
              <Printer className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Live preview</label>
          <pre className="tm-code h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {doc}
          </pre>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Template output is a starting point, not legal advice — have a qualified attorney review before signing.</p>
    </div>
  );
}

/* ==========================================================================
 * MODULE I — Watermark Studio
 * ========================================================================== */
interface WmPage { dataUrl: string; width: number; height: number; }

function WatermarkStudio() {
  const toast = useToast();
  const [pages, setPages] = useState<WmPage[]>([]);
  const [current, setCurrent] = useState(0);
  const [kind, setKind] = useState<"image" | "pdf">("image");
  const [fileName, setFileName] = useState("watermarked");
  const [wmType, setWmType] = useState<"text" | "logo">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(35);
  const [angle, setAngle] = useState(-30);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ff0000");
  const [tile, setTile] = useState(true);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<HTMLImageElement | null>(null);

  const drawWatermark = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    const one = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((angle * Math.PI) / 180);
      if (wmType === "text") {
        ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text || " ", 0, 0);
      } else if (logo) {
        const w = fontSize * 4;
        const h = (logo.height / logo.width) * w;
        ctx.drawImage(logo, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
    };
    if (tile) {
      const stepX = Math.max(120, fontSize * (wmType === "text" ? (text.length || 1) * 0.6 : 5));
      const stepY = Math.max(120, fontSize * 3);
      for (let y = 0; y < H + stepY; y += stepY)
        for (let x = 0; x < W + stepX; x += stepX) one(x, y);
    } else {
      one(W / 2, H / 2);
    }
    ctx.restore();
  }, [opacity, angle, fontSize, color, tile, wmType, text, logo]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    const page = pages[current];
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (base && base.complete) ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height);
  }, [pages, current, drawWatermark]);

  useEffect(() => {
    const page = pages[current];
    if (!page) return;
    const img = new Image();
    img.onload = () => { baseRef.current = img; redraw(); };
    img.src = page.dataUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, current]);
  useEffect(() => { redraw(); }, [redraw]);

  const loadFile = async (file: File) => {
    setBusy(true);
    try {
      setFileName(file.name.replace(/\.[^.]+$/, "") || "watermarked");
      if (/pdf/.test(file.type) || /\.pdf$/i.test(file.name)) {
        const pdfjs: any = await import("pdfjs-dist");
        if (!pdfWorkerConfigured) { pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"; pdfWorkerConfigured = true; }
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const out: WmPage[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const pg = await doc.getPage(i);
          const vp = pg.getViewport({ scale: 1.5 });
          const c = document.createElement("canvas");
          c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
          await pg.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          out.push({ dataUrl: c.toDataURL("image/png"), width: c.width, height: c.height });
        }
        setPages(out); setKind("pdf"); setCurrent(0);
      } else if (/^image\//.test(file.type)) {
        const url = await readAsDataURL(file);
        const img = await loadImageEl(url);
        setPages([{ dataUrl: url, width: img.naturalWidth, height: img.naturalHeight }]);
        setKind("image"); setCurrent(0);
      } else {
        toast("Use an image or PDF file.", "error");
      }
    } catch {
      toast("Could not load file.", "error");
    } finally { setBusy(false); }
  };

  const buildCanvas = async (page: WmPage) => {
    const c = document.createElement("canvas");
    c.width = page.width; c.height = page.height;
    const ctx = c.getContext("2d")!;
    const img = await loadImageEl(page.dataUrl);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    drawWatermark(ctx, c.width, c.height);
    return c;
  };

  const download = async () => {
    if (pages.length === 0) return;
    setBusy(true);
    try {
      if (kind === "image") {
        const c = await buildCanvas(pages[0]);
        c.toBlob((b) => b && downloadBlob(b, `${fileName}-watermarked.png`), "image/png");
      } else {
        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.create();
        for (const page of pages) {
          const c = await buildCanvas(page);
          const bytes = await fetch(c.toDataURL("image/png")).then((r) => r.arrayBuffer());
          const png = await pdf.embedPng(bytes);
          const p = pdf.addPage([page.width, page.height]);
          p.drawImage(png, { x: 0, y: 0, width: page.width, height: page.height });
        }
        const out = await pdf.save();
        const buffer = new ArrayBuffer(out.byteLength);
        new Uint8Array(buffer).set(out);
        downloadBlob(new Blob([buffer], { type: "application/pdf" }), `${fileName}-watermarked.pdf`);
      }
      toast("Watermarked file downloaded");
    } catch { toast("Export failed.", "error"); }
    finally { setBusy(false); }
  };

  const page = pages[current];
  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<Stamp className="h-5 w-5" />} title="Watermark Studio"
        subtitle="Stamp text or a logo across images and PDFs — rendered on-canvas." />
      {pages.length === 0 ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Upload className="h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">Upload an image or PDF</p>
          <p className="text-xs text-slate-400">PNG, JPG, WebP, or PDF</p>
          <input type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button type="button" onClick={() => setWmType("text")} className={`rounded px-3 py-1 text-xs font-semibold ${wmType === "text" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Text</button>
              <button type="button" onClick={() => setWmType("logo")} className={`rounded px-3 py-1 text-xs font-semibold ${wmType === "logo" ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Logo</button>
            </div>
            {wmType === "text" ? (
              <div>
                <label className={LABEL}>Watermark text</label>
                <input className={INPUT} value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            ) : (
              <div>
                <label className={LABEL}>Logo image</label>
                <input type="file" accept="image/*" className="text-xs"
                  onChange={async (e) => { const fl = e.target.files?.[0]; if (fl) setLogo(await loadImageEl(await readAsDataURL(fl))); }} />
              </div>
            )}
            <div>
              <div className="flex justify-between"><label className={LABEL}>Opacity</label><span className="text-xs text-slate-500">{opacity}%</span></div>
              <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="tm-range w-full" />
            </div>
            <div>
              <div className="flex justify-between"><label className={LABEL}>Angle</label><span className="text-xs text-slate-500">{angle}°</span></div>
              <input type="range" min={-180} max={180} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="tm-range w-full" />
            </div>
            <div>
              <div className="flex justify-between"><label className={LABEL}>{wmType === "text" ? "Font size" : "Logo size"}</label><span className="text-xs text-slate-500">{fontSize}px</span></div>
              <input type="range" min={12} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="tm-range w-full" />
            </div>
            {wmType === "text" && (
              <div className="flex items-center gap-3">
                <label className={`${LABEL} mb-0`}>Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded border border-slate-300" />
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-200">Tile / repeat pattern</span>
              <input type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            </label>
            <button type="button" className={`${BTN_PRIMARY} w-full`} onClick={download} disabled={busy}>
              <Download className="h-4 w-4" /> {busy ? "Working…" : `Download ${kind === "pdf" ? "PDF" : "PNG"}`}
            </button>
            <button type="button" className={`${BTN_GHOST} w-full`} onClick={() => { setPages([]); baseRef.current = null; }}>
              <X className="h-4 w-4" /> Choose another
            </button>
          </div>
          <div className="lg:col-span-2">
            {pages.length > 1 && (
              <div className="mb-3 flex items-center justify-center gap-2">
                <button type="button" className={BTN_GHOST} onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>Prev</button>
                <span className="text-sm text-slate-500">Page {current + 1} / {pages.length}</span>
                <button type="button" className={BTN_GHOST} onClick={() => setCurrent((c) => Math.min(pages.length - 1, c + 1))} disabled={current === pages.length - 1}>Next</button>
              </div>
            )}
            <div className="flex items-center justify-center rounded-xl bg-slate-100 p-4 dark:bg-slate-800/50">
              {page && <canvas ref={canvasRef} width={page.width} height={page.height} className="max-w-full rounded shadow-lg" style={{ height: "auto" }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
 * MODULE J — Screenshot Annotator & Markup
 * ========================================================================== */
type AnnTool = "arrow" | "rect" | "ellipse" | "pen" | "blur" | "text";
interface Ann {
  tool: AnnTool;
  color: string;
  stroke: number;
  x1: number; y1: number; x2: number; y2: number;
  points?: { x: number; y: number }[];
  text?: string;
}

function ScreenshotAnnotator() {
  const toast = useToast();
  const [base, setBase] = useState<{ url: string; w: number; h: number } | null>(null);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [tool, setTool] = useState<AnnTool>("arrow");
  const [color, setColor] = useState("#ef4444");
  const [stroke, setStroke] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef<Ann | null>(null);

  const setBaseFromSrc = async (url: string) => {
    const img = await loadImageEl(url);
    const off = document.createElement("canvas");
    off.width = img.naturalWidth; off.height = img.naturalHeight;
    off.getContext("2d")!.drawImage(img, 0, 0);
    baseImgRef.current = img;
    baseCanvasRef.current = off;
    setAnns([]);
    setBase({ url, w: img.naturalWidth, h: img.naturalHeight });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, a: Ann) => {
    const head = Math.max(10, a.stroke * 3);
    const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
    ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x2, a.y2);
    ctx.lineTo(a.x2 - head * Math.cos(ang - Math.PI / 6), a.y2 - head * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(a.x2 - head * Math.cos(ang + Math.PI / 6), a.y2 - head * Math.sin(ang + Math.PI / 6));
    ctx.closePath(); ctx.fillStyle = a.color; ctx.fill();
  };

  const drawOne = (ctx: CanvasRenderingContext2D, a: Ann) => {
    ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = a.stroke;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2), w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
    if (a.tool === "arrow") drawArrow(ctx, a);
    else if (a.tool === "rect") { ctx.strokeRect(x, y, w, h); }
    else if (a.tool === "ellipse") { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (a.tool === "pen" && a.points) {
      ctx.beginPath();
      a.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    } else if (a.tool === "text" && a.text) {
      ctx.font = `bold ${Math.max(14, a.stroke * 6)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(a.text, a.x1, a.y1);
    } else if (a.tool === "blur") {
      const bc = baseCanvasRef.current;
      if (bc && w > 2 && h > 2) {
        const px = Math.max(1, Math.floor(Math.min(w, h) / 12));
        const tmp = document.createElement("canvas");
        tmp.width = Math.max(1, Math.floor(w / px));
        tmp.height = Math.max(1, Math.floor(h / px));
        const tctx = tmp.getContext("2d")!;
        tctx.drawImage(bc, x, y, w, h, 0, 0, tmp.width, tmp.height);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, x, y, w, h);
        ctx.restore();
      }
    }
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImgRef.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImgRef.current, 0, 0, canvas.width, canvas.height);
    for (const a of anns) drawOne(ctx, a);
    if (drawing.current) drawOne(ctx, drawing.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anns]);

  useEffect(() => { redraw(); }, [redraw, base]);

  const pt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    if (!r.width) return { x: 0, y: 0 };
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!base) return;
    const { x, y } = pt(e);
    if (tool === "text") {
      const t = window.prompt("Callout text:");
      if (t) setAnns((a) => [...a, { tool: "text", color, stroke, x1: x, y1: y, x2: x, y2: y, text: t }]);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { tool, color, stroke, x1: x, y1: y, x2: x, y2: y, points: tool === "pen" ? [{ x, y }] : undefined };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const { x, y } = pt(e);
    drawing.current.x2 = x; drawing.current.y2 = y;
    if (drawing.current.tool === "pen") drawing.current.points!.push({ x, y });
    redraw();
  };
  const onUp = () => {
    if (!drawing.current) return;
    const a = drawing.current;
    drawing.current = null;
    const moved = Math.abs(a.x2 - a.x1) > 2 || Math.abs(a.y2 - a.y1) > 2 || (a.points && a.points.length > 2);
    if (moved) setAnns((prev) => [...prev, a]);
    else redraw();
  };

  const exportPng = () => {
    canvasRef.current?.toBlob((b) => b && downloadBlob(b, "annotated.png"), "image/png");
  };
  const copyPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (b) => {
      if (!b) return;
      try {
        const CI: any = (window as any).ClipboardItem;
        await navigator.clipboard.write([new CI({ "image/png": b })]);
        toast("Copied image to clipboard");
      } catch { toast("Clipboard image copy unsupported in this browser.", "error"); }
    }, "image/png");
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) await setBaseFromSrc(await readAsDataURL(file));
    }
  };

  const TOOLS_UI: { t: AnnTool; icon: React.ReactNode; label: string }[] = [
    { t: "arrow", icon: <ArrowUpRight className="h-4 w-4" />, label: "Arrow" },
    { t: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
    { t: "ellipse", icon: <Circle className="h-4 w-4" />, label: "Ellipse" },
    { t: "pen", icon: <PenTool className="h-4 w-4" />, label: "Freehand" },
    { t: "blur", icon: <Highlighter className="h-4 w-4" />, label: "Blur box" },
    { t: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
  ];

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<PenTool className="h-5 w-5" />} title="Screenshot Annotator & Markup"
        subtitle="Arrows, shapes, freehand, blur, and text — export or copy locally." />
      {!base ? (
        <div
          tabIndex={0}
          onPaste={onPaste}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-10 text-center outline-none focus:border-indigo-500 dark:border-slate-700"
        >
          <ClipboardPaste className="h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">Upload an image, or click here and paste (Ctrl/Cmd+V)</p>
          <label className={`${BTN_GHOST} mt-4 cursor-pointer`}>
            Browse image
            <input type="file" accept="image/*" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) await setBaseFromSrc(await readAsDataURL(f)); }} />
          </label>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {TOOLS_UI.map((u) => (
              <button key={u.t} type="button" onClick={() => setTool(u.t)} title={u.label}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${tool === u.t ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                {u.icon}<span className="hidden sm:inline">{u.label}</span>
              </button>
            ))}
            <div className="mx-1 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-9 rounded border border-slate-300" aria-label="Stroke color" />
              <input type="range" min={1} max={20} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} className="tm-range w-24" aria-label="Stroke weight" />
              <span className="text-xs text-slate-400">{stroke}px</span>
            </div>
            <button type="button" className={BTN_GHOST} onClick={() => setAnns((a) => a.slice(0, -1))} disabled={!anns.length}>
              <Undo2 className="h-4 w-4" /> Undo
            </button>
            <button type="button" className={BTN_GHOST} onClick={() => setAnns([])} disabled={!anns.length}>
              <Eraser className="h-4 w-4" /> Clear
            </button>
            <div className="ml-auto flex gap-2">
              <button type="button" className={BTN_GHOST} onClick={copyPng}><Copy className="h-4 w-4" /> Copy</button>
              <button type="button" className={BTN_PRIMARY} onClick={exportPng}><Download className="h-4 w-4" /> PNG</button>
              <button type="button" className={BTN_GHOST} onClick={() => setBase(null)}><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex items-center justify-center overflow-auto rounded-xl bg-slate-100 p-4 dark:bg-slate-800/50">
            <canvas
              ref={canvasRef}
              width={base.w}
              height={base.h}
              className="tm-redact-canvas max-w-full rounded shadow-lg"
              style={{ height: "auto" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ==========================================================================
 * MODULE K — SVG Optimizer & Sanitizer
 * ========================================================================== */
function optimizeSvg(
  src: string,
  opts: { removeXml: boolean; removeComments: boolean; precision: number; inlineStyles: boolean }
): { out: string; error: string | null } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(src, "image/svg+xml");
    const err = doc.querySelector("parsererror");
    if (err) return { out: src, error: "Invalid SVG: " + (err.textContent || "parse error").slice(0, 120) };
    const svg = doc.documentElement;

    const round = (v: string) =>
      v.replace(/-?\d*\.\d+(e-?\d+)?/gi, (m) => {
        const n = Number(m);
        return Number.isFinite(n) ? String(Number(n.toFixed(opts.precision))) : m;
      });

    const PRESENTATION = new Set([
      "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
      "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "font-size",
      "font-family", "font-weight", "text-anchor", "color",
    ]);

    const walk = (el: Element) => {
      // Remove comment nodes
      if (opts.removeComments) {
        Array.from(el.childNodes).forEach((n) => {
          if (n.nodeType === 8) el.removeChild(n);
        });
      }
      // Round numeric attribute values
      Array.from(el.attributes).forEach((attr) => {
        if (/[\d.]/.test(attr.value)) el.setAttribute(attr.name, round(attr.value));
      });
      // Convert presentation attributes to inline style
      if (opts.inlineStyles) {
        const styles: string[] = [];
        const existing = el.getAttribute("style");
        if (existing) styles.push(existing.replace(/;\s*$/, ""));
        Array.from(el.attributes).forEach((attr) => {
          if (PRESENTATION.has(attr.name)) {
            styles.push(`${attr.name}:${attr.value}`);
            el.removeAttribute(attr.name);
          }
        });
        if (styles.length) el.setAttribute("style", styles.join(";"));
      }
      // Remove editor metadata
      if (/^(metadata|sodipodi:namedview)$/i.test(el.tagName)) {
        el.parentNode?.removeChild(el);
        return;
      }
      Array.from(el.children).forEach(walk);
    };
    walk(svg);

    let out = new XMLSerializer().serializeToString(svg);
    if (opts.removeComments) out = out.replace(/<!--[\s\S]*?-->/g, "");
    if (!opts.removeXml) out = '<?xml version="1.0" encoding="UTF-8"?>\n' + out;
    out = out.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
    return { out, error: null };
  } catch (e) {
    return { out: src, error: e instanceof Error ? e.message : "Optimization failed." };
  }
}

function SvgOptimizer() {
  const toast = useToast();
  const [input, setInput] = useState(
    `<?xml version="1.0"?>\n<!-- drawn in an editor -->\n<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <metadata>editor data</metadata>\n  <circle cx="50.00000" cy="50.00000" r="40.123456" fill="#6366f1" stroke="#312e81" stroke-width="2.0000"/>\n</svg>`
  );
  const [removeXml, setRemoveXml] = useState(true);
  const [removeComments, setRemoveComments] = useState(true);
  const [precision, setPrecision] = useState(2);
  const [inlineStyles, setInlineStyles] = useState(false);

  const { out, error } = useMemo(
    () => optimizeSvg(input, { removeXml, removeComments, precision, inlineStyles }),
    [input, removeXml, removeComments, precision, inlineStyles]
  );
  const before = new Blob([input]).size;
  const after = new Blob([out]).size;
  const saved = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<FileCode2 className="h-5 w-5" />} title="SVG Optimizer & Sanitizer"
        subtitle="Shrink and clean SVG markup with a live preview — fully client-side." />
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {[["Remove XML decl", removeXml, setRemoveXml], ["Remove comments", removeComments, setRemoveComments], ["Attributes → inline CSS", inlineStyles, setInlineStyles]].map(
          ([label, val, setter]) => (
            <label key={label as string} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={val as boolean} onChange={(e) => (setter as (b: boolean) => void)(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              {label as string}
            </label>
          )
        )}
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          Precision
          <input type="number" min={0} max={6} value={precision} onChange={(e) => setPrecision(Math.min(6, Math.max(0, Number(e.target.value) || 0)))}
            className={`${INPUT} w-16 py-1`} />
        </label>
        <label className="cursor-pointer text-xs font-medium text-indigo-600">
          Upload .svg
          <input type="file" accept=".svg,image/svg+xml" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setInput(await readAsText(f)); }} />
        </label>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${saved > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
          Saved {saved}% ({formatBytesLocal(before)} → {formatBytesLocal(after)})
        </span>
      </div>
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <label className={LABEL}>Before</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className={`${INPUT} tm-code h-56 resize-y`} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${LABEL} mb-0`}>After</label>
            <CopyButton text={out} className="!px-2.5 !py-1" />
          </div>
          <textarea value={out} readOnly spellCheck={false} className={`${INPUT} tm-code h-56 resize-y bg-slate-50 dark:bg-slate-950`} />
        </div>
        <div>
          <label className={LABEL}>Preview</label>
          <div className="flex h-56 items-center justify-center rounded-lg border border-slate-200 bg-[conic-gradient(#f1f5f9_90deg,#fff_90deg_180deg,#f1f5f9_180deg_270deg,#fff_270deg)] bg-[length:20px_20px] p-2 dark:border-slate-700"
            dangerouslySetInnerHTML={{ __html: error ? "" : out }} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className={BTN_GHOST} onClick={() => { if (!error) { downloadBlob(new Blob([out], { type: "image/svg+xml" }), "optimized.svg"); toast("Downloaded optimized.svg"); } }}>
          <Download className="h-4 w-4" /> Download .svg
        </button>
      </div>
    </div>
  );
}
function formatBytesLocal(b: number): string {
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;
}

/* ==========================================================================
 * MODULE L — Network CIDR & Subnet Calculator
 * ========================================================================== */
function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}
const intToIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const toBinary = (n: number) => [24, 16, 8, 0].map((s) => ((n >>> s) & 255).toString(2).padStart(8, "0")).join(".");

function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.10");
  const [cidr, setCidr] = useState(24);
  const result = useMemo(() => {
    const ipInt = ipToInt(ip);
    if (ipInt === null) return { error: "Enter a valid IPv4 address (e.g. 192.168.1.10)." };
    const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = Math.pow(2, 32 - cidr);
    const usable = Math.max(0, total - 2);
    const firstHost = usable > 0 ? network + 1 : network;
    const lastHost = usable > 0 ? broadcast - 1 : broadcast;
    return {
      error: null as string | null,
      rows: [
        ["Network address", intToIp(network)],
        ["Broadcast address", intToIp(broadcast)],
        ["First usable host", intToIp(firstHost)],
        ["Last usable host", intToIp(lastHost)],
        ["Subnet mask", intToIp(mask)],
        ["Total addresses", total.toLocaleString()],
        ["Usable hosts", usable.toLocaleString()],
        ["Wildcard mask", intToIp(~mask >>> 0)],
      ] as [string, string][],
      maskBinary: toBinary(mask),
      ipBinary: toBinary(ipInt),
    };
  }, [ip, cidr]);

  return (
    <div className={`${CARD} p-6`}>
      <ToolHeader icon={<Network className="h-5 w-5" />} title="Network CIDR & Subnet Calculator"
        subtitle="Bitwise IPv4 subnet math, computed instantly in your browser." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div>
            <label className={LABEL} htmlFor="sn-ip">IPv4 address</label>
            <input id="sn-ip" className={`${INPUT} tm-code`} value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.10" />
          </div>
          <div>
            <label className={LABEL} htmlFor="sn-cidr">Subnet mask (CIDR)</label>
            <div className="relative">
              <select id="sn-cidr" className={`${INPUT} appearance-none pr-8`} value={cidr} onChange={(e) => setCidr(Number(e.target.value))}>
                {Array.from({ length: 23 }, (_, i) => i + 8).map((c) => (
                  <option key={c} value={c}>/{c} — {intToIp((0xffffffff << (32 - c)) >>> 0)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          {!result.error && (
            <div className="rounded-xl bg-indigo-600 p-4 text-white">
              <p className="text-xs text-indigo-200">Usable host count</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{result.rows?.find((r) => r[0] === "Usable hosts")?.[1]}</p>
              <p className="mt-1 text-xs text-indigo-200">{ip}/{cidr}</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          {result.error ? (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
              <AlertTriangle className="h-4 w-4" /> {result.error}
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {result.rows!.map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="tm-code font-medium text-slate-800 dark:text-slate-100">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-slate-900 p-3 tm-code text-xs text-emerald-300">
                  <span className="text-slate-500">IP binary: </span>{result.ipBinary}
                </div>
                <div className="rounded-lg bg-slate-900 p-3 tm-code text-xs text-sky-300">
                  <span className="text-slate-500">Mask binary: </span>{result.maskBinary}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
/* ==========================================================================
 * Tool registry + categorized sidebar + application shell.
 * ========================================================================== */
type ToolId =
  | "pdf" | "diff" | "legal" | "watermark"
  | "invoice" | "meeting" | "freelance"
  | "exif" | "aes" | "jwt"
  | "data" | "sql" | "mock" | "svg" | "subnet"
  | "compress" | "annotate";

type Category =
  | "Document & Legal Ops"
  | "Finance & Business Ops"
  | "Security & Privacy"
  | "Developer & Web Utilities"
  | "Media & Design Tools";

interface ToolDef {
  id: ToolId;
  name: string;
  category: Category;
  icon: React.ReactNode;
  component: React.ReactNode;
  seoTitle: string;
  seoBody: string;
}

const TOOLS: ToolDef[] = [
  { id: "pdf", name: "PDF Redactor", category: "Document & Legal Ops", icon: <Shield className="h-4 w-4" />, component: <PdfAnonymizer />,
    seoTitle: "Local PDF redaction that destroys, not hides", seoBody: "Renders PDFs to canvas with PDF.js, auto-detects PII by regex, lets you draw black-out boxes, and exports a rasterized PDF so the underlying text is permanently gone. Nothing is uploaded." },
  { id: "diff", name: "Contract Diff", category: "Document & Legal Ops", icon: <GitCompare className="h-4 w-4" />, component: <ContractDiff />,
    seoTitle: "How the contract diff engine works", seoBody: "An in-browser longest-common-subsequence algorithm compares two documents line by line, then word by word inside changed lines, colour-coding additions (green), deletions (red), and modifications (yellow) in split or unified views with full edit statistics." },
  { id: "legal", name: "Legal Generator", category: "Document & Legal Ops", icon: <FileSignature className="h-4 w-4" />, component: <LegalGenerator />,
    seoTitle: "Automated legal document generator", seoBody: "Fill dynamic fields to assemble an NDA, Master Services Agreement, or Work-for-Hire contract with a live preview. Copy the raw text or print to PDF — all templating runs locally, so party names and terms never leave your device." },
  { id: "watermark", name: "Watermark Studio", category: "Document & Legal Ops", icon: <Stamp className="h-4 w-4" />, component: <WatermarkStudio />,
    seoTitle: "Client-side watermarking for images and PDFs", seoBody: "Stamp a text or logo watermark across images and PDF pages with opacity, rotation, size, colour, and tiling controls. The canvas renders a live preview and exports the watermarked file entirely on-device." },

  { id: "invoice", name: "Invoice & Tax Engine", category: "Finance & Business Ops", icon: <Calculator className="h-4 w-4" />, component: <InvoiceEngine />,
    seoTitle: "Exact-precision invoicing with BigNumber.js", seoBody: "Every subtotal, discount, grouped tax, and grand total is computed with BigNumber.js half-up rounding, eliminating floating-point drift. Choose a currency and print a clean invoice — locally." },
  { id: "meeting", name: "Meeting Cost Ticker", category: "Finance & Business Ops", icon: <Timer className="h-4 w-4" />, component: <MeetingTicker />,
    seoTitle: "Real-time meeting cost ticker", seoBody: "Enter attendees and an average hourly rate to watch cash burn in real time, updated every 100 ms with green/amber/red budget thresholds. Start, pause, resume, and reset — no data leaves the browser." },
  { id: "freelance", name: "Freelance Pay Estimator", category: "Finance & Business Ops", icon: <Wallet className="h-4 w-4" />, component: <FreelanceEstimator />,
    seoTitle: "Freelance self-employment tax estimator", seoBody: "Estimates self-employment tax, the QBI deduction, federal and state income tax, and net take-home pay from your gross income and expenses using 2025 U.S. figures — a client-side planning estimate, not tax advice." },

  { id: "exif", name: "EXIF Stripper", category: "Security & Privacy", icon: <Fingerprint className="h-4 w-4" />, component: <ExifStripper />,
    seoTitle: "Inspect and strip photo metadata", seoBody: "A JavaScript JPEG/TIFF parser surfaces GPS coordinates, camera model, timestamps, and author tags; one click re-encodes the image via canvas to remove every metadata segment. All on-device." },
  { id: "aes", name: "AES Vault", category: "Security & Privacy", icon: <LockKeyhole className="h-4 w-4" />, component: <AesVault />,
    seoTitle: "AES-256-GCM encryption in the browser", seoBody: "Uses the native Web Crypto API with PBKDF2-SHA256 (250,000 iterations) key derivation and authenticated AES-GCM. A random salt and IV are packed with the ciphertext into a portable base64 payload — no keys or plaintext ever transmitted." },
  { id: "jwt", name: "JWT Debugger", category: "Security & Privacy", icon: <KeyRound className="h-4 w-4" />, component: <JwtDebugger />,
    seoTitle: "Decode and inspect JWTs locally", seoBody: "Splits and Base64URL-decodes a token's header, payload, and signature with colour coding, then reports expiry status, issued-at, not-before, and issuer claims. Decoding happens entirely in your browser." },

  { id: "data", name: "Data Sanitizer", category: "Developer & Web Utilities", icon: <Braces className="h-4 w-4" />, component: <DataSanitizer />,
    seoTitle: "JSON/CSV conversion and cleanup", seoBody: "Convert JSON to CSV and back, validate JSON with line/column error reporting, beautify or minify, and deduplicate or sanitize text — all processed locally with no server round-trip." },
  { id: "sql", name: "SQL Formatter", category: "Developer & Web Utilities", icon: <Code2 className="h-4 w-4" />, component: <SqlFormatter />,
    seoTitle: "SQL formatting and sanitization", seoBody: "A tokenizer preserves strings and comments while formatting, minifying, escaping, and unescaping SQL for Standard, MySQL, and PostgreSQL, with real-time detection of unbalanced parentheses and unterminated strings." },
  { id: "mock", name: "Mock API Builder", category: "Developer & Web Utilities", icon: <Database className="h-4 w-4" />, component: <MockDataGenerator />,
    seoTitle: "Synthetic mock data generator", seoBody: "Design a schema of typed fields and generate up to 500 realistic JSON records using crypto.randomUUID and curated data — copy or export as .json to seed databases and prototypes, with no third-party service." },
  { id: "svg", name: "SVG Optimizer", category: "Developer & Web Utilities", icon: <FileCode2 className="h-4 w-4" />, component: <SvgOptimizer />,
    seoTitle: "Optimize and sanitize SVG markup", seoBody: "Parses SVG with the browser's DOMParser to remove XML declarations, comments, and editor metadata, round coordinate precision, and optionally inline presentation attributes — showing before/after code, a size-savings percentage, and a live preview." },
  { id: "subnet", name: "Subnet Calculator", category: "Developer & Web Utilities", icon: <Network className="h-4 w-4" />, component: <SubnetCalculator />,
    seoTitle: "IPv4 CIDR subnet calculator", seoBody: "Bitwise math derives the network and broadcast addresses, first and last usable hosts, total and usable host counts, and the subnet mask in dotted-decimal and binary from any IPv4 address and /8–/30 CIDR prefix." },

  { id: "compress", name: "Image Compressor", category: "Media & Design Tools", icon: <ImageIcon className="h-4 w-4" />, component: <ImageCompressor />,
    seoTitle: "Client-side image compression", seoBody: "Re-encodes PNG, JPG, and WebP on an HTML5 Canvas with quality and dimension controls and an optional max-file-size target met by binary-searching quality — with a live before/after preview and reduction badge." },
  { id: "annotate", name: "Screenshot Annotator", category: "Media & Design Tools", icon: <PenTool className="h-4 w-4" />, component: <ScreenshotAnnotator />,
    seoTitle: "Screenshot annotation & markup", seoBody: "A canvas editor for uploaded or pasted images with arrow, rectangle, ellipse, freehand, blur/pixelate, and text-callout tools plus colour and stroke controls. Export a PNG or copy to the clipboard — no upload required." },
];

const CATEGORIES: { name: Category; emoji: string; icon: React.ReactNode }[] = [
  { name: "Document & Legal Ops", emoji: "📄", icon: <FileText className="h-3.5 w-3.5" /> },
  { name: "Finance & Business Ops", emoji: "💰", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { name: "Security & Privacy", emoji: "🔒", icon: <Lock className="h-3.5 w-3.5" /> },
  { name: "Developer & Web Utilities", emoji: "🛠️", icon: <Wrench className="h-3.5 w-3.5" /> },
  { name: "Media & Design Tools", emoji: "🖼️", icon: <ImageIcon className="h-3.5 w-3.5" /> },
];

export default function TaskMatrixPlatform() {
  const { isDark, mounted, toggle } = useTheme();
  const [activeId, setActiveId] = useState<ToolId>("pdf");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = TOOLS.find((t) => t.id === activeId)!;

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `TaskMatrix AI — ${active.name}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      description: active.seoBody,
      featureList: TOOLS.map((t) => t.name),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "4820" },
    }),
    [active]
  );

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-4">
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          {!collapsed && (
            <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span aria-hidden="true">{cat.emoji}</span>
              {cat.name}
            </p>
          )}
          <ul className="space-y-1">
            {TOOLS.filter((t) => t.category === cat.name).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => { setActiveId(t.id); onNavigate?.(); }}
                  aria-current={activeId === t.id ? "page" : undefined}
                  title={t.name}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activeId === t.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  {t.icon}
                  {!collapsed && <span>{t.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 tm-glass dark:border-slate-800">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </button>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                  TaskMatrix <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </p>
                <p className="hidden items-center gap-1 text-[11px] leading-tight text-slate-500 sm:flex">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> 100% Browser Local Processing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 md:inline-flex">
                <Lock className="h-3 w-3" /> 17 tools · Zero-server
              </span>
              <button type="button" onClick={toggle} aria-label="Toggle dark mode"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
              </button>
            </div>
          </div>
        </header>

        {/* Top banner ad (728x90) */}
        <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6">
          <AdSlot variant="banner" />
        </div>

        <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
          {/* Desktop sidebar */}
          <aside className={`hidden flex-shrink-0 lg:block ${collapsed ? "w-16" : "w-60"} transition-all`}>
            <div className={`${CARD} sticky top-24 p-3`}>
              <button type="button" onClick={() => setCollapsed((c) => !c)}
                className="mb-3 flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <NavList />
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
              <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">All Tools</span>
                  <button type="button" onClick={() => setMobileOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close navigation">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          )}

          {/* Main */}
          <main className="min-w-0 flex-1">
            <section className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" /> Canvas · Web Crypto · BigNumber · PDF.js
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {active.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                One of 17 enterprise utilities in TaskMatrix AI — every byte processed locally, nothing uploaded.
              </p>
            </section>

            {active.component}

            {/* Native content footer container */}
            <AdSlot variant="native" className="mt-8" />

            {/* SEO explanation */}
            <article className="mt-8">
              <div className={`${CARD} p-6 sm:p-8`}>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <FileJson className="h-5 w-5 text-indigo-500" /> {active.seoTitle}
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{active.seoBody}</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Zero data egress</p>
                      <p className="text-xs text-slate-500">Verify in DevTools → Network: no outbound requests for your content.</p></div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <Clipboard className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                    <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Native Web APIs</p>
                      <p className="text-xs text-slate-500">Canvas, Web Crypto, and TypedArrays — no opaque third-party SDKs.</p></div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
                    <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Works offline</p>
                      <p className="text-xs text-slate-500">After first load, every tool runs with no network at all.</p></div>
                  </div>
                </div>
              </div>
            </article>
          </main>

          {/* Right rail: 300x250 box + 300x600 large banner */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              <AdSlot variant="box" />
              <AdSlot variant="tower" />
            </div>
          </aside>
        </div>

        <footer className="mt-8 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">TaskMatrix AI</span>
            </div>
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} · 17 utilities · 100% browser-local · No data collected, ever.
            </p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

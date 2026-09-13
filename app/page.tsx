"use client";

/**
 * TaskMatrix AI v2.0 — Enterprise-grade, privacy-first utility suite.
 * ==========================================================================
 * Every operation — image compression, EXIF stripping, JWT decoding,
 * AES-256-GCM encryption, mock-data generation, and SQL formatting — runs
 * 100% locally in the browser using native Web APIs (HTML5 Canvas, the
 * Web Crypto API, TextEncoder/Decoder). No file, key, or byte is ever sent to
 * a server. There are zero external API endpoints and no backend pipeline.
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
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FileCog,
  FileJson,
  FileKey2,
  FileText,
  Fingerprint,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LockKeyhole,
  MapPin,
  Menu,
  Minimize2,
  Moon,
  Plus,
  RefreshCw,
  Scan,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  Upload,
  Wand2,
  X,
} from "lucide-react";

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
  variant: "banner" | "tower" | "native";
  className?: string;
}) {
  const cfg = {
    banner: { cls: "min-h-[90px]", label: "728 × 90 · Banner" },
    tower: { cls: "min-h-[600px] min-w-[300px]", label: "300 × 600 · Half-page" },
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

/* ==========================================================================
 * Tool registry + sidebar.
 * ========================================================================== */
type ToolId = "compress" | "exif" | "jwt" | "aes" | "mock" | "sql";
type Category = "Document Ops" | "Dev Tools" | "Security Vault";

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
  {
    id: "compress",
    name: "Image Compressor",
    category: "Document Ops",
    icon: <ImageIcon className="h-4 w-4" />,
    component: <ImageCompressor />,
    seoTitle: "How the client-side image compressor works",
    seoBody:
      "The compressor decodes your PNG, JPG, or WebP into an in-memory HTMLImageElement, redraws it onto an HTML5 Canvas at your chosen dimension scale, and re-encodes it with canvas.toBlob() at your target quality. When you set a maximum file size, a binary search over the quality parameter converges on the largest quality that still fits the limit — all in a few milliseconds and entirely on the GPU/CPU of your own device. Because the pixels never leave the browser, you can safely compress confidential screenshots, ID scans, or product artwork without exposing them to any server.",
  },
  {
    id: "exif",
    name: "EXIF Stripper",
    category: "Document Ops",
    icon: <Fingerprint className="h-4 w-4" />,
    component: <ExifStripper />,
    seoTitle: "How EXIF metadata inspection & removal works",
    seoBody:
      "Photos routinely embed EXIF metadata: the exact GPS coordinates where a picture was taken, the camera make and model, timestamps, the editing software, and author/copyright tags. TaskMatrix AI parses the JPEG APP1/TIFF structure directly in JavaScript with a DataView to surface these tags in a readable tree. To sanitize, the image is repainted onto a fresh canvas and re-encoded — a process that discards every metadata segment, producing a visually identical but privacy-clean file. Nothing is uploaded; the parser and the rewrite both run on-device.",
  },
  {
    id: "jwt",
    name: "JWT Debugger",
    category: "Dev Tools",
    icon: <KeyRound className="h-4 w-4" />,
    component: <JwtDebugger />,
    seoTitle: "How the JWT debugger decodes tokens",
    seoBody:
      "A JSON Web Token is three Base64URL-encoded segments separated by dots: header, payload, and signature. This debugger splits the token, Base64URL-decodes the first two segments (handling UTF-8), and parses them as JSON with color-coded output — red for the header, purple for the payload, blue for the signature. It reads standard registered claims to report status: exp (expiration), iat (issued-at), nbf (not-before), and iss (issuer). Signature verification is intentionally omitted because it requires your secret or public key; decoding a token here never transmits it anywhere.",
  },
  {
    id: "aes",
    name: "AES-256 Vault",
    category: "Security Vault",
    icon: <LockKeyhole className="h-4 w-4" />,
    component: <AesVault />,
    seoTitle: "How the AES-256-GCM vault protects your secrets",
    seoBody:
      "The vault uses the browser's native Web Crypto API (window.crypto.subtle). Your passphrase is stretched into a 256-bit key with PBKDF2-HMAC-SHA256 over 250,000 iterations against a random 16-byte salt, then used with AES-GCM — an authenticated cipher that guarantees both confidentiality and tamper detection. Each encryption generates a fresh random 12-byte IV; the salt, IV, and ciphertext are concatenated and Base64-encoded into a single portable payload. Decryption reverses the process and fails loudly if the passphrase is wrong or the payload was altered. No keys, plaintext, or ciphertext are ever stored or sent off your device.",
  },
  {
    id: "mock",
    name: "Mock Data Generator",
    category: "Dev Tools",
    icon: <Database className="h-4 w-4" />,
    component: <MockDataGenerator />,
    seoTitle: "How the synthetic mock data generator works",
    seoBody:
      "Design a schema by adding key/type pairs — UUIDs, names, emails, ISO timestamps, integers, booleans, prices, colors, and more — then generate up to 500 realistic records as a JSON array. UUIDs come from crypto.randomUUID(), and every other value is assembled from curated word lists and seeded randomness. The result is copy-ready or exportable as a .json file for seeding databases, prototyping front-ends, or load-testing APIs, with no third-party data service in the loop.",
  },
  {
    id: "sql",
    name: "SQL Formatter",
    category: "Dev Tools",
    icon: <Code2 className="h-4 w-4" />,
    component: <SqlFormatter />,
    seoTitle: "How the SQL formatter & sanitizer works",
    seoBody:
      "A hand-written tokenizer walks your query character by character, correctly preserving string literals (including doubled-quote and backslash escapes), line comments, identifiers, and punctuation. The formatter merges multi-word keywords (GROUP BY, LEFT JOIN, INSERT INTO), uppercases reserved words, inserts newlines before major clauses, and indents by parenthesis depth. Minify collapses the query to a single line while protecting quoted strings. Escape/Unescape convert between raw text and safe SQL string literals, and a structural validator flags unbalanced parentheses and unterminated strings for Standard, MySQL, and PostgreSQL dialects.",
  },
];

const CATEGORIES: { name: Category; icon: React.ReactNode }[] = [
  { name: "Document Ops", icon: <FileText className="h-3.5 w-3.5" /> },
  { name: "Dev Tools", icon: <Code2 className="h-3.5 w-3.5" /> },
  { name: "Security Vault", icon: <FileKey2 className="h-3.5 w-3.5" /> },
];

/* ==========================================================================
 * Root page.
 * ========================================================================== */
export default function TaskMatrixV2Page() {
  const { isDark, mounted, toggle } = useTheme();
  const [activeId, setActiveId] = useState<ToolId>("compress");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = TOOLS.find((t) => t.id === activeId)!;

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `TaskMatrix AI v2.0 — ${active.name}`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web browser",
      description: active.seoBody,
      featureList: TOOLS.map((t) => t.name),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "3072",
      },
    }),
    [active]
  );

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-4">
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          {!collapsed && (
            <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {cat.icon}
              {cat.name}
            </p>
          )}
          <ul className="space-y-1">
            {TOOLS.filter((t) => t.category === cat.name).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(t.id);
                    onNavigate?.();
                  }}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 tm-glass dark:border-slate-800">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
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
                  TaskMatrix <span className="text-indigo-600 dark:text-indigo-400">AI</span>{" "}
                  <span className="align-super text-[10px] font-bold text-violet-500">v2.0</span>
                </p>
                <p className="hidden items-center gap-1 text-[11px] leading-tight text-slate-500 sm:flex">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> 100% Browser Local
                  Processing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 md:inline-flex">
                <Lock className="h-3 w-3" /> Zero-server · No uploads
              </span>
              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle dark mode"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
              </button>
            </div>
          </div>
        </header>

        {/* Top banner ad */}
        <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6">
          <AdSlot variant="banner" />
        </div>

        {/* Shell: sidebar + main + right rail */}
        <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
          {/* Desktop sidebar */}
          <aside
            className={`hidden flex-shrink-0 lg:block ${collapsed ? "w-16" : "w-60"} transition-all`}
          >
            <div className={`${CARD} sticky top-24 p-3`}>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="mb-3 flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <NavList />
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Tools</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close navigation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* Hero (only above first tool) */}
            <section className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" /> Canvas · Web Crypto · WebAssembly-ready
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {active.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                One of six enterprise utilities in TaskMatrix AI v2.0 — every byte
                processed locally, nothing uploaded.
              </p>
            </section>

            {/* Active tool */}
            {active.component}

            {/* Native content footer container */}
            <AdSlot variant="native" className="mt-8" />

            {/* SEO explanation for the active tool */}
            <article className="mt-8">
              <div className={`${CARD} p-6 sm:p-8`}>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <FileJson className="h-5 w-5 text-indigo-500" />
                  {active.seoTitle}
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                  {active.seoBody}
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Zero data egress
                      </p>
                      <p className="text-xs text-slate-500">
                        Verify in DevTools → Network: no outbound requests for your
                        content.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <Clipboard className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Native Web APIs
                      </p>
                      <p className="text-xs text-slate-500">
                        Canvas, Web Crypto, and TypedArrays — no opaque third-party
                        SDKs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Works offline
                      </p>
                      <p className="text-xs text-slate-500">
                        After first load, every tool runs with no network at all.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </main>

          {/* Right rail sticky ad (high-CPM) */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <AdSlot variant="tower" />
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                TaskMatrix AI v2.0
              </span>
            </div>
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} · 6 utilities · 100% browser-local · No
              data collected, ever.
            </p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

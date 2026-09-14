# TaskMatrix AI

An **enterprise-grade, privacy-first, zero-server** multi-tool platform. All
**18 utilities run 100% locally in the browser** using native Web APIs (HTML5
Canvas, the Web Crypto API, TypedArrays, DOMParser), plus **BigNumber.js** for
exact money math and **PDF.js / pdf-lib** for local PDF handling. There are
**no external API endpoints and no backend pipeline** — nothing you load is
ever uploaded.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind
CSS**, and **Lucide React** icons.

## The 17 tools, by category

### 📄 Document & Legal Ops
- **PDF Redactor** — render PDFs to canvas (PDF.js), auto-detect PII by regex, draw black-out boxes, export a **rasterized** PDF so redacted text is destroyed.
- **PDF Editor** — add real, selectable **text**, a drawn or typed **e-signature**, dates, checkmarks, and images onto any page; pdf-lib writes them onto the original PDF (source preserved underneath) and exports a genuine PDF.
- **Contract Diff** — LCS line + word diffing with green/red/yellow coding, split/unified views, and edit statistics.
- **Legal Generator** — NDA, MSA, and Work-for-Hire templates with dynamic fields, live preview, copy, and print-to-PDF.
- **Watermark Studio** — text or logo watermark across images **and PDFs**, with opacity, angle, size, color, and tiling; live canvas preview.

### 💰 Finance & Business Ops
- **Invoice & Tax Engine** — exact-precision invoicing via **BigNumber.js** (grouped tax breakdown, discounts, 10 currencies, print/PDF).
- **Meeting Cost Ticker** — real-time cash-burn counter (100 ms tick) with green/amber/red budget thresholds.
- **Freelance Pay Estimator** — self-employment tax, QBI, federal + state, and net take-home from gross income and expenses (2025 US).

### 🔒 Security & Privacy
- **EXIF Stripper** — in-JS JPEG/TIFF parser reveals GPS/camera/date/author tags; canvas re-encode removes all metadata.
- **AES Vault** — Web Crypto **AES-256-GCM** with PBKDF2-SHA256 (250k iterations), portable base64 payload.
- **JWT Debugger** — color-coded header/payload/signature decode with Active/Expired status and issuer claims.

### 🛠️ Developer & Web Utilities
- **Data Sanitizer** — JSON↔CSV, validate with line/column errors, beautify/minify, dedupe, sanitize.
- **SQL Formatter** — tokenizer-based format/minify/escape/unescape for Standard/MySQL/PostgreSQL with syntax warnings.
- **Mock API Builder** — schema builder, 1–500 records, live JSON, copy + `.json` export.
- **SVG Optimizer** — DOMParser-based cleanup (strip XML decl/comments/metadata, round precision, inline styles) with before/after code, size-savings %, and live preview.
- **Subnet Calculator** — bitwise IPv4 CIDR math (network, broadcast, host range, counts, binary masks).

### 🖼️ Media & Design Tools
- **Image Compressor** — Canvas re-encode with quality/scale and a max-file-size target via quality binary search; live before/after with reduction badge.
- **Screenshot Annotator** — canvas editor for uploaded or **pasted** images: arrow, rectangle, ellipse, freehand, **blur/pixelate**, and text tools; export PNG or copy to clipboard.

## UI system
- Persistent **glassmorphism header** with the "100% Browser Local Processing"
  badge and a **dark/light toggle** (localStorage-persisted, applied pre-paint).
- **Left categorized sidebar** grouping all 17 tools under the five categories
  above; collapsible to icons on desktop and a drawer on mobile. Switching tools
  is pure client-state — no page reload, no layout shift.
- **CLS-safe reserved ad frames**: a `728×90` top banner, and a sticky right
  rail with a `300×250` box above a `300×600` half-page unit.
- **SEO**: a JSON-LD `SoftwareApplication` schema that reflects the active tool,
  rich metadata, and a per-tool technical explanation with privacy guarantees.

## Privacy guarantee
Open DevTools → Network, use any tool, and you will see **zero outbound
transfer of your content**. The app works fully offline once loaded.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

> `public/pdf.worker.min.js` is the PDF.js worker (pinned to
> `pdfjs-dist@3.11.174`), committed so the PDF tools work out of the box.

## Verified
- `npm run build` and `npm run lint` pass clean (18 tools, ~55 kB page; PDF.js
  and pdf-lib are code-split out of the initial bundle).
- A headless-Chromium smoke test confirms the sidebar lists all 18 tools and
  that the subnet calculator, SVG optimizer, contract diff, legal generator,
  freelance estimator, screenshot annotator, AES round-trip, invoice engine,
  and meeting ticker all work end-to-end with no console errors.
- A dedicated PDF-editor test uploads a generated PDF, places text, a date, and
  a drawn signature, exports it, and validates the result is a genuine 1-page
  PDF that grew with the embedded annotations.

## Project structure

```
app/
  layout.tsx    # metadata, theme-init script, global styles
  page.tsx      # the entire 18-tool platform (single file)
  globals.css   # Tailwind + dark mode + slider/glass/print styles
  icon.svg      # app favicon
public/
  pdf.worker.min.js   # PDF.js worker (same-origin)
```

The complete application lives in `app/page.tsx` as requested.

## Deploying
With no backend, TaskMatrix AI deploys to **Vercel** or **Cloudflare Pages**
with zero configuration (`npm run build`) — no environment variables or server
runtime required.

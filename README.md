# TaskMatrix AI v2.0

An **enterprise-grade, privacy-first, zero-server** utility suite. Every
operation — image compression, EXIF stripping, JWT decoding, AES-256-GCM
encryption, mock-data generation, and SQL formatting — runs **100% locally in
the browser** using **native Web APIs** (HTML5 Canvas, the Web Crypto API,
`TextEncoder`/`TextDecoder`, TypedArrays). There are **no external API
endpoints and no backend pipeline** — nothing you load is ever uploaded.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind
CSS**, and **Lucide React** icons. No processing libraries — just the platform.

## The six utilities

| Category | Tool | What it does |
|---|---|---|
| **Document Ops** | **Image & File Compressor** | Drag-drop PNG/JPG/WebP; quality slider, dimension scaling, and a **max-file-size** target met by binary-searching quality; live **side-by-side** original vs. compressed with a `−N% smaller` badge; client-side download. |
| **Document Ops** | **EXIF & Metadata Stripper** | Parses the JPEG APP1/TIFF structure in JS to reveal **GPS, camera, date, author, and software** tags in a tree; one-click **Sanitize & Download** re-encodes via canvas to strip all metadata. |
| **Dev Tools** | **JWT Debugger** | Color-coded decode — **header (red), payload (purple), signature (blue)** — with **Active/Expired** status, issued-at, not-before, and issuer claims. |
| **Security Vault** | **AES-256-GCM Vault** | `window.crypto.subtle` with **PBKDF2-SHA256 (250k iterations)** key derivation and authenticated **AES-GCM**; encrypt/decrypt toggle, portable base64 payload (salt+IV+ciphertext), copy + toasts. |
| **Dev Tools** | **Mock Data Generator** | Schema builder (UUID, names, email, ISO timestamp, integer, boolean, price, color, and more); generate **1–500** records; live JSON viewer, copy, and `.json` export. |
| **Dev Tools** | **SQL Formatter** | Tokenizer-based **format/indent, minify, escape, unescape** for **Standard / MySQL / PostgreSQL**, with a real-time unbalanced-paren / unterminated-string warning banner. |

## UI system
- Persistent **glassmorphism header** — "TaskMatrix AI v2.0", dark/light toggle
  (localStorage-persisted, applied pre-paint), and a "100% Browser Local
  Processing" privacy badge.
- **Left expandable sidebar** grouping the tools under *Document Ops*, *Dev
  Tools*, and *Security Vault*, collapsible to icons on desktop and a drawer on
  mobile. The active tool panel swaps with no page reload.
- **CLS-safe ad layout**: reserved `min-h-[90px]` top banner, a sticky
  `min-h-[600px] min-w-[300px]` right rail, and a native content unit between
  the tool output and the SEO section.
- **SEO**: a JSON-LD `SoftwareApplication` schema that reflects the selected
  tool, rich metadata, and a per-tool technical explanation with security
  guarantees.

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

## Verified
- `npm run build` and `npm run lint` pass clean.
- A headless-Chromium smoke test confirms the AES encrypt→decrypt round-trip
  (and wrong-password rejection), JWT decoding, mock-data JSON output, SQL
  formatting, and dark-mode persistence all work end-to-end in a real browser.

## Project structure

```
app/
  layout.tsx    # metadata, theme-init script, global styles
  page.tsx      # the entire TaskMatrix AI v2.0 app (single-file, all six tools)
  globals.css   # Tailwind + dark mode + slider/glass/print styles
  icon.svg      # app favicon
```

The complete application lives in `app/page.tsx` as requested.

## Deploying
With no backend, TaskMatrix AI v2.0 deploys to **Vercel** or **Cloudflare
Pages** with zero configuration (`npm run build`) — no environment variables or
server runtime required.

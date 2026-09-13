# TaskMatrix AI

A **production-grade, privacy-first, zero-server** multi-tool web application.
Every module runs **100% locally in the browser** — no file, byte, or keystroke
is ever transmitted off-device. There are no external API calls, uploads, or
backend database roundtrips for processing user input.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind
CSS**, **Lucide React** icons, **BigNumber.js** (exact decimal math),
**pdf-lib** (PDF export), and **PDF.js** (client-side PDF rendering).

## Modules

### A · Local PDF & Document Anonymizer
- Drag-and-drop upload for **PDF, PNG, JPG**.
- Pages render locally to an **HTML5 Canvas** via PDF.js (worker served
  same-origin from `/public` — no CDN, no external fetch).
- **Regex PII auto-detection** — emails, phone numbers, tax IDs/SSNs, and
  credit-card numbers — mapped to page coordinates via positioned text
  extraction, plus a free-text "redact anything containing…" field.
- **Draw custom black-out rectangles** directly on the preview canvas.
- **Client-side export** to a clean PDF (via pdf-lib) or PNG. Redactions are
  **rasterized** on export, so underlying text/metadata is permanently
  destroyed — not merely hidden.

### B · High-Precision Invoice & Tax Math Engine
- Line items: description, quantity, unit price, tax %, discount %.
- **All currency math uses BigNumber.js** with half-up rounding — no IEEE-754
  float errors (`0.1 + 0.2 === 0.3`, not `0.30000000000000004`).
- Live **Subtotal, Discount, grouped Tax Breakdown by rate, and Grand Total**,
  with a 10-currency selector.
- **Print / Save as PDF** via a self-contained printable HTML document.

### C · Real-Time Executive Meeting Cost Ticker
- Inputs: attendees, average hourly rate, currency, budget cap.
- **Start / Pause / Resume / Reset** timer engine (drift-corrected via
  `performance.now()`), refreshing every **100 ms**.
- Live cash-burn counter (per second / per minute) with **green → amber → red**
  status thresholds against your budget.

### D · Structured Data & Sanitization Utility
- **JSON → CSV** and **CSV → JSON** (RFC-4180-style quoting).
- **JSON validate / beautify / minify** with **line & column error reporting**
  and dynamic error-line highlighting.
- **Line deduplicator** and **whitespace sanitizer**, with copy / reuse output.

## UI / UX & Monetization
- **TaskMatrix AI** brand with a custom SVG logo and glassmorphism header.
- **Dark / Light mode** toggle persisted to `localStorage`, applied
  pre-paint to avoid flash-of-wrong-theme.
- **Tabbed navigation** — modules stay mounted, so the meeting timer keeps
  running and a loaded document stays loaded when you switch tools.
- **CLS-safe ad containers**: fixed-height leaderboard (728×90), sticky sidebar
  box (300×250), plus an email lead-capture card.
- **SEO**: injected JSON-LD `SoftwareApplication` + `FAQPage` schema, rich
  metadata (Open Graph/Twitter/canonical), a step-by-step guide, and an
  accessible FAQ accordion.

## Privacy guarantee
Open your browser's DevTools → Network tab, load a document, redact it, and
export it: you will see **zero outbound transfer of your content**. The app
works fully offline once loaded.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

> **Note:** `public/pdf.worker.min.js` is the PDF.js worker, committed so the
> anonymizer works out of the box. It is pinned to match `pdfjs-dist@3.11.174`;
> if you upgrade pdfjs-dist, copy the matching worker again:
> `cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js`.

## Project structure

```
app/
  layout.tsx    # metadata, theme-init script, global styles
  page.tsx      # the entire TaskMatrix AI app (single-file, all four modules)
  globals.css   # Tailwind + dark mode + slider/glass/print styles
public/
  pdf.worker.min.js   # PDF.js worker (same-origin)
```

The complete application lives in `app/page.tsx` as requested.

## Deploying
Because there is no backend, TaskMatrix AI deploys as a static-friendly
Next.js app to **Vercel** or **Cloudflare Pages** with zero configuration
(`npm run build`). No environment variables or server runtime are required.

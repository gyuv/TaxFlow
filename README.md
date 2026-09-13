# TaxFlow — Freelance Tax & Net Income Estimator

A production-grade, fully responsive, monetizable web tool that estimates
quarterly tax liabilities, self-employment tax, deductions, effective tax
rate, and **net take-home pay** for freelancers, 1099 contractors, and the
self-employed.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind
CSS**, and **Lucide React** icons.

## Features

### Interactive calculator engine
- Real-time recalculation on every input change (`"use client"` + `useMemo`).
- Range sliders paired with precise numeric inputs for gross income and
  expenses.
- Select dropdowns for **filing status** and **state / region**.
- Toggle switches for **home office**, **self-employed health insurance**,
  **retirement contributions**, and the **20% QBI deduction**.
- Results dashboard with three headline metric cards (Net Take-Home, Total
  Tax Owed, Effective Tax Rate), an **SVG donut chart**, CSS **progress
  bars**, and a line-item breakdown.
- **Copy summary to clipboard** and **Export as PDF** (print) actions.

### Tax model (2025 tax year)
- Progressive federal brackets for Single / MFJ / Head of Household.
- Self-employment tax (15.3% on 92.35% of net earnings, Social Security wage
  base cap + uncapped Medicare), with the deductible half applied.
- Standard deduction, above-the-line adjustments, and a simplified Section
  199A QBI deduction.
- Simplified per-state effective income tax rates.
- Quarterly estimated payment and monthly set-aside guidance.

> These are planning estimates, **not tax advice**. Always confirm with a
> licensed CPA.

### Monetization framework
- Reserved, CLS-safe ad containers: **leaderboard (728×90)**, **medium
  rectangle (300×250)**, and a **native content unit**.
- Lead-gen email opt-in card ("Download Your Detailed PDF Tax Strategy
  Guide") with client-side validation.
- Niche affiliate recommendation banner with advertising disclosure.

### SEO & content engine
- Long-form "How to Calculate" guide, printed formulas, and a
  Sole-Prop vs LLC vs S-Corp comparison table.
- Accessible FAQ accordion (7 items).
- Injected **JSON-LD** `FAQPage` and `SoftwareApplication` structured data,
  plus rich `metadata` (Open Graph, Twitter, canonical) in the layout.

### Accessibility & quality
- ARIA labels on every control, `role="switch"` toggles, keyboard-navigable
  accordion, visible focus rings.
- Fully responsive grid (inputs left, dashboard right) that stacks on mobile.
- Strict TypeScript, zero lint warnings, static prerendering.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

## Project structure

```
app/
  layout.tsx    # metadata, fonts, global styles
  page.tsx      # the entire tool (single-file component)
  globals.css   # Tailwind + slider/glass/print styles
```

The complete tool lives in `app/page.tsx` as requested.

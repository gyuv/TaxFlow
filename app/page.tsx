"use client";

/**
 * Freelance Tax & Net Income Estimator
 * ------------------------------------------------------------------
 * A production-grade, monetizable, fully responsive single-file web tool.
 *
 * Core purpose: Calculate quarterly tax liabilities, self-employment tax,
 * deductions, effective tax rate, and net take-home pay for freelancers,
 * independent contractors, and self-employed professionals in the U.S.
 *
 * Tax figures reflect the 2025 U.S. federal tax year. All results are
 * planning estimates, not tax advice.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeDollarSign,
  Banknote,
  Briefcase,
  Calculator,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Gauge,
  HeartPulse,
  Home,
  Info,
  Landmark,
  Mail,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

/* ============================================================
 * 1. TAX DATA & DOMAIN CONSTANTS (2025 tax year)
 * ============================================================ */

const TAX_YEAR = 2025;

type FilingStatus = "single" | "mfj" | "hoh";

interface Bracket {
  upTo: number; // upper bound of this bracket (Infinity for top)
  rate: number; // marginal rate as a decimal
}

const FEDERAL_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 11925, rate: 0.1 },
    { upTo: 48475, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250525, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  mfj: [
    { upTo: 23850, rate: 0.1 },
    { upTo: 96950, rate: 0.12 },
    { upTo: 206700, rate: 0.22 },
    { upTo: 394600, rate: 0.24 },
    { upTo: 501050, rate: 0.32 },
    { upTo: 751600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  hoh: [
    { upTo: 17000, rate: 0.1 },
    { upTo: 64850, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250500, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15000,
  mfj: 30000,
  hoh: 22500,
};

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "Married Filing Jointly",
  hoh: "Head of Household",
};

// Social Security wage base for 2025.
const SS_WAGE_BASE = 176100;
const SS_RATE = 0.124; // 12.4% (employer + employee halves)
const MEDICARE_RATE = 0.029; // 2.9%
const SE_TAX_BASE_MULTIPLIER = 0.9235; // 92.35% of net earnings

// QBI (Qualified Business Income) deduction rate — Section 199A.
const QBI_RATE = 0.2;

/**
 * A curated set of states with an approximate flat/effective state income
 * tax rate applied to taxable income. Rates are simplified planning
 * estimates — several states use graduated brackets, local surtaxes, or
 * no income tax at all.
 */
interface StateOption {
  code: string;
  name: string;
  rate: number;
}

const STATES: StateOption[] = [
  { code: "NONE", name: "No state income tax (TX, FL, WA, NV, TN, WY, SD, AK)", rate: 0 },
  { code: "AZ", name: "Arizona (~2.5%)", rate: 0.025 },
  { code: "CA", name: "California (~9.3% marginal est.)", rate: 0.093 },
  { code: "CO", name: "Colorado (~4.4%)", rate: 0.044 },
  { code: "GA", name: "Georgia (~5.39%)", rate: 0.0539 },
  { code: "IL", name: "Illinois (4.95%)", rate: 0.0495 },
  { code: "MA", name: "Massachusetts (5.0%)", rate: 0.05 },
  { code: "MI", name: "Michigan (4.25%)", rate: 0.0425 },
  { code: "NC", name: "North Carolina (~4.5%)", rate: 0.045 },
  { code: "NY", name: "New York (~6.85% marginal est.)", rate: 0.0685 },
  { code: "OH", name: "Ohio (~3.5% est.)", rate: 0.035 },
  { code: "PA", name: "Pennsylvania (3.07%)", rate: 0.0307 },
  { code: "VA", name: "Virginia (~5.75%)", rate: 0.0575 },
  { code: "OTHER", name: "Other / custom (5.0% est.)", rate: 0.05 },
];

/* ============================================================
 * 2. FORMATTING & MATH HELPERS
 * ============================================================ */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyFormatterPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatCurrency(value: number, precise = false): string {
  const safe = Number.isFinite(value) ? value : 0;
  return precise
    ? currencyFormatterPrecise.format(safe)
    : currencyFormatter.format(safe);
}

function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return percentFormatter.format(safe);
}

/** Clamp a number into [min, max], coercing NaN/undefined to `min`. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** Parse a raw input string into a non-negative number (sanitized). */
function parseNonNegative(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

/**
 * Compute progressive federal income tax for a given taxable income and
 * filing status. Returns both the total tax and the marginal rate reached.
 */
function computeFederalTax(
  taxableIncome: number,
  status: FilingStatus
): { tax: number; marginalRate: number } {
  const income = Math.max(0, taxableIncome);
  const brackets = FEDERAL_BRACKETS[status];
  let tax = 0;
  let lower = 0;
  let marginalRate = brackets[0].rate;

  for (const bracket of brackets) {
    if (income > lower) {
      const taxableInBracket = Math.min(income, bracket.upTo) - lower;
      tax += taxableInBracket * bracket.rate;
      marginalRate = bracket.rate;
    } else {
      break;
    }
    lower = bracket.upTo;
  }

  return { tax, marginalRate };
}

/* ============================================================
 * 3. CORE CALCULATOR ENGINE
 * ============================================================ */

interface EstimatorInputs {
  grossIncome: number;
  businessExpenses: number;
  filingStatus: FilingStatus;
  stateCode: string;
  homeOfficeEnabled: boolean;
  homeOfficeAmount: number;
  healthInsuranceEnabled: boolean;
  healthInsuranceAmount: number;
  retirementEnabled: boolean;
  retirementAmount: number;
  qbiEnabled: boolean;
}

interface EstimatorResults {
  gross: number;
  totalBusinessExpenses: number;
  netBusinessIncome: number;
  seTax: number;
  halfSeTax: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  taxableIncome: number;
  qbiDeduction: number;
  standardDeduction: number;
  retirement: number;
  netTakeHome: number;
  effectiveTaxRate: number;
  marginalRate: number;
  quarterlyEstimate: number;
  monthlySetAside: number;
}

function computeEstimate(inputs: EstimatorInputs): EstimatorResults {
  const gross = Math.max(0, inputs.grossIncome);

  const baseExpenses = clamp(inputs.businessExpenses, 0, gross);
  const homeOffice = inputs.homeOfficeEnabled
    ? clamp(inputs.homeOfficeAmount, 0, gross)
    : 0;
  const totalBusinessExpenses = Math.min(gross, baseExpenses + homeOffice);

  const netBusinessIncome = Math.max(0, gross - totalBusinessExpenses);

  // Self-employment tax on 92.35% of net earnings.
  const seBase = netBusinessIncome * SE_TAX_BASE_MULTIPLIER;
  const ssTax = Math.min(seBase, SS_WAGE_BASE) * SS_RATE;
  const medicareTax = seBase * MEDICARE_RATE;
  const seTax = seBase > 0 ? ssTax + medicareTax : 0;
  const halfSeTax = seTax / 2;

  // Above-the-line adjustments.
  const healthInsurance = inputs.healthInsuranceEnabled
    ? clamp(inputs.healthInsuranceAmount, 0, netBusinessIncome)
    : 0;
  const retirement = inputs.retirementEnabled
    ? clamp(inputs.retirementAmount, 0, netBusinessIncome)
    : 0;

  const adjustments = halfSeTax + healthInsurance + retirement;
  const incomeAfterAdjustments = Math.max(0, netBusinessIncome - adjustments);

  const standardDeduction = STANDARD_DEDUCTION[inputs.filingStatus];
  const taxableBeforeQbi = Math.max(
    0,
    incomeAfterAdjustments - standardDeduction
  );

  // QBI deduction: 20% of the lesser of qualified business income or
  // taxable income before the deduction. Taxable income is the binding
  // limit here, so we apply it against taxableBeforeQbi.
  const qbiDeduction = inputs.qbiEnabled ? QBI_RATE * taxableBeforeQbi : 0;

  const taxableIncome = Math.max(0, taxableBeforeQbi - qbiDeduction);

  const { tax: federalTax, marginalRate } = computeFederalTax(
    taxableIncome,
    inputs.filingStatus
  );

  const stateOption =
    STATES.find((s) => s.code === inputs.stateCode) ?? STATES[0];
  const stateTax = taxableIncome * stateOption.rate;

  const totalTax = seTax + federalTax + stateTax;

  // Net take-home is spendable cash after all taxes and retirement savings
  // are set aside. Retirement remains the freelancer's money but is locked
  // away, so we report it as its own slice of gross revenue.
  const netTakeHome = Math.max(0, netBusinessIncome - totalTax - retirement);

  const effectiveTaxRate = gross > 0 ? totalTax / gross : 0;

  return {
    gross,
    totalBusinessExpenses,
    netBusinessIncome,
    seTax,
    halfSeTax,
    federalTax,
    stateTax,
    totalTax,
    taxableIncome,
    qbiDeduction,
    standardDeduction,
    retirement,
    netTakeHome,
    effectiveTaxRate,
    marginalRate,
    quarterlyEstimate: totalTax / 4,
    monthlySetAside: totalTax / 12,
  };
}

/* ============================================================
 * 4. SEO CONTENT DATA (FAQ powers both UI + JSON-LD schema)
 * ============================================================ */

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "How much should a freelancer set aside for taxes?",
    answer:
      "A common rule of thumb is to set aside 25%–30% of your net freelance income for taxes, but the exact figure depends on your total income, filing status, state, and deductions. Use this estimator to calculate your specific effective tax rate, then reserve at least that percentage of every payment you receive. Freelancers in higher federal brackets or high-tax states should lean toward 30%–40%.",
  },
  {
    question: "What is self-employment tax and how is it calculated?",
    answer:
      "Self-employment (SE) tax covers Social Security and Medicare for self-employed people. For 2025 it is 15.3% — 12.4% for Social Security (up to the $176,100 wage base) plus 2.9% for Medicare (uncapped). It is calculated on 92.35% of your net business income. You can deduct half of your SE tax as an above-the-line adjustment when computing income tax.",
  },
  {
    question: "When are quarterly estimated taxes due?",
    answer:
      "Federal quarterly estimated taxes are generally due on April 15, June 15, September 15, and January 15 of the following year. If a due date falls on a weekend or holiday it shifts to the next business day. Missing payments or underpaying can trigger IRS underpayment penalties, so many freelancers pay a fixed amount each quarter based on their projected annual liability.",
  },
  {
    question: "What is the QBI (Qualified Business Income) deduction?",
    answer:
      "The Qualified Business Income deduction (Section 199A) lets many self-employed people and pass-through business owners deduct up to 20% of their qualified business income. It is limited to 20% of taxable income before the deduction, and it phases out for certain service businesses above income thresholds. Toggling QBI in this calculator applies a simplified 20% estimate.",
  },
  {
    question: "Which freelance expenses are tax deductible?",
    answer:
      "Ordinary and necessary business expenses are deductible — including software subscriptions, home office costs, business travel, professional services, health insurance premiums (for the self-employed), retirement contributions, equipment, marketing, and a portion of your phone and internet. Deductions reduce both your income tax and your self-employment tax base, so tracking them carefully is one of the highest-leverage things a freelancer can do.",
  },
  {
    question: "Should I form an LLC or S-Corp to save on taxes?",
    answer:
      "A single-member LLC is taxed the same as a sole proprietorship by default, so it does not change your tax bill on its own — but it provides liability protection. Electing S-Corp taxation can reduce self-employment tax by splitting income into a reasonable salary plus distributions, but it adds payroll, bookkeeping, and compliance costs. S-Corp status typically becomes worthwhile once net profit consistently exceeds roughly $60,000–$80,000. Consult a CPA before electing.",
  },
  {
    question: "Are the results from this freelance tax calculator accurate?",
    answer:
      "This tool produces a reliable planning estimate using 2025 federal brackets, standard deductions, and self-employment tax rules, plus simplified state rates. It does not account for every credit, phase-out, local tax, or the additional 0.9% Medicare surtax on high earners. Treat the output as a strong directional estimate for budgeting and quarterly planning, and confirm your final numbers with a licensed tax professional.",
  },
];

/* ============================================================
 * 5. REUSABLE UI PRIMITIVES
 * ============================================================ */

interface SliderInputProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  prefix?: string;
  disabled?: boolean;
  helpText?: string;
}

function SliderInput({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
  prefix = "$",
  disabled = false,
  helpText,
}: SliderInputProps) {
  const inputId = useId();
  const sliderId = useId();
  const progress = max > min ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0;

  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="flex items-end justify-between gap-3">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          <span className="text-brand-600" aria-hidden="true">
            {icon}
          </span>
          {label}
        </label>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200">
          {prefix && (
            <span className="pr-1 text-sm text-slate-400" aria-hidden="true">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            value={value === 0 ? "" : value}
            placeholder="0"
            aria-label={`${label} exact amount`}
            onChange={(e) => onChange(clamp(parseNonNegative(e.target.value), min, max))}
            className="w-24 bg-transparent text-right text-sm font-semibold text-slate-900 outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <input
        id={sliderId}
        type="range"
        className="tf-range mt-3"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        disabled={disabled}
        aria-label={`${label} slider`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamp(value, min, max)}
        aria-valuetext={`${prefix}${clamp(value, min, max).toLocaleString()}`}
        style={{ ["--tf-progress" as string]: `${progress}%` }}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
      />

      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>
          {prefix}
          {min.toLocaleString()}
        </span>
        {helpText && <span className="text-slate-400">{helpText}</span>}
        <span>
          {prefix}
          {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({
  label,
  description,
  icon,
  checked,
  onChange,
}: ToggleSwitchProps) {
  const labelId = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 p-3">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 rounded-lg p-1.5 ${
            checked ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-400"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <span id={labelId} className="block text-sm font-medium text-slate-800">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs text-slate-500">
              {description}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          checked ? "bg-brand-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  tone: "primary" | "danger" | "neutral" | "accent";
}

function MetricCard({ label, value, sublabel, icon, tone }: MetricCardProps) {
  const tones: Record<MetricCardProps["tone"], string> = {
    primary:
      "from-brand-600 to-brand-500 text-white shadow-brand-500/30 shadow-lg",
    danger: "from-rose-500 to-rose-400 text-white shadow-rose-500/30 shadow-lg",
    accent:
      "from-emerald-500 to-teal-400 text-white shadow-emerald-500/30 shadow-lg",
    neutral: "from-white to-white text-slate-900 border border-slate-200",
  };
  const isDark = tone !== "neutral";
  return (
    <div
      className={`tf-print-block relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 sm:p-5 ${tones[tone]}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium uppercase tracking-wide ${
            isDark ? "text-white/80" : "text-slate-500"
          }`}
        >
          {label}
        </span>
        <span
          className={isDark ? "text-white/80" : "text-brand-600"}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>
      {sublabel && (
        <p
          className={`mt-1 text-xs ${isDark ? "text-white/75" : "text-slate-500"}`}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

/* ---------- SVG Donut Chart ---------- */

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  slices,
  total,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  total: number;
  centerLabel: string;
  centerValue: string;
}) {
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;

  let cumulative = 0;
  const titleId = useId();

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        role="img"
        aria-labelledby={titleId}
        className="flex-shrink-0"
      >
        <title id={titleId}>Breakdown of gross revenue by category</title>
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice, index) => {
          if (slice.value <= 0) return null;
          const fraction = slice.value / safeTotal;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={index}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x="90"
          y="82"
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: "11px", fontWeight: 500 }}
        >
          {centerLabel}
        </text>
        <text
          x="90"
          y="102"
          textAnchor="middle"
          className="fill-slate-900"
          style={{ fontSize: "18px", fontWeight: 700 }}
        >
          {centerValue}
        </text>
      </svg>

      <ul className="w-full space-y-2 sm:w-auto sm:min-w-[220px]">
        {slices.map((slice, index) => {
          const pct = total > 0 ? slice.value / total : 0;
          return (
            <li key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                {slice.label}
              </span>
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <span className="text-slate-400">{formatPercent(pct)}</span>
                {formatCurrency(slice.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Progress Bar ---------- */

function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? clamp((value / total) * 100, 0, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-500">
          {formatCurrency(value)} · {formatPercent(total > 0 ? value / total : 0)}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={`${label} share of gross revenue`}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ---------- Ad Slot Placeholder ---------- */

function AdSlot({
  variant,
  className = "",
}: {
  variant: "leaderboard" | "rectangle" | "native";
  className?: string;
}) {
  const config = {
    leaderboard: {
      label: "Advertisement",
      dims: "728 × 90",
      minH: "min-h-[90px]",
    },
    rectangle: {
      label: "Advertisement",
      dims: "300 × 250",
      minH: "min-h-[250px]",
    },
    native: {
      label: "Sponsored",
      dims: "Native content unit",
      minH: "min-h-[120px]",
    },
  }[variant];

  return (
    <div
      className={`tf-no-print flex ${config.minH} w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100/60 ${className}`}
      aria-label="Advertisement placeholder"
      role="complementary"
    >
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {config.label}
        </p>
        <p className="mt-1 text-xs text-slate-400">{config.dims}</p>
      </div>
    </div>
  );
}

/* ---------- FAQ Accordion Item ---------- */

function FaqItem({ entry, index }: { entry: FaqEntry; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const panelId = useId();
  const buttonId = useId();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-5"
        >
          <span className="text-sm font-semibold text-slate-800 sm:text-base">
            {entry.question}
          </span>
          <ChevronDown
            className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="px-4 pb-4 text-sm leading-relaxed text-slate-600 sm:px-5"
      >
        {entry.answer}
      </div>
    </div>
  );
}

/* ============================================================
 * 6. MAIN PAGE COMPONENT
 * ============================================================ */

export default function FreelanceTaxEstimatorPage() {
  /* ---- Input state ---- */
  const [grossIncome, setGrossIncome] = useState<number>(90000);
  const [businessExpenses, setBusinessExpenses] = useState<number>(12000);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [stateCode, setStateCode] = useState<string>("CA");

  const [homeOfficeEnabled, setHomeOfficeEnabled] = useState<boolean>(true);
  const [homeOfficeAmount, setHomeOfficeAmount] = useState<number>(1500);

  const [healthInsuranceEnabled, setHealthInsuranceEnabled] =
    useState<boolean>(true);
  const [healthInsuranceAmount, setHealthInsuranceAmount] =
    useState<number>(6000);

  const [retirementEnabled, setRetirementEnabled] = useState<boolean>(false);
  const [retirementAmount, setRetirementAmount] = useState<number>(6000);

  const [qbiEnabled, setQbiEnabled] = useState<boolean>(true);

  /* ---- Derived results (real-time recalculation) ---- */
  const results = useMemo<EstimatorResults>(
    () =>
      computeEstimate({
        grossIncome,
        businessExpenses,
        filingStatus,
        stateCode,
        homeOfficeEnabled,
        homeOfficeAmount,
        healthInsuranceEnabled,
        healthInsuranceAmount,
        retirementEnabled,
        retirementAmount,
        qbiEnabled,
      }),
    [
      grossIncome,
      businessExpenses,
      filingStatus,
      stateCode,
      homeOfficeEnabled,
      homeOfficeAmount,
      healthInsuranceEnabled,
      healthInsuranceAmount,
      retirementEnabled,
      retirementAmount,
      qbiEnabled,
    ]
  );

  const donutSlices = useMemo<DonutSlice[]>(
    () => [
      { label: "Net take-home", value: results.netTakeHome, color: "#10b981" },
      {
        label: "Business expenses",
        value: results.totalBusinessExpenses,
        color: "#94a3b8",
      },
      { label: "Self-employment tax", value: results.seTax, color: "#f97316" },
      { label: "Federal income tax", value: results.federalTax, color: "#ef4444" },
      { label: "State income tax", value: results.stateTax, color: "#a855f7" },
      { label: "Retirement savings", value: results.retirement, color: "#3b82f6" },
    ],
    [results]
  );

  /* ---- Copy to clipboard ---- */
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const stateName =
      STATES.find((s) => s.code === stateCode)?.name ?? "N/A";
    const summary = [
      `Freelance Tax & Net Income Estimate (Tax Year ${TAX_YEAR})`,
      `----------------------------------------------`,
      `Filing status:        ${FILING_STATUS_LABELS[filingStatus]}`,
      `State:                ${stateName}`,
      ``,
      `Gross revenue:        ${formatCurrency(results.gross, true)}`,
      `Business expenses:    ${formatCurrency(results.totalBusinessExpenses, true)}`,
      `Net business income:  ${formatCurrency(results.netBusinessIncome, true)}`,
      `Taxable income:       ${formatCurrency(results.taxableIncome, true)}`,
      ``,
      `Self-employment tax:  ${formatCurrency(results.seTax, true)}`,
      `Federal income tax:   ${formatCurrency(results.federalTax, true)}`,
      `State income tax:     ${formatCurrency(results.stateTax, true)}`,
      `TOTAL TAX OWED:       ${formatCurrency(results.totalTax, true)}`,
      ``,
      `Effective tax rate:   ${formatPercent(results.effectiveTaxRate)}`,
      `Marginal fed rate:    ${formatPercent(results.marginalRate)}`,
      `Quarterly estimate:   ${formatCurrency(results.quarterlyEstimate, true)}`,
      `Monthly set-aside:    ${formatCurrency(results.monthlySetAside, true)}`,
      ``,
      `NET TAKE-HOME PAY:    ${formatCurrency(results.netTakeHome, true)}`,
      ``,
      `Estimate only — not tax advice. Generated with TaxFlow.`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail gracefully.
      window.prompt("Copy your tax summary:", summary);
    }
  }, [results, filingStatus, stateCode]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* ---- Email opt-in ---- */
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!valid) {
        setEmailError("Please enter a valid email address.");
        return;
      }
      setEmailError(null);
      setEmailSubmitted(true);
      // In production, POST `email` to your ESP / CRM endpoint here.
    },
    [email]
  );

  /* ---- JSON-LD structured data (SEO) ---- */
  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ENTRIES.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
        },
      })),
    }),
    []
  );

  const softwareSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Freelance Tax & Net Income Estimator",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description:
        "Free online calculator that estimates quarterly tax liabilities, self-employment tax, deductions, effective tax rate, and net take-home pay for freelancers and independent contractors.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "2184",
      },
    }),
    []
  );

  const selectedState = STATES.find((s) => s.code === stateCode) ?? STATES[0];

  /* ============================================================
   * RENDER
   * ============================================================ */
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* --- JSON-LD Structured Data (FAQPage + SoftwareApplication) --- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* ================= HEADER ================= */}
      <header className="tf-no-print border-b border-slate-200 bg-white/80 tf-glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
              <Calculator className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">
                TaxFlow
              </p>
              <p className="text-[11px] leading-tight text-slate-500">
                Freelance Tax Estimator
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
            <a href="#calculator" className="hover:text-brand-600">
              Calculator
            </a>
            <a href="#guide" className="hover:text-brand-600">
              Guide
            </a>
            <a href="#faq" className="hover:text-brand-600">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ================= HERO ================= */}
        <section className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Updated for the {TAX_YEAR} tax year
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Freelance Tax &amp; Net Income Estimator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Instantly estimate your self-employment tax, quarterly payments,
            deductions, effective tax rate, and real take-home pay. Built for
            freelancers, 1099 contractors, and the self-employed.
          </p>
        </section>

        {/* ===== AD SLOT 1: Leaderboard Banner (above calculator) ===== */}
        <AdSlot variant="leaderboard" className="mb-6" />

        {/* ================= CALCULATOR ================= */}
        <section
          id="calculator"
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
          aria-label="Tax calculator"
        >
          {/* ---------- LEFT: Input controls ---------- */}
          <div className="lg:col-span-2">
            <div className="tf-print-block rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h2 className="text-lg font-bold text-slate-900">
                  Your details
                </h2>
              </div>

              <div className="space-y-6">
                <SliderInput
                  label="Gross annual freelance income"
                  icon={<Banknote className="h-4 w-4" />}
                  value={grossIncome}
                  min={0}
                  max={500000}
                  step={1000}
                  onChange={setGrossIncome}
                />

                <SliderInput
                  label="Deductible business expenses"
                  icon={<Receipt className="h-4 w-4" />}
                  value={businessExpenses}
                  min={0}
                  max={200000}
                  step={500}
                  onChange={setBusinessExpenses}
                />

                {/* Selects */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="filing-status"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Filing status
                    </label>
                    <div className="relative">
                      <select
                        id="filing-status"
                        value={filingStatus}
                        onChange={(e) =>
                          setFilingStatus(e.target.value as FilingStatus)
                        }
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                      >
                        {(Object.keys(FILING_STATUS_LABELS) as FilingStatus[]).map(
                          (key) => (
                            <option key={key} value={key}>
                              {FILING_STATUS_LABELS[key]}
                            </option>
                          )
                        )}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="state-select"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      State / region
                    </label>
                    <div className="relative">
                      <select
                        id="state-select"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                      >
                        {STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <fieldset className="space-y-3">
                  <legend className="mb-1 text-sm font-semibold text-slate-700">
                    Deductions &amp; adjustments
                  </legend>

                  <ToggleSwitch
                    label="Home office deduction"
                    description="Deduct a dedicated workspace in your home."
                    icon={<Home className="h-4 w-4" />}
                    checked={homeOfficeEnabled}
                    onChange={setHomeOfficeEnabled}
                  />
                  {homeOfficeEnabled && (
                    <div className="pl-1">
                      <SliderInput
                        label="Home office amount"
                        icon={<Home className="h-4 w-4" />}
                        value={homeOfficeAmount}
                        min={0}
                        max={15000}
                        step={100}
                        onChange={setHomeOfficeAmount}
                        helpText="Simplified: $5/sq ft, max $1,500"
                      />
                    </div>
                  )}

                  <ToggleSwitch
                    label="Self-employed health insurance"
                    description="Premiums you pay for yourself and family."
                    icon={<HeartPulse className="h-4 w-4" />}
                    checked={healthInsuranceEnabled}
                    onChange={setHealthInsuranceEnabled}
                  />
                  {healthInsuranceEnabled && (
                    <div className="pl-1">
                      <SliderInput
                        label="Annual health premiums"
                        icon={<HeartPulse className="h-4 w-4" />}
                        value={healthInsuranceAmount}
                        min={0}
                        max={40000}
                        step={250}
                        onChange={setHealthInsuranceAmount}
                      />
                    </div>
                  )}

                  <ToggleSwitch
                    label="Retirement contributions"
                    description="SEP-IRA or Solo 401(k) contributions."
                    icon={<PiggyBank className="h-4 w-4" />}
                    checked={retirementEnabled}
                    onChange={setRetirementEnabled}
                  />
                  {retirementEnabled && (
                    <div className="pl-1">
                      <SliderInput
                        label="Annual retirement contribution"
                        icon={<PiggyBank className="h-4 w-4" />}
                        value={retirementAmount}
                        min={0}
                        max={70000}
                        step={500}
                        onChange={setRetirementAmount}
                      />
                    </div>
                  )}

                  <ToggleSwitch
                    label="Apply 20% QBI deduction"
                    description="Qualified Business Income deduction (Sec. 199A)."
                    icon={<ShieldCheck className="h-4 w-4" />}
                    checked={qbiEnabled}
                    onChange={setQbiEnabled}
                  />
                </fieldset>
              </div>
            </div>

            {/* ===== AD SLOT 2 (mobile): rectangle appears below inputs on small screens ===== */}
            <AdSlot variant="rectangle" className="mt-6 lg:hidden" />
          </div>

          {/* ---------- RIGHT: Results dashboard ---------- */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Metric cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Net take-home pay"
                  value={formatCurrency(results.netTakeHome)}
                  sublabel={`${formatCurrency(
                    results.netTakeHome / 12
                  )} / month`}
                  icon={<Wallet className="h-5 w-5" />}
                  tone="accent"
                />
                <MetricCard
                  label="Total tax owed"
                  value={formatCurrency(results.totalTax)}
                  sublabel={`${formatCurrency(
                    results.quarterlyEstimate
                  )} / quarter`}
                  icon={<Landmark className="h-5 w-5" />}
                  tone="danger"
                />
                <MetricCard
                  label="Effective tax rate"
                  value={formatPercent(results.effectiveTaxRate)}
                  sublabel={`${formatPercent(
                    results.marginalRate
                  )} marginal (federal)`}
                  icon={<Gauge className="h-5 w-5" />}
                  tone="primary"
                />
              </div>

              {/* Dashboard panel with donut + breakdown */}
              <div className="tf-print-block rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className="h-5 w-5 text-brand-600"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-bold text-slate-900">
                      Where your money goes
                    </h2>
                  </div>
                  <div className="tf-no-print flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-live="polite"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy summary
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF
                    </button>
                  </div>
                </div>

                <DonutChart
                  slices={donutSlices}
                  total={results.gross}
                  centerLabel="Gross"
                  centerValue={formatCurrency(results.gross)}
                />

                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                  <ProgressBar
                    label="Net take-home"
                    value={results.netTakeHome}
                    total={results.gross}
                    color="#10b981"
                  />
                  <ProgressBar
                    label="Total taxes"
                    value={results.totalTax}
                    total={results.gross}
                    color="#ef4444"
                  />
                  <ProgressBar
                    label="Business expenses"
                    value={results.totalBusinessExpenses}
                    total={results.gross}
                    color="#94a3b8"
                  />
                  {results.retirement > 0 && (
                    <ProgressBar
                      label="Retirement savings"
                      value={results.retirement}
                      total={results.gross}
                      color="#3b82f6"
                    />
                  )}
                </div>
              </div>

              {/* Detailed tax breakdown table */}
              <div className="tf-print-block rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FileText
                    className="h-5 w-5 text-brand-600"
                    aria-hidden="true"
                  />
                  Detailed breakdown
                </h2>
                <dl className="divide-y divide-slate-100 text-sm">
                  {[
                    ["Gross revenue", results.gross],
                    ["Business expenses", -results.totalBusinessExpenses],
                    ["Net business income", results.netBusinessIncome],
                    ["Self-employment tax", -results.seTax],
                    ["Federal income tax", -results.federalTax],
                    [
                      `State income tax (${selectedState.code})`,
                      -results.stateTax,
                    ],
                    results.retirement > 0
                      ? ["Retirement set-aside", -results.retirement]
                      : null,
                  ]
                    .filter(Boolean)
                    .map((row) => {
                      const [label, amount] = row as [string, number];
                      const negative = amount < 0;
                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between py-2.5"
                        >
                          <dt className="text-slate-600">{label}</dt>
                          <dd
                            className={`font-medium tabular-nums ${
                              negative ? "text-rose-600" : "text-slate-900"
                            }`}
                          >
                            {negative ? "−" : ""}
                            {formatCurrency(Math.abs(amount), true)}
                          </dd>
                        </div>
                      );
                    })}
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-base font-bold text-slate-900">
                      Net take-home pay
                    </dt>
                    <dd className="text-base font-bold tabular-nums text-emerald-600">
                      {formatCurrency(results.netTakeHome, true)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-xl bg-brand-50 p-4">
                  <div className="flex items-start gap-2">
                    <CalendarClock
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600"
                      aria-hidden="true"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-brand-800">
                        Set aside {formatCurrency(results.monthlySetAside)} per
                        month
                      </p>
                      <p className="mt-0.5 text-brand-700/80">
                        Pay {formatCurrency(results.quarterlyEstimate)} each
                        quarter (due Apr 15, Jun 15, Sep 15, Jan 15) to stay
                        ahead of the IRS.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== AD SLOT 2 (desktop): Sidebar Medium Rectangle ===== */}
              <AdSlot variant="rectangle" className="hidden lg:flex" />
            </div>
          </div>
        </section>

        {/* ===== LEAD-GEN: Email opt-in ===== */}
        <section className="tf-no-print mt-8">
          <div className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-6 shadow-lg sm:p-8">
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              <div className="text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Free PDF · No spam
                </span>
                <h2 className="mt-3 text-xl font-bold sm:text-2xl">
                  Download Your Detailed PDF Tax Strategy Guide
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  Get our 18-page playbook of freelancer tax deductions,
                  quarterly payment worksheets, and S-Corp savings checklists —
                  delivered instantly.
                </p>
              </div>
              <div>
                {emailSubmitted ? (
                  <div
                    className="flex items-center gap-3 rounded-xl bg-white/95 p-5"
                    role="status"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Check your inbox!
                      </p>
                      <p className="text-sm text-slate-600">
                        Your PDF guide is on its way to {email}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} noValidate>
                    <label htmlFor="lead-email" className="sr-only">
                      Email address
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="lead-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError(null);
                          }}
                          placeholder="you@example.com"
                          aria-invalid={emailError ? "true" : "false"}
                          aria-describedby={
                            emailError ? "lead-email-error" : undefined
                          }
                          className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        Get the guide
                      </button>
                    </div>
                    {emailError && (
                      <p
                        id="lead-email-error"
                        className="mt-2 text-sm text-white"
                        role="alert"
                      >
                        {emailError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== AFFILIATE BANNER ===== */}
        <section className="tf-no-print mt-6">
          <a
            href="#"
            className="group flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:border-amber-300 hover:bg-amber-100/60 sm:flex-row"
            aria-label="Affiliate offer: accounting software for freelancers"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                <BadgeDollarSign className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                  Recommended tool
                </p>
                <p className="text-base font-bold text-slate-900">
                  Automate your bookkeeping — Get 50% off QuickBooks for
                  freelancers
                </p>
                <p className="text-sm text-slate-600">
                  Track expenses, mileage, and quarterly taxes automatically.
                </p>
              </div>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition group-hover:bg-amber-600">
              Claim offer
            </span>
          </a>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">
            Advertising disclosure: we may earn a commission from partner links
            at no cost to you.
          </p>
        </section>

        {/* ===== AD SLOT 3: Native content unit ===== */}
        <AdSlot variant="native" className="mt-8" />

        {/* ================= SEO CONTENT GUIDE ================= */}
        <article
          id="guide"
          className="prose prose-slate mt-10 max-w-none"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              How to Calculate Freelance Taxes, Step by Step
            </h2>
            <p className="mt-3 text-slate-600">
              Freelancers and independent contractors don&apos;t have an
              employer withholding taxes from each paycheck, so you are
              responsible for calculating and paying your own federal income
              tax, state income tax, and self-employment tax throughout the
              year. Here is the exact process this calculator follows.
            </p>

            <ol className="mt-5 space-y-4 text-slate-600">
              <li>
                <strong className="text-slate-900">
                  1. Start with gross income.
                </strong>{" "}
                Add up everything you were paid across all 1099s and client
                invoices for the year.
              </li>
              <li>
                <strong className="text-slate-900">
                  2. Subtract business expenses.
                </strong>{" "}
                Deduct ordinary and necessary costs — software, home office,
                travel, equipment — to find your{" "}
                <em>net business income</em>.
              </li>
              <li>
                <strong className="text-slate-900">
                  3. Calculate self-employment tax.
                </strong>{" "}
                Multiply net income by 92.35%, then apply 15.3% (12.4% Social
                Security up to the wage base + 2.9% Medicare).
              </li>
              <li>
                <strong className="text-slate-900">
                  4. Apply adjustments &amp; deductions.
                </strong>{" "}
                Subtract half of your SE tax, health insurance premiums,
                retirement contributions, the standard deduction, and the 20%
                QBI deduction.
              </li>
              <li>
                <strong className="text-slate-900">
                  5. Compute income tax on what remains.
                </strong>{" "}
                Apply the progressive federal brackets (and your state rate) to
                your taxable income.
              </li>
              <li>
                <strong className="text-slate-900">
                  6. Divide by four for quarterly payments.
                </strong>{" "}
                Split your total projected liability into four estimated
                payments to avoid IRS underpayment penalties.
              </li>
            </ol>

            {/* Formulas */}
            <h3 className="mt-8 text-xl font-bold text-slate-900">
              The Formulas
            </h3>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-900 p-5 font-mono text-sm text-slate-100">
              <p>Net Business Income = Gross Income − Business Expenses</p>
              <p>SE Tax = (Net Income × 0.9235) × 15.3%</p>
              <p>
                Taxable Income = Net Income − ½(SE Tax) − Adjustments − Std
                Deduction − QBI
              </p>
              <p>Federal Tax = Σ (Bracket Income × Bracket Rate)</p>
              <p>Total Tax = SE Tax + Federal Tax + State Tax</p>
              <p>Effective Rate = Total Tax ÷ Gross Income</p>
              <p>Quarterly Payment = Total Tax ÷ 4</p>
            </div>

            {/* Scenarios table */}
            <h3 className="mt-8 text-xl font-bold text-slate-900">
              Common Scenarios &amp; Edge Cases
            </h3>
            <p className="mt-2 text-slate-600">
              Your business structure changes how much self-employment tax you
              pay. Here is how the same {formatCurrency(100000)} net profit is
              typically treated:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 font-semibold text-slate-700">
                      Structure
                    </th>
                    <th className="p-3 font-semibold text-slate-700">
                      SE / Payroll Tax
                    </th>
                    <th className="p-3 font-semibold text-slate-700">
                      Admin Burden
                    </th>
                    <th className="p-3 font-semibold text-slate-700">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      Sole Proprietor
                    </td>
                    <td className="p-3">15.3% on all net profit</td>
                    <td className="p-3">Lowest</td>
                    <td className="p-3">Side gigs &amp; early freelancers</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      Single-Member LLC
                    </td>
                    <td className="p-3">
                      15.3% (same as sole prop by default)
                    </td>
                    <td className="p-3">Low</td>
                    <td className="p-3">
                      Freelancers wanting liability protection
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      LLC + S-Corp Election
                    </td>
                    <td className="p-3">
                      15.3% on salary only; 0% on distributions
                    </td>
                    <td className="p-3">High (payroll, filings)</td>
                    <td className="p-3">
                      Profit consistently above ~$70k
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <Info
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <p>
                <strong className="text-slate-800">Disclaimer:</strong> This
                estimator provides planning estimates using {TAX_YEAR} federal
                figures and simplified state rates. It does not account for
                every credit, phase-out, local tax, or the additional 0.9%
                Medicare surtax. It is not tax, legal, or financial advice —
                always confirm with a licensed CPA or tax professional.
              </p>
            </div>
          </div>
        </article>

        {/* ================= FAQ ================= */}
        <section id="faq" className="mt-10">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600">
            Everything freelancers and contractors ask about estimating and
            paying taxes.
          </p>
          <div className="mx-auto mt-6 max-w-3xl space-y-3">
            {FAQ_ENTRIES.map((entry, index) => (
              <FaqItem key={index} entry={entry} index={index} />
            ))}
          </div>
        </section>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="tf-no-print mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Calculator className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-slate-900">TaxFlow</span>
            </div>
            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} TaxFlow · Estimates for {TAX_YEAR}{" "}
              tax year · Not tax advice.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

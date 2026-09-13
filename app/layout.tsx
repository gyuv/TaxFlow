import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "TaxFlow";
const TOOL_NAME = "Freelance Tax & Net Income Estimator";
const DESCRIPTION =
  "Free Freelance Tax & Net Income Estimator. Instantly calculate quarterly tax liabilities, self-employment tax, deductions, effective tax rate, and net take-home pay for freelancers, contractors, and self-employed professionals.";

export const metadata: Metadata = {
  metadataBase: new URL("https://taxflow.app"),
  title: {
    default: `${TOOL_NAME} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "freelance tax calculator",
    "self employment tax calculator",
    "1099 tax calculator",
    "quarterly estimated tax calculator",
    "net income estimator",
    "contractor take home pay",
    "self employed tax deductions",
    "QBI deduction calculator",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${TOOL_NAME} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TOOL_NAME} | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e62f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "TaskMatrix AI";
const DESCRIPTION =
  "TaskMatrix AI is a privacy-first, zero-server multi-tool suite that runs 100% in your browser: a local PDF & image redactor/anonymizer, a high-precision invoice & tax calculator, a real-time meeting cost ticker, and a JSON/CSV data sanitizer. No uploads, no tracking, no data ever leaves your device.";

export const metadata: Metadata = {
  metadataBase: new URL("https://taskmatrix.ai"),
  title: {
    default: `${APP_NAME} — Privacy-First Local PDF, Invoice, Meeting & Data Tools`,
    template: `%s | ${APP_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "local pdf redaction",
    "browser pdf anonymizer",
    "client side pdf editor",
    "redact pii offline",
    "invoice tax calculator",
    "bignumber invoice math",
    "meeting cost calculator",
    "json to csv converter",
    "csv to json parser",
    "privacy first tools",
    "no upload document tools",
  ],
  authors: [{ name: APP_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Privacy-First Local Multi-Tool Suite`,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Privacy-First Local Multi-Tool Suite`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

// Blocking script that applies the persisted theme before first paint to
// prevent a flash of the wrong color scheme (FOUC) and layout shift.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('taskmatrix-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

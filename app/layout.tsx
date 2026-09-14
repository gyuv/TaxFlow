import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "TaskMatrix AI";
const DESCRIPTION =
  "TaskMatrix AI is a privacy-first, zero-server platform of 18 utilities that run 100% in your browser: PDF redactor, an advanced PDF editor with text & e-signature, contract diff, legal document generator, watermark studio, invoice & tax engine, meeting cost ticker, freelance pay estimator, EXIF stripper, AES-256-GCM vault, JWT debugger, data sanitizer, SQL formatter, mock API builder, SVG optimizer, subnet calculator, image compressor, and screenshot annotator. No uploads, no tracking, no data ever leaves your device.";

export const metadata: Metadata = {
  metadataBase: new URL("https://taskmatrix.ai"),
  title: {
    default: `${APP_NAME} — 18 Privacy-First Local Tools for Docs, Dev, Security & Media`,
    template: `%s | ${APP_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "pdf editor online free",
    "sign pdf in browser",
    "add text to pdf",
    "local pdf redactor",
    "contract diff comparator",
    "legal document generator",
    "image pdf watermark tool",
    "invoice tax calculator",
    "meeting cost calculator",
    "exif metadata remover",
    "aes 256 gcm encryption online",
    "jwt decoder debugger",
    "json csv sanitizer",
    "sql formatter beautifier",
    "mock json data generator",
    "svg optimizer online",
    "subnet cidr calculator",
    "client side image compressor",
    "screenshot annotator markup",
    "privacy first offline tools",
  ],
  authors: [{ name: APP_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — 18 Privacy-First Local Tools`,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — 18 Privacy-First Local Tools`,
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

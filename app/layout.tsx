import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_NAME = "TaskMatrix AI v2.0";
const DESCRIPTION =
  "TaskMatrix AI v2.0 is a privacy-first, zero-server utility suite that runs 100% in your browser using native Web APIs: a local image/file compressor, EXIF & metadata stripper, JWT debugger, AES-256-GCM encryption vault, synthetic API mock-data generator, and SQL formatter. No uploads, no tracking, no data ever leaves your device.";

export const metadata: Metadata = {
  metadataBase: new URL("https://taskmatrix.ai"),
  title: {
    default: `${APP_NAME} — Local Image Compressor, EXIF Stripper, JWT & AES Tools`,
    template: `%s | ${APP_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "client side image compressor",
    "browser image resizer",
    "exif metadata remover",
    "strip gps from photo",
    "jwt decoder debugger",
    "jwt expiry checker",
    "aes 256 gcm encryption online",
    "web crypto encrypt text",
    "mock json data generator",
    "sql formatter beautifier",
    "privacy first developer tools",
    "no upload offline tools",
  ],
  authors: [{ name: APP_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Privacy-First Local Developer & Security Toolkit`,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Privacy-First Local Developer & Security Toolkit`,
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

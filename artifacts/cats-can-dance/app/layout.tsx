/**
 * app/layout.tsx — Root layout for App Router pages.
 *
 * Coexists with pages/ (Pages Router). Next.js runs both simultaneously:
 *   - pages/* → Pages Router (existing)
 *   - app/*   → App Router  (new, takes priority when paths overlap)
 *
 * This layout provides all the client-side providers needed by child pages.
 * We keep all providers in a single "Providers" client component so the
 * layout shell itself stays a server component (lighter, faster TTFB).
 *
 * Fonts, global CSS, and metadata are declared here once — not in _document.
 */
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "@/index.css";
import "@/pages/ccd.css";

// ── Site-wide metadata (pages override per-page via generateMetadata) ────────

export const metadata: Metadata = {
  metadataBase: new URL("https://catscandance.com"),
  title: {
    default: "Cats Can Dance — Bangalore Underground Dance Music",
    template: "%s — Cats Can Dance",
  },
  description:
    "Cats Can Dance is Bangalore's underground dance music crew. Discover artists, events, and culture from India's electronic scene.",
  keywords: ["cats can dance", "bangalore electronic music", "underground dance", "indian dj", "techno bangalore"],
  authors: [{ name: "Cats Can Dance" }],
  creator: "Cats Can Dance",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Cats Can Dance",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cats Can Dance — Bangalore underground crew. Parties, drops, culture.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@catscandance",
    creator: "@catscandance",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://catscandance.com",
    languages: {
      "x-default": "https://catscandance.com",
      "en-IN": "https://catscandance.com",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff2bd6" },
    { media: "(prefers-color-scheme: dark)",  color: "#0E0E10" },
  ],
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for Google Fonts — loaded in CSS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* Structured data — Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "LocalBusiness"],
              name: "Cats Can Dance",
              alternateName: "CCD",
              url: "https://catscandance.com",
              logo: "https://catscandance.com/ccd-logo.png",
              image: "https://catscandance.com/og-image.jpg",
              description:
                "Cats Can Dance is a Bangalore, India brand running underground dance music Episodes and a streetwear label.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Bangalore",
                addressRegion: "Karnataka",
                addressCountry: "IN",
              },
              sameAs: [
                "https://instagram.com/catscandance",
                "https://www.youtube.com/@catscandance",
              ],
            }),
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

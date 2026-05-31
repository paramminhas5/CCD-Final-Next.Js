import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Charset and viewport are set by Next.js automatically */}
        <meta name="author" content="Cats Can Dance" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="theme-color" content="#ff2bd6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0E0E10" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* Hreflang */}
        <link rel="alternate" hrefLang="x-default" href="https://catscandance.com/" />
        <link rel="alternate" hrefLang="en-IN" href="https://catscandance.com/" />
        <link rel="alternate" type="application/rss+xml" title="Cats Can Dance — Blog" href="https://catscandance.com/rss.xml" />

        {/* Icons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="CCD" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="application-name" content="Cats Can Dance" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* IndieWeb identity */}
        <link rel="me" href="https://instagram.com/catscandance" />
        <link rel="me" href="https://www.youtube.com/@catscandance" />

        {/* Geo */}
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Bangalore" />
        <meta name="geo.position" content="12.9716;77.5946" />
        <meta name="ICBM" content="12.9716, 77.5946" />

        {/* Default Open Graph (page-specific overridden via next/head) */}
        <meta property="og:site_name" content="Cats Can Dance" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:image" content="https://catscandance.com/og-image.jpg?v=2" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Cats Can Dance — Bangalore underground crew. Parties, drops, culture." />

        {/* Default Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@catscandance" />
        <meta name="twitter:image" content="https://catscandance.com/og-image.jpg?v=2" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//cdn.shopify.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "LocalBusiness"],
              "name": "Cats Can Dance",
              "alternateName": "CCD",
              "url": "https://catscandance.com",
              "logo": "https://catscandance.com/ccd-logo.png",
              "image": "https://catscandance.com/og-image.jpg",
              "description": "Cats Can Dance is a Bangalore, India brand running underground dance music Episodes and a streetwear label.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bangalore",
                "addressRegion": "Karnataka",
                "addressCountry": "IN"
              },
              "geo": { "@type": "GeoCoordinates", "latitude": 12.9716, "longitude": 77.5946 },
              "areaServed": [
                { "@type": "City", "name": "Bangalore" },
                { "@type": "Country", "name": "India" }
              ],
              "sameAs": [
                "https://instagram.com/catscandance",
                "https://www.tiktok.com/@catscandance",
                "https://www.youtube.com/@catscandance"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "hello@catscandance.com",
                "contactType": "customer support",
                "areaServed": "IN"
              }
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Cats Can Dance",
              "url": "https://catscandance.com",
              "inLanguage": "en-IN",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://catscandance.com/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

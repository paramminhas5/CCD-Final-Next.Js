/**
 * app/lib/metadata.ts — typed metadata helpers for App Router pages.
 *
 * Replaces the Pages Router <SEO> component for all app/ pages.
 * Use generateMetadata() in each page to call these helpers.
 *
 * Usage:
 *   export async function generateMetadata({ params }) {
 *     const artist = await getArtist(params.slug);
 *     return artistMetadata(artist);
 *   }
 */
import type { Metadata } from "next";

const SITE     = "https://catscandance.com";
const SITE_NAME = "Cats Can Dance";
const DEFAULT_OG = `${SITE}/og-image.jpg?v=2`;

// ── Base helper — builds full Metadata from common fields ─────────────────────

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  imageAlt,
  type = "website",
  keywords,
  noindex = false,
  jsonLd,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
  jsonLd?: object | object[];
}): Metadata {
  const url   = `${SITE}${path}`;
  const ogImg = image
    ? image.startsWith("http") ? image : `${SITE}${image.startsWith("/") ? "" : "/"}${image}`
    : DEFAULT_OG;
  const alt = imageAlt ?? title;

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    robots: noindex
      ? { index: false, follow: false }
      : {
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
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [
        {
          url: ogImg,
          width: 1200,
          height: 630,
          alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@catscandance",
      creator: "@catscandance",
      title,
      description,
      images: [{ url: ogImg, alt }],
    },
    // JSON-LD is injected via <script> in the page component, not here,
    // because Next.js Metadata API doesn't have a jsonLd field.
  };
}

// ── Artist directory page ─────────────────────────────────────────────────────

export function artistsPageMetadata(): Metadata {
  return buildMetadata({
    title: "Artists — Cats Can Dance | India's Electronic Music Directory",
    description:
      "Discover India's top electronic music artists. Browse DJs, producers, and live acts from Bangalore, Mumbai, Delhi and beyond.",
    path: "/artists",
    keywords: [
      "indian electronic artists",
      "bangalore dj",
      "techno india",
      "house music artists india",
      "cats can dance artists",
    ],
  });
}

// ── Single artist page ────────────────────────────────────────────────────────

export function artistPageMetadata(artist: {
  name: string;
  slug: string;
  bio?: string | null;
  based_city?: string | null;
  from_city?: string | null;
  genres: string[];
  photo_url?: string | null;
}): Metadata {
  const city      = artist.based_city ?? artist.from_city ?? "India";
  const genres    = (artist.genres ?? []).slice(0, 3).join(", ");
  const title     = `${artist.name} — Artist Profile`;
  const description =
    artist.bio
      ? `${artist.bio.slice(0, 155)}…`
      : `${artist.name} is a ${genres} artist from ${city}. Book, follow, and explore their full profile on Cats Can Dance.`;

  return buildMetadata({
    title,
    description,
    path: `/artists/${artist.slug}`,
    image: artist.photo_url ?? undefined,
    imageAlt: `${artist.name} — artist photo`,
    keywords: [
      artist.name.toLowerCase(),
      ...artist.genres.map((g) => g.toLowerCase()),
      `${city.toLowerCase()} dj`,
      "indian electronic artist",
    ],
  });
}

import { GetServerSideProps } from "next";
import { CITY_SCENES, GLOBAL_SCENES, GENRE_PAGES } from "@/content/scenes";

const BASE = "https://catscandance.com";

function url(loc: string, priority: string, changefreq: string, lastmod?: string) {
  return `  <url>
    <loc>${BASE}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod ?? new Date().toISOString().split("T")[0]}</lastmod>
  </url>`;
}

function buildSitemap(artistSlugs: string[]): string {
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    url("/", "1.0", "weekly", today),
    url("/discover", "0.95", "weekly", today),
    url("/about", "0.8", "monthly"),
    url("/events", "1.0", "daily", today),
    url("/artists", "0.95", "weekly", today),
    url("/promoters", "0.85", "weekly", today),
    url("/shop", "0.85", "weekly", today),
    url("/blog", "0.9", "weekly", today),
    url("/videos", "0.7", "monthly"),
    url("/playlists", "0.7", "monthly"),
    url("/press", "0.6", "monthly"),
    url("/media", "0.6", "monthly"),
    url("/pets", "0.7", "monthly"),
    url("/care", "0.7", "monthly"),
    url("/bengaluru-underground-dance-music", "0.9", "monthly"),
    url("/bengaluru-techno-events", "0.85", "monthly"),
    url("/bengaluru-house-parties", "0.85", "monthly"),
    url("/submit-event", "0.6", "monthly"),
    url("/for-artists", "0.75", "monthly"),
    url("/for-venues", "0.75", "monthly"),
    url("/for-investors", "0.7", "monthly"),
  ];

  const cityUrls = CITY_SCENES.map(c =>
    url(`/scene/${c.slug}`, "0.9", "weekly", today)
  );

  const genreUrls = GENRE_PAGES.map(g =>
    url(`/genres/${g.slug}`, "0.85", "monthly")
  );

  const sceneUrls = GLOBAL_SCENES.map(s =>
    url(`/scenes/${s.slug}`, "0.8", "monthly")
  );

  const artistUrls = artistSlugs.map(slug =>
    url(`/artists/${slug}`, "0.8", "monthly", today)
  );

  const allUrls = [
    ...staticUrls,
    ...cityUrls,
    ...genreUrls,
    ...sceneUrls,
    ...artistUrls,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.join("\n")}
</urlset>`;
}

export default function SitemapXml() {
  // Rendered server-side only — component never actually renders
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Fetch all artist slugs
  let artistSlugs: string[] = [];
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const r = await fetch(`${apiBase}/artists`);
    if (r.ok) {
      const data = await r.json();
      artistSlugs = Array.isArray(data) ? data.map((a: { slug: string }) => a.slug).filter(Boolean) : [];
    }
  } catch {
    // silently skip — sitemap still works without artist slugs
  }

  const sitemap = buildSitemap(artistSlugs);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

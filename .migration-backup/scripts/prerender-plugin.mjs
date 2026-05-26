// Vite plugin: after build, generate per-route static HTML files with
// route-specific <title>, meta description, canonical, OG/Twitter tags,
// and (for blog posts) a real article body — so crawlers receive proper
// HTML on the first response instead of an empty SPA shell.
//
// The React app still hydrates on top of these files in the browser.

import fs from "node:fs";
import path from "node:path";
import { SITE, staticRoutes } from "./seo-routes.mjs";

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Extract the static blog posts from src/content/posts.ts without executing
// the module (it imports React-flavoured runtime). We only need the literal
// rawPosts array entries: slug, title, excerpt, date, author, category, body[].
function loadStaticPosts() {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/content/posts.ts"),
    "utf8",
  );
  const start = src.indexOf("const rawPosts: Post[] = [");
  if (start === -1) return [];
  // Find the matching closing "];" for the array.
  let depth = 0;
  let i = src.indexOf("[", start);
  const arrStart = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  const arrText = src.slice(arrStart, i + 1);
  // Parse with a sandboxed Function — the array contents are pure data.
  // eslint-disable-next-line no-new-func
  const posts = new Function(`return ${arrText};`)();
  return posts;
}

function buildHeadReplacement({
  title,
  description,
  url,
  type = "website",
  jsonLd = [],
}) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  const ldTags = jsonLd
    .map(
      (obj) =>
        `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n    ");
  return { t, d, u, type, ldTags };
}

function patchHtml(template, { t, d, u, type, ldTags }) {
  let html = template;
  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  // meta description
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${d}" />`,
  );
  // canonical
  html = html.replace(
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${u}" />`,
  );
  // hreflang x-default + en-IN
  html = html.replace(
    /<link\s+rel=["']alternate["']\s+hreflang=["']x-default["'][^>]*>/i,
    `<link rel="alternate" hreflang="x-default" href="${u}" />`,
  );
  html = html.replace(
    /<link\s+rel=["']alternate["']\s+hreflang=["']en-IN["'][^>]*>/i,
    `<link rel="alternate" hreflang="en-IN" href="${u}" />`,
  );
  // og:url, og:title, og:description, og:type
  html = html.replace(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${u}" />`,
  );
  html = html.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${t}" />`,
  );
  html = html.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${d}" />`,
  );
  html = html.replace(
    /<meta\s+property=["']og:type["'][^>]*>/i,
    `<meta property="og:type" content="${type}" />`,
  );
  // twitter
  html = html.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${t}" />`,
  );
  html = html.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${d}" />`,
  );
  // Inject route-specific JSON-LD just before </head>
  if (ldTags) {
    html = html.replace("</head>", `    ${ldTags}\n  </head>`);
  }
  return html;
}

function injectArticleBody(html, post, url) {
  const safeTitle = escapeHtml(post.title);
  const safeExcerpt = escapeHtml(post.excerpt);
  const safeAuthor = escapeHtml(post.author);
  const safeDate = escapeHtml(post.date);
  const safeCat = escapeHtml(post.category || post.tag || "JOURNAL");
  const paragraphs = (post.body || [])
    .map(
      (p) =>
        `<p>${escapeHtml(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`,
    )
    .join("\n      ");
  const tldr =
    post.tldr && post.tldr.length
      ? `<aside><h2>TL;DR</h2><ul>${post.tldr
          .map((t) => `<li>${escapeHtml(t)}</li>`)
          .join("")}</ul></aside>`
      : "";
  const seoBlock = `
    <article id="prerender-content" data-prerender="1" style="position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden;">
      <header>
        <p>${safeCat}</p>
        <h1>${safeTitle}</h1>
        <p>${safeDate} · ${safeAuthor}</p>
        <p>${safeExcerpt}</p>
      </header>
      ${tldr}
      <div>
        ${paragraphs}
      </div>
      <p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
    </article>`;
  // Insert inside the root container so it's part of initial HTML but
  // gets replaced when React hydrates the SPA shell.
  return html.replace(
    /<div id="root">([\s\S]*?)<\/div>/,
    `<div id="root">$1${seoBlock}</div>`,
  );
}

function injectGenericIntro(html, { title, description, url }) {
  const block = `
    <section id="prerender-content" data-prerender="1" style="position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden;">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
    </section>`;
  return html.replace(
    /<div id="root">([\s\S]*?)<\/div>/,
    `<div id="root">$1${block}</div>`,
  );
}

function writeRouteFile(outDir, routePath, html) {
  // For "/" we keep dist/index.html; for "/about" we write
  // dist/about/index.html so static hosting serves it before the SPA fallback.
  if (routePath === "/" || routePath === "") {
    fs.writeFileSync(path.join(outDir, "index.html"), html);
    return;
  }
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  const dir = path.join(outDir, clean);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function generateSitemap(outDir, posts, events) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const r of staticRoutes) {
    urls.push(
      `  <url><loc>${SITE}${r.path === "/" ? "/" : r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority><lastmod>${today}</lastmod></url>`,
    );
  }
  for (const p of posts) {
    urls.push(
      `  <url><loc>${SITE}/blog/${p.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`,
    );
  }
  for (const e of events) {
    urls.push(
      `  <url><loc>${SITE}/events/${e.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${today}</lastmod></url>`,
    );
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    "\n",
  )}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml);
}

function generateImageSitemap(outDir, posts, events) {
  const entries = [];
  for (const e of events) {
    if (!e.poster_url) continue;
    const img = e.poster_url.startsWith("http") ? e.poster_url : `${SITE}/${e.poster_url.replace(/^\/+/, "")}`;
    entries.push(
      `  <url><loc>${SITE}/events/${e.slug}</loc><image:image><image:loc>${escapeHtml(img)}</image:loc><image:title>${escapeHtml(`Cats Can Dance — ${e.title}`)}</image:title></image:image></url>`,
    );
  }
  for (const p of posts) {
    entries.push(
      `  <url><loc>${SITE}/blog/${p.slug}</loc><image:image><image:loc>${SITE}/og-image.jpg</image:loc><image:title>${escapeHtml(p.title)}</image:title></image:image></url>`,
    );
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, "sitemap-images.xml"), xml);
}

function generateSitemapIndex(outDir) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${SITE}/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>\n  <sitemap><loc>${SITE}/sitemap-images.xml</loc><lastmod>${today}</lastmod></sitemap>\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(outDir, "sitemap-index.xml"), xml);
}

function generateRss(outDir, posts) {
  const now = new Date().toUTCString();
  const items = posts.slice(0, 30).map((p) => {
    const link = `${SITE}/blog/${p.slug}`;
    const desc = (p.body || []).slice(0, 2).join(" ").slice(0, 800);
    let pub = now;
    try {
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) pub = d.toUTCString();
    } catch {}
    return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <author>hello@catscandance.com (${escapeHtml(p.author)})</author>
      <category>${escapeHtml(p.category || p.tag || "JOURNAL")}</category>
      <description><![CDATA[${p.excerpt}\n\n${desc}]]></description>
    </item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Cats Can Dance — Journal</title>\n    <link>${SITE}/blog</link>\n    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n    <description>Long reads on Bangalore's underground party scene, India's drop culture, and the artists behind the nights.</description>\n    <language>en-IN</language>\n    <lastBuildDate>${now}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
  fs.writeFileSync(path.join(outDir, "rss.xml"), xml);
}

function generateLlmsTxt(outDir, posts, events) {
  const lines = [];
  lines.push("# Cats Can Dance");
  lines.push("");
  lines.push("> Bangalore underground dance music collective and streetwear label. RSVP-only Episodes, limited drops, no restocks.");
  lines.push("");
  lines.push("## Pages");
  for (const r of staticRoutes) {
    lines.push(`- [${r.title}](${SITE}${r.path === "/" ? "/" : r.path}): ${r.description}`);
  }
  lines.push("");
  lines.push("## Events");
  for (const e of events) {
    lines.push(`- [${e.title} — ${e.city}, ${e.venue} (${e.date})](${SITE}/events/${e.slug}): ${e.blurb || ""}`);
  }
  lines.push("");
  lines.push("## Journal");
  for (const p of posts) {
    lines.push(`- [${p.title}](${SITE}/blog/${p.slug}): ${p.excerpt}`);
  }
  fs.writeFileSync(path.join(outDir, "llms.txt"), lines.join("\n") + "\n");

  // Full corpus for AI training crawlers
  const full = [];
  full.push("# Cats Can Dance — Full Knowledge Base\n");
  full.push("Bangalore underground dance music collective and streetwear label.\n\n");
  for (const p of posts) {
    full.push(`---\n\n# ${p.title}\n`);
    full.push(`URL: ${SITE}/blog/${p.slug}\n`);
    full.push(`Date: ${p.date} · Author: ${p.author} · Category: ${p.category || p.tag}\n\n`);
    full.push(`${p.excerpt}\n\n`);
    if (p.tldr?.length) full.push(`## TL;DR\n${p.tldr.map((t) => `- ${t}`).join("\n")}\n\n`);
    full.push((p.body || []).join("\n\n") + "\n\n");
  }
  fs.writeFileSync(path.join(outDir, "llms-full.txt"), full.join(""));
}

async function fetchEvents() {
  const url = process.env.VITE_SUPABASE_URL || "https://zyilevwfuhymzhezexep.supabase.co";
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5aWxldndmdWh5bXpoZXpleGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDM3MTMsImV4cCI6MjA5MjMxOTcxM30.sAUuKkoZ2dWXcklhjbw8JiVWaOp8cZbZgwzzbTy1Yh0";
  try {
    const res = await fetch(`${url}/rest/v1/events?select=slug,title,date,city,venue,blurb,lineup,status,poster_url&order=sort_order.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("[ccd-prerender] event fetch failed:", err.message);
    return [];
  }
}

function buildEventLd(event) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${event.title}`,
    description: event.blurb || "",
    startDate: event.date,
    eventStatus: event.status === "upcoming" ? "https://schema.org/EventScheduled" : "https://schema.org/EventMovedOnline",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue,
        addressLocality: event.city || "Bangalore",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    image: event.poster_url ? [event.poster_url.startsWith("http") ? event.poster_url : `${SITE}/${event.poster_url.replace(/^\/+/, "")}`] : undefined,
    performer: (event.lineup || []).map((p) => ({ "@type": "PerformingGroup", name: p })),
    organizer: { "@type": "Organization", name: "Cats Can Dance", url: SITE },
    offers: {
      "@type": "Offer",
      url: `${SITE}/events/${event.slug}`,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    url: `${SITE}/events/${event.slug}`,
  };
}

function injectEventBody(html, event, url) {
  const lineup = (event.lineup || []).map((l) => `<li>${escapeHtml(l)}</li>`).join("");
  const block = `
    <article id="prerender-content" data-prerender="1" style="position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden;">
      <header>
        <h1>${escapeHtml(event.title)} — Cats Can Dance</h1>
        <p>${escapeHtml(event.date)} · ${escapeHtml(event.venue)} · ${escapeHtml(event.city || "Bangalore")}</p>
        <p>${escapeHtml(event.blurb || "")}</p>
      </header>
      <h2>Lineup</h2>
      <ul>${lineup}</ul>
      <p><a href="${escapeHtml(url)}">RSVP and details: ${escapeHtml(url)}</a></p>
    </article>`;
  return html.replace(/<div id="root">([\s\S]*?)<\/div>/, `<div id="root">$1${block}</div>`);
}

async function pingSearchEngines() {
  const targets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE + "/sitemap.xml")}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITE + "/sitemap.xml")}`,
  ];
  await Promise.all(targets.map((u) => fetch(u).then(() => console.log(`[ccd-prerender] pinged ${u}`)).catch(() => {})));
}

export default function prerenderPlugin() {
  return {
    name: "ccd-prerender",
    apply: "build",
    async closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, "utf8");

      let posts = [];
      try {
        posts = loadStaticPosts();
      } catch (err) {
        console.warn("[ccd-prerender] failed to load posts:", err.message);
      }

      const events = await fetchEvents();

      // Static routes
      for (const route of staticRoutes) {
        const url = `${SITE}${route.path === "/" ? "/" : route.path}`;
        const head = buildHeadReplacement({
          title: route.title,
          description: route.description,
          url,
          type: "website",
          jsonLd: [],
        });
        let html = patchHtml(template, head);
        html = injectGenericIntro(html, {
          title: route.title,
          description: route.description,
          url,
        });
        writeRouteFile(outDir, route.path, html);
      }

      // Blog posts
      for (const post of posts) {
        const url = `${SITE}/blog/${post.slug}`;
        const title = `${post.title} — Cats Can Dance`;
        const description = post.excerpt;
        const articleLd = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: [`${SITE}/og-image.jpg`],
          datePublished: post.date,
          dateModified: post.date,
          inLanguage: "en-IN",
          author: { "@type": "Person", name: post.author },
          publisher: {
            "@type": "Organization",
            name: "Cats Can Dance",
            logo: { "@type": "ImageObject", url: `${SITE}/ccd-logo.png` },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        };
        const breadcrumbLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        };
        const head = buildHeadReplacement({
          title,
          description,
          url,
          type: "article",
          jsonLd: [articleLd, breadcrumbLd],
        });
        let html = patchHtml(template, head);
        html = injectArticleBody(html, post, url);
        writeRouteFile(outDir, `/blog/${post.slug}`, html);
      }

      // Event detail pages
      for (const event of events) {
        const url = `${SITE}/events/${event.slug}`;
        const title = `${event.title} — Cats Can Dance${event.city ? ` · ${event.city}` : ""}`;
        const description = (event.blurb || `Cats Can Dance ${event.title} — underground dance music in ${event.city || "Bangalore"} at ${event.venue}.`).slice(0, 300);
        const breadcrumbLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
            { "@type": "ListItem", position: 3, name: event.title, item: url },
          ],
        };
        const head = buildHeadReplacement({
          title,
          description,
          url,
          type: "website",
          jsonLd: [buildEventLd(event), breadcrumbLd],
        });
        let html = patchHtml(template, head);
        html = injectEventBody(html, event, url);
        writeRouteFile(outDir, `/events/${event.slug}`, html);
      }

      // Sitemaps + feeds
      generateSitemap(outDir, posts, events);
      generateImageSitemap(outDir, posts, events);
      generateSitemapIndex(outDir);
      generateRss(outDir, posts);
      generateLlmsTxt(outDir, posts, events);

      console.log(
        `[ccd-prerender] wrote ${staticRoutes.length} static + ${posts.length} blog + ${events.length} event pages, sitemap, image-sitemap, rss, llms.txt`,
      );

      // Best-effort search engine ping (non-blocking, ignored if offline)
      if (process.env.CCD_PING_SEARCH === "1") {
        await pingSearchEngines();
      }
    },
  };
}


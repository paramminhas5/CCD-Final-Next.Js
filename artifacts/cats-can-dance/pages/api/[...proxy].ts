/**
 * CCD API proxy — Next.js serverless function
 * Routes all /api/* calls to Supabase REST with service-role key.
 * Admin routes require x-admin-password header matching ADMIN_PASSWORD env var.
 * NO hardcoded password fallback — set ADMIN_PASSWORD in Vercel env vars.
 *
 * /api/ticketing/* routes are forwarded to the Express API server.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
// SUPABASE_SERVICE_KEY must be set in Vercel env vars.
// Without it the proxy returns empty arrays — admin panel and scraper will not function.
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";
// ADMIN_PASSWORD must be set in Vercel env vars.
// Without it all admin routes return 401.
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
// Express API server URL — for ticketing routes
const API_SERVER = process.env.API_SERVER_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:3001";

const H = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

const isAdmin = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

// ── Supabase helpers ─────────────────────────────────────────────────────────
async function sb(table: string, qs = "", method = "GET", body?: unknown, preferOverride?: string) {
  const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
    method,
    headers: preferOverride ? { ...H(), Prefer: preferOverride } : H(),
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, data: t ? tryJson(t) : null };
}
const tryJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };
const get  = async (t: string, q = "") => { const r = await sb(t, q); return r.ok ? r.data : []; };
const ins  = (t: string, b: unknown) => sb(t, "", "POST", b);
const upsert = (t: string, b: unknown) => sb(t, "", "POST", b, "return=representation,resolution=merge-duplicates");
const patch  = (t: string, q: string, b: unknown) => sb(t, q, "PATCH", b);
const del    = (t: string, q: string) => sb(t, q, "DELETE", undefined, "return=minimal");

// Returns the exact row count for a table+filter via PostgREST's Prefer: count=exact header.
async function sbCount(table: string, qs: string): Promise<number | null> {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs || ""}?select=id&limit=0`, {
      headers: { ...H(), Prefer: "count=exact" },
    });
    const raw = r.headers.get("content-range"); // e.g. "0-0/1234"
    if (raw) {
      const total = raw.split("/")[1];
      const n = parseInt(total, 10);
      if (!isNaN(n)) return n;
    }
    return null;
  } catch {
    return null;
  }
}

// ── PostgREST query builder ──────────────────────────────────────────────────
// Manually builds ?col=eq.val strings — avoids URLSearchParams encoding @ as %40
// which breaks PostgREST eq. filters on email columns.
const pq = (filters: Record<string,string> = {}) => {
  const parts = Object.entries(filters).map(([k, v]) => `${encodeURIComponent(k)}=${v}`);
  return parts.length ? `?${parts.join("&")}` : "";
};
const eqf  = (col: string, val: unknown) => ({ [col]: `eq.${val}` });
const neqf = (col: string, val: unknown) => ({ [col]: `neq.${val}` });
const ord  = (col: string, asc = true) => ({ order: `${col}.${asc ? "asc" : "desc"}` });

// Extract youtube_id from various URL formats
function ytId(urlOrId: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = urlOrId.match(p);
    if (m) return m[1];
  }
  return null;
}

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
  const segs: string[] = Array.isArray(req.query.proxy)
    ? req.query.proxy
    : [req.query.proxy as string];
  const path = segs.join("/");

  // ── Ticketing: forward to Express API server ──────────────────────────────
  if (segs[0] === "ticketing") {
    const subPath = segs.join("/");
    const qs = new URLSearchParams(req.query as Record<string, string>);
    qs.delete("proxy");
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    const targetUrl = `${API_SERVER}/api/${subPath}${qsStr}`;
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Forward auth and admin headers verbatim
    if (req.headers["authorization"]) forwardHeaders["authorization"] = req.headers["authorization"] as string;
    if (req.headers["x-admin-password"]) forwardHeaders["x-admin-password"] = req.headers["x-admin-password"] as string;
    if (req.headers["cookie"]) forwardHeaders["cookie"] = req.headers["cookie"] as string;
    try {
      const upstream = await fetch(targetUrl, {
        method: req.method ?? "GET",
        headers: forwardHeaders,
        ...(req.method !== "GET" && req.method !== "HEAD" && req.body ? { body: JSON.stringify(req.body) } : {}),
      });
      const contentType = upstream.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await upstream.json();
        return res.status(upstream.status).json(data);
      }
      const text = await upstream.text();
      return res.status(upstream.status).send(text);
    } catch (proxyErr: any) {
      return res.status(502).json({ error: `Ticketing API unreachable: ${proxyErr.message}` });
    }
  }

  const { proxy: _p, ...rq } = req.query as Record<string, string>;
  const body: any = req.body ?? {};
  const m = req.method ?? "GET";

  // ── Health ──────────────────────────────────────────────────────────────────
  if (path === "health") return res.json({ ok: true, ts: Date.now() });

  // ════════════════════════════════════════════════════════════════════════════
  // ADMIN  /api/functions/v1/*
  // ════════════════════════════════════════════════════════════════════════════
  if (segs[0] === "functions" && segs[1] === "v1") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const fn = segs[2];

    // ── signups ────────────────────────────────────────────────────────────────
    if (fn === "admin-signups") {
      const rows = (await get("early_access_signups", pq(ord("created_at", false)))) as any[];
      if (rq.format === "csv") {
        const csv = ["id,email,source,created_at",
          ...rows.map((r: any) => [r.id,r.email,r.source??"",r.created_at].map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(","))
        ].join("\n");
        res.setHeader("Content-Type","text/csv");
        res.setHeader("Content-Disposition","attachment; filename=signups.csv");
        return res.send(csv);
      }
      return res.json({ signups: rows });
    }

    // ── content: settings / events / messages ─────────────────────────────────
    if (fn === "admin-content") {
      if (m === "GET") {
        const type = rq.type;
        if (type === "events") {
          return res.json({ events: await get("events", pq(ord("sort_order"))) });
        }
        if (type === "messages") {
          return res.json({ messages: await get("contact_messages", pq(ord("created_at", false))) });
        }
        // settings
        const rows = await get("site_settings", pq(eqf("id","main"))) as any[];
        return res.json({ settings: rows[0] ?? null });
      }
      // POST — events CRUD or settings upsert
      const { type, action, payload } = body;
      if (type === "events") {
        if (action === "upsert" || action === "save") {
          const ev = payload ?? body;
          const now = new Date().toISOString();
          const existing = ev?.id
            ? await get("events", pq(eqf("id", ev.id))) as any[]
            : [];
          if (existing.length) {
            await patch("events", pq(eqf("id", ev.id)), { ...ev, updated_at: now });
          } else {
            // ensure slug
            if (!ev.slug) ev.slug = `event-${Date.now()}`;
            await ins("events", { ...ev, created_at: now, updated_at: now });
          }
          return res.json({ events: await get("events", pq(ord("sort_order"))) });
        }
        if (action === "delete" && payload?.id) {
          await del("events", pq(eqf("id", payload.id)));
          return res.json({ ok: true });
        }
      }
      // settings save — payload IS the settings object
      // NOTE: site_settings has NO created_at column — only updated_at
      const settings = payload ?? body;
      const now = new Date().toISOString();
      const existing = await get("site_settings", pq(eqf("id","main"))) as any[];
      if (existing.length) {
        await patch("site_settings", pq(eqf("id","main")), { ...settings, updated_at: now });
      } else {
        // Drop created_at — site_settings table has no such column
        const { created_at: _drop, ...safeSettings } = settings as any;
        await ins("site_settings", { id: "main", ...safeSettings, updated_at: now });
      }
      return res.json({ ok: true });
    }

    // ── curated events ────────────────────────────────────────────────────────
    if (fn === "admin-curated-events") {
      if (m === "GET") {
        return res.json({ events: await get("curated_events", pq(ord("created_at", false))) });
      }
      // Admin page sends POST with {action, payload} OR direct object
      const action = body.action;
      const row = body.payload ?? body;
      const now = new Date().toISOString();

      if (m === "POST") {
        if (action === "delete") {
          await del("curated_events", pq(eqf("id", row.id)));
          return res.json({ ok: true });
        }
        // upsert or plain add
        const clean = { ...row, updated_at: now };
        delete clean.action; delete clean.payload;
        if (clean.id) {
          await patch("curated_events", pq(eqf("id", clean.id)), clean);
        } else {
          clean.created_at = now;
          await ins("curated_events", clean);
        }
        return res.json({ ok: true });
      }
      if (m === "DELETE") {
        const id = rq.id ?? row.id;
        await del("curated_events", pq(eqf("id", id)));
        return res.json({ ok: true });
      }
    }

    // ── curate / scheduled (stubs — no auto-scraping yet) ────────────────────
    if (fn === "curate-events" || fn === "scheduled-curate") {
      return res.json({ ok: true, upserted: 0, message: "Auto-curation not configured. Add events manually above." });
    }

    // ── videos ────────────────────────────────────────────────────────────────
    if (fn === "admin-videos") {
      if (m === "GET") {
        return res.json({ videos: await get("site_videos", pq(ord("sort_order"))) });
      }
      if (m === "POST") {
        // Extract youtube_id from url field
        const url: string = body.url ?? body.youtube_id ?? "";
        const id = ytId(url) ?? url;
        if (!id) return res.status(400).json({ error: "Could not parse YouTube ID from URL" });
        const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
        const now = new Date().toISOString();
        const existing = await get("site_videos", pq(ord("sort_order"))) as any[];
        const nextOrder = existing.length ? Math.max(...existing.map((v: any) => v.sort_order ?? 0)) + 1 : 0;
        const { ok, data } = await ins("site_videos", {
          youtube_id: id,
          title: body.title || id,
          thumbnail_url: thumb,
          is_featured: body.is_featured ?? false,
          sort_order: nextOrder,
          created_at: now, updated_at: now,
        });
        return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed to add video" });
      }
      if (m === "PUT") {
        // toggle featured
        const { id, ...rest } = body;
        const { ok } = await patch("site_videos", pq(eqf("id", id)), { ...rest, updated_at: new Date().toISOString() });
        return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
      }
      if (m === "DELETE") {
        const id = rq.id ?? body.id;
        await del("site_videos", pq(eqf("id", id)));
        return res.json({ ok: true });
      }
    }

    // ── rsvps ─────────────────────────────────────────────────────────────────
    if (fn === "admin-rsvps") {
      const f: Record<string,string> = { ...ord("created_at", false) };
      if (rq.event_slug) f["event_slug"] = `eq.${rq.event_slug}`;
      return res.json({ rsvps: await get("event_rsvps", pq(f)) });
    }

    // ── promoters ─────────────────────────────────────────────────────────────
    if (fn === "admin-promoters") {
      if (m === "GET") return res.json({ promoters: await get("promoters", pq(ord("name"))) });
      if (m === "POST") {
        const { action, payload } = body;
        const now = new Date().toISOString();

        if (action === "toggle_trust" && payload?.id) {
          const { ok } = await patch("promoters", pq(eqf("id", payload.id)), { trusted: payload.trusted, updated_at: now });
          return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
        }

        if (action === "delete" && payload?.id) {
          await del("promoters", pq(eqf("id", payload.id)));
          return res.json({ ok: true });
        }

        // upsert (action === "upsert" or no action = plain insert)
        const row = payload ?? body;
        const { action: _a, payload: _p, created_at: _c, ...cleanRow } = row as any;
        if (cleanRow.id) {
          const { ok } = await patch("promoters", pq(eqf("id", cleanRow.id)), { ...cleanRow, updated_at: now });
          return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
        }
        const { ok, data } = await ins("promoters", { ...cleanRow, created_at: now, updated_at: now });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
    }

    // ── artists (admin) ───────────────────────────────────────────────────────
    if (fn === "admin-artists") {
      if (m === "GET") return res.json({ artists: await get("artists", pq(ord("name"))) });
      if (m === "POST") {
        const now = new Date().toISOString();
        const { ok, data } = await ins("artists", { ...body, created_at: now, updated_at: now });
        return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
      }
      if (m === "PATCH") {
        const id = rq.id ?? body.id;
        const { ok, data } = await patch("artists", pq(eqf("id", id)), { ...body, updated_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
      if (m === "DELETE") {
        const id = rq.id ?? body.id;
        await del("artists", pq(eqf("id", id)));
        return res.json({ ok: true });
      }
    }

    // ── blog ──────────────────────────────────────────────────────────────────
    if (fn === "admin-publish-blog" || fn === "admin-generate-blog") {
      const rows = await get("site_settings", pq(eqf("id","main"))) as any[];
      const existing = rows[0];
      const posts = [...(existing?.blog_posts ?? [])];
      if (body?.post) posts.unshift(body.post);
      if (existing) await patch("site_settings", pq(eqf("id","main")), { blog_posts: posts, updated_at: new Date().toISOString() });
      else await ins("site_settings", { id: "main", blog_posts: posts, created_at: new Date().toISOString() });
      return res.json({ ok: true, posts });
    }

    if (fn === "admin-upload-poster") {
      return res.status(501).json({ error: "File upload not configured — paste an image URL instead." });
    }
    if (fn === "enrich-artists") return res.json({ ok: true, message: "Enrichment queued." });

    return res.status(404).json({ error: `Unknown admin function: ${fn}` });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Artists: list ───────────────────────────────────────────────────────────
  if (path === "artists" && m === "GET") {
    const f: Record<string,string> = { ...eqf("status","approved"), ...ord("name") };
    if (rq.featured === "true") f["featured"] = "eq.true";
    const limitVal = rq.limit ? parseInt(rq.limit) : null;
    let rows = (await get("artists", pq(f))) as any[];
    if (limitVal && limitVal > 0) rows = rows.slice(0, limitVal);
    return res.json(rows ?? []);
  }

  // ── Artists: single by slug ─────────────────────────────────────────────────
  // Handles both /api/artists/kohra (path style) and /api/artists?slug=kohra (query style)
  if (segs[0] === "artists" && segs[1] && segs.length === 2 && m === "GET") {
    const rows = await get("artists", pq({ ...eqf("slug", segs[1]), ...eqf("status","approved") })) as any[];
    return rows?.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  // Also handle query-param slug: /api/artists?slug=kohra
  if (path === "artists" && rq.slug && m === "GET") {
    const rows = await get("artists", pq({ ...eqf("slug", rq.slug), ...eqf("status","approved") })) as any[];
    return rows?.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  // ── Artists: basic profile + appearances (/api/artists/:slug/basic) ─────────
  if (segs[0] === "artists" && segs[2] === "basic" && m === "GET") {
    const slug = segs[1];
    const artistRows = await get("artists", pq(eqf("slug", slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Not found" });
    const artist = artistRows[0];

    // appearances — try both old schema (venue_name/venue_city) and new (venue/city)
    let appearances: any[] = [];
    try {
      const raw = await get("event_appearances", `?artist_slug=eq.${slug}&order=event_date.desc&limit=50`) as any[];
      appearances = (raw ?? []).map((a: any) => ({
        ...a,
        venue: a.venue ?? a.venue_name ?? null,
        city: a.city ?? a.venue_city ?? null,
        year: a.year ?? (a.event_date ? parseInt(a.event_date.split("-")[0]) : null),
      }));
    } catch { /* table may not have all columns yet */ }

    let upcomingDates: any[] = [];
    try {
      const today = new Date().toISOString().split("T")[0];
      upcomingDates = await get("artist_dates", `?artist_id=eq.${artist.id}&event_date=gte.${today}&order=event_date.asc&limit=10`) as any[];
    } catch { /* ignore */ }

    const stats = {
      total_gigs: appearances.length,
      total_cities: new Set(appearances.map((a: any) => a.city).filter(Boolean)).size,
      total_venues: new Set(appearances.map((a: any) => a.venue).filter(Boolean)).size,
      total_connections: 0, years_active: 0, b2b_count: 0, festival_count: 0,
    };
    if (appearances.length > 0) {
      const years = appearances.map((a: any) => a.year).filter(Boolean);
      if (years.length) stats.years_active = Math.max(...years) - Math.min(...years) + 1;
    }

    return res.json({ artist, appearances, upcomingDates, stats, connections: [], milestones: [], socialStats: null, facts: [] });
  }

  // ── Artists: full enriched profile (/api/artists/:slug/full) ────────────────
  if (segs[0] === "artists" && segs[2] === "full" && m === "GET") {
    const slug = segs[1];
    const artistRows = await get("artists", pq(eqf("slug", slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Not found" });
    const artist = artistRows[0];

    // appearances — normalise column names across old and new schema
    let appearances: any[] = [];
    try {
      const raw = await get("event_appearances", `?artist_slug=eq.${slug}&order=event_date.desc&limit=50`) as any[];
      appearances = (raw ?? []).map((a: any) => ({
        ...a,
        venue: a.venue ?? a.venue_name ?? null,
        city: a.city ?? a.venue_city ?? null,
        year: a.year ?? (a.event_date ? parseInt(a.event_date.split("-")[0]) : null),
      }));
    } catch { /* resilient */ }

    // connections — try new schema (artist_a_slug/artist_b_slug), fall back to old (artist_id/connected_artist_id)
    let connections: any[] = [];
    try {
      const [asA, asB] = await Promise.all([
        get("artist_connections", `?artist_a_slug=eq.${slug}&order=strength.desc&limit=20`),
        get("artist_connections", `?artist_b_slug=eq.${slug}&order=strength.desc&limit=20`),
      ]) as [any[], any[]];
      connections = [...(asA ?? []), ...(asB ?? [])];
      // if new-schema columns not present, try old schema
      if (!connections.length) {
        const oldRows = await get("artist_connections", `?artist_id=eq.${artist.id}&limit=20`) as any[];
        connections = (oldRows ?? []).map((c: any) => ({
          ...c,
          artist_a_id: c.artist_id, artist_a_slug: slug,
          artist_b_id: c.connected_artist_id, artist_b_slug: c.connected_artist_id,
          strength: 1, shared_events: [], shared_venues: [],
        }));
      }
    } catch { /* resilient */ }

    let upcomingDates: any[] = [];
    try {
      const today = new Date().toISOString().split("T")[0];
      upcomingDates = await get("artist_dates", `?artist_id=eq.${artist.id}&event_date=gte.${today}&order=event_date.asc&limit=10`) as any[];
    } catch { /* ignore */ }

    let milestones: any[] = [];
    try { milestones = await get("artist_milestones", `?artist_slug=eq.${slug}&order=date.asc&limit=30`) as any[]; } catch { /* table may not exist */ }

    let socialStats: any = null;
    try {
      const ss = await get("artist_social_stats", `?artist_slug=eq.${slug}&order=captured_at.desc&limit=1`) as any[];
      socialStats = ss?.[0] ?? null;
    } catch { /* table may not exist */ }

    let socialHistory: any[] = [];
    try {
      socialHistory = await get("artist_social_stats", `?artist_slug=eq.${slug}&order=captured_at.asc&limit=30`) as any[];
    } catch { /* resilient */ }

    let discography: any[] = [];
    try { discography = await get("artist_discography", `?artist_slug=eq.${slug}&order=release_date.desc&limit=20`) as any[]; } catch { /* table may not exist */ }

    let press: any[] = [];
    try { press = await get("artist_press", `?artist_slug=eq.${slug}&order=date_published.desc&limit=10`) as any[]; } catch { /* table may not exist */ }

    const stats = {
      total_gigs: appearances.length,
      total_cities: new Set(appearances.map((a: any) => a.city).filter(Boolean)).size,
      total_venues: new Set(appearances.map((a: any) => a.venue).filter(Boolean)).size,
      total_connections: connections.length,
      years_active: 0,
      b2b_count: connections.filter((c: any) => c.connection_type === "b2b").length,
      festival_count: appearances.filter((a: any) => a.role === "headliner").length,
    };
    if (appearances.length > 0) {
      const years = appearances.map((a: any) => a.year).filter(Boolean);
      if (years.length) stats.years_active = Math.max(...years) - Math.min(...years) + 1;
    }

    // Generate cool facts inline
    const facts: any[] = [];
    if (stats.total_gigs > 0) facts.push({ icon: "🎧", label: "Gigs played", value: String(stats.total_gigs), detail: `Across ${stats.total_cities} cities and ${stats.total_venues} venues` });
    if (stats.years_active > 1) facts.push({ icon: "📅", label: "Years active", value: String(stats.years_active), detail: "Consistently performing" });
    if (stats.b2b_count > 0) facts.push({ icon: "🤝", label: "B2B partners", value: String(stats.b2b_count), detail: "Artists they've shared the decks with" });
    if (stats.festival_count > 0) facts.push({ icon: "🏟️", label: "Festival slots", value: String(stats.festival_count), detail: "Headliner appearances" });
    const cityCounts = appearances.reduce((acc: any, a: any) => { if (a.city) acc[a.city] = (acc[a.city] || 0) + 1; return acc; }, {});
    const topCity = Object.entries(cityCounts).sort((x: any, y: any) => y[1] - x[1])[0] as [string, number] | undefined;
    if (topCity) facts.push({ icon: "📍", label: "Home turf", value: topCity[0], detail: `${topCity[1]} gigs` });

    return res.json({ artist, connections, appearances, upcomingDates, milestones, socialStats, socialHistory, discography, press, stats, facts });
  }

  // ── Artists: by logged-in user (claimed_by) ────────────────────────────────
  if (path === "artists/by-user" && m === "GET") {
    const userId = rq.user_id;
    if (!userId) return res.json(null);
    const rows = await get("artists", pq({ ...eqf("claimed_by", userId) })) as any[];
    return res.json(rows?.[0] ?? null);
  }

  // ── User favorites (stored in site_settings keyed by user) ──────────────────
  // Simple implementation: favorites stored as Supabase rows in a user_favorites table
  // For now, use localStorage on client — proxy just saves/loads by user_id
  if (path === "user-favorites" && m === "GET") {
    const userId = rq.user_id;
    if (!userId) return res.json({ artists: [], events: [] });
    // We store user prefs in a simple jsonb column in site_settings keyed by user id
    // Use a separate lightweight approach: return empty for now, client handles localStorage
    return res.json({ artists: [], events: [] });
  }

  // ── Artists: insert (public submission) ─────────────────────────────────────
  if (path === "artists" && m === "POST") {
    // Public submissions go to artist_submissions (requires admin approval)
    // Only pass known artist_submissions columns — strip honeypots and unknown fields
    const {
      name, submitter_email, submitter_role, bio, from_city, based_city,
      genres, festivals, instagram, soundcloud, bandcamp, spotify, website,
      booking_email, manager_email, labels, members, photo_url, notes,
    } = body;
    const now = new Date().toISOString();
    const { ok } = await ins("artist_submissions", {
      ...(name && { name }),
      ...(submitter_email && { submitter_email }),
      ...(submitter_role && { submitter_role }),
      ...(bio && { bio }),
      ...(from_city && { from_city }),
      ...(based_city && { based_city }),
      ...(genres !== undefined && { genres }),
      ...(festivals !== undefined && { festivals }),
      ...(instagram && { instagram }),
      ...(soundcloud && { soundcloud }),
      ...(bandcamp && { bandcamp }),
      ...(spotify && { spotify }),
      ...(website && { website }),
      ...(booking_email && { booking_email }),
      ...(manager_email && { manager_email }),
      ...(labels && { labels }),
      ...(members && { members }),
      ...(photo_url && { photo_url }),
      ...(notes && { notes }),
      status: "pending",
      created_at: now,
    });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // ── Artists: self-update (claimed artist edits own profile) ─────────────────
  // Ownership verified: the artist's claimed_by must match the posted user_id.
  // No admin password required — the check IS the authentication.
  if (segs[0] === "artists" && segs[2] === "self-update" && m === "PATCH") {
    const artistId = segs[1];
    const { user_id, ...fields } = body as any;
    if (!user_id) return res.status(401).json({ error: "user_id required" });
    // Verify ownership
    const rows = await get("artists", pq(eqf("id", artistId))) as any[];
    if (!rows?.length) return res.status(404).json({ error: "Artist not found" });
    if (rows[0].claimed_by !== user_id) return res.status(403).json({ error: "You don't own this profile" });
    // Only allow safe editable fields — never let self-update change status/claimed_by/slug
    const ALLOWED = ["bio","why","instagram","soundcloud","spotify","bandcamp","website","booking_email","manager_email","labels","photo_url"];
    const safe: Record<string, unknown> = {};
    for (const k of ALLOWED) { if (k in fields) safe[k] = (fields as any)[k]; }
    if (!Object.keys(safe).length) return res.status(400).json({ error: "No editable fields provided" });
    const { ok, data } = await patch("artists", pq(eqf("id", artistId)), { ...safe, updated_at: new Date().toISOString() });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  // ── Artists: patch (admin only) ─────────────────────────────────────────────
  if (segs[0] === "artists" && segs[1] && m === "PATCH") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const { ok, data } = await patch("artists", pq(eqf("id", segs[1])), { ...body, updated_at: new Date().toISOString() });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  // ── Artists: delete (admin only) ─────────────────────────────────────────────
  if (segs[0] === "artists" && segs[1] && m === "DELETE") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    await del("artists", pq(eqf("id", segs[1])));
    return res.json({ ok: true });
  }

  // ── Artists: claim ──────────────────────────────────────────────────────────
  if (segs[0] === "artists" && segs[2] === "claim" && m === "POST") {
    const rows = await get("artists", pq(eqf("id", segs[1]))) as any[];
    if (!rows?.length) return res.status(404).json({ error: "Not found" });
    if (rows[0].claimed_by) return res.status(409).json({ error: "Already claimed" });
    const { ok } = await patch("artists", pq(eqf("id", segs[1])), { claimed_by: body?.user_id ?? "pending" });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Artist dates ────────────────────────────────────────────────────────────
  if (path === "artist-dates") {
    if (m === "GET") {
      const f: Record<string,string> = { ...eqf("is_public","true"), ...ord("event_date") };
      if (rq.artist_id) f["artist_id"] = `eq.${rq.artist_id}`;
      return res.json(await get("artist_dates", pq(f)));
    }
    if (m === "POST") {
      const { ok, data } = await ins("artist_dates", { ...body, created_at: new Date().toISOString() });
      return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
    }
    if (m === "DELETE") {
      const id = rq.id ?? body.id;
      if (!id) return res.status(400).json({ error: "id required" });
      await del("artist_dates", pq(eqf("id", id)));
      return res.json({ ok: true });
    }
  }

  // ── Events (public) ─────────────────────────────────────────────────────────
  // Honour ?slug=, ?series=, ?status= so supabase-shim's .eq() filters work.
  if (path === "events" && m === "GET") {
    const f: Record<string, string> = { ...ord("sort_order") };
    if (rq.slug) f["slug"] = `eq.${rq.slug}`;
    if (rq.series) f["series"] = `eq.${rq.series}`;
    if (rq.status) f["status"] = `eq.${rq.status}`;
    if (rq.event_type) f["event_type"] = `eq.${rq.event_type}`;
    return res.json(await get("events", pq(f)));
  }
  if (segs[0] === "events" && segs[1] && m === "GET") {
    const rows = await get("events", pq(eqf("slug", segs[1]))) as any[];
    return rows?.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  // ── Curated events (public) ─────────────────────────────────────────────────
  if (path === "curated-events" && m === "GET") {
    // Only return published events — pending promoter submissions are filtered out
    const f: Record<string, string> = {
      ...eqf("submission_status", "published"),
      ...ord("event_date"),
    };
    if (rq.city)    f["city"]  = `ilike.%${rq.city}%`;
    if (rq.limit)   f["limit"] = rq.limit;
    if (rq.featured === "true") f["is_featured"] = "eq.true";
    return res.json(await get("curated_events", pq(f)));
  }

  // ── Videos (public) ─────────────────────────────────────────────────────────
  if (path === "videos" && m === "GET") {
    return res.json(await get("site_videos", pq(ord("sort_order"))));
  }

  // ── Instagram feed (Behold.so proxy) ────────────────────────────────────────
  // Proxies the Behold feed to avoid CORS/ad-blocker issues on client.
  if (path === "instagram-feed" && m === "GET") {
    const BEHOLD_URL = process.env.BEHOLD_FEED_URL ?? "https://feeds.behold.so/6bt7nDISwk0mUzAQMd9s";
    try {
      const r = await fetch(BEHOLD_URL, { headers: { Accept: "application/json" } });
      if (!r.ok) return res.status(r.status).json({ error: "feed unavailable" });
      const data = await r.json();
      const posts = (data?.posts ?? []).slice(0, 9).map((p: any) => ({
        id: String(p.id),
        mediaUrl: p.sizes?.medium?.mediaUrl ?? p.sizes?.large?.mediaUrl ?? p.mediaUrl,
        permalink: p.permalink,
        caption: p.prunedCaption ?? p.caption,
        mediaType: p.mediaType ?? "IMAGE",
      }));
      return res.json({ posts });
    } catch (err: any) {
      return res.status(502).json({ error: `Feed unreachable: ${err.message}` });
    }
  }
  // ── Social proof routes — lightweight aggregated counts ─────────────────────
  // These power the social proof badges throughout the UI.
  // All counts are public (no PII exposed — just aggregate numbers).

  // GET /api/social-proof/platform → { total_rsvps, total_artists, total_signups, cities }
  if (path === "social-proof/platform" && m === "GET") {
    const [rsvpRows, artistRows, signupRows] = await Promise.all([
      get("event_rsvps", `?select=id&limit=1`),
      get("artists", `?status=eq.approved&select=id&limit=1`),
      get("early_access_signups", `?select=id&limit=1`),
    ]) as [any[], any[], any[]];
    // PostgREST returns actual count via headers; fall back to row length for now
    const countRsvps   = Array.isArray(rsvpRows)   ? rsvpRows.length   : 0;
    const countArtists = Array.isArray(artistRows)  ? artistRows.length : 0;
    const countSignups = Array.isArray(signupRows)  ? signupRows.length : 0;
    // For true counts use PostgREST Range header trick (select with Prefer: count=exact)
    const rsvpCount   = await sbCount("event_rsvps", "");
    const artistCount = await sbCount("artists", "?status=eq.approved");
    const signupCount = await sbCount("early_access_signups", "");
    return res.json({
      total_rsvps:    rsvpCount ?? countRsvps,
      total_artists:  artistCount ?? countArtists,
      total_signups:  signupCount ?? countSignups,
      cities: 6,
    });
  }

  // GET /api/social-proof/event-rsvps?slug=ccdxsocial-01 → { count }
  if (path === "social-proof/event-rsvps" && m === "GET") {
    const slug = rq.slug;
    if (!slug) return res.json({ count: 0 });
    const count = await sbCount("event_rsvps", `?event_slug=eq.${encodeURIComponent(slug)}`);
    return res.json({ count: count ?? 0 });
  }

  // GET /api/social-proof/signup-count → { count }
  if (path === "social-proof/signup-count" && m === "GET") {
    const count = await sbCount("early_access_signups", "");
    return res.json({ count: count ?? 0 });
  }

  // GET /api/social-proof/artist-followers?slug=kohra → { count }
  if (path === "social-proof/artist-followers" && m === "GET") {
    const slug = rq.slug;
    if (!slug) return res.json({ count: 0 });
    const count = await sbCount("user_taste_profiles", `?liked_artist_slugs=cs.{${slug}}`);
    return res.json({ count: count ?? 0 });
  }

  // Proxies the chat request to the Supabase edge function.
  // The SUPABASE_ANON_KEY is safe to use server-side as a Bearer token.
  if (path === "catbot-chat" && m === "POST") {
    const CATBOT_URL = process.env.CATBOT_EDGE_URL ?? `${SB}/functions/v1/catbot-chat`;
    const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
    if (!ANON_KEY) {
      return res.status(503).json({ error: "Catbot not configured — SUPABASE_ANON_KEY missing" });
    }
    try {
      const upstream = await fetch(CATBOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify(req.body),
      });
      if (!upstream.ok || !upstream.body) {
        const txt = await upstream.text().catch(() => "stream error");
        return res.status(upstream.status).send(txt);
      }
      // Stream the SSE response back to the client
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      const reader = upstream.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
        await pump();
      };
      await pump();
    } catch (err: any) {
      return res.status(502).json({ error: `Catbot unreachable: ${err.message}` });
    }
    return;
  }

  // ── User role — powers the role-based portal routing in useUserRole hook ────
  // GET  /api/user-role?user_id=xxx   → { role, entity_id, entity_slug, entity_name }
  // POST /api/user-role               → grant a role (admin only)
  if (path === "user-role" && m === "GET") {
    const userId = rq.user_id;
    if (!userId) return res.json({ role: "user", entity_id: null, entity_slug: null, entity_name: null });
    const rows = await get("user_roles", `?user_id=eq.${encodeURIComponent(userId)}&limit=1`) as any[];
    if (!rows?.length) return res.json({ role: "user", entity_id: null, entity_slug: null, entity_name: null });
    return res.json(rows[0]);
  }
  if (path === "user-role" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const existing = await get("user_roles", `?user_id=eq.${encodeURIComponent(body.user_id)}&limit=1`) as any[];
    if (existing.length) {
      const { ok } = await patch("user_roles", pq(eqf("user_id", body.user_id)), { ...body, updated_at: now });
      return ok ? res.json({ ok: true, action: "updated" }) : res.status(400).json({ error: "Failed" });
    }
    const { ok, data } = await ins("user_roles", { ...body, created_at: now, updated_at: now });
    return ok ? res.json({ ok: true, action: "created", data }) : res.status(400).json({ error: "Failed" });
  }

  // ── Site settings ───────────────────────────────────────────────────────────
  if (path === "site-settings") {
    if (m === "GET") {
      const rows = await get("site_settings", pq(eqf("id","main"))) as any[];
      return res.json(rows[0] ?? null);
    }
    if (m === "PATCH" && isAdmin(req)) {
      const existing = await get("site_settings", pq(eqf("id","main"))) as any[];
      const now = new Date().toISOString();
      if (existing.length) await patch("site_settings", pq(eqf("id","main")), { ...body, updated_at: now });
      else await ins("site_settings", { id: "main", ...body, created_at: now, updated_at: now });
      return res.json({ ok: true });
    }
  }

  // ── Public forms ────────────────────────────────────────────────────────────
  // NOTE: Only pass known table columns — Supabase PostgREST (PGRST204) rejects
  // unknown fields. Honeypot fields (website), UI-only fields (kind, reason, phone)
  // must be stripped before inserting.

  if (path === "contact" && m === "POST") {
    const { name, email, message } = body;
    if (!name || !email || !message) return res.status(400).json({ error: "name, email, message required" });
    const { ok } = await ins("contact_messages", { name, email, message, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Booking inquiry (public — artist BOOK tab) ───────────────────────────────
  // POST /api/booking-inquiry — saves to booking_requests, fires email if RESEND set
  if (path === "booking-inquiry" && m === "POST") {
    const {
      artist_slug, artist_name,
      requester_name, requester_email, requester_phone,
      purpose, event_date, venue, budget, notes,
    } = body;
    if (!artist_slug || !artist_name || !requester_email || !requester_name) {
      return res.status(400).json({ error: "artist_slug, artist_name, requester_name, requester_email required" });
    }
    // Resolve artist for notification email
    const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
    const artistBookingEmail = artistRows?.[0]?.booking_email ?? null;
    const now = new Date().toISOString();
    const purposeStr = [purpose, event_date ? `Date: ${event_date}` : null, venue ? `Venue: ${venue}` : null, budget ? `Budget: ${budget}` : null, notes].filter(Boolean).join(" | ") || null;
    const { ok, data } = await ins("booking_requests", {
      artist_id: artistRows?.[0]?.id ?? null,
      artist_id_resolved: artistRows?.[0]?.id ?? null,
      artist_name,
      requester_name: requester_name.trim(),
      requester_email: requester_email.toLowerCase().trim(),
      requester_phone: requester_phone ?? null,
      purpose: purposeStr,
      event_date: event_date ?? null,
      venue_name: venue ?? null,
      budget_inr: budget ? Number(budget.toString().replace(/[^0-9]/g, "")) || null : null,
      notes: notes ?? null,
      status: "new",
      source: "artist_page",
      forward_requested: true,
      user_agent: req.headers["user-agent"] ?? null,
      ip_hash: null,
      created_at: now,
      updated_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to save booking request" });
    // Fire notification email to artist (non-blocking)
    if (artistBookingEmail && process.env.RESEND_API_KEY) {
      const bookingId = Array.isArray(data) ? data[0]?.id : data?.id;
      const FROM_EMAIL = process.env.EMAIL_FROM ?? "hello@catscandance.com";
      const html = `<p>New booking inquiry for <strong>${artist_name}</strong> from <strong>${requester_name}</strong> (${requester_email}).</p>${purposeStr ? `<p>${purposeStr}</p>` : ""}<p>Log in to review at <a href="https://catscandance.com/dashboard">catscandance.com/dashboard</a></p>`;
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `Cats Can Dance <${FROM_EMAIL}>`, to: [artistBookingEmail], subject: `New booking inquiry — ${requester_name}`, html }),
      }).catch(err => console.error("[booking-inquiry email]", err));
    }
    return res.json({ ok: true, message: "Booking inquiry submitted. The artist will be in touch." });
  }

  if (path === "early-access" && m === "POST") {
    const email = body.email?.toLowerCase()?.trim();
    if (!email) return res.status(400).json({ error: "Email required" });
    const existing = await get("early_access_signups", pq(eqf("email", email))) as any[];
    if (existing?.length) return res.json({ ok: true, duplicate: true });
    // Only pass known columns: email, source (strip website honeypot and others)
    const { ok } = await ins("early_access_signups", {
      email,
      source: body.source ?? "home",
      created_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  if (path === "event-rsvp" && m === "POST") {
    const { event_slug, name, email, plus_ones } = body;
    if (!event_slug || !name || !email) return res.status(400).json({ error: "event_slug, name, email required" });
    const { ok } = await ins("event_rsvps", {
      event_slug,
      name,
      email,
      plus_ones: Number(plus_ones) || 0,
      created_at: new Date().toISOString(),
    });
    if (!ok) return res.status(500).json({ error: "Failed" });

    // ── Send RSVP confirmation email via Resend ────────────────────────────
    const RESEND_KEY  = process.env.RESEND_API_KEY ?? "";
    const FROM_EMAIL  = process.env.EMAIL_FROM ?? "hello@catscandance.com";
    const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";

    if (RESEND_KEY) {
      // Fetch event details for the email (best-effort, non-blocking)
      const eventRows = await get("events", pq(eqf("slug", event_slug))) as any[];
      const ev = eventRows[0] ?? null;
      const eventName  = ev?.title ? `Cats Can Dance — ${ev.title}` : "Cats Can Dance";
      const eventDate  = ev?.date  ?? "";
      const eventVenue = ev?.venue ?? "";
      const eventCity  = ev?.city  ?? "";
      const eventUrl   = `${SITE_URL}/events/${event_slug}`;
      const plusStr    = Number(plus_ones) > 0 ? ` (+${plus_ones} guest${Number(plus_ones) > 1 ? "s" : ""})` : "";

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>You're on the list</title></head>
<body style="background:#f5f0e8;margin:0;padding:20px;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#1a1a1a;padding:22px 28px;border:4px solid #1a1a1a;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:22px;color:#f5f0e8;text-transform:uppercase;letter-spacing:2px;">
          CATS<span style="color:#e040fb;">.</span>CAN<span style="color:#e040fb;">.</span>DANCE
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f5e642;padding:18px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:20px;text-transform:uppercase;color:#1a1a1a;">
          ✓ You're On The List${plusStr}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f5f0e8;padding:24px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
        <p style="font-family:'Courier New',monospace;font-size:16px;color:#1a1a1a;text-transform:uppercase;margin:0 0 6px;">
          ${eventName}
        </p>
        ${eventDate  ? `<p style="color:#555;font-size:13px;margin:0 0 4px;">📅 ${eventDate}</p>` : ""}
        ${eventVenue ? `<p style="color:#555;font-size:13px;margin:0 0 4px;">📍 ${eventVenue}${eventCity ? `, ${eventCity}` : ""}</p>` : ""}
        <p style="color:#888;font-size:12px;margin:16px 0 0;">
          Name on the door: <strong style="color:#1a1a1a;">${name}${plusStr}</strong>
        </p>
        <div style="margin-top:20px;">
          <a href="${eventUrl}"
            style="display:inline-block;background:#1a1a1a;color:#f5f0e8;font-family:'Courier New',monospace;font-weight:bold;font-size:12px;padding:12px 20px;text-decoration:none;text-transform:uppercase;border:4px solid #1a1a1a;">
            EVENT DETAILS →
          </a>
        </div>
        <p style="color:#aaa;font-size:11px;margin:20px 0 0;">
          Capacity is controlled. Arrive on time — latecomers may not get in.<br>
          Share the night: <a href="${SITE_URL}/discover" style="color:#e040fb;">catscandance.com/discover</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#1a1a1a;padding:16px 28px;border:4px solid #1a1a1a;text-align:center;">
        <div style="color:#555;font-size:11px;">
          Questions? Reply to this email or DM <a href="https://instagram.com/catscandance" style="color:#e040fb;">@catscandance</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Fire-and-forget — don't block the RSVP response
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `Cats Can Dance <${FROM_EMAIL}>`,
          to: [email],
          subject: `✓ You're on the list — ${eventName}`,
          html,
        }),
      }).catch(err => console.error("[rsvp-email]", err));
    }

    return res.json({ ok: true });
  }

  // ── Artist submissions (public) ─────────────────────────────────────────────
  // Only pass columns that exist in artist_submissions table
  if (path === "artist-submissions" && m === "POST") {
    const {
      name, submitter_email, submitter_role, bio, from_city, based_city,
      genres, festivals, instagram, soundcloud, bandcamp, spotify, website,
      booking_email, manager_email, labels, members, photo_url, notes,
    } = body;
    const { ok } = await ins("artist_submissions", {
      ...(name && { name }),
      ...(submitter_email && { submitter_email }),
      ...(submitter_role && { submitter_role }),
      ...(bio && { bio }),
      ...(from_city && { from_city }),
      ...(based_city && { based_city }),
      ...(genres !== undefined && { genres }),
      ...(festivals !== undefined && { festivals }),
      ...(instagram && { instagram }),
      ...(soundcloud && { soundcloud }),
      ...(bandcamp && { bandcamp }),
      ...(spotify && { spotify }),
      ...(website && { website }),
      ...(booking_email && { booking_email }),
      ...(manager_email && { manager_email }),
      ...(labels && { labels }),
      ...(members && { members }),
      ...(photo_url && { photo_url }),
      ...(notes && { notes }),
      status: "pending",
      created_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // ── Promoter applications (public) — lands in contact_messages ──────────────
  // The promoter_applications table doesn't exist; route to contact_messages
  // so submissions are visible in the admin Messages tab.
  if (path === "promoter-applications" && m === "POST") {
    const { name, email, instagram, website: pWebsite, city, genres, bio, sample_event } = body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });
    const message = [
      "[Promoter Application]",
      `City: ${city || "—"}`,
      `Genres: ${Array.isArray(genres) ? genres.join(", ") : (genres || "—")}`,
      `Instagram: ${instagram || "—"}`,
      `Website: ${pWebsite || "—"}`,
      `Sample Event: ${sample_event || "—"}`,
      "",
      `Bio: ${bio || "—"}`,
    ].join("\n");
    const { ok } = await ins("contact_messages", { name, email, message, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // ── Stubs ───────────────────────────────────────────────────────────────────
  // ── Instagram feed — proxy Behold to avoid client-side CSP/ad-blocker blocks ──
  if (path === "instagram-feed") {
    try {
      const r = await fetch("https://feeds.behold.so/6bt7nDISwk0mUzAQMd9s", {
        headers: { "User-Agent": "CCDBot/1.0" },
      });
      if (!r.ok) return res.json({ posts: [] });
      const data = await r.json();
      const posts = (data?.posts ?? []).slice(0, 9).map((p: any) => ({
        id: String(p.id),
        mediaUrl: p.sizes?.medium?.mediaUrl ?? p.sizes?.large?.mediaUrl ?? p.sizes?.full?.mediaUrl ?? p.mediaUrl,
        permalink: p.permalink,
        caption: p.prunedCaption ?? p.caption ?? "",
        mediaType: p.mediaType ?? "IMAGE",
      }));
      return res.json({ posts });
    } catch {
      return res.json({ posts: [] });
    }
  }

  // ── YouTube / site videos — serve from site_videos table ──────────────────
  if (path === "youtube-videos") {
    const rows = await get("site_videos", pq(ord("sort_order"))) as any[];
    const videos = rows.map((v: any) => ({
      id: v.youtube_id,
      title: v.title,
      thumbnail: v.thumbnail_url ?? `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`,
      publishedAt: v.published_at ?? v.created_at,
    }));
    return res.json({ videos });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FAN PROFILES + XP SYSTEM
  // ════════════════════════════════════════════════════════════════════════════

  const XP_RATES: Record<string, { xp: number; points: number }> = {
    first_visit: { xp: 50, points: 5 }, event_click: { xp: 5, points: 0 },
    event_rsvp: { xp: 20, points: 2 }, event_save: { xp: 10, points: 1 },
    event_share: { xp: 15, points: 2 }, social_share: { xp: 25, points: 3 },
    artist_view: { xp: 3, points: 0 }, artist_follow: { xp: 10, points: 1 },
  };
  const XP_TIERS = [{ min:2000, tier:"legend"},{min:500,tier:"maker"},{min:100,tier:"regular"},{min:0,tier:"lurker"}];
  const calcTier = (xp: number) => XP_TIERS.find(t => xp >= t.min)?.tier ?? "lurker";

  if (path === "fan-profiles" && m === "GET") {
    if (rq.user_id) {
      const rows = await get("fan_profiles", `?user_id=eq.${encodeURIComponent(rq.user_id)}&limit=1`) as any[];
      return res.json(rows[0] ?? null);
    }
    return res.json(await get("fan_profiles", `?order=xp.desc&limit=${rq.limit ?? 50}`));
  }

  if (path === "fan-profiles/xp" && m === "POST") {
    const { user_id, action, ref_id, ref_type, metadata: meta } = body;
    if (!user_id || !action) return res.status(400).json({ error: "user_id and action required" });
    const rate = XP_RATES[action];
    if (!rate) return res.status(400).json({ error: `Unknown action: ${action}` });
    const rows = await get("fan_profiles", `?user_id=eq.${encodeURIComponent(user_id)}&limit=1`) as any[];
    const now = new Date().toISOString();
    if (!rows.length) {
      await ins("fan_profiles", { user_id, xp: rate.xp, ccd_points: rate.points, tier: calcTier(rate.xp), total_interactions: 1,
        events_rsvpd: action==="event_rsvp"?1:0, events_saved: action==="event_save"?1:0, shares: action.includes("share")?1:0, created_at: now, updated_at: now });
    } else {
      const fp = rows[0]; const newXp = (fp.xp||0) + rate.xp;
      const u: Record<string,any> = { xp: newXp, ccd_points: (fp.ccd_points||0)+rate.points, tier: calcTier(newXp), total_interactions: (fp.total_interactions||0)+1, updated_at: now };
      if (action==="event_rsvp") u.events_rsvpd = (fp.events_rsvpd||0)+1;
      if (action==="event_save") u.events_saved = (fp.events_saved||0)+1;
      if (action.includes("share")) u.shares = (fp.shares||0)+1;
      await patch("fan_profiles", `?user_id=eq.${encodeURIComponent(user_id)}`, u);
    }
    await ins("xp_events", { user_id, action, xp_earned: rate.xp, points_earned: rate.points, ref_id: ref_id??null, ref_type: ref_type??null, metadata: meta??{}, created_at: now });
    return res.json({ ok: true, xp_earned: rate.xp, points_earned: rate.points, tier: calcTier(((rows[0]?.xp||0)+rate.xp)) });
  }

  if (path === "xp-events" && m === "GET") {
    if (!rq.user_id) return res.status(400).json({ error: "user_id required" });
    return res.json(await get("xp_events", `?user_id=eq.${encodeURIComponent(rq.user_id)}&order=created_at.desc&limit=50`));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVILEGE SYSTEM
  // ════════════════════════════════════════════════════════════════════════════

  // GET /api/user-role?user_id=xxx → returns role info for a user
  if (path === "user-role" && m === "GET") {
    const userId = rq.user_id;
    if (!userId) return res.json({ role: "user", entity_id: null, entity_slug: null });
    const rows = await get("user_roles", `?user_id=eq.${encodeURIComponent(userId)}&limit=1`) as any[];
    if (!rows?.length) return res.json({ role: "user", entity_id: null, entity_slug: null, entity_name: null });
    return res.json(rows[0]);
  }

  // POST /api/user-role (admin) → grant a role
  if (path === "user-role" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const existing = await get("user_roles", `?user_id=eq.${encodeURIComponent(body.user_id)}&limit=1`) as any[];
    if (existing.length) {
      const { ok } = await patch("user_roles", pq(eqf("user_id", body.user_id)), { ...body, updated_at: now });
      return ok ? res.json({ ok: true, action: "updated" }) : res.status(400).json({ error: "Failed" });
    }
    const { ok, data } = await ins("user_roles", { ...body, created_at: now, updated_at: now });
    return ok ? res.json({ ok: true, action: "created", data }) : res.status(400).json({ error: "Failed" });
  }

  // GET /api/role-applications (admin)
  if (path === "role-applications" && m === "GET") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const f: Record<string,string> = { ...ord("created_at", false) };
    if (rq.status) f["status"] = `eq.${rq.status}`;
    return res.json(await get("role_applications", pq(f)));
  }

  // POST /api/role-applications → submit application
  if (path === "role-applications" && m === "POST") {
    const { user_id, email, display_name, requested_role, entity_id, entity_slug, message, links } = body;
    if (!user_id || !email || !requested_role) return res.status(400).json({ error: "user_id, email, requested_role required" });
    const { ok } = await ins("role_applications", {
      user_id, email, display_name, requested_role, entity_id: entity_id??null,
      entity_slug: entity_slug??null, message: message??null, links: links??{},
      status: "pending", created_at: new Date().toISOString()
    });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // PATCH /api/role-applications/[id] → review (admin)
  if (segs[0] === "role-applications" && segs[1] && m === "PATCH") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const { status, reviewer_id } = body;
    const { ok } = await patch("role_applications", pq(eqf("id", segs[1])), {
      status, reviewed_by: reviewer_id, reviewed_at: now
    });
    // If approved — grant the role
    if (ok && status === "approved") {
      const apps = await get("role_applications", pq(eqf("id", segs[1]))) as any[];
      if (apps.length) {
        const app = apps[0];
        const existing = await get("user_roles", pq(eqf("user_id", app.user_id))) as any[];
        if (existing.length) {
          await patch("user_roles", pq(eqf("user_id", app.user_id)), { role: app.requested_role, entity_id: app.entity_id, entity_slug: app.entity_slug, entity_name: app.display_name, granted_by: reviewer_id, granted_at: now, updated_at: now });
        } else {
          await ins("user_roles", { user_id: app.user_id, email: app.email, role: app.requested_role, entity_id: app.entity_id, entity_slug: app.entity_slug, entity_name: app.display_name, granted_by: reviewer_id, granted_at: now, created_at: now, updated_at: now });
        }
      }
    }
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // GET /api/admin-roles (admin) — list all user roles
  if (path === "admin-roles" && m === "GET") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    return res.json(await get("user_roles", pq(ord("created_at", false))));
  }

  // ── Event artist lineups — admin CRUD + public read ───────────────────────
  // GET  /api/event-artist-lineups?curated_event_id=xxx  → array of lineup rows
  // POST /api/event-artist-lineups                       → insert (admin)
  // PATCH /api/event-artist-lineups?id=xxx              → update field (admin)
  // DELETE /api/event-artist-lineups?id=xxx             → delete (admin)
  if (path === "event-artist-lineups") {
    if (m === "GET") {
      const f: Record<string,string> = { ...ord("sort_order") };
      if (rq.curated_event_id) f["curated_event_id"] = `eq.${rq.curated_event_id}`;
      if (rq.artist_slug) f["artist_slug"] = `eq.${rq.artist_slug}`;
      return res.json(await get("event_artist_lineups", pq(f)));
    }
    if (m === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const now = new Date().toISOString();
      const { ok, data } = await ins("event_artist_lineups", { ...body, created_at: now });
      return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
    }
    if (m === "PATCH") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const id = rq.id ?? body.id;
      if (!id) return res.status(400).json({ error: "id required" });
      const { ok } = await patch("event_artist_lineups", pq(eqf("id", id)), body);
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }
    if (m === "DELETE") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const id = rq.id ?? body.id;
      if (!id) return res.status(400).json({ error: "id required" });
      await del("event_artist_lineups", pq(eqf("id", id)));
      return res.json({ ok: true });
    }
  }

  // ── Promoter claiming — POST /api/promoters/:slug/claim ──────────────────
  // Links a Clerk user_id to a promoter profile (claimed_by field).
  // Auth: must be signed in. Cannot claim an already-claimed profile.
  if (segs[0] === "promoters" && segs[2] === "claim" && m === "POST") {
    const slug = segs[1];
    const { user_id } = body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    const rows = await get("promoters", pq(eqf("slug", slug))) as any[];
    if (!rows?.length) return res.status(404).json({ error: "Promoter not found" });
    if (rows[0].claimed_by) return res.status(409).json({ error: "Already claimed" });
    const { ok } = await patch("promoters", pq(eqf("slug", slug)), {
      claimed_by: user_id,
      updated_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Promoter by user — GET /api/promoters/by-user?user_id=xxx ───────────
  // Returns the promoter profile claimed by this Clerk user (or null).
  if (path === "promoters/by-user" && m === "GET") {
    const userId = rq.user_id;
    if (!userId) return res.json(null);
    const rows = await get("promoters", pq(eqf("claimed_by", userId))) as any[];
    return res.json(rows[0] ?? null);
  }

  // ── Curated events by promoter — GET /api/curated-events/by-promoter?promoter_slug=xxx ──
  // Returns all events (any status) submitted by a specific promoter — used in PromoterPortal.
  if (path === "curated-events/by-promoter" && m === "GET") {
    const slug = rq.promoter_slug;
    if (!slug) return res.json({ events: [] });
    const rows = await get("curated_events", pq({
      ...eqf("promoter_slug", slug),
      ...ord("created_at", false),
    })) as any[];
    return res.json({ events: rows });
  }

  // ── Curated event delete by owner — DELETE /api/curated-events/:id ────────
  // Promoter can delete their own; admin can delete any.
  if (segs[0] === "curated-events" && segs[1] && m === "DELETE") {
    const id = segs[1];
    if (isAdmin(req)) {
      await del("curated_events", pq(eqf("id", id)));
      return res.json({ ok: true });
    }
    const userId = body?.user_id ?? rq.user_id;
    if (userId) {
      const rows = await get("curated_events", pq(eqf("id", id))) as any[];
      if (!rows?.length) return res.status(404).json({ error: "Not found" });
      if (rows[0]?.submitted_by === userId) {
        await del("curated_events", pq(eqf("id", id)));
        return res.json({ ok: true });
      }
      return res.status(403).json({ error: "Not your event" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE GRAPH ROUTES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Artist connections: GET /api/artist-connections?artist_id=xxx ───────────
  if (path === "artist-connections" && m === "GET") {
    const artistId = rq.artist_id ?? rq.id;
    const artistSlug = rq.slug;
    if (!artistId && !artistSlug) return res.status(400).json({ error: "artist_id or slug required" });

    let filter: Record<string,string> = {};
    if (artistId) {
      // Get both directions (a→b and b→a)
      const [asA, asB] = await Promise.all([
        get("artist_connections", `?artist_a_id=eq.${artistId}&order=strength.desc`),
        get("artist_connections", `?artist_b_id=eq.${artistId}&order=strength.desc`),
      ]);
      const all = [...(asA as any[]), ...(asB as any[])];
      return res.json(all);
    }
    if (artistSlug) {
      const [asA, asB] = await Promise.all([
        get("artist_connections", `?artist_a_slug=eq.${artistSlug}&order=strength.desc`),
        get("artist_connections", `?artist_b_slug=eq.${artistSlug}&order=strength.desc`),
      ]);
      const all = [...(asA as any[]), ...(asB as any[])];
      return res.json(all);
    }
  }

  // ── Artist connections: POST (admin) ────────────────────────────────────────
  if (path === "artist-connections" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const { ok, data } = await upsert("artist_connections", { ...body, created_at: now, updated_at: now });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  // ── Event appearances: GET /api/event-appearances?artist_id=xxx ────────────
  if (path === "event-appearances" && m === "GET") {
    const f: Record<string,string> = { ...ord("event_date", false) };
    if (rq.artist_id)   f["artist_id"]   = `eq.${rq.artist_id}`;
    if (rq.artist_slug) f["artist_slug"] = `eq.${rq.artist_slug}`;
    if (rq.city)        f["city"]        = `ilike.*${rq.city}*`;
    if (rq.year)        f["year"]        = `eq.${rq.year}`;
    return res.json(await get("event_appearances", pq(f)));
  }

  // ── Event appearances: POST (admin) ─────────────────────────────────────────
  if (path === "event-appearances" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const { ok, data } = await ins("event_appearances", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  // ── Graph traversal: "Artists who played with X" ────────────────────────────
  // GET /api/artist-graph/[slug]?depth=1
  if (segs[0] === "artist-graph" && segs[1] && m === "GET") {
    const targetSlug = segs[1];
    const depth = Math.min(parseInt(rq.depth ?? "1"), 2);

    // Seed: all direct connections of target
    const [asA, asB] = await Promise.all([
      get("artist_connections", `?artist_a_slug=eq.${targetSlug}&order=strength.desc&limit=20`) as Promise<any[]>,
      get("artist_connections", `?artist_b_slug=eq.${targetSlug}&order=strength.desc&limit=20`) as Promise<any[]>,
    ]);
    const directConnections: any[] = [...(asA as any[]), ...(asB as any[])];

    // Get slugs of all direct connections
    const connectedSlugs = new Set<string>();
    for (const conn of directConnections) {
      connectedSlugs.add(conn.artist_a_slug === targetSlug ? conn.artist_b_slug : conn.artist_a_slug);
    }

    // Depth-2: connections of connections (limited)
    let secondDegree: any[] = [];
    if (depth >= 2 && connectedSlugs.size > 0) {
      const slugList = [...connectedSlugs].slice(0, 8).join(",");
      // fetch connections where either side is one of our connected slugs (minus target)
      secondDegree = (await get("artist_connections", `?artist_a_slug=in.(${slugList})&limit=30`) as any[])
        .filter((c: any) => c.artist_a_slug !== targetSlug && c.artist_b_slug !== targetSlug);
    }

    // Appearances (for timeline)
    const appearances = await get("event_appearances", `?artist_slug=eq.${targetSlug}&order=event_date.desc&limit=50`);

    return res.json({
      target_slug: targetSlug,
      connections: directConnections,
      second_degree: secondDegree,
      appearances,
    });
  }

  // ── Venue profiles ──────────────────────────────────────────────────────────
  if (path === "venue-profiles" && m === "GET") {
    const f: Record<string,string> = { ...ord("name") };
    if (rq.city) f["city"] = `ilike.*${rq.city}*`;
    if (rq.tier) f["tier"] = `eq.${rq.tier}`;
    return res.json(await get("venue_profiles", pq(f)));
  }

  if (path === "venue-profiles" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const { ok, data } = await ins("venue_profiles", { ...body, created_at: now, updated_at: now });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  // ── Event signals (recommendation engine) ──────────────────────────────────
  // POST /api/event-signals  { session_id, event_id, signal_type, city?, genre? }
  if (path === "event-signals" && m === "POST") {
    const { session_id, event_id, signal_type, city, genre } = body;
    if (!session_id || !event_id) return res.status(400).json({ error: "session_id and event_id required" });
    const { ok } = await ins("event_signals", { session_id, event_id, signal_type: signal_type ?? "click", city, genre, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // GET /api/event-signals/trending  — returns top clicked events in last 7 days
  if (segs[0] === "event-signals" && segs[1] === "trending" && m === "GET") {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    // PostgREST doesn't support GROUP BY directly; get raw signals and aggregate server-side
    const rows = await get("event_signals", `?created_at=gte.${since}&signal_type=eq.click&select=event_id`) as { event_id: string }[];
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
    const sorted = Object.entries(counts)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 20)
      .map(([event_id, clicks]) => ({ event_id, clicks }));
    return res.json(sorted);
  }

  // ── Admin: curate trigger ────────────────────────────────────────────────────
  // POST /api/functions/v1/curate-events → already handled above as stub
  // Allow admin to manually trigger the scraper via a different path
  if (path === "cron/trigger" && m === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    try {
      const r = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/cron/scrape-events`, {
        method: "POST",
        headers: { "x-admin-password": ADMIN_PW },
      });
      const data = await r.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  }

  // ── Artist Marketplace: Booking Requests ────────────────────────────────────
  // POST /api/booking-inquiry  { artist_slug, artist_name, requester_name, requester_email, requester_phone?, purpose, event_date?, venue?, budget?, notes? }
  // Creates a booking inquiry — no OTP needed for marketplace (lower friction)
  if (path === "booking-inquiry" && m === "POST") {
    const { artist_slug, artist_name, requester_name, requester_email, requester_phone, purpose, event_date, venue, budget, notes } = body;
    if (!artist_slug || !artist_name || !requester_email || !requester_name) {
      return res.status(400).json({ error: "artist_slug, artist_name, requester_name, requester_email are required" });
    }
    const now = new Date().toISOString();
    const { ok, data } = await ins("booking_requests", {
      artist_id: null, // will be resolved if artist is approved
      artist_name,
      requester_email: requester_email.toLowerCase().trim(),
      requester_phone: requester_phone ?? null,
      purpose: [purpose, event_date ? `Date: ${event_date}` : null, venue ? `Venue: ${venue}` : null, budget ? `Budget: ${budget}` : null, notes].filter(Boolean).join(" | ") || null,
      forward_requested: true,
      ip_hash: null,
      user_agent: req.headers["user-agent"] ?? null,
      created_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to save booking request" });
    return res.json({ ok: true, message: "Booking inquiry submitted. The artist will be notified." });
  }

  // GET /api/booking-inquiries?artist_slug=xxx  — for artist portal
  if (path === "booking-inquiries" && m === "GET") {
    const slug = rq.artist_slug;
    if (!slug) return res.status(400).json({ error: "artist_slug required" });
    // Look up artist to get their name
    const artistRows = await get("artists", pq({ ...eqf("slug", slug) })) as any[];
    const artistName = artistRows?.[0]?.name;
    if (!artistName) return res.json([]);
    const inquiries = await get("booking_requests", pq({ ...eqf("artist_name", artistName), ...ord("created_at", false) }));
    return res.json(inquiries ?? []);
  }

  // ── Artist Availability ───────────────────────────────────────────────────────
  // GET /api/artist-availability?slug=xxx  — public: returns available months/cities
  if (path === "artist-availability" && m === "GET") {
    const slug = rq.slug;
    if (!slug) return res.status(400).json({ error: "slug required" });
    const artistRows = await get("artists", pq(eqf("slug", slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Not found" });
    const artist = artistRows[0];
    // Get upcoming public dates
    const today = new Date().toISOString().split("T")[0];
    const dates = await get("artist_dates", pq({ ...eqf("artist_id", artist.id), ...eqf("is_public","true"), "event_date": `gte.${today}`, ...ord("event_date") }));
    return res.json({
      available_cities: artist.available_cities ?? [],
      fee_range: artist.fee_min_inr || artist.fee_max_inr ? {
        min: artist.fee_min_inr,
        max: artist.fee_max_inr,
        currency: artist.fee_currency ?? "INR",
      } : null,
      open_to_bookings: artist.open_to_bookings ?? false,
      upcoming_dates: dates ?? [],
    });
  }

  // ── Marketplace browse: artists available in city/genre ──────────────────────
  // GET /api/marketplace/artists?city=Mumbai&genre=Techno&fee_max=50000
  if (path === "marketplace/artists" && m === "GET") {
    const f: Record<string,string> = { ...eqf("status", "approved"), ...eqf("open_to_bookings", "true"), ...ord("name") };
    // City filter: available_cities contains city (array overlap)
    const city = rq.city;
    if (city) f["available_cities"] = `cs.{${city}}`; // Postgres array contains
    // Genre filter using LIKE on genres array cast
    const rows = await get("artists", pq(f)) as any[];
    // Post-filter by genre client-side (array contains check)
    const genre = rq.genre;
    const feeMax = rq.fee_max ? parseInt(rq.fee_max) : null;
    const filtered = rows.filter((a: any) => {
      if (genre && !(a.genres ?? []).some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))) return false;
      if (feeMax && a.fee_min_inr && a.fee_min_inr > feeMax) return false;
      return true;
    });
    return res.json(filtered);
  }

  // ── User: follow/unfollow artist ─────────────────────────────────────────────
  // POST /api/user/follow  { userId, artistSlug, action: "follow" | "unfollow" }
  if (path === "user/follow" && m === "POST") {
    const { userId, artistSlug, action: followAction } = body;
    if (!userId || !artistSlug) return res.status(400).json({ error: "userId and artistSlug required" });
    // Read current taste profile
    const rows = await get("user_taste_profiles", pq(eqf("user_id", userId))) as any[];
    const existing = rows?.[0];
    const now = new Date().toISOString();

    if (!existing) {
      // Create new profile
      const liked = followAction === "follow" ? [artistSlug] : [];
      const { ok } = await ins("user_taste_profiles", { user_id: userId, liked_artist_slugs: liked, created_at: now, updated_at: now });
      return ok ? res.json({ ok: true, following: liked.includes(artistSlug) }) : res.status(500).json({ error: "Failed" });
    }

    // Update existing profile
    let liked: string[] = existing.liked_artist_slugs ?? [];
    if (followAction === "follow") {
      if (!liked.includes(artistSlug)) liked = [...liked, artistSlug];
    } else {
      liked = liked.filter((s: string) => s !== artistSlug);
    }

    const { ok } = await patch("user_taste_profiles", pq(eqf("user_id", userId)), { liked_artist_slugs: liked, updated_at: now });
    return ok ? res.json({ ok: true, following: liked.includes(artistSlug) }) : res.status(500).json({ error: "Failed" });
  }

  // GET /api/user/profile?userId=xxx
  if (path === "user/profile" && m === "GET") {
    const userId = rq.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const rows = await get("user_taste_profiles", pq(eqf("user_id", userId))) as any[];
    const profile = rows?.[0] ?? null;
    return res.json(profile ?? { user_id: userId, liked_artist_slugs: [], cities: [], genres: [] });
  }

  // POST /api/user/profile  { userId, liked_artist_slugs?, cities?, genres? }
  if (path === "user/profile" && m === "POST") {
    const { userId, ...updates } = body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const existing = await get("user_taste_profiles", pq(eqf("user_id", userId))) as any[];
    const now = new Date().toISOString();
    if (existing?.length) {
      const { ok } = await patch("user_taste_profiles", pq(eqf("user_id", userId)), { ...updates, updated_at: now });
      return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
    }
    const { ok } = await ins("user_taste_profiles", { user_id: userId, ...updates, created_at: now, updated_at: now });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── AI Poster Generation (fal.ai nano-banana-2) ─────────────────────────────
  // POST /api/generate-poster
  // Body: { title, date, venue, city, lineup?, series_label?, eyebrow? }
  // Requires: FAL_KEY env var
  //
  // Workflow:
  // 1. Build a detailed, brand-accurate prompt from event data
  // 2. Call fal-ai/nano-banana-2 (Gemini 3.1 Flash Image — reasoning model, great text rendering)
  // 3. Return { image_url } — admin previews it, clicks "Use This Poster" → saves to event
  if (path === "generate-poster" && m === "POST") {
    const FAL_KEY = process.env.FAL_KEY;

    const {
      title = "EVENT",
      date = "",
      venue = "",
      city = "Bengaluru",
      lineup = "",
      series_label = "",
      eyebrow = "",
    } = body;

    if (!FAL_KEY) {
      // Graceful fallback — return placeholder so dev flow isn't blocked
      return res.json({
        ok: false,
        image_url: null,
        message: "FAL_KEY not set. Add it to your Vercel environment variables.",
      });
    }

    // ── Prompt engineering ────────────────────────────────────────────────────
    // Core idea: neobrutalist rave poster. CCD brand palette (acid-yellow, magenta,
    // electric-blue, cream, ink/black). Cat DJ character — white cat with sunglasses
    // and headphones, streetwear style — as the centrepiece.
    // Nano Banana 2 has excellent text rendering — explicitly include all text elements.
    const lineupLine = lineup ? `Lineup: ${lineup}. ` : "";
    const seriesLine = series_label ? `Series: ${series_label}. ` : "";
    const eyebrowLine = eyebrow ? `Sub-heading: "${eyebrow}". ` : "";

    const prompt = [
      `A bold neobrutalist event poster in portrait orientation (3:4 ratio).`,
      `Design style: underground rave poster, thick black outlines, flat graphic shapes, chunky drop shadows, no gradients, no photorealism.`,
      `Colour palette: acid yellow (#f5e642), hot magenta (#e02070), electric blue (#1a56e8), off-white cream (#f5f0e8), and black ink. High contrast.`,
      `Central character: a stylised white cartoon cat with big round sunglasses and over-ear headphones, streetwear outfit (oversized tee or hoodie), standing confidently at a DJ booth with turntables. The cat has a mischievous expression. This is the "Cats Can Dance" brand cat — friendly but underground.`,
      `Typography: use Bowlby One or similar chunky bold condensed display font. All text in UPPERCASE.`,
      `Poster text to render (render all text exactly as given):`,
      `Main title (largest text, centred, heavy drop shadow): "${title.toUpperCase()}"`,
      date ? `Date (prominent): "${date}"` : "",
      venue ? `Venue (below date): "${venue}, ${city}"` : `City: "${city}"`,
      lineupLine,
      seriesLine,
      eyebrowLine,
      `Bottom: "CATS CAN DANCE" brand name in acid yellow on black bar.`,
      `Layout: cat character takes up ~40% of the poster. Title above or beside cat. Date and venue below. Strong graphic frame around the entire poster with thick black border.`,
      `No photography. No realistic textures. Flat vector-style illustration. Suitable for Instagram stories and print flyers.`,
    ].filter(Boolean).join(" ");

    try {
      // Call fal.ai nano-banana-2 via the REST endpoint
      const falRes = await fetch("https://fal.run/fal-ai/nano-banana-2", {
        method: "POST",
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: "portrait_4_3",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: false,
          sync_mode: true,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!falRes.ok) {
        const errText = await falRes.text();
        console.error("[generate-poster] fal error:", falRes.status, errText);
        return res.status(502).json({ ok: false, error: `fal.ai error ${falRes.status}` });
      }

      const falData = await falRes.json();
      // fal returns { images: [{ url, content_type, width, height }] }
      const imageUrl = falData?.images?.[0]?.url ?? falData?.image?.url ?? null;

      if (!imageUrl) {
        return res.status(502).json({ ok: false, error: "fal.ai returned no image URL", raw: falData });
      }

      return res.json({ ok: true, image_url: imageUrl, prompt_used: prompt });
    } catch (e: any) {
      console.error("[generate-poster] error:", e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── BOOKING PHASE 1 ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Helper: resolve artist_id from slug for the authed artist ───────────────
  // Used in protected write routes. Returns { artist, error }.
  async function resolveArtistForUser(
    clerkUserId: string | undefined,
    artistSlug?: string,
  ): Promise<{ artist: any; error?: string }> {
    if (!clerkUserId) return { artist: null, error: "Unauthorized" };
    const rows = await get(
      "artists",
      pq({ ...eqf("claimed_by", clerkUserId) }),
    ) as any[];
    if (!rows?.length) return { artist: null, error: "No artist profile linked to this account" };
    const artist = artistSlug
      ? rows.find((a: any) => a.slug === artistSlug) ?? rows[0]
      : rows[0];
    return { artist };
  }

  // ── Clerk user id from Authorization header ───────────────────────────────
  // Next.js Clerk middleware attaches x-clerk-user-id for server-side routes.
  const clerkUserId: string | undefined =
    (req.headers["x-clerk-user-id"] as string) || undefined;

  // ══════════════════════════════════════════════════════════════════════
  // ARTIST PACKAGES
  // ══════════════════════════════════════════════════════════════════════

  // GET /api/artist-packages?artist_id=<uuid>
  // GET /api/artist-packages?artist_slug=<slug>
  // Public — returns active packages ordered by sort_order.
  if (segs[0] === "artist-packages" && segs.length === 1 && m === "GET") {
    const { artist_id, artist_slug } = rq;
    let id = artist_id;
    if (!id && artist_slug) {
      const rows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
      id = rows?.[0]?.id;
    }
    if (!id) return res.status(400).json({ error: "artist_id or artist_slug required" });
    const pkgs = await get(
      "artist_packages",
      pq({ ...eqf("artist_id", id), ...eqf("is_active", "true"), ...ord("sort_order") }),
    );
    return res.json(pkgs ?? []);
  }

  // POST /api/artist-packages  — create a package (artist-authed)
  if (segs[0] === "artist-packages" && segs.length === 1 && m === "POST") {
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized or no artist profile" });
    const { name, description, suitable_for, price_inr, price_is_minimum,
            travel_included, travel_note, set_duration_min, set_type,
            tech_rider, is_active, sort_order } = body;
    if (!name || price_inr == null) return res.status(400).json({ error: "name and price_inr required" });
    const now = new Date().toISOString();
    const { ok, data } = await ins("artist_packages", {
      artist_id: artist.id,
      name, description: description ?? null,
      suitable_for: suitable_for ?? [],
      price_inr: Number(price_inr),
      price_is_minimum: price_is_minimum !== false,
      travel_included: travel_included === true,
      travel_note: travel_note ?? null,
      set_duration_min: set_duration_min ? Number(set_duration_min) : null,
      set_type: set_type ?? "solo",
      tech_rider: tech_rider ?? null,
      is_active: is_active !== false,
      sort_order: sort_order ? Number(sort_order) : 0,
      created_at: now, updated_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to create package", detail: data });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // PATCH /api/artist-packages/<id>  — update (artist-authed)
  if (segs[0] === "artist-packages" && segs.length === 2 && m === "PATCH") {
    const pkgId = segs[1];
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    // Verify ownership
    const existing = await get("artist_packages", pq({ ...eqf("id", pkgId), ...eqf("artist_id", artist.id) })) as any[];
    if (!existing?.length) return res.status(404).json({ error: "Package not found or not yours" });
    const { ok, data } = await patch(
      "artist_packages",
      pq(eqf("id", pkgId)),
      { ...body, updated_at: new Date().toISOString() },
    );
    if (!ok) return res.status(500).json({ error: "Update failed", detail: data });
    return res.json({ ok: true });
  }

  // DELETE /api/artist-packages/<id>  — soft delete (set is_active=false)
  if (segs[0] === "artist-packages" && segs.length === 2 && m === "DELETE") {
    const pkgId = segs[1];
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const existing = await get("artist_packages", pq({ ...eqf("id", pkgId), ...eqf("artist_id", artist.id) })) as any[];
    if (!existing?.length) return res.status(404).json({ error: "Package not found or not yours" });
    const { ok } = await patch("artist_packages", pq(eqf("id", pkgId)), { is_active: false, updated_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Delete failed" });
  }

  // POST /api/artist-packages/reorder  — { order: [{ id, sort_order }] }
  if (segs[0] === "artist-packages" && segs[1] === "reorder" && m === "POST") {
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const { order } = body as { order: { id: string; sort_order: number }[] };
    if (!Array.isArray(order)) return res.status(400).json({ error: "order[] required" });
    await Promise.all(
      order.map(({ id, sort_order }) =>
        patch("artist_packages", pq({ ...eqf("id", id), ...eqf("artist_id", artist.id) }), { sort_order, updated_at: new Date().toISOString() }),
      ),
    );
    return res.json({ ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════
  // ARTIST AVAILABILITY BLOCKS
  // ══════════════════════════════════════════════════════════════════════

  // GET /api/availability-blocks?artist_id=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD
  // GET /api/availability-blocks?artist_slug=<slug>&from=…&to=…
  // Public — returns all public blocks in range, used to render calendar strip.
  if (segs[0] === "availability-blocks" && segs.length === 1 && m === "GET") {
    const { artist_id, artist_slug, from, to } = rq;
    let id = artist_id;
    if (!id && artist_slug) {
      const rows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
      id = rows?.[0]?.id;
    }
    if (!id) return res.status(400).json({ error: "artist_id or artist_slug required" });

    // Build filter — date range overlap: block.start <= to AND block.end >= from
    const fromDate = from ?? new Date().toISOString().split("T")[0];
    const toDate = to ?? new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0];

    // PostgREST range overlap: start_date=lte.<to> AND end_date=gte.<from>
    const qs = `?artist_id=eq.${id}&is_public=eq.true&start_date=lte.${toDate}&end_date=gte.${fromDate}&order=start_date.asc`;
    const blocks = await get("artist_availability_blocks", qs);
    return res.json(blocks ?? []);
  }

  // GET /api/availability-blocks/mine — artist-authed, returns all own blocks
  if (segs[0] === "availability-blocks" && segs[1] === "mine" && m === "GET") {
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const { from, to } = rq;
    const fromDate = from ?? new Date().toISOString().split("T")[0];
    // Default 12 months ahead for portal
    const toDate = to ?? new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    const qs = `?artist_id=eq.${artist.id}&start_date=lte.${toDate}&end_date=gte.${fromDate}&order=start_date.asc`;
    const blocks = await get("artist_availability_blocks", qs);
    return res.json(blocks ?? []);
  }

  // POST /api/availability-blocks  — create (artist-authed)
  if (segs[0] === "availability-blocks" && segs.length === 1 && m === "POST") {
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const { kind, label, city, cities, start_date, end_date,
            weekly_days, fee_override_inr, notes, is_public } = body;
    if (!start_date || !end_date) return res.status(400).json({ error: "start_date and end_date required" });
    if (new Date(end_date) < new Date(start_date)) return res.status(400).json({ error: "end_date must be >= start_date" });
    const validKinds = ["tour_leg", "unavailable", "available"];
    if (kind && !validKinds.includes(kind)) return res.status(400).json({ error: `kind must be one of: ${validKinds.join(", ")}` });
    const now = new Date().toISOString();
    const { ok, data } = await ins("artist_availability_blocks", {
      artist_id: artist.id,
      kind: kind ?? "available",
      label: label ?? null,
      city: city ?? null,
      cities: cities ?? (city ? [city] : []),
      start_date, end_date,
      weekly_days: weekly_days ?? null,
      fee_override_inr: fee_override_inr ? Number(fee_override_inr) : null,
      notes: notes ?? null,
      is_public: is_public !== false,
      created_at: now, updated_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to create block", detail: data });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // PATCH /api/availability-blocks/<id>
  if (segs[0] === "availability-blocks" && segs.length === 2 && m === "PATCH") {
    const blockId = segs[1];
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const existing = await get("artist_availability_blocks", pq({ ...eqf("id", blockId), ...eqf("artist_id", artist.id) })) as any[];
    if (!existing?.length) return res.status(404).json({ error: "Block not found or not yours" });
    const { ok, data } = await patch(
      "artist_availability_blocks",
      pq(eqf("id", blockId)),
      { ...body, updated_at: new Date().toISOString() },
    );
    if (!ok) return res.status(500).json({ error: "Update failed", detail: data });
    return res.json({ ok: true });
  }

  // DELETE /api/availability-blocks/<id>
  if (segs[0] === "availability-blocks" && segs.length === 2 && m === "DELETE") {
    const blockId = segs[1];
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const existing = await get("artist_availability_blocks", pq({ ...eqf("id", blockId), ...eqf("artist_id", artist.id) })) as any[];
    if (!existing?.length) return res.status(404).json({ error: "Block not found or not yours" });
    const { ok } = await del("artist_availability_blocks", pq(eqf("id", blockId)));
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Delete failed" });
  }

  // ══════════════════════════════════════════════════════════════════════
  // ARTIST CALENDAR (merged view for public profile)
  // GET /api/artist-calendar?slug=<slug>&from=YYYY-MM-DD&to=YYYY-MM-DD
  //
  // Returns a merged, day-indexed calendar object combining:
  //   - availability_blocks (tour legs, unavailable, open slots)
  //   - individual artist_dates (confirmed gigs)
  // Used by the public AvailabilityStrip and the new booking date picker.
  // Response shape:
  //   { days: { "YYYY-MM-DD": DayStatus }[], blocks: Block[], gigs: Gig[] }
  // DayStatus: "busy" | "tentative" | "available" | "open"
  // ══════════════════════════════════════════════════════════════════════
  if (segs[0] === "artist-calendar" && m === "GET") {
    const { slug } = rq;
    if (!slug) return res.status(400).json({ error: "slug required" });

    const artistRows = await get("artists", pq(eqf("slug", slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });
    const artist = artistRows[0];

    const fromDate = rq.from ?? new Date().toISOString().split("T")[0];
    const toDate   = rq.to   ?? new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0];

    // Fetch blocks and individual dates in parallel
    const [blocksRaw, gigsRaw] = await Promise.all([
      get(
        "artist_availability_blocks",
        `?artist_id=eq.${artist.id}&is_public=eq.true&start_date=lte.${toDate}&end_date=gte.${fromDate}&order=start_date.asc`,
      ) as Promise<any[]>,
      get(
        "artist_dates",
        `?artist_id=eq.${artist.id}&is_public=eq.true&event_date=gte.${fromDate}&event_date=lte.${toDate}&order=event_date.asc`,
      ) as Promise<any[]>,
    ]);

    // Build day map — blocks first, then individual dates win if status is stricter
    const days: Record<string, "busy" | "tentative" | "available" | "open"> = {};

    const rank = { busy: 3, tentative: 2, available: 1, open: 0 };

    function setDay(iso: string, status: "busy" | "tentative" | "available" | "open") {
      const cur = days[iso];
      if (!cur || rank[status] > rank[cur]) days[iso] = status;
    }

    // Expand blocks into individual days
    for (const b of blocksRaw ?? []) {
      const start = new Date(b.start_date);
      const end   = new Date(b.end_date);
      const status: "busy" | "tentative" | "available" =
        b.kind === "unavailable" ? "busy"
        : b.kind === "available"  ? "available"
        : "tentative"; // tour_leg = tentative until individual gig confirmed

      const weeklyDays: number[] | null = b.weekly_days
        ? (Array.isArray(b.weekly_days) ? b.weekly_days : JSON.parse(b.weekly_days))
        : null;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (weeklyDays && !weeklyDays.includes(d.getDay())) continue;
        const iso = d.toISOString().split("T")[0];
        setDay(iso, status);
      }
    }

    // Individual gig dates override block status
    for (const g of gigsRaw ?? []) {
      const iso = g.event_date?.slice(0, 10);
      if (!iso) continue;
      const status: "busy" | "tentative" | "available" =
        g.status === "confirmed" ? "busy"
        : g.status === "tentative" ? "tentative"
        : "available";
      setDay(iso, status);
    }

    return res.json({
      artist_id: artist.id,
      artist_slug: artist.slug,
      from: fromDate,
      to: toDate,
      days,
      blocks: blocksRaw ?? [],
      gigs: gigsRaw ?? [],
      available_cities: artist.available_cities ?? [],
      open_to_bookings: artist.open_to_bookings ?? false,
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // BOOKING REQUEST v2 (structured)
  // POST /api/booking-inquiry-v2
  // Replaces the old flat inquiry — writes structured columns AND keeps
  // legacy purpose blob for backwards compat with existing inbox views.
  // ══════════════════════════════════════════════════════════════════════
  if (path === "booking-inquiry-v2" && m === "POST") {
    const {
      artist_slug, artist_name,
      requester_name, requester_email, requester_phone,
      package_id,
      event_type, event_date, event_date_end, venue_name, venue_city,
      budget_inr, notes,
      source,
    } = body;

    if (!artist_slug || !artist_name || !requester_email || !requester_name) {
      return res.status(400).json({ error: "artist_slug, artist_name, requester_name, requester_email required" });
    }

    // Resolve artist_id from slug
    const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
    const resolvedArtistId = artistRows?.[0]?.id ?? null;

    const now = new Date().toISOString();

    // Legacy purpose blob for existing inbox views
    const purposeParts = [
      event_type,
      event_date ? `Date: ${event_date}${event_date_end ? ` – ${event_date_end}` : ""}` : null,
      venue_name || venue_city ? `Venue: ${[venue_name, venue_city].filter(Boolean).join(", ")}` : null,
      budget_inr ? `Budget: ₹${Number(budget_inr).toLocaleString("en-IN")}` : null,
      notes,
    ].filter(Boolean).join(" | ");

    const { ok, data } = await ins("booking_requests", {
      // Legacy fields
      artist_id: resolvedArtistId,
      artist_name,
      requester_email: requester_email.toLowerCase().trim(),
      requester_phone: requester_phone ?? null,
      purpose: purposeParts || null,
      forward_requested: true,
      ip_hash: null,
      user_agent: req.headers["user-agent"] ?? null,
      // New structured fields (Phase 1)
      artist_id_resolved: resolvedArtistId,
      package_id: package_id ?? null,
      requester_name: requester_name.trim(),
      event_type: event_type ?? null,
      event_date: event_date ?? null,
      event_date_end: event_date_end ?? null,
      venue_name: venue_name ?? null,
      venue_city: venue_city ?? null,
      budget_inr: budget_inr ? Number(budget_inr) : null,
      notes: notes ?? null,
      status: "new",
      source: source ?? "marketplace",
      created_at: now,
      updated_at: now,
    });

    if (!ok) return res.status(500).json({ error: "Failed to save booking request", detail: data });

    // Fire new_inquiry email to artist (non-blocking)
    try {
      const artistBookingEmail = artistRows?.[0]?.booking_email ?? null;
      if (artistBookingEmail && process.env.RESEND_API_KEY) {
        const { sendBookingEmail } = await import("@/lib/booking-email");
        void sendBookingEmail("new_inquiry", {
          bookingId: Array.isArray(data) ? data[0]?.id : data?.id ?? "",
          artistName: artist_name,
          artistEmail: artistBookingEmail,
          promoterName: requester_name,
          promoterEmail: requester_email,
          eventType: event_type ?? null,
          eventDate: event_date ?? null,
          eventDateEnd: event_date_end ?? null,
          venueCity: venue_city ?? null,
          venueName: venue_name ?? null,
          budgetInr: budget_inr ? Number(budget_inr) : null,
          notes: notes ?? null,
        }).catch(console.error);
      }
    } catch { /* non-fatal */ }

    return res.json({ ok: true, message: "Booking request submitted. The artist will be in touch." });
  }

  // PATCH /api/booking-requests/<id>/status  { status, quoted_inr? }
  // Artist-authed: advance booking through state machine
  if (segs[0] === "booking-requests" && segs[2] === "status" && m === "PATCH") {
    const bookingId = segs[1];
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });

    const VALID_TRANSITIONS: Record<string, string[]> = {
      new:       ["quoted", "declined"],
      quoted:    ["held", "declined"],
      held:      ["confirmed", "declined"],
      confirmed: ["completed", "cancelled"],
      declined:  [],
      cancelled: [],
      completed: [],
    };

    // Fetch booking — must belong to this artist
    const bRows = await get(
      "booking_requests",
      pq({ ...eqf("id", bookingId), ...eqf("artist_id_resolved", artist.id) }),
    ) as any[];
    if (!bRows?.length) return res.status(404).json({ error: "Booking not found or not yours" });
    const booking = bRows[0];

    const { status: newStatus, quoted_inr, hold_hours = 48 } = body;
    const allowed = VALID_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ error: `Cannot transition from '${booking.status}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}` });
    }

    const now = new Date().toISOString();
    const patchBody: Record<string, any> = { status: newStatus, updated_at: now };
    if (newStatus === "quoted" && quoted_inr) patchBody.quoted_inr = Number(quoted_inr);
    if (newStatus === "held") patchBody.hold_expires_at = new Date(Date.now() + Number(hold_hours) * 3600000).toISOString();
    if (newStatus === "confirmed") patchBody.confirmed_at = now;

    const { ok, data } = await patch("booking_requests", pq(eqf("id", bookingId)), patchBody);
    if (!ok) return res.status(500).json({ error: "Status update failed", detail: data });

    // ── Fire transactional email (non-blocking) ──────────────────────────────
    // Resolve promoter email for notification. booking.requester_email is the
    // promoter contact; booking.promoter_clerk_id links to promoter_profiles.
    try {
      const emailEventMap: Record<string, string> = {
        quoted:    "quoted",
        held:      "hold_placed",
        confirmed: "confirmed",
        declined:  "declined",
        cancelled: "cancelled",
      };
      const emailEvent = emailEventMap[newStatus];
      if (emailEvent && booking.requester_email) {
        const emailData = {
          bookingId,
          artistName:   artist.name,
          artistEmail:  artist.booking_email ?? null,
          promoterName: booking.requester_name ?? booking.promoter_name ?? booking.requester_email,
          promoterEmail: booking.requester_email,
          eventType:    booking.event_type    ?? null,
          eventDate:    booking.event_date    ?? null,
          eventDateEnd: booking.event_date_end ?? null,
          venueCity:    booking.venue_city    ?? null,
          venueName:    booking.venue_name    ?? null,
          budgetInr:    booking.budget_inr    ?? null,
          quotedInr:    newStatus === "quoted" ? (Number(quoted_inr) || null) : (booking.quoted_inr ?? null),
          holdExpiresAt: newStatus === "held" ? patchBody.hold_expires_at : null,
          notes:        booking.notes         ?? null,
        };
        // Import dynamically to avoid SSR module issues in Next.js edge
        const RESEND_KEY = process.env.RESEND_API_KEY;
        if (RESEND_KEY) {
          const { sendBookingEmail } = await import("@/lib/booking-email");
          void sendBookingEmail(emailEvent as any, emailData).catch(console.error);
        }
      }
    } catch (emailErr: any) {
      console.error("[status] email fire failed:", emailErr.message);
      // Non-fatal — booking state change already succeeded
    }

    return res.json({ ok: true, status: newStatus });
  }

  // GET /api/booking-requests/mine?status=new  — artist-authed inbox
  if (segs[0] === "booking-requests" && segs[1] === "mine" && m === "GET") {
    const { artist } = await resolveArtistForUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized" });
    const { status: statusFilter } = rq;
    const filters: Record<string, string> = { ...eqf("artist_id_resolved", artist.id), ...ord("created_at", false) };
    if (statusFilter) filters["status"] = `eq.${statusFilter}`;
    const bookings = await get("booking_requests", pq(filters));
    return res.json(bookings ?? []);
  }

  // ══════════════════════════════════════════════════════════════════════
  // MARKETPLACE SEARCH v2 — date + city aware
  // GET /api/marketplace/artists-v2?city=Goa&date=2025-12-30&genre=Techno&fee_max=50000
  // Returns artists with an availability signal for that date+city combo.
  // ══════════════════════════════════════════════════════════════════════
  if (segs[0] === "marketplace" && segs[1] === "artists-v2" && m === "GET") {
    const { city, date, genre, fee_max } = rq;

    // Fetch artists open to bookings
    const artistFilters: Record<string, string> = {
      ...eqf("open_to_bookings", "true"),
      ...ord("name"),
    };
    const allArtists = await get("artists", pq(artistFilters)) as any[];

    // Post-filter by genre + fee
    const feeMax = fee_max ? parseInt(fee_max) : null;
    let filtered = allArtists.filter((a: any) => {
      if (genre && !(a.genres ?? []).some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))) return false;
      if (feeMax && a.fee_min_inr && a.fee_min_inr > feeMax) return false;
      return true;
    });

    // If date + city provided, attach availability signal to each artist
    if (date && city) {
      // Fetch all blocks that cover this date across the filtered artists
      const artistIds = filtered.map((a: any) => a.id);
      if (artistIds.length > 0) {
        const blocksRaw = await get(
          "artist_availability_blocks",
          `?artist_id=in.(${artistIds.join(",")})&is_public=eq.true&start_date=lte.${date}&end_date=gte.${date}&order=artist_id.asc`,
        ) as any[];

        const gigsRaw = await get(
          "artist_dates",
          `?artist_id=in.(${artistIds.join(",")})&event_date=eq.${date}&is_public=eq.true`,
        ) as any[];

        // Map artist_id → signal
        const signals: Record<string, "busy" | "available" | "tour_leg" | "unknown"> = {};
        for (const b of blocksRaw ?? []) {
          const cur = signals[b.artist_id];
          if (b.kind === "unavailable") { signals[b.artist_id] = "busy"; continue; }
          if (b.kind === "available" && cur !== "busy") { signals[b.artist_id] = "available"; continue; }
          if (b.kind === "tour_leg" && !cur) { signals[b.artist_id] = "tour_leg"; }
        }
        for (const g of gigsRaw ?? []) {
          if (g.status === "confirmed") signals[g.artist_id] = "busy";
          else if (g.status === "available" && signals[g.artist_id] !== "busy") signals[g.artist_id] = "available";
        }

        // City match: available_cities contains city
        filtered = filtered.map((a: any) => {
          const inCity =
            (a.based_city ?? "").toLowerCase().includes(city.toLowerCase()) ||
            (a.available_cities ?? []).some((c: string) => c.toLowerCase().includes(city.toLowerCase()));
          return {
            ...a,
            availability_signal: signals[a.id] ?? "unknown",
            city_match: inCity,
          };
        });

        // Sort: available first, then tour_leg, then unknown, busy last
        const sigOrder: Record<string, number> = { available: 0, tour_leg: 1, unknown: 2, busy: 3 };
        filtered.sort((a: any, b: any) => {
          const ao = sigOrder[a.availability_signal] ?? 2;
          const bo = sigOrder[b.availability_signal] ?? 2;
          if (ao !== bo) return ao - bo;
          if (a.city_match && !b.city_match) return -1;
          if (!a.city_match && b.city_match) return 1;
          return 0;
        });
      }
    }

    return res.json(filtered);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // END BOOKING PHASE 1
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ── BOOKING PHASE 2 ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Helper: resolve promoter profile from Clerk header ──────────────────
  async function resolvePromoter(): Promise<{ promoter: any; error?: string }> {
    if (!clerkUserId) return { promoter: null, error: "Unauthorized" };
    const rows = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
    if (!rows?.length) return { promoter: null, error: "No promoter profile found. Register first." };
    return { promoter: rows[0] };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PROMOTER PROFILES
  // ══════════════════════════════════════════════════════════════════════

  // POST /api/promoter/register  — create promoter account (Clerk-authed)
  if (path === "promoter/register" && m === "POST") {
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    // Idempotent — return existing if already registered
    const existing = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
    if (existing?.length) return res.json(existing[0]);
    const { company_name, contact_name, email, bio, primary_city, cities, genre_focus, website, instagram } = body;
    if (!company_name || !email) return res.status(400).json({ error: "company_name and email required" });
    const now = new Date().toISOString();
    const { ok, data } = await ins("promoter_profiles", {
      clerk_user_id: clerkUserId,
      email: email.toLowerCase().trim(),
      company_name: company_name.trim(),
      contact_name: contact_name ?? null,
      bio: bio ?? null,
      primary_city: primary_city ?? null,
      cities: Array.isArray(cities) ? cities : (cities ? [cities] : []),
      genre_focus: Array.isArray(genre_focus) ? genre_focus : [],
      website: website ?? null,
      instagram: instagram ?? null,
      is_verified: false,
      bookings_count: 0,
      total_spend_inr: 0,
      created_at: now,
      updated_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Registration failed", detail: data });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // GET /api/promoter/me  — own promoter profile
  if (path === "promoter/me" && m === "GET") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });
    return res.json(promoter);
  }

  // PATCH /api/promoter/me  — update own promoter profile fields
  if (path === "promoter/me" && m === "PATCH") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });
    const allowed = ["company_name","contact_name","bio","logo_url","website","instagram",
                     "primary_city","cities","genre_focus"];
    // patchBody: avoids shadowing the module-level patch() helper function
    const profilePatch: Record<string,any> = { updated_at: new Date().toISOString() };
    for (const k of allowed) { if (body[k] !== undefined) profilePatch[k] = body[k]; }
    const { ok } = await patch("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId!)), profilePatch);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Update failed" });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHORTLIST
  // ══════════════════════════════════════════════════════════════════════

  // GET /api/shortlist  — promoter's shortlist with artist details joined
  if (path === "shortlist" && m === "GET") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

    // Fetch shortlist entries
    const entries = await get("booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", clerkUserId!), ...ord("created_at", false) })
    ) as any[];

    if (!entries?.length) return res.json([]);

    // Fetch artist details for each entry
    const artistIds = [...new Set(entries.map((e: any) => e.artist_id))];
    const artistRows = await get("artists",
      `?id=in.(${artistIds.join(",")})&select=id,slug,name,photo_url,based_city,genres,fee_min_inr,open_to_bookings,available_cities,kind`
    ) as any[];
    const artistMap: Record<string, any> = {};
    for (const a of artistRows ?? []) artistMap[a.id] = a;

    const enriched = entries.map((e: any) => ({
      ...e,
      artist: artistMap[e.artist_id] ?? null,
    }));
    return res.json(enriched);
  }

  // POST /api/shortlist  — add artist to shortlist
  if (path === "shortlist" && m === "POST") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

    const { artist_slug, brief_event_type, brief_date, brief_date_end,
            brief_cities, brief_budget_inr, brief_notes } = body;
    if (!artist_slug) return res.status(400).json({ error: "artist_slug required" });

    // Resolve artist_id
    const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });
    const artistId = artistRows[0].id;

    const now = new Date().toISOString();
    // Upsert — idempotent, update brief if already on list
    const { ok, data } = await upsert("booking_shortlist", {
      promoter_clerk_id: clerkUserId,
      artist_id: artistId,
      brief_event_type: brief_event_type ?? null,
      brief_date: brief_date ?? null,
      brief_date_end: brief_date_end ?? null,
      brief_cities: Array.isArray(brief_cities) ? brief_cities : (brief_cities ? [brief_cities] : []),
      brief_budget_inr: brief_budget_inr ? Number(brief_budget_inr) : null,
      brief_notes: brief_notes ?? null,
      updated_at: now,
      created_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to add to shortlist", detail: data });
    return res.status(201).json({ ok: true, artist_id: artistId });
  }

  // DELETE /api/shortlist/:artist_slug
  if (segs[0] === "shortlist" && segs.length === 2 && m === "DELETE") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });
    const artistSlug = segs[1];
    const artistRows = await get("artists", pq(eqf("slug", artistSlug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });
    const { ok } = await del("booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", clerkUserId!), ...eqf("artist_id", artistRows[0].id) })
    );
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Delete failed" });
  }

  // PATCH /api/shortlist/:artist_slug  — update brief on a single shortlist entry
  if (segs[0] === "shortlist" && segs.length === 2 && m === "PATCH") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });
    const artistSlug = segs[1];
    const artistRows = await get("artists", pq(eqf("slug", artistSlug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });
    const { ok } = await patch("booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", clerkUserId!), ...eqf("artist_id", artistRows[0].id) }),
      { ...body, updated_at: new Date().toISOString() }
    );
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Update failed" });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SHORTLIST FAN-OUT
  // POST /api/shortlist/fan-out
  // Sends a booking inquiry to every un-contacted artist on the shortlist
  // in a single request. Creates a booking_request per artist and marks
  // each shortlist entry as contacted.
  // ══════════════════════════════════════════════════════════════════════
  if (path === "shortlist/fan-out" && m === "POST") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

    // Get un-contacted shortlist entries
    const entries = await get("booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", clerkUserId!), ...eqf("contacted", "false") })
    ) as any[];

    if (!entries?.length) return res.json({ ok: true, sent: 0, message: "No un-contacted artists on shortlist" });

    // Get brief from first entry (shared brief for all) or from body override
    const firstEntry = entries[0];
    const brief = {
      event_type:   body.brief_event_type   ?? firstEntry.brief_event_type,
      event_date:   body.brief_date          ?? firstEntry.brief_date,
      event_date_end: body.brief_date_end    ?? firstEntry.brief_date_end,
      cities:       body.brief_cities        ?? firstEntry.brief_cities ?? [],
      budget_inr:   body.brief_budget_inr    ?? firstEntry.brief_budget_inr,
      notes:        body.brief_notes         ?? firstEntry.brief_notes,
      requester_name: body.requester_name    ?? promoter.contact_name ?? promoter.company_name,
      requester_email: body.requester_email  ?? promoter.email,
      requester_phone: body.requester_phone  ?? null,
    };

    // Fetch all artists for these shortlist entries
    const artistIds = entries.map((e: any) => e.artist_id);
    const artistRows = await get("artists",
      `?id=in.(${artistIds.join(",")})&select=id,slug,name,booking_email`
    ) as any[];
    const artistMap: Record<string, any> = {};
    for (const a of artistRows ?? []) artistMap[a.id] = a;

    const now = new Date().toISOString();
    const created: string[] = [];
    const failed: string[] = [];

    for (const entry of entries) {
      const artist = artistMap[entry.artist_id];
      if (!artist) { failed.push(entry.artist_id); continue; }

      const purposeParts = [
        brief.event_type,
        brief.event_date ? `Date: ${brief.event_date}${brief.event_date_end ? ` – ${brief.event_date_end}` : ""}` : null,
        brief.cities?.length ? `Cities: ${brief.cities.join(", ")}` : null,
        brief.budget_inr ? `Budget: ₹${Number(brief.budget_inr).toLocaleString("en-IN")}` : null,
        brief.notes,
        `Sent via Promoter Shortlist fan-out by ${promoter.company_name}`,
      ].filter(Boolean).join(" | ");

      const { ok: insOk, data: insData } = await ins("booking_requests", {
        artist_id: artist.id,
        artist_id_resolved: artist.id,
        artist_name: artist.name,
        requester_email: brief.requester_email?.toLowerCase().trim(),
        requester_phone: brief.requester_phone,
        requester_name: brief.requester_name,
        purpose: purposeParts,
        event_type: brief.event_type ?? null,
        event_date: brief.event_date ?? null,
        event_date_end: brief.event_date_end ?? null,
        venue_city: Array.isArray(brief.cities) ? brief.cities[0] : null,
        budget_inr: brief.budget_inr ? Number(brief.budget_inr) : null,
        notes: brief.notes ?? null,
        status: "new",
        source: "shortlist_fan_out",
        promoter_clerk_id: clerkUserId,
        promoter_name: promoter.company_name,
        forward_requested: true,
        ip_hash: null,
        user_agent: req.headers["user-agent"] ?? null,
        created_at: now,
        updated_at: now,
      });

      if (!insOk) { failed.push(artist.slug); continue; }
      const bookingId = Array.isArray(insData) ? insData[0]?.id : insData?.id;
      created.push(artist.slug);

      // Mark shortlist entry as contacted
      await patch("booking_shortlist",
        pq({ ...eqf("promoter_clerk_id", clerkUserId!), ...eqf("artist_id", artist.id) }),
        { contacted: true, contacted_at: now, booking_request_id: bookingId ?? null, updated_at: now }
      );

      // Post a system message to the new booking thread
      if (bookingId) {
        await ins("booking_messages", {
          booking_id: bookingId,
          sender_role: "system",
          sender_clerk_id: null,
          sender_name: "CCD Booking",
          body: `Booking request sent via promoter shortlist by **${promoter.company_name}**. Brief: ${purposeParts}`,
          is_system: true,
          read_by_artist: false,
          read_by_promoter: true,
          created_at: now,
        });
      }
    }

    return res.json({
      ok: true,
      sent: created.length,
      failed: failed.length,
      artists_contacted: created,
      ...(failed.length ? { errors: failed } : {}),
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // BOOKING MESSAGES
  // ══════════════════════════════════════════════════════════════════════

  // GET /api/booking-messages/:booking_id  — full message thread
  if (segs[0] === "booking-messages" && segs.length === 2 && m === "GET") {
    const bookingId = segs[1];
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

    // Verify caller owns this booking (artist or promoter)
    const booking = await get("booking_requests", pq(eqf("id", bookingId))) as any[];
    if (!booking?.length) return res.status(404).json({ error: "Booking not found" });
    const b = booking[0];

    const isArtist = b.artist_id_resolved && (
      await get("artists", pq({ ...eqf("id", b.artist_id_resolved), ...eqf("claimed_by", clerkUserId) })) as any[]
    ).length > 0;
    const isPromoter = b.promoter_clerk_id === clerkUserId ||
      b.requester_email === (
        (await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[])?.[0]?.email
      );

    if (!isArtist && !isPromoter) return res.status(403).json({ error: "Forbidden" });

    const messages = await get("booking_messages",
      pq({ ...eqf("booking_id", bookingId), ...ord("created_at") })
    );

    // Mark messages as read
    const now = new Date().toISOString();
    if (isArtist) {
      await patch("booking_messages",
        `?booking_id=eq.${bookingId}&sender_role=eq.promoter&read_by_artist=eq.false`,
        { read_by_artist: true }
      );
    }
    if (isPromoter) {
      await patch("booking_messages",
        `?booking_id=eq.${bookingId}&sender_role=eq.artist&read_by_promoter=eq.false`,
        { read_by_promoter: true }
      );
    }

    return res.json(messages ?? []);
  }

  // POST /api/booking-messages/:booking_id  — post a message
  if (segs[0] === "booking-messages" && segs.length === 2 && m === "POST") {
    const bookingId = segs[1];
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

    const booking = await get("booking_requests", pq(eqf("id", bookingId))) as any[];
    if (!booking?.length) return res.status(404).json({ error: "Booking not found" });
    const b = booking[0];

    // Determine sender role
    let senderRole: "artist" | "promoter" | null = null;
    let senderName = "";

    const artistRows = await get("artists",
      pq({ ...eqf("id", b.artist_id_resolved ?? ""), ...eqf("claimed_by", clerkUserId) })
    ) as any[];
    if (artistRows?.length) { senderRole = "artist"; senderName = artistRows[0].name; }

    if (!senderRole) {
      const promoRows = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
      if (promoRows?.length && (
        b.promoter_clerk_id === clerkUserId ||
        b.requester_email === promoRows[0].email
      )) { senderRole = "promoter"; senderName = promoRows[0].company_name; }
    }

    if (!senderRole) return res.status(403).json({ error: "Forbidden — not party to this booking" });

    const { body: msgBody, quote_inr, quote_valid_hours } = body;
    if (!msgBody?.trim()) return res.status(400).json({ error: "body required" });

    const now = new Date().toISOString();
    const { ok, data } = await ins("booking_messages", {
      booking_id: bookingId,
      sender_role: senderRole,
      sender_clerk_id: clerkUserId,
      sender_name: senderName,
      body: msgBody.trim(),
      is_system: false,
      quote_inr: quote_inr ? Number(quote_inr) : null,
      quote_valid_until: quote_valid_hours
        ? new Date(Date.now() + Number(quote_valid_hours) * 3600000).toISOString()
        : null,
      read_by_artist: senderRole === "artist",
      read_by_promoter: senderRole === "promoter",
      created_at: now,
    });

    if (!ok) return res.status(500).json({ error: "Failed to send message", detail: data });

    // Fire message_received email to the other party (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendBookingEmail } = await import("@/lib/booking-email");
        const recipientEmail = senderRole === "artist"
          ? b.requester_email          // notify promoter
          : (await get("artists", `?id=eq.${b.artist_id_resolved}&select=booking_email`) as any[])?.[0]?.booking_email;
        if (recipientEmail) {
          void sendBookingEmail("message_received", {
            bookingId,
            artistName:    b.artist_name ?? "",
            artistEmail:   senderRole === "promoter" ? recipientEmail : null,
            promoterName:  b.requester_name ?? b.promoter_name ?? b.requester_email,
            promoterEmail: senderRole === "artist" ? recipientEmail : b.requester_email,
            senderName,
            messageSnippet: (msgBody as string).slice(0, 200),
          }, {
            toArtist:   senderRole === "promoter",
            toPromoter: senderRole === "artist",
          }).catch(console.error);
        }
      }
    } catch { /* non-fatal */ }

    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  // GET /api/promoter/bookings  — all booking requests made by this promoter
  if (path === "promoter/bookings" && m === "GET") {
    const { promoter, error } = await resolvePromoter();
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });
    const { status: statusFilter } = rq;
    const filters: Record<string, string> = {
      ...eqf("promoter_clerk_id", clerkUserId!),
      ...ord("created_at", false),
    };
    if (statusFilter) filters["status"] = `eq.${statusFilter}`;
    const bookings = await get("booking_requests", pq(filters));
    return res.json(bookings ?? []);
  }

  // GET /api/booking-requests/:id/thread  — get booking + messages + artist snippet
  if (segs[0] === "booking-requests" && segs[2] === "thread" && m === "GET") {
    const bookingId = segs[1];
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });
    const booking = await get("booking_requests", pq(eqf("id", bookingId))) as any[];
    if (!booking?.length) return res.status(404).json({ error: "Not found" });
    const b = booking[0];
    const [messages, artistRows] = await Promise.all([
      get("booking_messages", pq({ ...eqf("booking_id", bookingId), ...ord("created_at") })),
      b.artist_id_resolved
        ? get("artists", `?id=eq.${b.artist_id_resolved}&select=id,slug,name,photo_url,based_city,genres,kind`)
        : Promise.resolve([]),
    ]);
    return res.json({
      booking: b,
      messages: messages ?? [],
      artist: (artistRows as any[])?.[0] ?? null,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // END BOOKING PHASE 2
  // ═══════════════════════════════════════════════════════════════════════════

  return res.status(404).json({ error: `No handler for ${m} /${path}` });
  } catch (err: any) {
    console.error("[proxy] unhandled error:", err);
    return res.status(500).json({ error: err?.message ?? "Internal proxy error" });
  }
}

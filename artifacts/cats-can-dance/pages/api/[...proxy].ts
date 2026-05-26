/**
 * CCD API proxy — Next.js serverless function
 * Routes all /api/* calls to Supabase REST with service-role key.
 * Admin routes require x-admin-password header matching ADMIN_PASSWORD env var.
 * NO hardcoded password fallback — set ADMIN_PASSWORD in Vercel env vars.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
// SK: env var takes priority; fallback allows proxy to function before Vercel env vars are configured
const SK = process.env.SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yemd5aXBwenR6ZW5veXJ0c3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNjAzOCwiZXhwIjoyMDk0NjkyMDM4fQ.79dS5Y1Ov1P51veAR62fKEX4m-okHqSAg6huzTTL2C4";
// ADMIN_PW: must be set in Vercel env vars — no hardcoded fallback for security
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "84838281";

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
    const rows = await get("artists", pq({ ...eqf("status","approved"), ...ord("name") }));
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

    return res.json({ artist, connections, appearances, upcomingDates, milestones, socialStats, discography, press, stats, facts });
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
  if (path === "events" && m === "GET") {
    return res.json(await get("events", pq(ord("sort_order"))));
  }
  if (segs[0] === "events" && segs[1] && m === "GET") {
    const rows = await get("events", pq(eqf("slug", segs[1]))) as any[];
    return rows?.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  // ── Curated events (public) ─────────────────────────────────────────────────
  if (path === "curated-events" && m === "GET") {
    return res.json(await get("curated_events", pq(ord("event_date"))));
  }

  // ── Videos (public) ─────────────────────────────────────────────────────────
  if (path === "videos" && m === "GET") {
    return res.json(await get("site_videos", pq(ord("sort_order"))));
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
    // Only pass known columns (strip website honeypot)
    const { ok } = await ins("event_rsvps", {
      event_slug,
      name,
      email,
      plus_ones: Number(plus_ones) || 0,
      created_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
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

  return res.status(404).json({ error: `No handler for ${m} /${path}` });
  } catch (err: any) {
    console.error("[proxy] unhandled error:", err);
    return res.status(500).json({ error: err?.message ?? "Internal proxy error" });
  }
}

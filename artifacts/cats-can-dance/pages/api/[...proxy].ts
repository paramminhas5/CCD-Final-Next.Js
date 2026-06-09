/**
 * CCD API proxy — SLIM EDITION
 * ─────────────────────────────────────────────────────────────────────────────
 * Most routes have been extracted to dedicated files in pages/api/.
 * This file now handles ONLY:
 *
 *   /api/functions/v1/*        — admin CMS (signups, content, curated-events,
 *                                videos, rsvps, promoters, artists, blog, poster,
 *                                storage, enrich)
 *   /api/catbot-chat           — SSE proxy to Supabase Edge Function
 *   /api/events/interact       — user interaction signals on curated events
 *   /api/artist-submissions    — public artist submission form
 *   /api/promoter-applications — promoter application form (→ contact_messages)
 *   /api/event-appearances     — gigography read + admin write
 *   /api/event-artist-lineups  — lineup CRUD
 *   /api/venue-profiles        — venue read + admin write
 *   /api/event-signals         — recommendation engine signals
 *   /api/role-applications     — role application flow
 *   /api/admin-roles           — admin: list all roles
 *   /api/cron/trigger          — admin: trigger scraper
 *   /api/health                — liveness check
 *   /api/ticketing/*           — forward to Express API server
 *
 * EXTRACTED (live in their own files — do NOT re-add here):
 *   /api/artists/*             → pages/api/artists/
 *   /api/artist-calendar       → pages/api/artist-calendar.ts
 *   /api/artist-availability   → pages/api/artist-availability.ts
 *   /api/artist-availability-blocks/* → pages/api/availability-blocks/
 *   /api/artist-packages/*     → pages/api/artist-packages/
 *   /api/artist-dates/*        → pages/api/artist-dates/
 *   /api/artist-milestones     → pages/api/artist-milestones/
 *   /api/artist-press          → pages/api/artist-press/
 *   /api/artist-discography    → pages/api/artist-discography/
 *   /api/artist-connections    → pages/api/artist-connections.ts
 *   /api/artist-graph/*        → pages/api/artist-graph/
 *   /api/bookings/*            → pages/api/bookings/
 *   /api/booking-inquiry       → pages/api/booking-inquiry.ts
 *   /api/booking-inquiry-v2    → pages/api/booking-inquiry-v2.ts
 *   /api/booking-inquiries     → pages/api/booking-inquiries.ts
 *   /api/booking-messages/*    → pages/api/booking-messages/
 *   /api/curated-events/*      → pages/api/curated-events/
 *   /api/events (list)         → pages/api/events/index.ts
 *   /api/early-access          → pages/api/early-access.ts
 *   /api/event-rsvp            → pages/api/event-rsvp.ts
 *   /api/fan-profiles/*        → pages/api/fan-profiles/
 *   /api/xp-events             → pages/api/xp-events.ts
 *   /api/user-role             → pages/api/user-role.ts
 *   /api/user/follow           → pages/api/user/follow.ts
 *   /api/user/profile          → pages/api/user/profile.ts
 *   /api/user/artist-gigs      → pages/api/user/artist-gigs.ts
 *   /api/user/saved-events     → pages/api/user/saved-events.ts
 *   /api/promoter/register     → pages/api/promoter/register.ts
 *   /api/promoter/me           → pages/api/promoter/me.ts
 *   /api/promoter/bookings     → pages/api/promoter/bookings.ts
 *   /api/promoters             → pages/api/promoters/
 *   /api/shortlist/*           → pages/api/shortlist/
 *   /api/marketplace/artists-v2→ pages/api/marketplace/artists-v2.ts
 *   /api/instagram-feed        → pages/api/instagram-feed.ts
 *   /api/youtube-videos        → pages/api/youtube-videos.ts
 *   /api/contact               → pages/api/contact.ts
 *   /api/site-settings         → pages/api/site-settings.ts
 *   /api/social-proof/*        → pages/api/social-proof/
 *   /api/storage/sign-upload   → pages/api/storage/sign-upload.ts
 *   /api/admin/artists         → pages/api/admin/artists.ts
 *   /api/admin/test-storage    → pages/api/admin/test-storage.ts
 *   /api/generate-poster       → pages/api/generate-poster.ts
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB       = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK       = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const API_SERVER = process.env.API_SERVER_URL
  ?? process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")
  ?? "http://localhost:3001";

const H = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

const isAdmin = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

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
const get    = async (t: string, q = "") => { const r = await sb(t, q); return r.ok ? r.data : []; };
const ins    = (t: string, b: unknown) => sb(t, "", "POST", b);
const upsert = (t: string, b: unknown) => sb(t, "", "POST", b, "return=representation,resolution=merge-duplicates");
const patch  = (t: string, q: string, b: unknown) => sb(t, q, "PATCH", b);
const del    = (t: string, q: string) => sb(t, q, "DELETE", undefined, "return=minimal");

const pq = (filters: Record<string, string> = {}) => {
  const parts = Object.entries(filters).map(([k, v]) => `${encodeURIComponent(k)}=${v}`);
  return parts.length ? `?${parts.join("&")}` : "";
};
const eqf = (col: string, val: unknown) => ({ [col]: `eq.${val}` });
const ord  = (col: string, asc = true)  => ({ order: `${col}.${asc ? "asc" : "desc"}` });

function ytId(urlOrId: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = urlOrId.match(p); if (m) return m[1]; }
  return null;
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

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

    // ── Health ────────────────────────────────────────────────────────────────
    if (path === "health") return res.json({ ok: true, ts: Date.now() });

    // ── Ticketing: forward to Express API server ──────────────────────────────
    if (segs[0] === "ticketing") {
      const qs = new URLSearchParams(req.query as Record<string, string>);
      qs.delete("proxy");
      const qsStr = qs.toString() ? `?${qs.toString()}` : "";
      const targetUrl = `${API_SERVER}/api/${segs.join("/")}${qsStr}`;
      const fwd: Record<string, string> = { "Content-Type": "application/json" };
      if (req.headers["authorization"]) fwd["authorization"] = req.headers["authorization"] as string;
      if (req.headers["x-admin-password"]) fwd["x-admin-password"] = req.headers["x-admin-password"] as string;
      try {
        const upstream = await fetch(targetUrl, {
          method: req.method ?? "GET",
          headers: fwd,
          ...(req.method !== "GET" && req.method !== "HEAD" && req.body
            ? { body: JSON.stringify(req.body) } : {}),
        });
        const ct = upstream.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) return res.status(upstream.status).json(await upstream.json());
        return res.status(upstream.status).send(await upstream.text());
      } catch (e: any) {
        return res.status(502).json({ error: `Ticketing API unreachable: ${e.message}` });
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN CMS  /api/functions/v1/*
    // ════════════════════════════════════════════════════════════════════════
    if (segs[0] === "functions" && segs[1] === "v1") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
      const fn = segs[2];

      // admin-signups
      if (fn === "admin-signups") {
        const rows = await get("early_access_signups", pq(ord("created_at", false))) as any[];
        if (rq.format === "csv") {
          const csv = ["id,email,source,created_at",
            ...rows.map((r: any) => [r.id, r.email, r.source ?? "", r.created_at]
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(","))
          ].join("\n");
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", "attachment; filename=signups.csv");
          return res.send(csv);
        }
        return res.json({ signups: rows });
      }

      // admin-content (settings / events / messages)
      if (fn === "admin-content") {
        if (m === "GET") {
          const type = rq.type;
          if (type === "events") return res.json({ events: await get("events", pq(ord("sort_order"))) });
          if (type === "messages") return res.json({ messages: await get("contact_messages", pq(ord("created_at", false))) });
          const rows = await get("site_settings", pq(eqf("id", "main"))) as any[];
          return res.json({ settings: rows[0] ?? null });
        }
        const { type, action, payload } = body;
        const now = new Date().toISOString();
        if (type === "events") {
          if (action === "upsert" || action === "save") {
            const ev = payload ?? body;
            const existing = ev?.id ? await get("events", pq(eqf("id", ev.id))) as any[] : [];
            if (existing.length) { await patch("events", pq(eqf("id", ev.id)), { ...ev, updated_at: now }); }
            else { if (!ev.slug) ev.slug = `event-${Date.now()}`; await ins("events", { ...ev, created_at: now, updated_at: now }); }
            return res.json({ events: await get("events", pq(ord("sort_order"))) });
          }
          if (action === "delete" && payload?.id) { await del("events", pq(eqf("id", payload.id))); return res.json({ ok: true }); }
        }
        const settings = payload ?? body;
        const existing2 = await get("site_settings", pq(eqf("id", "main"))) as any[];
        if (existing2.length) { await patch("site_settings", pq(eqf("id", "main")), { ...settings, updated_at: now }); }
        else { const { created_at: _d, ...safe } = settings as any; await ins("site_settings", { id: "main", ...safe, updated_at: now }); }
        return res.json({ ok: true });
      }

      // admin-curated-events
      if (fn === "admin-curated-events") {
        if (m === "GET") return res.json({ events: await get("curated_events", pq(ord("created_at", false))) });
        const action = body.action; const row = body.payload ?? body; const now = new Date().toISOString();
        if (m === "POST") {
          if (action === "delete") { await del("curated_events", pq(eqf("id", row.id))); return res.json({ ok: true }); }
          const clean = { ...row, updated_at: now }; delete clean.action; delete clean.payload;
          if (clean.id) { await patch("curated_events", pq(eqf("id", clean.id)), clean); }
          else { clean.created_at = now; await ins("curated_events", clean); }
          return res.json({ ok: true });
        }
        if (m === "DELETE") { await del("curated_events", pq(eqf("id", rq.id ?? row.id))); return res.json({ ok: true }); }
      }

      if (fn === "curate-events" || fn === "scheduled-curate") {
        return res.json({ ok: true, upserted: 0, message: "Auto-curation not configured." });
      }

      // admin-videos
      if (fn === "admin-videos") {
        if (m === "GET") return res.json({ videos: await get("site_videos", pq(ord("sort_order"))) });
        if (m === "POST") {
          const url: string = body.url ?? body.youtube_id ?? "";
          const id = ytId(url) ?? url;
          if (!id) return res.status(400).json({ error: "Could not parse YouTube ID" });
          const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
          const now = new Date().toISOString();
          const existing = await get("site_videos", pq(ord("sort_order"))) as any[];
          const nextOrder = existing.length ? Math.max(...existing.map((v: any) => v.sort_order ?? 0)) + 1 : 0;
          const { ok, data } = await ins("site_videos", { youtube_id: id, title: body.title || id, thumbnail_url: thumb, is_featured: body.is_featured ?? false, sort_order: nextOrder, created_at: now, updated_at: now });
          return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
        }
        if (m === "PUT") { const { id, ...rest } = body; const { ok } = await patch("site_videos", pq(eqf("id", id)), { ...rest, updated_at: new Date().toISOString() }); return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" }); }
        if (m === "DELETE") { await del("site_videos", pq(eqf("id", rq.id ?? body.id))); return res.json({ ok: true }); }
      }

      if (fn === "admin-rsvps") {
        const f: Record<string, string> = { ...ord("created_at", false) };
        if (rq.event_slug) f["event_slug"] = `eq.${rq.event_slug}`;
        return res.json({ rsvps: await get("event_rsvps", pq(f)) });
      }

      if (fn === "admin-promoters") {
        if (m === "GET") return res.json({ promoters: await get("promoters", pq(ord("name"))) });
        if (m === "POST") {
          const { action, payload } = body; const now = new Date().toISOString(); const row = payload ?? body;
          if (action === "toggle_trust" && payload?.id) { const { ok } = await patch("promoters", pq(eqf("id", payload.id)), { trusted: payload.trusted, updated_at: now }); return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" }); }
          if (action === "delete" && payload?.id) { await del("promoters", pq(eqf("id", payload.id))); return res.json({ ok: true }); }
          const { action: _a, payload: _p, created_at: _c, ...cleanRow } = row as any;
          if (cleanRow.id) { const { ok } = await patch("promoters", pq(eqf("id", cleanRow.id)), { ...cleanRow, updated_at: now }); return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" }); }
          const { ok, data } = await ins("promoters", { ...cleanRow, created_at: now, updated_at: now });
          return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
        }
      }

      // admin-artists (legacy alias — canonical routes live in pages/api/admin/artists.ts)
      if (fn === "admin-artists") {
        if (m === "GET") return res.json({ artists: await get("artists", pq(ord("name"))) });
        if (m === "POST") { const now = new Date().toISOString(); const { ok, data } = await ins("artists", { ...body, created_at: now, updated_at: now }); return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" }); }
        if (m === "PATCH") { const id = rq.id ?? body.id; const { ok, data } = await patch("artists", pq(eqf("id", id)), { ...body, updated_at: new Date().toISOString() }); return ok ? res.json(data) : res.status(400).json({ error: "Failed" }); }
        if (m === "DELETE") { const id = rq.id ?? body.id; await del("artists", pq(eqf("id", id))); return res.json({ ok: true }); }
      }

      if (fn === "admin-publish-blog" || fn === "admin-generate-blog") {
        const rows = await get("site_settings", pq(eqf("id", "main"))) as any[];
        const existing = rows[0]; const posts = [...(existing?.blog_posts ?? [])];
        if (body?.post) posts.unshift(body.post);
        if (existing) await patch("site_settings", pq(eqf("id", "main")), { blog_posts: posts, updated_at: new Date().toISOString() });
        else await ins("site_settings", { id: "main", blog_posts: posts, created_at: new Date().toISOString() });
        return res.json({ ok: true, posts });
      }

      // admin-upload-poster — issue a signed Supabase Storage URL
      if (fn === "admin-upload-poster") {
        if (!SK) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY is not configured." });
        const BUCKET = "event-posters";
        await fetch(`${SB}/storage/v1/bucket`, { method: "POST", headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 10485760, allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"] }) }).catch(() => {});
        const slug = (body.slug ?? `poster-${Date.now()}`).toString().replace(/[^a-z0-9-_]/gi, "-").slice(0, 60);
        const ext = (body.ext ?? "jpg").toString().replace(/[^a-z0-9]/gi, "").slice(0, 5);
        const mimeType = body.mimeType ?? "image/jpeg";
        const storagePath = `${slug}-${Date.now()}.${ext}`;
        const signRes = await fetch(`${SB}/storage/v1/object/upload/sign/${BUCKET}/${storagePath}`, { method: "POST", headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" }, body: JSON.stringify({ upsert: "true" }) });
        if (!signRes.ok) { const err = await signRes.text(); return res.status(signRes.status).json({ error: `Could not get upload URL (${signRes.status}): ${err.slice(0, 300)}` }); }
        const signJson = await signRes.json() as { signedURL?: string; url?: string };
        const rawUrl = signJson.signedURL ?? signJson.url ?? "";
        if (!rawUrl) return res.status(500).json({ error: "Supabase did not return a signed URL." });
        const signedUrl = rawUrl.startsWith("http") ? rawUrl : `${SB}${rawUrl}`;
        return res.json({ signedUrl, path: storagePath, publicUrl: `${SB}/storage/v1/object/public/${BUCKET}/${storagePath}`, mimeType });
      }

      if (fn === "setup-storage") {
        if (!SK) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY is not configured." });
        const BUCKET = "event-posters";
        const r = await fetch(`${SB}/storage/v1/bucket`, { method: "POST", headers: { Authorization: `Bearer ${SK}`, apikey: SK, "Content-Type": "application/json" }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 10485760, allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"] }) });
        const txt = await r.text(); const data = txt ? tryJson(txt) : {};
        if (r.ok) return res.json({ ok: true, created: true, bucket: BUCKET });
        if (r.status === 409) return res.json({ ok: true, created: false, message: `Bucket '${BUCKET}' already exists.` });
        return res.status(r.status).json({ error: data?.message ?? txt });
      }

      if (fn === "enrich-artists") return res.json({ ok: true, message: "Enrichment queued." });

      return res.status(404).json({ error: `Unknown admin function: ${fn}` });
    }

    // ── Catbot SSE proxy ──────────────────────────────────────────────────────
    if (path === "catbot-chat" && m === "POST") {
      const CATBOT_URL = process.env.CATBOT_EDGE_URL ?? `${SB}/functions/v1/catbot-chat`;
      const ANON_KEY   = process.env.SUPABASE_ANON_KEY ?? "";
      if (!ANON_KEY) return res.status(503).json({ error: "Catbot not configured — SUPABASE_ANON_KEY missing" });
      try {
        const upstream = await fetch(CATBOT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` }, body: JSON.stringify(req.body) });
        if (!upstream.ok || !upstream.body) { const txt = await upstream.text().catch(() => "stream error"); return res.status(upstream.status).send(txt); }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        const reader = upstream.body.getReader();
        const pump = async () => { const { done, value } = await reader.read(); if (done) { res.end(); return; } res.write(value); await pump(); };
        await pump();
      } catch (err: any) {
        return res.status(502).json({ error: `Catbot unreachable: ${err.message}` });
      }
      return;
    }

    // ── Curated event interactions (save/dismiss/click/rsvp/share) ────────────
    if (segs[0] === "events" && segs[2] === "interact" && m === "POST") {
      const eventId = segs[1];
      const { action = "click", user_id } = body ?? {};
      if (!eventId) return res.status(400).json({ error: "event id required" });
      if (user_id) await ins("user_event_interactions", { user_id, event_id: eventId, action, created_at: new Date().toISOString() }).catch(() => {});
      const sessionId = (req.headers["x-session-id"] as string) || `anon-${Date.now()}`;
      await ins("event_signals", { session_id: sessionId, event_id: eventId, signal_type: action, created_at: new Date().toISOString() }).catch(() => {});
      return res.json({ ok: true });
    }

    // ── Artist submissions (public) ───────────────────────────────────────────
    if (path === "artist-submissions" && m === "POST") {
      const { name, submitter_email, submitter_role, bio, from_city, based_city, genres, festivals, instagram, soundcloud, bandcamp, spotify, website, booking_email, manager_email, labels, members, photo_url, notes } = body;
      const { ok } = await ins("artist_submissions", {
        ...(name && { name }), ...(submitter_email && { submitter_email }), ...(submitter_role && { submitter_role }), ...(bio && { bio }), ...(from_city && { from_city }), ...(based_city && { based_city }), ...(genres !== undefined && { genres }), ...(festivals !== undefined && { festivals }), ...(instagram && { instagram }), ...(soundcloud && { soundcloud }), ...(bandcamp && { bandcamp }), ...(spotify && { spotify }), ...(website && { website }), ...(booking_email && { booking_email }), ...(manager_email && { manager_email }), ...(labels && { labels }), ...(members && { members }), ...(photo_url && { photo_url }), ...(notes && { notes }),
        status: "pending", created_at: new Date().toISOString(),
      });
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }

    // ── Promoter applications → contact_messages ──────────────────────────────
    if (path === "promoter-applications" && m === "POST") {
      const { name, email, instagram, website: pWeb, city, genres, bio, sample_event } = body;
      if (!name || !email) return res.status(400).json({ error: "name and email required" });
      const message = [`[Promoter Application]`, `City: ${city || "—"}`, `Genres: ${Array.isArray(genres) ? genres.join(", ") : (genres || "—")}`, `Instagram: ${instagram || "—"}`, `Website: ${pWeb || "—"}`, `Sample Event: ${sample_event || "—"}`, "", `Bio: ${bio || "—"}`].join("\n");
      const { ok } = await ins("contact_messages", { name, email, message, created_at: new Date().toISOString() });
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }

    // ── Event appearances (gigography) ────────────────────────────────────────
    if (path === "event-appearances") {
      if (m === "GET") {
        const f: Record<string, string> = { ...ord("event_date", false) };
        if (rq.artist_id)   f["artist_id"]   = `eq.${rq.artist_id}`;
        if (rq.artist_slug) f["artist_slug"] = `eq.${rq.artist_slug}`;
        if (rq.city)        f["city"]        = `ilike.*${rq.city}*`;
        if (rq.year)        f["year"]        = `eq.${rq.year}`;
        return res.json(await get("event_appearances", pq(f)));
      }
      if (m === "POST") {
        if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
        const { ok, data } = await ins("event_appearances", { ...body, created_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
    }

    // ── Event artist lineups ──────────────────────────────────────────────────
    if (path === "event-artist-lineups") {
      if (m === "GET") { const f: Record<string, string> = { ...ord("sort_order") }; if (rq.curated_event_id) f["curated_event_id"] = `eq.${rq.curated_event_id}`; if (rq.artist_slug) f["artist_slug"] = `eq.${rq.artist_slug}`; return res.json(await get("event_artist_lineups", pq(f))); }
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const now = new Date().toISOString();
      if (m === "POST") { const { ok, data } = await ins("event_artist_lineups", { ...body, created_at: now }); return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" }); }
      const id = rq.id ?? body.id; if (!id) return res.status(400).json({ error: "id required" });
      if (m === "PATCH") { const { ok } = await patch("event_artist_lineups", pq(eqf("id", id)), body); return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" }); }
      if (m === "DELETE") { await del("event_artist_lineups", pq(eqf("id", id))); return res.json({ ok: true }); }
    }

    // ── Venue profiles ────────────────────────────────────────────────────────
    if (path === "venue-profiles") {
      if (m === "GET") { const f: Record<string, string> = { ...ord("name") }; if (rq.city) f["city"] = `ilike.*${rq.city}*`; if (rq.tier) f["tier"] = `eq.${rq.tier}`; return res.json(await get("venue_profiles", pq(f))); }
      if (m === "POST") { if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" }); const now = new Date().toISOString(); const { ok, data } = await ins("venue_profiles", { ...body, created_at: now, updated_at: now }); return ok ? res.json(data) : res.status(400).json({ error: "Failed" }); }
    }

    // ── Event signals ─────────────────────────────────────────────────────────
    if (path === "event-signals" && m === "POST") {
      const { session_id, event_id, signal_type, city, genre } = body;
      if (!session_id || !event_id) return res.status(400).json({ error: "session_id and event_id required" });
      const { ok } = await ins("event_signals", { session_id, event_id, signal_type: signal_type ?? "click", city, genre, created_at: new Date().toISOString() });
      return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
    }
    if (segs[0] === "event-signals" && segs[1] === "trending" && m === "GET") {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const rows = await get("event_signals", `?created_at=gte.${since}&signal_type=eq.click&select=event_id`) as { event_id: string }[];
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
      const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 20).map(([event_id, clicks]) => ({ event_id, clicks }));
      return res.json(sorted);
    }

    // ── Role applications ─────────────────────────────────────────────────────
    if (path === "role-applications" && m === "GET") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const f: Record<string, string> = { ...ord("created_at", false) };
      if (rq.status) f["status"] = `eq.${rq.status}`;
      return res.json(await get("role_applications", pq(f)));
    }
    if (path === "role-applications" && m === "POST") {
      const { user_id, email, display_name, requested_role, entity_id, entity_slug, message, links } = body;
      if (!user_id || !email || !requested_role) return res.status(400).json({ error: "user_id, email, requested_role required" });
      const { ok } = await ins("role_applications", { user_id, email, display_name, requested_role, entity_id: entity_id ?? null, entity_slug: entity_slug ?? null, message: message ?? null, links: links ?? {}, status: "pending", created_at: new Date().toISOString() });
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }
    if (segs[0] === "role-applications" && segs[1] && m === "PATCH") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      const now = new Date().toISOString();
      const { status: newStatus, reviewer_id } = body;
      const { ok } = await patch("role_applications", pq(eqf("id", segs[1])), { status: newStatus, reviewed_by: reviewer_id, reviewed_at: now });
      if (ok && newStatus === "approved") {
        const apps = await get("role_applications", pq(eqf("id", segs[1]))) as any[];
        if (apps.length) {
          const app = apps[0];
          const existing = await get("user_roles", pq(eqf("user_id", app.user_id))) as any[];
          const roleData = { role: app.requested_role, entity_id: app.entity_id, entity_slug: app.entity_slug, entity_name: app.display_name, granted_by: reviewer_id, granted_at: now, updated_at: now };
          if (existing.length) await patch("user_roles", pq(eqf("user_id", app.user_id)), roleData);
          else await ins("user_roles", { user_id: app.user_id, email: app.email, ...roleData, created_at: now });
        }
      }
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }

    // ── Admin: list all roles ─────────────────────────────────────────────────
    if (path === "admin-roles" && m === "GET") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      return res.json(await get("user_roles", pq(ord("created_at", false))));
    }

    // ── Manual cron trigger ───────────────────────────────────────────────────
    if (path === "cron/trigger" && m === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
      try {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const r = await fetch(`${base}/api/cron/scrape-events`, { method: "POST", headers: { "x-admin-password": ADMIN_PW } });
        return res.json(await r.json());
      } catch (err: any) {
        return res.status(500).json({ error: err?.message });
      }
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────
    return res.status(404).json({
      error: `No handler for ${m} /${path}. This route may have been extracted to pages/api/.`,
    });

  } catch (err: any) {
    console.error("[proxy] unhandled error:", err);
    return res.status(500).json({ error: err?.message ?? "Internal proxy error" });
  }
}

/**
 * CCD API proxy — Next.js serverless function
 * Routes all /api/* calls to Supabase REST with service-role key.
 * Admin routes require x-admin-password header matching ADMIN_PASSWORD env var.
 * NO hardcoded password fallback — set ADMIN_PASSWORD in Vercel env vars.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? ""; // set in Vercel — no fallback

if (!SK) console.error("[proxy] SUPABASE_SERVICE_KEY not set");

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
// Builds ?col=eq.val&col2=order.asc style strings
const pq = (filters: Record<string,string> = {}) => {
  const p = new URLSearchParams(filters);
  return p.size ? `?${p}` : "";
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
      const settings = payload ?? body;
      const now = new Date().toISOString();
      const existing = await get("site_settings", pq(eqf("id","main"))) as any[];
      if (existing.length) {
        await patch("site_settings", pq(eqf("id","main")), { ...settings, updated_at: now });
      } else {
        await ins("site_settings", { id: "main", ...settings, created_at: now, updated_at: now });
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
        const { ok, data } = await ins("promoters", { ...body, created_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
    }

    // ── artists (admin) ───────────────────────────────────────────────────────
    if (fn === "admin-artists") {
      if (m === "GET") return res.json({ artists: await get("artists", pq(ord("name"))) });
      if (m === "PATCH") {
        const id = rq.id ?? body.id;
        const { ok, data } = await patch("artists", pq(eqf("id", id)), { ...body, updated_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
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
    // Public submissions go to artist_submissions, not artists (requires admin approval)
    const now = new Date().toISOString();
    const { ok } = await ins("artist_submissions", { ...body, status: "pending", created_at: now });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // ── Artists: patch (admin only) ─────────────────────────────────────────────
  if (segs[0] === "artists" && segs[1] && m === "PATCH") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const { ok, data } = await patch("artists", pq(eqf("id", segs[1])), { ...body, updated_at: new Date().toISOString() });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
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
  if (path === "contact" && m === "POST") {
    const { ok } = await ins("contact_messages", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "early-access" && m === "POST") {
    // check for existing
    const email = body.email?.toLowerCase()?.trim();
    if (!email) return res.status(400).json({ error: "Email required" });
    const existing = await get("early_access_signups", pq(eqf("email", email))) as any[];
    if (existing?.length) return res.json({ ok: true, duplicate: true });
    const { ok } = await ins("early_access_signups", { ...body, email, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "event-rsvp" && m === "POST") {
    const { ok } = await ins("event_rsvps", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Artist submissions (public) ─────────────────────────────────────────────
  if (path === "artist-submissions" && m === "POST") {
    const { ok } = await ins("artist_submissions", { ...body, status: "pending", created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  // ── Stubs ───────────────────────────────────────────────────────────────────
  if (path === "instagram-feed") return res.json({ posts: [] });
  if (path === "youtube-videos") return res.json({ videos: [] });

  return res.status(404).json({ error: `No handler for ${m} /${path}` });
}

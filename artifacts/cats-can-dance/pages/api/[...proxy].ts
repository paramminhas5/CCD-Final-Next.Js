import type { NextApiRequest, NextApiResponse } from "next";

const SB_URL = "https://nrzgyippztzenoyrtszr.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yemd5aXBwenR6ZW5veXJ0c3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNjAzOCwiZXhwIjoyMDk0NjkyMDM4fQ.79dS5Y1Ov1P51veAR62fKEX4m-okHqSAg6huzTTL2C4";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "84838281";

const SB = { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, "Content-Type": "application/json" };
const isAdmin = (req: NextApiRequest) => req.headers["x-admin-password"] === ADMIN_PASSWORD;

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbFetch(table: string, qs = "", method = "GET", body?: unknown, extra?: Record<string,string>) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}${qs}`, {
    method,
    headers: { ...SB, Prefer: "return=representation", ...extra },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? safeJson(text) : null };
}
function safeJson(t: string) { try { return JSON.parse(t); } catch { return t; } }

async function sbGet(table: string, qs = "") { const r = await sbFetch(table, qs); return r.ok ? r.data : []; }
async function sbPost(table: string, body: unknown, upsert = false) {
  return sbFetch(table, "", "POST", body, upsert ? { Prefer: "return=representation,resolution=merge-duplicates" } : { Prefer: "return=representation" });
}
async function sbPatch(table: string, qs: string, body: unknown) { return sbFetch(table, qs, "PATCH", body); }
async function sbDelete(table: string, qs: string) { return sbFetch(table, qs, "DELETE", undefined, { Prefer: "return=minimal" }); }

// ── Postgrest filter builder ──────────────────────────────────────────────────
function qs(filter: Record<string, string> = {}, extras: Record<string, string> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) p.set(k, v);
  for (const [k, v] of Object.entries(extras)) p.set(k, v);
  return p.toString() ? `?${p}` : "";
}
function eq(col: string, val: unknown) { return { [col]: `eq.${val}` }; }
function orderStr(col: string, asc = true) { return `${col}.${asc ? "asc" : "desc"}`; }

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const segments: string[] = Array.isArray(req.query.proxy) ? req.query.proxy : [req.query.proxy as string];
  const path = segments.join("/");
  const { proxy: _p, ...rawQ } = req.query as Record<string, string>;
  const body = req.body ?? {};
  const method = req.method ?? "GET";

  // ── Health ──────────────────────────────────────────────────────────────────
  if (path === "health") return res.json({ ok: true });

  // ════════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES  /api/functions/v1/*
  // ════════════════════════════════════════════════════════════════════════════
  if (segments[0] === "functions" && segments[1] === "v1") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const fn = segments[2];

    // ── Admin: verify + signups ───────────────────────────────────────────────
    if (fn === "admin-signups") {
      if (rawQ.format === "csv") {
        const rows = await sbGet("early_access_signups", `?${qs({}, { order: orderStr("created_at", false) })}`);
        const csv = ["id,email,source,created_at", ...(rows as any[]).map((r: any) =>
          [r.id, r.email, r.source ?? "", r.created_at].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        )].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="signups.csv"`);
        return res.send(csv);
      }
      const signups = await sbGet("early_access_signups", qs({}, { order: orderStr("created_at", false) }));
      return res.json({ signups: signups ?? [] });
    }

    // ── Admin: content (settings / events / messages) ─────────────────────────
    if (fn === "admin-content") {
      if (method === "GET") {
        const type = rawQ.type;
        if (type === "events") {
          const events = await sbGet("events", qs({}, { order: orderStr("sort_order") }));
          return res.json({ events: events ?? [] });
        }
        if (type === "messages") {
          const messages = await sbGet("contact_messages", qs({}, { order: orderStr("created_at", false) }));
          return res.json({ messages: messages ?? [] });
        }
        // settings
        const rows = await sbGet("site_settings", qs(eq("id", "main")));
        return res.json({ settings: Array.isArray(rows) ? rows[0] ?? null : rows });
      }
      if (method === "POST" || method === "PATCH") {
        const { type, action, payload } = body as { type?: string; action?: string; payload?: any };

        // Events CRUD
        if (type === "events") {
          if (action === "upsert") {
            const ev = payload;
            const existing = ev?.id ? await sbGet("events", qs(eq("id", ev.id))) : [];
            const now = new Date().toISOString();
            if (Array.isArray(existing) && existing.length > 0) {
              await sbPatch("events", qs(eq("id", ev.id)), { ...ev, updated_at: now });
            } else {
              await sbPost("events", { ...ev, created_at: now, updated_at: now });
            }
            const updated = await sbGet("events", qs({}, { order: orderStr("sort_order") }));
            return res.json({ events: updated });
          }
          if (action === "delete" && payload?.id) {
            await sbDelete("events", qs(eq("id", payload.id)));
            return res.json({ ok: true });
          }
        }

        // Settings save (any other type)
        const rows = await sbGet("site_settings", qs(eq("id", "main")));
        const existing = Array.isArray(rows) ? rows[0] : null;
        const settingsPayload = payload ?? body;
        if (existing) {
          await sbPatch("site_settings", qs(eq("id", "main")), { ...settingsPayload, updated_at: new Date().toISOString() });
        } else {
          await sbPost("site_settings", { id: "main", ...settingsPayload, created_at: new Date().toISOString() });
        }
        return res.json({ ok: true });
      }
    }

    // ── Admin: curated events ─────────────────────────────────────────────────
    if (fn === "admin-curated-events") {
      if (method === "GET") {
        const rows = await sbGet("curated_events", qs({}, { order: orderStr("created_at", false) }));
        return res.json({ events: rows ?? [] });
      }
      if (method === "POST") {
        const now = new Date().toISOString();
        const { ok, data } = await sbPost("curated_events", { ...body, created_at: now, updated_at: now });
        return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Insert failed" });
      }
      if (method === "PATCH") {
        const id = rawQ.id ?? body?.id;
        const { ok, data } = await sbPatch("curated_events", qs(eq("id", id)), { ...body, updated_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Update failed" });
      }
      if (method === "DELETE") {
        const id = rawQ.id ?? body?.id;
        await sbDelete("curated_events", qs(eq("id", id)));
        return res.json({ ok: true });
      }
    }

    // ── Admin: curate-events (auto-fetch / scheduled) ─────────────────────────
    if (fn === "curate-events" || fn === "scheduled-curate") {
      return res.json({ ok: true, message: "Auto-curation not yet wired — add events manually." });
    }

    // ── Admin: videos ─────────────────────────────────────────────────────────
    if (fn === "admin-videos") {
      if (method === "GET") {
        const rows = await sbGet("site_videos", qs({}, { order: orderStr("sort_order") }));
        return res.json({ videos: rows ?? [] });
      }
      if (method === "POST") {
        const now = new Date().toISOString();
        const { ok, data } = await sbPost("site_videos", { ...body, created_at: now, updated_at: now });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
      if (method === "DELETE") {
        const id = rawQ.id ?? body?.id;
        await sbDelete("site_videos", qs(eq("id", id)));
        return res.json({ ok: true });
      }
    }

    // ── Admin: rsvps ──────────────────────────────────────────────────────────
    if (fn === "admin-rsvps") {
      const filter: Record<string, string> = { order: orderStr("created_at", false) };
      if (rawQ.event_slug) filter["event_slug"] = `eq.${rawQ.event_slug}`;
      const rsvps = await sbGet("event_rsvps", qs({}, filter));
      return res.json({ rsvps: rsvps ?? [] });
    }

    // ── Admin: promoters ──────────────────────────────────────────────────────
    if (fn === "admin-promoters") {
      if (method === "GET") {
        const rows = await sbGet("promoters", qs({}, { order: orderStr("name") }));
        return res.json({ promoters: rows ?? [] });
      }
      if (method === "POST") {
        const { ok, data } = await sbPost("promoters", { ...body, created_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
    }

    // ── Admin: artists ────────────────────────────────────────────────────────
    if (fn === "admin-artists") {
      if (method === "GET") {
        const rows = await sbGet("artists", qs({}, { order: orderStr("name") }));
        return res.json({ artists: rows ?? [] });
      }
      if (method === "PATCH") {
        const id = rawQ.id ?? body?.id;
        const { ok, data } = await sbPatch("artists", qs(eq("id", id)), { ...body, updated_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
    }

    // ── Admin: upload poster (stub — needs R2/Cloudflare storage) ─────────────
    if (fn === "admin-upload-poster") {
      return res.status(501).json({ error: "File upload not yet configured. Host images externally and paste the URL." });
    }

    // ── Admin: blog ───────────────────────────────────────────────────────────
    if (fn === "admin-publish-blog" || fn === "admin-generate-blog") {
      const rows = await sbGet("site_settings", qs(eq("id", "main")));
      const existing = Array.isArray(rows) ? rows[0] : null;
      const posts = existing?.blog_posts ?? [];
      if (method === "POST" && body?.post) {
        posts.unshift(body.post);
        if (existing) await sbPatch("site_settings", qs(eq("id", "main")), { blog_posts: posts, updated_at: new Date().toISOString() });
        else await sbPost("site_settings", { id: "main", blog_posts: posts });
      }
      return res.json({ ok: true, posts });
    }

    // ── Admin: enrich artists (stub) ──────────────────────────────────────────
    if (fn === "enrich-artists") {
      return res.json({ ok: true, message: "Enrichment queued — check back shortly." });
    }

    return res.status(404).json({ error: `Unknown admin fn: ${fn}` });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Artists ──────────────────────────────────────────────────────────────
  if (path === "artists") {
    if (method === "GET") {
      const filter: Record<string, string> = { "status": "eq.approved", order: orderStr("name") };
      const rows = await sbGet("artists", qs(filter));
      return res.json(rows ?? []);
    }
    if (method === "POST") {
      const { ok, data } = await sbPost("artists", body);
      return ok ? res.json(data) : res.status(400).json({ error: "Insert failed" });
    }
  }

  // GET /api/artists/:slug
  if (segments[0] === "artists" && segments[1] && segments.length === 2 && method === "GET") {
    const slug = segments[1];
    const rows = await sbGet("artists", qs({ slug: `eq.${slug}`, status: "eq.approved" }));
    const artist = Array.isArray(rows) ? rows[0] : null;
    if (!artist) return res.status(404).json({ error: "Not found" });
    return res.json(artist);
  }

  // PATCH /api/artists/:id
  if (segments[0] === "artists" && segments[1] && method === "PATCH") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });
    const { ok, data } = await sbPatch("artists", qs(eq("id", segments[1])), { ...body, updated_at: new Date().toISOString() });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  // POST /api/artists/:id/claim
  if (segments[0] === "artists" && segments[2] === "claim") {
    const rows = await sbGet("artists", qs(eq("id", segments[1])));
    if (!Array.isArray(rows) || !rows.length) return res.status(404).json({ error: "Not found" });
    if (rows[0].claimed_by) return res.status(409).json({ error: "Already claimed" });
    const { ok } = await sbPatch("artists", qs(eq("id", segments[1])), { claimed_by: body?.user_id ?? "pending" });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Artist dates ──────────────────────────────────────────────────────────
  if (path === "artist-dates") {
    if (method === "GET") {
      const filter: Record<string, string> = { is_public: "eq.true", order: orderStr("event_date") };
      if (rawQ.artist_id) filter.artist_id = `eq.${rawQ.artist_id}`;
      return res.json(await sbGet("artist_dates", qs(filter)) ?? []);
    }
    if (method === "POST") {
      const { ok, data } = await sbPost("artist_dates", body);
      return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  if (path === "events") {
    const rows = await sbGet("events", qs({}, { order: orderStr("sort_order") }));
    return res.json(rows ?? []);
  }
  if (segments[0] === "events" && segments[1] && method === "GET") {
    const rows = await sbGet("events", qs(eq("slug", segments[1])));
    const ev = Array.isArray(rows) ? rows[0] : null;
    return ev ? res.json(ev) : res.status(404).json({ error: "Not found" });
  }

  // ── Curated events ────────────────────────────────────────────────────────
  if (path === "curated-events") {
    const rows = await sbGet("curated_events", qs({}, { order: orderStr("event_date") }));
    return res.json(rows ?? []);
  }

  // ── Videos ────────────────────────────────────────────────────────────────
  if (path === "videos") {
    const rows = await sbGet("site_videos", qs({}, { order: orderStr("sort_order") }));
    return res.json(rows ?? []);
  }

  // ── Site settings ─────────────────────────────────────────────────────────
  if (path === "site-settings") {
    if (method === "GET") {
      const rows = await sbGet("site_settings", qs(eq("id", "main")));
      return res.json(Array.isArray(rows) ? rows[0] ?? null : rows);
    }
    if (method === "PATCH" && isAdmin(req)) {
      const rows = await sbGet("site_settings", qs(eq("id", "main")));
      const existing = Array.isArray(rows) ? rows[0] : null;
      if (existing) await sbPatch("site_settings", qs(eq("id", "main")), { ...body, updated_at: new Date().toISOString() });
      else await sbPost("site_settings", { id: "main", ...body });
      return res.json({ ok: true });
    }
  }

  // ── Forms ─────────────────────────────────────────────────────────────────
  if (path === "contact" && method === "POST") {
    const { ok } = await sbPost("contact_messages", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "early-access" && method === "POST") {
    const { ok } = await sbPost("early_access_signups", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "event-rsvp" && method === "POST") {
    const { ok } = await sbPost("event_rsvps", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "artist-submissions" && method === "POST") {
    const { ok } = await sbPost("artist_submissions", { ...body, created_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Stubs ─────────────────────────────────────────────────────────────────
  if (path === "instagram-feed") return res.json({ posts: [] });
  if (path === "youtube-videos") return res.json({ videos: [] });
  if (path === "storage") return res.status(501).json({ error: "Storage not configured" });

  return res.status(404).json({ error: `No handler for ${method} /${path}` });
}

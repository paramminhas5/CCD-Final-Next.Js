/**
 * Supabase catch-all proxy — replaces the Express API server for Vercel deployments.
 * All /api/* calls from the frontend land here and are forwarded to Supabase REST.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SUPABASE_URL = "https://nrzgyippztzenoyrtszr.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yemd5aXBwenR6ZW5veXJ0c3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNjAzOCwiZXhwIjoyMDk0NjkyMDM4fQ.79dS5Y1Ov1P51veAR62fKEX4m-okHqSAg6huzTTL2C4";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "84838281";

const SB_HEADERS = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function sbHeaders(extra?: Record<string, string>) {
  return { ...SB_HEADERS, ...extra };
}

/** Convert shim query params → PostgREST query string */
function toPostgrest(query: Record<string, string | string[]>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (k === "order") {
      // shim sends "name:asc" → postgrest "name.asc"
      params.set("order", val.replace(":", "."));
    } else if (k === "limit" || k === "offset" || k === "or" || k === "select") {
      params.set(k, val);
    } else if (k.startsWith("neq_")) {
      params.set(k.slice(4), `neq.${val}`);
    } else if (k.startsWith("is_")) {
      params.set(k.slice(3), `is.${val}`);
    } else {
      // simple eq
      params.set(k, `eq.${val}`);
    }
  }
  return params.toString() ? `?${params}` : "";
}

function isAdmin(req: NextApiRequest): boolean {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

async function sbGet(table: string, qs: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, { headers: sbHeaders() });
  return r.ok ? r.json() : null;
}
async function sbInsert(table: string, body: unknown, upsert = false) {
  const prefer = upsert
    ? "return=representation,resolution=merge-duplicates"
    : "return=representation";
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders({ Prefer: prefer }),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text ? JSON.parse(text) : null };
}
async function sbUpdate(table: string, qs: string, body: unknown) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "PATCH",
    headers: sbHeaders(),
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { ok: r.ok, body: text ? JSON.parse(text) : null };
}
async function sbDelete(table: string, qs: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "DELETE",
    headers: sbHeaders({ Prefer: "return=minimal" }),
  });
  return r.ok;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = (req.query.proxy as string[]) ?? [];
  const path = segments.join("/");
  const { method } = req;
  // strip known filter/pagination params from query to build qs
  const { proxy: _p, ...rawQuery } = req.query as Record<string, string>;
  const body = req.body;

  // ── Health ─────────────────────────────────────────────────────────────
  if (path === "health") return res.json({ ok: true });

  // ── Artists ────────────────────────────────────────────────────────────
  if (path === "artists") {
    if (method === "GET") {
      const qs = toPostgrest({ status: "approved", order: "name:asc", ...rawQuery });
      const rows = await sbGet("artists", qs);
      return res.json(rows ?? []);
    }
    if (method === "POST") {
      const { ok, body: data } = await sbInsert("artists", body);
      return ok ? res.json(data) : res.status(400).json({ error: "Insert failed" });
    }
  }

  if (path === "artists/by-user") {
    // requires clerk session — return empty for now (portal flow handles this)
    return res.json(null);
  }

  // GET /api/artists/:slug  (slug is in query since shim uses query params)
  if (path === "artists" && rawQuery.slug) {
    const qs = toPostgrest({ slug: rawQuery.slug as string, status: "approved" });
    const rows = (await sbGet("artists", qs)) ?? [];
    return res.json(Array.isArray(rows) ? (rows[0] ?? null) : rows);
  }

  // PATCH /api/artists/:id or /api/artists/:id/profile
  if (segments[0] === "artists" && segments[1] && method === "PATCH") {
    const id = segments[1];
    const allowed = ["bio","why","instagram","soundcloud","bandcamp","spotify","website",
      "booking_email","manager_email","labels","open_to_bookings","available_cities",
      "photo_url","gallery","videos","members","based_city","from_city","genres","festivals",
      "fee_min_inr","fee_max_inr","fee_currency","status","featured","enrichment_log","name"];
    // admin can patch anything, others get filtered fields
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const src = (typeof body === "object" && body) ? body as Record<string, unknown> : {};
    for (const k of (isAdmin(req) ? Object.keys(src) : allowed)) {
      if (k in src) patch[k] = src[k];
    }
    const { ok, body: data } = await sbUpdate("artists", `?id=eq.${id}`, patch);
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Update failed" });
  }

  // POST /api/artists/:id/claim
  if (segments[0] === "artists" && segments[2] === "claim" && method === "POST") {
    const id = segments[1];
    const rows = await sbGet("artists", `?id=eq.${id}`);
    if (!rows?.length) return res.status(404).json({ error: "Not found" });
    if (rows[0].claimed_by) return res.status(409).json({ error: "Already claimed" });
    const { ok, body: data } = await sbUpdate("artists", `?id=eq.${id}`, {
      claimed_by: body?.user_id ?? "pending", updated_at: new Date().toISOString()
    });
    return ok ? res.json(data) : res.status(500).json({ error: "Claim failed" });
  }

  // GET /api/artists/:slug (path-style from ArtistDetail direct fetch)
  if (segments[0] === "artists" && segments[1] && segments.length === 2 && method === "GET") {
    const slug = segments[1];
    const rows = await sbGet("artists", `?slug=eq.${slug}&status=eq.approved`);
    if (!rows?.length) return res.status(404).json({ error: "Not found" });
    return res.json(rows[0]);
  }

  // ── Artist Dates ───────────────────────────────────────────────────────
  if (path === "artist-dates") {
    if (method === "GET") {
      const qs = toPostgrest({ is_public: "true", order: "event_date:asc", ...rawQuery });
      return res.json(await sbGet("artist_dates", qs) ?? []);
    }
    if (method === "POST") {
      const { ok, body: data } = await sbInsert("artist_dates", body);
      return ok ? res.json(data) : res.status(400).json({ error: "Insert failed" });
    }
  }

  // ── Site settings ──────────────────────────────────────────────────────
  if (path === "site-settings") {
    if (method === "GET") {
      const rows = await sbGet("site_settings", "?id=eq.main");
      return res.json(rows?.[0] ?? null);
    }
    if (method === "PATCH") {
      const rows = await sbGet("site_settings", "?id=eq.main");
      if (!rows?.length) {
        await sbInsert("site_settings", { id: "main", ...body });
      } else {
        await sbUpdate("site_settings", "?id=eq.main", { ...body, updated_at: new Date().toISOString() });
      }
      return res.json({ ok: true });
    }
  }

  // ── Curated Events ─────────────────────────────────────────────────────
  if (path === "curated-events") {
    const qs = toPostgrest({ order: "event_date:asc", ...rawQuery });
    return res.json(await sbGet("curated_events", qs) ?? []);
  }

  // ── Videos ────────────────────────────────────────────────────────────
  if (path === "videos") {
    const qs = toPostgrest({ order: "sort_order:asc", ...rawQuery });
    return res.json(await sbGet("site_videos", qs) ?? []);
  }

  // ── Forms ─────────────────────────────────────────────────────────────
  if (path === "contact" && method === "POST") {
    const { ok } = await sbInsert("contact_messages", body);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "early-access" && method === "POST") {
    const { ok } = await sbInsert("early_access_signups", body);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "event-rsvp" && method === "POST") {
    const { ok } = await sbInsert("event_rsvps", body);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }
  if (path === "artist-submissions" && method === "POST") {
    const { ok } = await sbInsert("artist_submissions", body);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
  }

  // ── Events (public) ───────────────────────────────────────────────────
  if (path === "events") {
    const qs = toPostgrest({ order: "sort_order:asc", ...rawQuery });
    return res.json(await sbGet("events", qs) ?? []);
  }
  if (segments[0] === "events" && segments[1] && method === "GET") {
    const rows = await sbGet("events", `?slug=eq.${segments[1]}`);
    return rows?.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  // ── ADMIN ROUTES (/functions/v1/*) ────────────────────────────────────
  if (segments[0] === "functions" && segments[1] === "v1") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const fn = segments[2];

    if (fn === "admin-content") {
      if (method === "GET") {
        const type = rawQuery.type;
        if (type === "events") return res.json({ events: await sbGet("curated_events", "?order=created_at.desc") ?? [] });
        if (type === "messages") return res.json({ messages: await sbGet("contact_messages", "?order=created_at.desc") ?? [] });
        const rows = await sbGet("site_settings", "?id=eq.main");
        return res.json({ settings: rows?.[0] ?? null });
      }
      if (method === "PATCH") {
        const rows = await sbGet("site_settings", "?id=eq.main");
        if (!rows?.length) await sbInsert("site_settings", { id: "main", ...body });
        else await sbUpdate("site_settings", "?id=eq.main", { ...body, updated_at: new Date().toISOString() });
        return res.json({ ok: true });
      }
    }

    if (fn === "admin-rsvps") return res.json({ rsvps: await sbGet("event_rsvps", "?order=created_at.desc") ?? [] });
    if (fn === "admin-signups") return res.json({ signups: await sbGet("early_access_signups", "?order=created_at.desc") ?? [] });
    if (fn === "admin-promoters") return res.json({ promoters: await sbGet("promoters", "?order=name.asc") ?? [] });

    if (fn === "admin-videos") {
      if (method === "GET") return res.json({ videos: await sbGet("site_videos", "?order=sort_order.asc") ?? [] });
      if (method === "POST") {
        const { ok, body: data } = await sbInsert("site_videos", body);
        return ok ? res.json(data) : res.status(400).json({ error: "Insert failed" });
      }
      if (method === "DELETE") {
        const id = rawQuery.id;
        if (!id) return res.status(400).json({ error: "id required" });
        await sbDelete("site_videos", `?id=eq.${id}`);
        return res.json({ ok: true });
      }
    }

    if (fn === "admin-artists") {
      if (method === "GET") {
        const qs = toPostgrest({ order: "name:asc", ...rawQuery });
        return res.json({ artists: await sbGet("artists", qs) ?? [] });
      }
      if (method === "PATCH") {
        const id = rawQuery.id ?? segments[3];
        const { ok, body: data } = await sbUpdate("artists", `?id=eq.${id}`, { ...body, updated_at: new Date().toISOString() });
        return ok ? res.json(data) : res.status(400).json({ error: "Update failed" });
      }
    }

    if (fn === "admin-curated-events") {
      if (method === "GET") return res.json({ events: await sbGet("curated_events", "?order=created_at.desc") ?? [] });
      if (method === "POST") {
        const { ok, body: data } = await sbInsert("curated_events", body);
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
      if (method === "PATCH") {
        const id = rawQuery.id ?? body?.id;
        const { ok, body: data } = await sbUpdate("curated_events", `?id=eq.${id}`, body);
        return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
      }
      if (method === "DELETE") {
        await sbDelete("curated_events", `?id=eq.${rawQuery.id}`);
        return res.json({ ok: true });
      }
    }

    // Generic admin table proxy
    const TABLE_MAP: Record<string, string> = {
      "admin-publish-blog": "site_settings",
    };
    if (TABLE_MAP[fn]) return res.json({ ok: true }); // stub

    return res.status(404).json({ error: `Unknown admin function: ${fn}` });
  }

  // ── Instagram / YouTube stubs ─────────────────────────────────────────
  if (path === "instagram-feed") return res.json({ posts: [] });
  if (path === "youtube-videos") return res.json({ videos: [] });

  return res.status(404).json({ error: `No handler for ${path}` });
}

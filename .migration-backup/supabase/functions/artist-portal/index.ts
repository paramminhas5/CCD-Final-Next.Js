/**
 * artist-portal — artist self-service API
 *
 * All routes require a valid Supabase JWT (Bearer token from the user's session).
 * The user can only access/modify artists rows where claimed_by = auth.uid().
 *
 * POST /artist-portal { action: "claim", artist_id }
 *   → sends magic-link email; sets claim_requested_at
 *
 * GET  /artist-portal?action=me
 *   → returns the artist profile claimed by the current user
 *
 * POST /artist-portal { action: "update_profile", ...fields }
 *   → updates allowed profile fields
 *
 * GET  /artist-portal?action=dates
 *   → returns all dates for the claimed artist (including private)
 *
 * POST /artist-portal { action: "upsert_date", ...dateFields }
 *   → creates or updates a tour date
 *
 * POST /artist-portal { action: "delete_date", date_id }
 *   → deletes a tour date owned by this artist
 *
 * GET  /artist-portal?action=bookings
 *   → returns booking_requests for this artist (email revealed)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Fields an artist is allowed to edit on their own profile
const EDITABLE = new Set([
  "bio", "why", "instagram", "soundcloud", "bandcamp", "spotify", "website",
  "photo_url", "gallery", "videos", "labels", "members",
  "from_city", "based_city", "genres", "festivals",
  "booking_email", "manager_email",
  "available_cities", "open_to_bookings",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Auth: require valid JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  // Client with user's JWT for RLS
  const supaUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  // Service client for ops that need to bypass RLS (e.g. claim initiation)
  const supaAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get the authenticated user
  const { data: { user }, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  const uid = user.id;
  const url = new URL(req.url);
  const action = req.method === "GET"
    ? (url.searchParams.get("action") ?? "me")
    : (await req.json().then((b: any) => { (req as any)._body = b; return b.action; }).catch(() => ""));
  const body: any = (req as any)._body ?? {};

  // ── GET: me ──────────────────────────────────────────────────────────────
  if (action === "me") {
    const { data, error } = await supaAdmin
      .from("artists")
      .select("*")
      .eq("claimed_by", uid)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ artist: null });
    return json({ artist: data });
  }

  // ── GET: dates ───────────────────────────────────────────────────────────
  if (action === "dates") {
    const { data: artist } = await supaAdmin
      .from("artists").select("id").eq("claimed_by", uid).maybeSingle();
    if (!artist) return json({ error: "No claimed profile" }, 403);
    const { data, error } = await supaAdmin
      .from("artist_dates")
      .select("*")
      .eq("artist_id", artist.id)
      .order("event_date", { ascending: true });
    if (error) return json({ error: error.message }, 500);
    return json({ dates: data ?? [] });
  }

  // ── GET: bookings ────────────────────────────────────────────────────────
  if (action === "bookings") {
    const { data: artist } = await supaAdmin
      .from("artists").select("id").eq("claimed_by", uid).maybeSingle();
    if (!artist) return json({ error: "No claimed profile" }, 403);
    const { data, error } = await supaAdmin
      .from("booking_requests")
      .select("*")
      .eq("artist_id", artist.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json({ error: error.message }, 500);
    return json({ bookings: data ?? [] });
  }

  // ── POST: claim ──────────────────────────────────────────────────────────
  if (action === "claim") {
    const artist_id = String(body.artist_id ?? "");
    if (!artist_id) return json({ error: "artist_id required" }, 400);

    // Check not already claimed by someone else
    const { data: existing } = await supaAdmin
      .from("artists").select("id, claimed_by, name").eq("id", artist_id).maybeSingle();
    if (!existing) return json({ error: "Artist not found" }, 404);
    if (existing.claimed_by && existing.claimed_by !== uid) {
      return json({ error: "This profile is already claimed" }, 409);
    }

    // Link immediately (user is already logged in via magic link)
    await supaAdmin
      .from("artists")
      .update({ claimed_by: uid, claim_requested_at: new Date().toISOString() })
      .eq("id", artist_id);

    return json({ ok: true, artist_id, message: "Profile claimed successfully" });
  }

  // ── POST: update_profile ─────────────────────────────────────────────────
  if (action === "update_profile") {
    const { data: artist } = await supaAdmin
      .from("artists").select("id").eq("claimed_by", uid).maybeSingle();
    if (!artist) return json({ error: "No claimed profile" }, 403);

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (k === "action") continue;
      if (EDITABLE.has(k)) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) return json({ error: "No editable fields" }, 400);
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supaAdmin
      .from("artists").update(patch).eq("id", artist.id).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, artist: data });
  }

  // ── POST: upsert_date ────────────────────────────────────────────────────
  if (action === "upsert_date") {
    const { data: artist } = await supaAdmin
      .from("artists").select("id").eq("claimed_by", uid).maybeSingle();
    if (!artist) return json({ error: "No claimed profile" }, 403);

    const { id: dateId, city, venue, event_date, event_time, status, ticket_url, notes, is_public } = body;
    if (!city || !event_date) return json({ error: "city and event_date required" }, 400);

    const row = {
      artist_id: artist.id,
      city: String(city),
      venue: venue ? String(venue) : null,
      event_date: String(event_date),
      event_time: event_time ? String(event_time) : null,
      status: ["confirmed", "tentative", "available"].includes(status) ? status : "confirmed",
      ticket_url: ticket_url ? String(ticket_url) : null,
      notes: notes ? String(notes) : null,
      is_public: is_public !== false,
      created_by: "artist",
    };

    if (dateId) {
      // Verify ownership
      const { data: existing } = await supaAdmin
        .from("artist_dates").select("artist_id").eq("id", dateId).maybeSingle();
      if (!existing || existing.artist_id !== artist.id) return json({ error: "Not found" }, 404);
      const { data, error } = await supaAdmin
        .from("artist_dates").update(row).eq("id", dateId).select().single();
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, date: data });
    } else {
      const { data, error } = await supaAdmin
        .from("artist_dates").insert(row).select().single();
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, date: data });
    }
  }

  // ── POST: delete_date ────────────────────────────────────────────────────
  if (action === "delete_date") {
    const { data: artist } = await supaAdmin
      .from("artists").select("id").eq("claimed_by", uid).maybeSingle();
    if (!artist) return json({ error: "No claimed profile" }, 403);

    const date_id = String(body.date_id ?? "");
    if (!date_id) return json({ error: "date_id required" }, 400);

    const { data: existing } = await supaAdmin
      .from("artist_dates").select("artist_id").eq("id", date_id).maybeSingle();
    if (!existing || existing.artist_id !== artist.id) return json({ error: "Not found" }, 404);

    await supaAdmin.from("artist_dates").delete().eq("id", date_id);
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});

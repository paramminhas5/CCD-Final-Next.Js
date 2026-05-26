import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const password = req.headers.get("x-admin-password") ?? "";
  const expected = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (!expected || !timingSafeEqual(password, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);

  if (req.method === "GET") {
    const type = url.searchParams.get("type") ?? "";
    if (type === "settings") {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ settings: data });
    }
    if (type === "events") {
      const { data, error } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ events: data ?? [] });
    }
    if (type === "messages") {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ messages: data ?? [] });
    }
    return json({ error: "Unknown type" }, 400);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const { type, action, payload } = body ?? {};

    if (type === "settings" && action === "upsert") {
      const updates: Record<string, unknown> = { id: "main" };
      if (payload?.playlists !== undefined) updates.playlists = payload.playlists ?? [];
      if (payload?.featured_playlist_id !== undefined) updates.featured_playlist_id = payload.featured_playlist_id ?? null;
      if (payload?.seo_verifications !== undefined) updates.seo_verifications = payload.seo_verifications ?? {};
      if (payload?.marquees !== undefined) updates.marquees = Array.isArray(payload.marquees) ? payload.marquees : [];
      if (payload?.theme !== undefined) updates.theme = payload.theme ?? {};
      if (payload?.home_content !== undefined) updates.home_content = payload.home_content ?? {};
      const { error } = await supabase.from("site_settings").upsert(updates);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (type === "events") {
      if (action === "upsert") {
        const row = {
          ...(payload?.id ? { id: payload.id } : {}),
          slug: payload.slug,
          title: payload.title,
          date: payload.date,
          city: payload.city,
          venue: payload.venue,
          blurb: payload.blurb ?? "",
          lineup: payload.lineup ?? [],
          status: payload.status ?? "upcoming",
          poster_url: payload.poster_url ?? null,
          sort_order: payload.sort_order ?? 0,
          media: Array.isArray(payload.media) ? payload.media : [],
        };
        const { error } = await supabase.from("events").upsert(row, { onConflict: "slug" });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
      if (action === "delete") {
        const { error } = await supabase.from("events").delete().eq("id", payload.id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
    }

    return json({ error: "Unknown action" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

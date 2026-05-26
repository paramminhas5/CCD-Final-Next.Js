import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const password = req.headers.get("x-admin-password") ?? "";
  const expected = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (!expected || !timingSafeEqual(password, expected)) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("curated_events")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false });
    if (error) return json({ error: error.message }, 500);
    return json({ events: data ?? [] });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const payload = body?.payload ?? {};

    if (action === "upsert") {
      if (!payload.url || !payload.title || !payload.source) return json({ error: "Missing required fields" }, 400);
      const row = {
        ...(payload.id ? { id: payload.id } : {}),
        title: payload.title,
        venue: payload.venue ?? null,
        event_date: payload.event_date || null,
        event_time: payload.event_time ?? null,
        url: payload.url,
        source: payload.source,
        blurb: payload.blurb ?? null,
        genre: Array.isArray(payload.genre) ? payload.genre : [],
        image_url: payload.image_url ?? null,
        is_featured: !!payload.is_featured,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("curated_events").upsert(row, { onConflict: "url" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = payload?.id;
      if (!id) return json({ error: "Missing id" }, 400);
      const { error } = await supabase.from("curated_events").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
});

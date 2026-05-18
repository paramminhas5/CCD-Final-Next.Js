import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
      .from("promoters")
      .select("*")
      .order("trusted", { ascending: false })
      .order("name", { ascending: true });
    if (error) return json({ error: error.message }, 500);
    return json({ promoters: data ?? [] });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    if (action === "upsert") {
      const p = payload ?? {};
      if (!p.slug || !p.name) return json({ error: "slug and name required" }, 400);
      const row: Record<string, unknown> = {
        slug: p.slug,
        name: p.name,
        city: p.city ?? null,
        cities: Array.isArray(p.cities) ? p.cities : [],
        blurb: p.blurb ?? null,
        genres: Array.isArray(p.genres) ? p.genres : [],
        instagram: p.instagram ?? null,
        website: p.website ?? null,
        booking_email: p.booking_email ?? null,
        logo_url: p.logo_url ?? null,
        trusted: !!p.trusted,
        crawl_urls: Array.isArray(p.crawl_urls) ? p.crawl_urls : [],
        status: p.status ?? "approved",
        updated_at: new Date().toISOString(),
      };
      if (p.id) row.id = p.id;
      const { error } = await supabase.from("promoters").upsert(row, { onConflict: "slug" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "toggle_trust") {
      if (!payload?.id) return json({ error: "id required" }, 400);
      const { error } = await supabase.from("promoters")
        .update({ trusted: !!payload.trusted, updated_at: new Date().toISOString() })
        .eq("id", payload.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!payload?.id) return json({ error: "id required" }, 400);
      const { error } = await supabase.from("promoters").delete().eq("id", payload.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

function extractYouTubeId(input: string): string | null {
  const t = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
    /\/live\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchOEmbed(youtubeId: string): Promise<{ title: string; thumbnail_url: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    return { title: j.title, thumbnail_url: j.thumbnail_url };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const pass = req.headers.get("x-admin-password");
  if (!ADMIN_PASSWORD || pass !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await sb.from("site_videos").select("*").order("sort_order", { ascending: true }).order("published_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ videos: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    if (req.method === "POST") {
      const { url, title: overrideTitle, is_featured } = body;
      const youtubeId = extractYouTubeId(String(url || ""));
      if (!youtubeId) {
        return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const meta = await fetchOEmbed(youtubeId);
      const title = overrideTitle || meta?.title || `YouTube ${youtubeId}`;
      const thumbnail_url = meta?.thumbnail_url || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

      const { data, error } = await sb.from("site_videos").upsert({
        youtube_id: youtubeId,
        title,
        thumbnail_url,
        published_at: new Date().toISOString(),
        is_featured: !!is_featured,
      }, { onConflict: "youtube_id" }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ video: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "PUT") {
      const { id, title, thumbnail_url, is_featured, sort_order } = body;
      if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const update: any = {};
      if (title !== undefined) update.title = title;
      if (thumbnail_url !== undefined) update.thumbnail_url = thumbnail_url;
      if (is_featured !== undefined) update.is_featured = is_featured;
      if (sort_order !== undefined) update.sort_order = sort_order;
      const { data, error } = await sb.from("site_videos").update(update).eq("id", id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ video: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { error } = await sb.from("site_videos").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-videos error", e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BEHOLD_URL = "https://feeds.behold.so/6bt7nDISwk0mUzAQMd9s";
const CACHE_MS = 15 * 60 * 1000;

let cache: { ts: number; posts: any[] } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return new Response(JSON.stringify({ posts: cache.posts, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(BEHOLD_URL);
    if (!res.ok) throw new Error(`Behold ${res.status}`);
    const data = await res.json();

    const raw = Array.isArray(data) ? data : data.posts || [];
    const posts = raw.map((p: any) => ({
      id: p.id,
      mediaUrl: p.sizes?.medium?.mediaUrl || p.sizes?.small?.mediaUrl || p.mediaUrl,
      permalink: p.permalink,
      caption: p.prunedCaption || p.caption || "",
    })).filter((p: any) => p.mediaUrl && p.permalink);

    cache = { ts: Date.now(), posts };

    return new Response(JSON.stringify({ posts, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("instagram-feed error", e);
    return new Response(JSON.stringify({ posts: [], error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

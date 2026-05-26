import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHANNEL_ID = "UCmtg0d8E2PXfs3vlQIcGwdQ";
const CACHE_MS = 60 * 60 * 1000; // 1 hour
const ERROR_CACHE_MS = 5 * 60 * 1000;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

type Video = { id: string; title: string; thumbnail: string; publishedAt: string };
type CacheEntry = { ts: number; videos: Video[]; isError?: boolean };
const cacheByMax = new Map<number, CacheEntry>();

async function fromAdminTable(): Promise<Video[]> {
  const { data, error } = await sb
    .from("site_videos")
    .select("youtube_id, title, thumbnail_url, published_at, sort_order")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.youtube_id,
    title: r.title,
    thumbnail: r.thumbnail_url || `https://i.ytimg.com/vi/${r.youtube_id}/hqdefault.jpg`,
    publishedAt: r.published_at || new Date().toISOString(),
  }));
}

async function fromYouTubeAPI(maxResults: number): Promise<Video[] | null> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return null;
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`;
  const r = await fetch(apiUrl);
  const j = await r.json();
  if (j.error) {
    console.warn("YouTube API error (will fall back to RSS):", j.error.message);
    return null;
  }
  return (j.items || []).map((v: any) => ({
    id: v.id.videoId,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
    publishedAt: v.snippet.publishedAt,
  }));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function fromRSS(): Promise<Video[]> {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CCDBot/1.0)" },
  });
  if (!r.ok) {
    console.warn(`RSS returned ${r.status} — channel may not have RSS enabled`);
    return [];
  }
  const xml = await r.text();
  const entries = xml.split("<entry>").slice(1);
  const videos: Video[] = [];
  for (const e of entries) {
    const idMatch = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = e.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = e.match(/<published>([^<]+)<\/published>/);
    if (!idMatch) continue;
    const vid = idMatch[1];
    videos.push({
      id: vid,
      title: titleMatch ? decodeEntities(titleMatch[1]) : `Video ${vid}`,
      thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
    });
  }
  return videos;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const maxParam = parseInt(url.searchParams.get("max") ?? "6", 10);
  const maxResults = Math.min(Math.max(isNaN(maxParam) ? 6 : maxParam, 1), 50);

  const now = Date.now();
  const cached = cacheByMax.get(maxResults);
  if (cached) {
    const ttl = cached.isError ? ERROR_CACHE_MS : CACHE_MS;
    if (now - cached.ts < ttl) {
      return new Response(JSON.stringify({ videos: cached.videos, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // 1. Admin curated table (source of truth if non-empty)
  try {
    const admin = await fromAdminTable();
    if (admin.length > 0) {
      const out = admin.slice(0, maxResults);
      cacheByMax.set(maxResults, { ts: now, videos: out });
      return new Response(JSON.stringify({ videos: out, source: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("admin table read failed", e);
  }

  // 2. YouTube Data API
  try {
    const api = await fromYouTubeAPI(maxResults);
    if (api && api.length > 0) {
      cacheByMax.set(maxResults, { ts: now, videos: api });
      return new Response(JSON.stringify({ videos: api, source: "api" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.warn("YouTube API failed, falling back to RSS", e);
  }

  // 3. RSS fallback (no quota, free, ~15 latest)
  try {
    const rss = await fromRSS();
    const out = rss.slice(0, maxResults);
    cacheByMax.set(maxResults, { ts: now, videos: out });
    return new Response(JSON.stringify({ videos: out, source: "rss" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("RSS fallback failed", e);
    if (cached && cached.videos.length > 0) {
      return new Response(JSON.stringify({ videos: cached.videos, cached: true, stale: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    cacheByMax.set(maxResults, { ts: now, videos: [], isError: true });
    return new Response(JSON.stringify({ videos: [], error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

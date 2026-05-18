// Enrich artist rows: Firecrawl for photos/contacts, YouTube for videos,
// SoundCloud for embed URL, Lovable AI for bio.
// Admin-only (header: x-admin-password must equal ADMIN_PASSWORD).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const FC_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
const LOV_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const YT_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const ADMIN = Deno.env.get("ADMIN_PASSWORD")!;
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SB_URL, SB_SR);

async function fcScrape(url: string) {
  const r = await fetch(`${FIRECRAWL}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${FC_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, onlyMainContent: true, formats: ["markdown"] }),
  });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

async function fcSearch(q: string) {
  const r = await fetch(`${FIRECRAWL}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${FC_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, limit: 4 }),
  });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

async function youtubeSearch(name: string) {
  if (!YT_KEY) return [];
  const queries = [`${name} DJ set`, `${name} live mix`, `${name} boiler room`];
  const seen = new Set<string>();
  const out: { youtube_id: string; title: string; source: string }[] = [];
  for (const q of queries) {
    if (out.length >= 4) break;
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(q)}&key=${YT_KEY}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      for (const item of data?.items ?? []) {
        const id: string = item?.id?.videoId;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({ youtube_id: id, title: item?.snippet?.title ?? name, source: "youtube" });
      }
    } catch { continue; }
  }
  return out.slice(0, 4);
}

async function uploadPhoto(slug: string, imgUrl: string, suffix = ""): Promise<string | null> {
  try {
    const r = await fetch(imgUrl);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length < 3000) return null;
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const path = `${slug}${suffix}.${ext}`;
    const { error } = await sb.storage.from("artist-photos").upload(path, buf, { contentType: ct, upsert: true });
    if (error) return null;
    return sb.storage.from("artist-photos").getPublicUrl(path).data.publicUrl;
  } catch { return null; }
}

function extractFrom(md: string) {
  return {
    email: md.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null,
    soundcloud: md.match(/soundcloud\.com\/([\w._-]+)/i)?.[0]
      ? `https://soundcloud.com/${md.match(/soundcloud\.com\/([\w._-]+)/i)![1]}`
      : null,
  };
}

function extractImages(md: string): string[] {
  const re = /!\[[^\]]*\]\((https?:\/\/[^\s)]+\.(?:jpe?g|png|webp|avif)[^)]*)\)/gi;
  const imgs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) imgs.push(m[1]);
  return imgs.filter((u) => !/\b(logo|icon|favicon|avatar|placeholder)\b/i.test(u));
}

async function aiBio(name: string, scraped: string, genres: string[]) {
  const hasCtx = scraped.trim().length > 200;
  const prompt = hasCtx
    ? `Write artist directory copy for Cats Can Dance, India's underground electronic music platform.
Artist: ${name}. Genres: ${genres.join(", ") || "electronic"}.
Reference (may be noisy): """${scraped.slice(0, 8000)}"""
Return ONLY valid JSON:
{ "bio": "120-180 word third-person bio, factual, no hype", "why": "single sentence hook <=120 chars for booking", "genres": ["up to 4 genres"], "festivals": ["only if explicitly mentioned"] }`
    : `Write artist directory copy for Cats Can Dance, India's underground electronic music platform.
Artist: ${name}. No reliable scraped material — keep bio short, no invented facts.
Return ONLY valid JSON:
{ "bio": "80-140 word third-person bio", "why": "single sentence hook <=120 chars", "genres": ["up to 4 genres"], "festivals": [] }`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOV_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const txt = j?.choices?.[0]?.message?.content;
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return null; }
}

async function enrichOne(a: any, force: boolean) {
  await sb.from("artists").update({ enrichment_status: "enriching" }).eq("id", a.id);
  const log: Record<string, unknown> = {};

  let bookingEmail: string | null = null;
  let managerEmail: string | null = null;
  let website: string | null = a.website;
  let photoUrl: string | null = a.photo_url;
  let soundcloud: string | null = a.soundcloud;
  let collectedMd = "";
  const imgCandidates: string[] = [];
  const gallery: { url: string }[] = force ? [] : (Array.isArray(a.gallery) ? a.gallery : []);
  const videos: { youtube_id: string; title: string; source: string }[] = force ? [] : (Array.isArray(a.videos) ? a.videos : []);

  // 1. Instagram
  if (a.instagram) {
    try {
      const ig = await fcScrape(`https://www.instagram.com/${a.instagram.replace(/^@/, "")}/`);
      const md: string = ig?.data?.markdown ?? ig?.markdown ?? "";
      const meta = ig?.data?.metadata ?? ig?.metadata ?? {};
      collectedMd += `\n\n[IG]\n${md}`;
      if (meta?.ogImage) imgCandidates.push(meta.ogImage);
      imgCandidates.push(...extractImages(md).slice(0, 4));
      const ex = extractFrom(md);
      if (ex.email) bookingEmail = ex.email;
      if (!soundcloud && ex.soundcloud) soundcloud = ex.soundcloud;
      log.ig = { ok: !!md, len: md.length };
    } catch (e) { log.ig = { error: String(e) }; }
  }

  // 2. Web search
  try {
    const search = await fcSearch(`${a.name} ${a.based_city ?? ""} DJ booking contact`);
    const results: any[] = Array.isArray(search?.data?.web) ? search.data.web
      : Array.isArray(search?.data) ? search.data
      : Array.isArray(search?.results?.web) ? search.results.web : [];
    for (const res of results.slice(0, 3)) {
      const rUrl: string = res.url ?? "";
      if (!website && /^https?:\/\/[^/]+\/?$/.test(rUrl)) website = rUrl;
      const md: string = res.markdown ?? res.description ?? "";
      collectedMd += `\n\n[${rUrl}]\n${md}`;
      const ex = extractFrom(md);
      if (!bookingEmail && ex.email) bookingEmail = ex.email;
      if (!soundcloud && ex.soundcloud) soundcloud = ex.soundcloud;
      imgCandidates.push(...extractImages(md).slice(0, 2));
    }
    log.search = { count: results.length };
  } catch (e) { log.search = { error: String(e) }; }

  // 3. Website
  if (website) {
    try {
      const site = await fcScrape(website);
      const md: string = site?.data?.markdown ?? site?.markdown ?? "";
      const meta = site?.data?.metadata ?? site?.metadata ?? {};
      collectedMd += `\n\n[SITE]\n${md}`;
      if (meta?.ogImage) imgCandidates.unshift(meta.ogImage);
      imgCandidates.push(...extractImages(md).slice(0, 4));
      const ex = extractFrom(md);
      if (!bookingEmail && ex.email) bookingEmail = ex.email;
      if (!soundcloud && ex.soundcloud) soundcloud = ex.soundcloud;
      const mgr = md.match(/(?:manager|mgmt)[^@\n]{0,40}([\w.+-]+@[\w-]+\.[\w.-]+)/i);
      if (mgr) managerEmail = mgr[1];
      log.site = { ok: !!md, len: md.length };
    } catch (e) { log.site = { error: String(e) }; }
  }

  // 4. SoundCloud discovery
  if (!soundcloud) {
    try {
      const sc = await fcSearch(`${a.name} soundcloud`);
      const items: any[] = Array.isArray(sc?.data) ? sc.data : Array.isArray(sc?.results?.web) ? sc.results.web : [];
      for (const item of items) {
        const u: string = item?.url ?? "";
        if (/soundcloud\.com\/[a-z0-9_-]+$/i.test(u) && !u.includes("search")) {
          soundcloud = u; break;
        }
      }
    } catch { /* ignore */ }
    log.soundcloud = { found: !!soundcloud };
  }

  // 5. Hero photo
  if (force || !photoUrl) {
    for (const img of imgCandidates.slice(0, 4)) {
      const up = await uploadPhoto(a.slug, img);
      if (up) { photoUrl = up; log.photo = { uploaded: true }; break; }
    }
  }

  // 6. Gallery (up to 6)
  if (gallery.length < 6) {
    const existingUrls = new Set(gallery.map((g) => g.url));
    let idx = 0;
    for (const img of imgCandidates.slice(1, 12)) {
      if (gallery.length >= 6) break;
      if (existingUrls.has(img)) continue;
      const up = await uploadPhoto(a.slug, img, `_g${idx}`);
      if (up) { gallery.push({ url: up }); existingUrls.add(img); idx++; }
    }
    log.gallery = { count: gallery.length };
  }

  // 7. YouTube videos
  if (videos.length < 3) {
    const yt = await youtubeSearch(a.name);
    const existingIds = new Set(videos.map((v) => v.youtube_id));
    for (const v of yt) {
      if (!existingIds.has(v.youtube_id)) videos.push(v);
    }
    log.youtube = { found: yt.length, total: videos.length };
  }

  // 8. AI bio
  const ai = await aiBio(a.name, collectedMd, []);
  log.ai = { ok: !!ai };

  const update: Record<string, unknown> = {
    booking_email: bookingEmail ?? "book@catscan.dance",
    manager_email: managerEmail,
    website,
    soundcloud,
    photo_url: photoUrl,
    gallery,
    videos,
    enrichment_status: "enriched",
    enriched_at: new Date().toISOString(),
    enrichment_log: log,
  };
  if (ai?.bio) update.bio = ai.bio;
  if (ai?.why) update.why = ai.why;
  if (Array.isArray(ai?.genres) && ai.genres.length) update.genres = ai.genres;
  if (Array.isArray(ai?.festivals) && ai.festivals.length) update.festivals = ai.festivals;

  await sb.from("artists").update(update).eq("id", a.id);
  return { id: a.id, name: a.name, ok: true, log };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.headers.get("x-admin-password") !== ADMIN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }

  let body: { artist_id?: string; all?: boolean; force?: boolean; limit?: number } = {};
  try { body = await req.json(); } catch { /* noop */ }

  let query = sb.from("artists")
    .select("id, slug, name, instagram, soundcloud, website, photo_url, based_city, gallery, videos")
    .eq("status", "approved");

  if (body.artist_id) {
    query = query.eq("id", body.artist_id);
  } else if (body.all) {
    if (!body.force) query = query.neq("enrichment_status", "enriched");
    query = query.limit(body.limit ?? 60);
  } else {
    return new Response(JSON.stringify({ error: "specify artist_id or all:true" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const { data: rows, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });

  const results: unknown[] = [];
  for (const a of rows ?? []) {
    try { results.push(await enrichOne(a, !!body.force)); }
    catch (e) {
      await sb.from("artists").update({ enrichment_status: "failed", enrichment_log: { error: String(e) } }).eq("id", a.id);
      results.push({ id: a.id, name: a.name, ok: false, error: String(e) });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  return new Response(JSON.stringify({ ok: true, count: results.length, results }), { headers: { ...cors, "Content-Type": "application/json" } });
});

/**
 * CCD Event Curation Pipeline
 * Vercel Cron: runs nightly at 2am IST (20:30 UTC prev day)
 *
 * Sources: District.in · Insider.in · HighApe · Skillbox
 * Scoring: Claude Haiku — relevance 1–10 + blurb
 * Output: upsert into curated_events table
 *
 * Invoke manually: POST /api/cron/scrape-events
 * (requires x-admin-password header)
 */

import type { NextApiRequest, NextApiResponse } from "next";

// ── Config ───────────────────────────────────────────────────────────────────
const SB  = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK  = process.env.SUPABASE_SERVICE_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "84838281";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

// Only keep events scoring >= this threshold
const RELEVANCE_THRESHOLD = 6;

// Indian electronic scene keywords for pre-filter
const SCENE_KEYWORDS = [
  "house", "techno", "rave", "dj", "electronic", "edm", "dance",
  "disco", "jungle", "drum and bass", "garage", "ambient", "psytrance",
  "bass", "underground", "club night", "live set", "nh7", "sunburn",
  "magnetic fields", "counterculture", "boiler room", "dgtl",
  "antiheroes", "district", "kitty su", "bonobo", "echoes",
  "festival", "music festival", "warehouse", "rooftop"
];

const REJECT_KEYWORDS = [
  "bollywood", "standup", "comedy", "fashion", "sports", "cricket",
  "wedding", "corporate", "trade show", "exhibition", "art show",
  "food festival", "film screening", "startup", "conference"
];

const INDIA_CITIES = [
  "bangalore", "bengaluru", "mumbai", "delhi", "pune", "goa",
  "hyderabad", "chennai", "kolkata", "ahmedabad", "jaipur"
];

// ── Types ────────────────────────────────────────────────────────────────────
interface RawEvent {
  title: string;
  url: string;
  city: string | null;
  venue: string | null;
  event_date: string | null;
  event_time: string | null;
  image_url: string | null;
  source: string;
  raw_description?: string;
}

interface ScoredEvent extends RawEvent {
  score: number;
  blurb: string;
  genre: string[];
}

// ── Supabase helpers ─────────────────────────────────────────────────────────
const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation,resolution=merge-duplicates",
});

async function sbUpsert(table: string, rows: object[]) {
  if (!rows.length) return { upserted: 0 };
  const r = await fetch(`${SB}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    const err = await r.text();
    console.error(`[upsert ${table}]`, err);
    return { upserted: 0 };
  }
  return { upserted: rows.length };
}

async function sbGet(table: string, qs = "") {
  const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
    headers: { Authorization: `Bearer ${SK}`, apikey: SK },
  });
  if (!r.ok) return [];
  return r.json();
}

// ── Pre-filter ───────────────────────────────────────────────────────────────
function quickFilter(e: RawEvent): boolean {
  const text = `${e.title} ${e.raw_description ?? ""} ${e.venue ?? ""}`.toLowerCase();
  const hasReject = REJECT_KEYWORDS.some(k => text.includes(k));
  if (hasReject) return false;
  const hasScene = SCENE_KEYWORDS.some(k => text.includes(k));
  const hasCity  = INDIA_CITIES.some(c => text.includes(c) || (e.city ?? "").toLowerCase().includes(c));
  return hasScene || hasCity;
}

// ── Claude Haiku scoring ─────────────────────────────────────────────────────
async function scoreWithHaiku(events: RawEvent[]): Promise<ScoredEvent[]> {
  if (!ANTHROPIC_KEY) {
    console.warn("[haiku] No ANTHROPIC_API_KEY — skipping scoring, assigning score 7");
    return events.map(e => ({
      ...e, score: 7, blurb: e.raw_description?.slice(0, 120) ?? "",
      genre: inferGenres(e.title + " " + (e.raw_description ?? "")),
    }));
  }

  const results: ScoredEvent[] = [];

  // Batch: score up to 10 at a time to save tokens
  const BATCH = 10;
  for (let i = 0; i < events.length; i += BATCH) {
    const batch = events.slice(i, i + BATCH);
    const prompt = `You are a curator for India's electronic music and culture scene targeting 18-30 year olds in cities like Bangalore, Mumbai, Delhi, Pune, Goa.

Score each of these events 1–10 for relevance to this scene. Also extract genres and write a punchy 1-sentence blurb (max 90 chars). Return ONLY a JSON array with no preamble:
[{"index":0,"score":7,"genres":["House","Techno"],"blurb":"Deep house takeover at Counterculture"}]

Events:
${batch.map((e, j) => `[${j}] ${e.title} | ${e.city ?? "?"} | ${e.venue ?? "?"} | ${e.raw_description?.slice(0, 150) ?? ""}`).join("\n")}

Scoring guide:
9-10: Core electronic/dance events at known underground/festival venues
7-8: Solid dance events, good DJs, culture-forward
5-6: Borderline — mainstream clubs, pop-adjacent
1-4: Not relevant — bollywood, comedy, sports, corporate
Only score ≥6 events get published.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await r.json();
      const text = data?.content?.[0]?.text ?? "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const scored: { index: number; score: number; genres: string[]; blurb: string }[] = JSON.parse(clean);

      for (const s of scored) {
        const ev = batch[s.index];
        if (ev) {
          results.push({
            ...ev,
            score: s.score,
            blurb: s.blurb ?? "",
            genre: s.genres ?? inferGenres(ev.title),
          });
        }
      }
    } catch (err) {
      console.error("[haiku batch error]", err);
      // Fallback: include all with score 6
      batch.forEach(e => results.push({
        ...e, score: 6, blurb: e.raw_description?.slice(0, 90) ?? "",
        genre: inferGenres(e.title),
      }));
    }

    // Rate limit pause between batches
    if (i + BATCH < events.length) await sleep(500);
  }

  return results;
}

function inferGenres(text: string): string[] {
  const t = text.toLowerCase();
  const genres: string[] = [];
  if (t.includes("house")) genres.push("House");
  if (t.includes("techno")) genres.push("Techno");
  if (t.includes("disco")) genres.push("Disco");
  if (t.includes("jungle") || t.includes("drum and bass") || t.includes("dnb")) genres.push("Drum & Bass");
  if (t.includes("garage")) genres.push("Garage");
  if (t.includes("ambient")) genres.push("Ambient");
  if (t.includes("psytrance") || t.includes("psy")) genres.push("Psytrance");
  if (t.includes("electronic") || t.includes("edm")) genres.push("Electronic");
  if (t.includes("live")) genres.push("Live");
  return genres.length ? genres : ["Electronic"];
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Scrapers ─────────────────────────────────────────────────────────────────

/** District.in — sitemap XML then individual pages */
async function scrapeDistrict(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    const sitemapUrl = "https://district.in/sitemap.xml";
    const r = await fetch(sitemapUrl, { headers: { "User-Agent": "CCDBot/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const xml = await r.text();

    // Extract event URLs from sitemap
    const urlMatches = xml.matchAll(/<loc>(https:\/\/district\.in\/event\/[^<]+)<\/loc>/g);
    const eventUrls = [...urlMatches].map(m => m[1]).slice(0, 30);

    for (const url of eventUrls) {
      try {
        const p = await fetch(url, { headers: { "User-Agent": "CCDBot/1.0" }, signal: AbortSignal.timeout(8000) });
        if (!p.ok) continue;
        const html = await p.text();

        const title = extractMeta(html, "og:title") ?? extractTag(html, "h1") ?? "";
        if (!title) continue;
        const desc  = extractMeta(html, "og:description") ?? "";
        const image = extractMeta(html, "og:image") ?? null;
        const dateStr = extractJsonLd(html, "startDate") ?? extractPattern(html, /(\d{4}-\d{2}-\d{2})/) ?? null;
        const venue   = extractPattern(html, /venue['":\s]+([^'"<\n,]{3,60})/i) ?? null;
        const city    = detectCity(title + " " + desc + " " + (venue ?? ""));

        events.push({ title, url, city, venue, event_date: dateStr, event_time: null, image_url: image, source: "district", raw_description: desc });
        await sleep(300);
      } catch { /* skip failed pages */ }
    }
  } catch (err) { console.error("[district]", err); }
  return events;
}

/** Insider.in — HTML event listing pages */
async function scrapeInsider(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  const cities = ["bangalore", "mumbai", "delhi", "pune", "hyderabad", "goa"];
  try {
    for (const city of cities) {
      const url = `https://insider.in/go/${city}/music`;
      try {
        const r = await fetch(url, { headers: { "User-Agent": "CCDBot/1.0" }, signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const html = await r.text();

        // Extract event cards — Insider uses structured JSON-LD
        const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        for (const block of ldBlocks) {
          try {
            const data = JSON.parse(block[1]);
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
              if (item["@type"] !== "Event") continue;
              const title = item.name ?? "";
              const evUrl = item.url ?? item["@id"] ?? "";
              const image = item.image ?? null;
              const dateStr = item.startDate?.slice(0, 10) ?? null;
              const timeStr = item.startDate?.slice(11, 16) ?? null;
              const venue   = item.location?.name ?? null;
              if (!title || !evUrl) continue;
              events.push({ title, url: evUrl, city, venue, event_date: dateStr, event_time: timeStr, image_url: typeof image === "string" ? image : null, source: "insider", raw_description: item.description?.slice(0, 200) ?? "" });
            }
          } catch { /* bad JSON-LD */ }
        }

        // Fallback: regex on links
        const linkMatches = [...html.matchAll(/href="(\/[^"]+music[^"]{0,80})"/g)];
        for (const m of linkMatches.slice(0, 20)) {
          const href = `https://insider.in${m[1]}`;
          if (!events.find(e => e.url === href)) {
            const titleMatch = html.match(new RegExp(`${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>[^<]*<[^>]+>([^<]{3,80})`));
            if (titleMatch) {
              events.push({ title: titleMatch[1].trim(), url: href, city, venue: null, event_date: null, event_time: null, image_url: null, source: "insider", raw_description: "" });
            }
          }
        }
        await sleep(500);
      } catch { /* skip city */ }
    }
  } catch (err) { console.error("[insider]", err); }
  return events;
}

/** HighApe — event listing pages */
async function scrapeHighApe(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    const url = "https://highape.com/music-events";
    const r = await fetch(url, { headers: { "User-Agent": "CCDBot/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const html = await r.text();

    // JSON-LD events
    const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const block of ldBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const items = (Array.isArray(data) ? data : [data]).filter((i: any) => i["@type"] === "Event");
        for (const item of items) {
          const title = item.name ?? "";
          const evUrl = item.url ?? "";
          if (!title || !evUrl) continue;
          const dateStr = item.startDate?.slice(0, 10) ?? null;
          const timeStr = item.startDate?.slice(11, 16) ?? null;
          const venue   = item.location?.name ?? null;
          const city    = item.location?.address?.addressLocality ?? detectCity(title + " " + (venue ?? ""));
          events.push({ title, url: evUrl, city, venue, event_date: dateStr, event_time: timeStr, image_url: item.image ?? null, source: "highape", raw_description: item.description?.slice(0, 200) ?? "" });
        }
      } catch { /* bad JSON-LD */ }
    }

    // Card pattern fallback
    const cardPattern = /href="(https:\/\/highape\.com\/events?\/[^"]+)"[^>]*>[\s\S]{0,300}?<[^>]+class="[^"]*title[^"]*"[^>]*>([^<]{3,80})/g;
    for (const m of html.matchAll(cardPattern)) {
      if (!events.find(e => e.url === m[1])) {
        events.push({ title: m[2].trim(), url: m[1], city: null, venue: null, event_date: null, event_time: null, image_url: null, source: "highape", raw_description: "" });
      }
    }
  } catch (err) { console.error("[highape]", err); }
  return events;
}

/** Skillbox — HTML scrape */
async function scrapeSkillbox(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    const url = "https://skillbox.in/events";
    const r = await fetch(url, { headers: { "User-Agent": "CCDBot/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const html = await r.text();

    const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const block of ldBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const items = (Array.isArray(data) ? data : [data]).filter((i: any) => i["@type"] === "Event");
        for (const item of items) {
          const title = item.name ?? "";
          const evUrl = item.url ?? item["@id"] ?? "";
          if (!title) continue;
          events.push({
            title,
            url: evUrl || url,
            city: item.location?.address?.addressLocality ?? null,
            venue: item.location?.name ?? null,
            event_date: item.startDate?.slice(0, 10) ?? null,
            event_time: item.startDate?.slice(11, 16) ?? null,
            image_url: typeof item.image === "string" ? item.image : null,
            source: "skillboxes",
            raw_description: item.description?.slice(0, 200) ?? "",
          });
        }
      } catch { /* bad JSON-LD */ }
    }
  } catch (err) { console.error("[skillbox]", err); }
  return events;
}

// ── HTML parsing helpers ──────────────────────────────────────────────────────
function extractMeta(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]{1,500})"`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content="([^"]{1,500})"[^>]+(?:property|name)="${prop}"`, "i"));
  return m ? m[1].trim() : null;
}

function extractTag(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]{2,120})<\\/${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function extractJsonLd(html: string, key: string): string | null {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]);
      const val = data[key] ?? (data["@graph"] ?? []).map((n: any) => n[key]).find(Boolean);
      if (val) return typeof val === "string" ? val.slice(0, 10) : null;
    } catch { /* */ }
  }
  return null;
}

function extractPattern(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m ? (m[1] ?? m[0]).trim() : null;
}

function detectCity(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("bangalore") || t.includes("bengaluru") || t.includes("blr")) return "Bangalore";
  if (t.includes("mumbai") || t.includes("bombay")) return "Mumbai";
  if (t.includes("delhi") || t.includes("ncr") || t.includes("gurgaon")) return "Delhi";
  if (t.includes("pune")) return "Pune";
  if (t.includes("goa") || t.includes("vagator") || t.includes("anjuna")) return "Goa";
  if (t.includes("hyderabad")) return "Hyderabad";
  if (t.includes("chennai") || t.includes("madras")) return "Chennai";
  if (t.includes("kolkata") || t.includes("calcutta")) return "Kolkata";
  return null;
}

// ── Dedup against existing events ────────────────────────────────────────────
async function getExistingUrls(): Promise<Set<string>> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await sbGet("curated_events", `?event_date=gte.${today}&select=url`) as { url: string }[];
    return new Set(rows.map(r => r.url));
  } catch { return new Set(); }
}

// ── Build upsert rows ────────────────────────────────────────────────────────
function toDbRow(e: ScoredEvent) {
  return {
    title:        e.title.slice(0, 200),
    url:          e.url,
    source:       e.source,
    city:         e.city,
    venue:        e.venue,
    event_date:   e.event_date,
    event_time:   e.event_time,
    blurb:        e.blurb.slice(0, 200),
    genre:        e.genre,
    image_url:    e.image_url,
    is_featured:  false,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth: Vercel cron passes Authorization Bearer CRON_SECRET
  const authHeader = req.headers.authorization ?? "";
  const isVercelCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const isAdmin = req.headers["x-admin-password"] === ADMIN_PW;
  if (!isVercelCron && !isAdmin && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const startTime = Date.now();
  const log: string[] = [];
  const push = (msg: string) => { console.log(msg); log.push(msg); };

  push(`[cron] Starting event curation pipeline — ${new Date().toISOString()}`);

  try {
    // 1. Scrape all sources in parallel
    push("[cron] Scraping sources...");
    const [district, insider, highape, skillbox] = await Promise.allSettled([
      scrapeDistrict(),
      scrapeInsider(),
      scrapeHighApe(),
      scrapeSkillbox(),
    ]);

    const allRaw: RawEvent[] = [
      ...(district.status === "fulfilled" ? district.value : []),
      ...(insider.status  === "fulfilled" ? insider.value  : []),
      ...(highape.status  === "fulfilled" ? highape.value  : []),
      ...(skillbox.status === "fulfilled" ? skillbox.value : []),
    ];
    push(`[cron] Scraped ${allRaw.length} raw events`);

    // 2. Pre-filter
    const preFiltered = allRaw.filter(quickFilter);
    push(`[cron] Pre-filter: ${preFiltered.length} events passed keywords`);

    // 3. Dedup against existing DB
    const existingUrls = await getExistingUrls();
    const deduped = preFiltered.filter(e => !existingUrls.has(e.url));
    push(`[cron] Dedup: ${deduped.length} new events to score`);

    if (deduped.length === 0) {
      return res.json({ ok: true, upserted: 0, log, elapsed: Date.now() - startTime });
    }

    // 4. Score with Claude Haiku
    push(`[cron] Scoring ${deduped.length} events with Claude Haiku...`);
    const scored = await scoreWithHaiku(deduped);
    push(`[cron] Haiku returned ${scored.length} scored events`);

    // 5. Filter by relevance threshold
    const accepted = scored.filter(e => e.score >= RELEVANCE_THRESHOLD);
    push(`[cron] Accepted: ${accepted.length} events (score >= ${RELEVANCE_THRESHOLD})`);

    // 6. Upsert into curated_events
    const rows = accepted.map(toDbRow);
    const { upserted } = await sbUpsert("curated_events", rows);
    push(`[cron] Upserted ${upserted} events into curated_events`);

    const elapsed = Date.now() - startTime;
    push(`[cron] Done in ${elapsed}ms`);

    return res.json({ ok: true, upserted, scraped: allRaw.length, accepted: accepted.length, log, elapsed });
  } catch (err: any) {
    console.error("[cron] Pipeline error:", err);
    return res.status(500).json({ ok: false, error: err?.message, log });
  }
}

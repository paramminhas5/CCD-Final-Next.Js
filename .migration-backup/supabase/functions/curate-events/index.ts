import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type SourceKey = "sortmyscene" | "insider" | "skillboxes" | "district" | "highape" | "bookmyshow";
type CityKey =
  | "bangalore" | "mumbai" | "delhi" | "pune"
  | "hyderabad" | "indore" | "ranchi" | "kochi" | "jaipur" | "shillong" | "chennai";

type CityConfig = {
  key: CityKey;
  aliases: string[];
  slugs: Partial<Record<SourceKey, string>>;
};

const CITIES: Record<CityKey, CityConfig> = {
  bangalore: { key: "bangalore", aliases: ["bangalore", "bengaluru", "blr"], slugs: { insider: "bengaluru", district: "bengaluru" } },
  mumbai:    { key: "mumbai",    aliases: ["mumbai", "bombay", "navi mumbai"], slugs: {} },
  delhi:     { key: "delhi",     aliases: ["delhi", "new delhi", "ncr", "gurgaon", "gurugram", "noida"], slugs: { insider: "new-delhi", district: "new-delhi", bookmyshow: "national-capital-region-ncr" } },
  pune:      { key: "pune",      aliases: ["pune"], slugs: {} },
  hyderabad: { key: "hyderabad", aliases: ["hyderabad", "secunderabad", "hyd"], slugs: { insider: "hyderabad", district: "hyderabad" } },
  indore:    { key: "indore",    aliases: ["indore"], slugs: { insider: "indore", district: "indore" } },
  ranchi:    { key: "ranchi",    aliases: ["ranchi"], slugs: { insider: "ranchi", district: "ranchi" } },
  kochi:     { key: "kochi",     aliases: ["kochi", "cochin", "ernakulam"], slugs: { insider: "kochi", district: "kochi" } },
  jaipur:    { key: "jaipur",    aliases: ["jaipur"], slugs: { insider: "jaipur", district: "jaipur" } },
  shillong:  { key: "shillong",  aliases: ["shillong"], slugs: { insider: "shillong", district: "shillong" } },
  chennai:   { key: "chennai",   aliases: ["chennai", "madras"], slugs: { insider: "chennai", district: "chennai" } },
};

type SourceConfig = {
  key: SourceKey;
  listingUrl: (city: CityConfig) => string;
  linkMatch: RegExp;
  linkReject: RegExp[];
};

const CITY_TITLE: Record<CityKey, string> = {
  bangalore: "Bengaluru", mumbai: "Mumbai", delhi: "Delhi", pune: "Pune",
  hyderabad: "Hyderabad", indore: "Indore", ranchi: "Ranchi", kochi: "Kochi",
  jaipur: "Jaipur", shillong: "Shillong", chennai: "Chennai",
};

const SOURCES: Record<SourceKey, SourceConfig> = {
  sortmyscene: {
    key: "sortmyscene",
    listingUrl: (c) => `https://sortmyscene.com/events?tab=events&city=${encodeURIComponent(CITY_TITLE[c.key])}`,
    linkMatch: /sortmyscene\.com\/events\/[^/?#]+/i,
    linkReject: [/\/category\//i, /\/tag\//i, /\/page\//i, /\/about/i, /\/contact/i, /\/events\?/i],
  },
  insider: {
    key: "insider",
    listingUrl: (c) => `https://insider.in/${c.slugs.insider ?? c.key}/nightlife`,
    linkMatch: /insider\.in\/(?:[a-z0-9-]+\/)?(?:event|e)[\/-][^?#]+/i,
    linkReject: [/\/online-events/i, /\/all-events$/i, /\/nightlife$/i],
  },
  skillboxes: {
    key: "skillboxes",
    listingUrl: (c) => `https://www.skillboxes.com/events-${c.slugs.skillboxes ?? c.key}`,
    linkMatch: /skillboxes\.com\/events\/[^/?#]+/i,
    linkReject: [/\/category\//i, /\/page\//i, /\/business\//i, /\/events-[a-z]+$/i],
  },
  district: {
    key: "district",
    listingUrl: (c) => `https://www.district.in/events/music-in-${c.slugs.district ?? c.key}-book-tickets`,
    linkMatch: /district\.in\/events\/[^/?#]+/i,
    linkReject: [/\/categories\//i, /\/events\/music-in-[a-z-]+-book-tickets$/i, /\/events\/[a-z-]+-in-[a-z-]+-book-tickets$/i],
  },
  highape: {
    key: "highape",
    listingUrl: (c) => `https://highape.com/${c.slugs.highape ?? c.key}/events`,
    linkMatch: /highape\.com\/[a-z]+\/[^/?#]+/i,
    linkReject: [/\/events$/i, /\/category\//i, /\/[a-z]+\/(?:events|nightlife|music|concerts)$/i],
  },
  bookmyshow: {
    key: "bookmyshow",
    listingUrl: (c) => `https://in.bookmyshow.com/explore/events-${c.slugs.bookmyshow ?? c.key}`,
    linkMatch: /bookmyshow\.com\/events\/[^/?#]+/i,
    linkReject: [/\/explore\//i],
  },
};

// Cities we explicitly DO NOT cover (used to reject events leaking in from other places).
const CITY_REJECT = ["goa", "kolkata", "ahmedabad", "chandigarh", "lucknow", "guwahati", "bhopal", "nagpur", "surat"];

// Hard "this is NOT the kind of event we want" filter.
const REJECT_KEYWORDS = [
  // Bollywood / desi nostalgia nights
  "bollywood","bolly","retro-bollywood","90s-bollywood","punjabi-night","desi-night",
  "arijit","kishore","mohammed-rafi","lata","kk-tribute","bolly-night",
  // Devotional / classical / instrumental
  "sufi","ghazal","kirtan","bhajan","bhakti","satsang","devotional","raga","gurbani",
  "carnatic","hindustani","classical-vocal","qawwali","fusion-classical","aarti","puja",
  "mantra","chanting","tantra","tabla","flute","sitar","santoor","harmonium",
  // Wellness / "sound" non-music
  "drone","drone-meditation","meditation","sound-bath","sound-healing","sound-journey",
  "breathwork","cacao","ecstatic-dance","silent-disco-yoga","morning-rave","sober-rave",
  // Comedy / spoken word
  "comedy","standup","stand-up","open-mic","openmic","poetry","kavi","shayari","mushaira",
  // Misc non-music
  "kids","children","family-friendly","trek","trekking","workshop","yoga","retreat","brunch","movie",
  "screening","quiz","craft","painting","brewery-tour","food-walk","spa","wellness","kalari",
  "magic-show","theatre","theater","play","drama","musical-play","stage-play","cricket","sports",
  "fashion-show","exhibition","art-exhibition","seminar","conference","masterclass","bootcamp",
  "singer-songwriter-night",
  // Cultural festivals
  "dussehra","diwali","holi","navratri","garba","dandiya","raas",
];

// HARD music keywords: must be present in url/title/blurb to qualify.
// Loose tokens like "music"/"party"/"set"/"showcase" intentionally excluded.
const HARD_MUSIC_KEYWORDS = [
  "techno","house","tech-house","deep-house","disco","nu-disco","dnb","drum-and-bass",
  "drum-n-bass","jungle","garage","electronic","edm","trance","downtempo","ambient-club",
  "rave","club-night","nightlife","boiler","b2b","warehouse","after-hours","afterhours",
  "label-night","sound-system","minimal","afro-house","afro-tech","bass-music",
  "indie","rock","jazz","gig","live-band","concert","sundowner",
];

// Back-compat alias for older callers.
const STRICT_MUSIC_KEYWORDS = HARD_MUSIC_KEYWORDS;

function urlPassesMusicFilter(url: string): boolean {
  const u = url.toLowerCase();
  if (REJECT_KEYWORDS.some((k) => u.includes(k))) return false;
  return HARD_MUSIC_KEYWORDS.some((k) => u.includes(k));
}

// Post-extraction sanity check applied to every event before upsert.
function isAcceptableMusicEvent(opts: {
  title?: string | null; blurb?: string | null; url?: string | null; genres?: string[];
}): boolean {
  const hay = `${opts.title ?? ""} ${opts.blurb ?? ""} ${opts.url ?? ""}`.toLowerCase();
  if (REJECT_KEYWORDS.some((k) => hay.includes(k))) return false;
  if ((opts.genres?.length ?? 0) > 0) return true;
  return HARD_MUSIC_KEYWORDS.some((k) => hay.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// District.in — sitemap-based discovery + direct SSR page parsing
// district.in renders a full SPA so Firecrawl can't reliably get event links
// from the listing page. Instead we:
//   1) Pull their public sitemap (4 500+ URLs, updated daily)
//   2) Filter by city alias + music URL keywords
//   3) Fetch each event page directly — the SSR HTML contains full JSON-LD
//      inside a __next_s.push() call, no JS execution required.
// ─────────────────────────────────────────────────────────────────────────────

const DISTRICT_MUSIC_KW = [
  "music","dj","techno","house","rave","electronic","club","disco","festival",
  "concert","nightlife","party","gig","live-music","edm","dance","underground",
  "psych","trance","ambient","funk","soul","bass","jungle","garage","warehouse",
];
const DISTRICT_SKIP_KW = [
  "comedy","standup","stand-up","cricket","ipl","cpl","anime","trekking","trek",
  "workshop","cooking","art-","yoga","meditation","kids-","kid-","tour-",
  "sports","film","movie","theatre","theater","gaming","quiz","networking",
  "startup","bhajan","religious","mahal","temple","mandir","devotional",
  "satsang","kirtana","ayurveda","fitness","gym","marathon","run-",
];

async function districtGetCandidates(city: CityConfig): Promise<string[]> {
  const sitemapUrl = "https://www.district.in/events/search-sitemap/event-detail-pages.xml";
  let xml: string;
  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CCDBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    xml = await res.text();
  } catch {
    return [];
  }

  const urls: string[] = [];
  const locRe = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(xml)) !== null) urls.push(m[1]);

  // City: check URL slug for any of the city aliases
  const cityTerms = [...city.aliases, city.key];

  return urls.filter((url) => {
    const ul = url.toLowerCase();
    const hasCity = cityTerms.some((a) => ul.includes(a));
    if (!hasCity) return false;
    const hasMusic = DISTRICT_MUSIC_KW.some((k) => ul.includes(k));
    if (!hasMusic) return false;
    const isSkip = DISTRICT_SKIP_KW.some((k) => ul.includes(k));
    return !isSkip;
  });
}

/** Extract the JSON-LD that district.in injects via __next_s.push() in SSR HTML */
function districtExtractJsonLd(html: string): Record<string, unknown> | null {
  // Pattern: self.__next_s=...push([0,{"type":"application/ld+json","children":"{...}","id":...}])
  const m = html.match(/__next_s[^[]*\[0\s*,\s*\{[^}]*"children"\s*:\s*"(\{[\s\S]+?\})"\s*,\s*"id"\s*:/);
  if (!m) return null;
  try {
    // The children value is a JSON string that has been escaped for embedding in another JSON string
    const unescaped = m[1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
    return JSON.parse(unescaped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function districtScrapePage(
  url: string,
  city: CityConfig,
): Promise<{ title: string; venue: string | null; event_date: string | null; event_time: string | null; blurb: string | null; genre: string[]; image_url: string | null } | null> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const ld = districtExtractJsonLd(html);
  if (!ld || !ld.name) return null;

  // City guard: address or location must mention the city
  const locName = String((ld.location as any)?.name ?? "");
  const locAddr = String((ld.location as any)?.address ?? "");
  const haystack = `${locName} ${locAddr} ${url}`.toLowerCase();
  const inCity = city.aliases.some((a) => haystack.includes(a));
  if (!inCity) return null;

  // Parse startDate → YYYY-MM-DD + HH:MM
  let event_date: string | null = null;
  let event_time: string | null = null;
  const sd = String(ld.startDate ?? "");
  if (sd) {
    const d = new Date(sd);
    if (!isNaN(d.getTime())) {
      event_date = d.toISOString().slice(0, 10);
      event_time = d.toISOString().slice(11, 16) + " UTC";
    }
  }

  // Keywords → genre buckets
  const kwRaw = String((ld.keywords as any)?.content ?? ld.keywords ?? "");
  const rawGenres = kwRaw.split(/[,|;]+/).map((s) => s.trim()).filter(Boolean);

  // image: prefer ld.image, fallback to og:image meta
  let image_url: string | null = typeof ld.image === "string" ? ld.image : null;
  if (!image_url) {
    const ogM = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogM) image_url = ogM[1];
  }
  if (image_url && /\b(logo|icon|favicon)\b/i.test(image_url)) image_url = null;

  // blurb from description (truncate)
  const blurb = typeof ld.description === "string" ? ld.description.slice(0, 200) : null;

  return {
    title: String(ld.name).slice(0, 200),
    venue: locName || null,
    event_date,
    event_time,
    blurb,
    genre: rawGenres,
    image_url,
  };
}

async function runDistrictSource(
  city: CityConfig,
  limit: number,
  supabase: any,
): Promise<{ source: string; city: string; candidateLinks: number; scrapedPages: number; upserted: number; errors: string[]; samples: string[] }> {
  const stats = {
    source: "district", city: city.key,
    candidateLinks: 0, scrapedPages: 0, upserted: 0,
    errors: [] as string[], samples: [] as string[],
  };

  const candidates = await districtGetCandidates(city);
  stats.candidateLinks = candidates.length;
  stats.samples = candidates.slice(0, 5);

  if (candidates.length === 0) {
    stats.errors.push("no candidate links found in sitemap");
    return stats;
  }

  for (const url of candidates) {
    if (stats.upserted >= limit) break;
    if (stats.scrapedPages >= 10) break;
    try {
      stats.scrapedPages += 1;
      const ev = await districtScrapePage(url, city);
      if (!ev || !ev.title) continue;

      const row = {
        title: ev.title,
        venue: ev.venue ?? null,
        event_date: ev.event_date ?? null,
        event_time: ev.event_time ?? null,
        url,
        source: "district",
        city: city.key,
        blurb: ev.blurb,
        genre: normalizeGenres(ev.genre),
        image_url: ev.image_url,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("curated_events").upsert(row, { onConflict: "url" });
      if (error) stats.errors.push(`upsert: ${error.message}`);
      else stats.upserted += 1;
    } catch (e: any) {
      stats.errors.push(String(e?.message ?? e));
    }
  }
  return stats;
}

const GENRE_BUCKETS = ["House", "Techno", "Disco", "Jungle", "Drum & Bass", "Garage", "Electronic", "Live"];
function normalizeGenres(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const g = raw.toLowerCase().trim();
    if (!g) continue;
    if (g.includes("drum") || g.includes("dnb") || g.includes("d&b")) out.add("Drum & Bass");
    else if (g.includes("jungle")) out.add("Jungle");
    else if (g.includes("garage")) out.add("Garage");
    else if (g.includes("disco")) out.add("Disco");
    else if (g.includes("techno")) out.add("Techno");
    else if (g.includes("house")) out.add("House");
    else if (g.includes("live") || g.includes("band") || g.includes("indie") || g.includes("rock") || g.includes("jazz")) out.add("Live");
    else if (g.includes("electro") || g.includes("edm") || g.includes("dance") || g.includes("club")) out.add("Electronic");
  }
  return Array.from(out);
}

function pickImageFromMarkdown(md: string, baseUrl: string): string | null {
  // ![alt](url) pattern
  const m = md.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+\.(?:jpe?g|png|webp|avif)[^)]*)\)/i);
  if (m) return m[1];
  return null;
}

async function firecrawlScrape(url: string, apiKey: string, formats: string[] = ["markdown"], waitFor = 0) {
  const body: any = { url, formats, onlyMainContent: false };
  if (waitFor > 0) body.waitFor = waitFor;
  const res = await fetch(`${FIRECRAWL}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("firecrawl scrape failed", url, res.status, t.slice(0, 200));
    return null;
  }
  return await res.json();
}

async function extractWithAI(text: string, sourceUrl: string, source: string, city: CityConfig, lovableKey: string) {
  const today = new Date().toISOString().slice(0, 10);
  const sys = `You extract a SINGLE music event from one event page. Today is ${today}.
Return the event ONLY if ALL of these are true:
- it is a real bookable individual event page (NOT a category, listing, or venue homepage)
- it is an UNDERGROUND / ELECTRONIC / CLUB / LIVE-BAND music event: techno, house, tech-house, disco, drum & bass, jungle, garage, electronic, EDM, trance, indie, rock, jazz, experimental gig, club night, rave, festival, boiler-room style, warehouse/after-hours.
- it is located in ${city.key.toUpperCase()} or its metro area (aliases: ${city.aliases.join(", ")}).
- you can set a non-empty "genre" array from: House, Techno, Disco, Jungle, Drum & Bass, Garage, Electronic, Live. If you can't, return events: [].

REJECT and return events: [] if the page is ANY of:
- Bollywood night, Bollywood tribute, retro Bollywood, 90s Bollywood, Punjabi night, desi night, Arijit/Kishore/KK/Rafi tribute
- Sufi, ghazal, qawwali, kirtan, bhajan, bhakti, satsang, devotional, classical vocal, carnatic, Hindustani, raga, gurbani, fusion-classical, aarti, puja, mantra, chanting
- Solo classical instrument: tabla, flute, sitar, santoor, harmonium (unless explicitly part of an electronic/jazz fusion gig)
- Drone meditation, sound bath, sound healing, sound journey, breathwork, cacao ceremony, ecstatic-dance (wellness), silent-disco-yoga, "morning rave", sober rave
- Comedy / stand-up / open mic / poetry / shayari / mushaira / singer-songwriter night
- Kids / family / trek / workshop / yoga / retreat / brunch / quiz / painting / wellness / spa
- Theatre / play / drama / musical play / fashion show / art exhibition / seminar / conference / masterclass
- Garba / dandiya / Holi / Diwali / Navratri / Dussehra cultural events
- a venue in another Indian city (Goa, Kolkata, Ahmedabad, etc.) — unless it matches ${city.key}.

Examples:
- ACCEPT: "BLOT! presents Warehouse Techno — 6hr set" → genre: ["Techno"]
- REJECT: "Drone Meditation Sound Journey at Sunset" → events: []
- REJECT: "Bollywood Night with DJ XYZ — Retro Hits" → events: []

Prefer future events; leave event_date empty if unknown.
For image_url use the first content image or og:image — skip logos/icons (URLs with 'logo','icon','favicon').
Use empty string for unknown fields.`;
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Source: ${source}\nCity: ${city.key}\nURL: ${sourceUrl}\n\nPage content:\n${text.slice(0, 9000)}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "save_events",
          description: "Save the single extracted event (or empty array if not a valid event)",
          parameters: {
            type: "object",
            properties: {
              events: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    venue: { type: "string" },
                    event_date: { type: "string", description: "YYYY-MM-DD" },
                    event_time: { type: "string" },
                    blurb: { type: "string", description: "max 140 chars" },
                    genre: { type: "array", items: { type: "string" } },
                    image_url: { type: "string", description: "absolute URL of poster/og:image, no logos" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["events"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "save_events" } },
    }),
  });
  if (!res.ok) {
    console.error("ai extract failed", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return [];
  try {
    const parsed = JSON.parse(args);
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function venueMatchesCity(venue: string | null | undefined, blurb: string | null | undefined, sourceUrl: string, pageMarkdown: string, city: CityConfig): boolean {
  const hay = `${venue ?? ""} ${blurb ?? ""} ${sourceUrl} ${pageMarkdown.slice(0, 800)}`.toLowerCase();
  if (city.aliases.some((a) => hay.includes(a))) return true;
  const otherCityKeys = (Object.keys(CITIES) as CityKey[]).filter((k) => k !== city.key);
  const otherCityHit = otherCityKeys.some((k) => CITIES[k].aliases.some((a) => hay.includes(a))) || CITY_REJECT.some((c) => hay.includes(c));
  return !otherCityHit;
}

// ──────────────────────────────────────────────────────────────────
// District: sitemap + JSON-LD extraction (no Firecrawl needed)
// ──────────────────────────────────────────────────────────────────
const DISTRICT_SITEMAP_INDEX = "https://www.district.in/sitemap.xml";
const DISTRICT_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const MUSIC_KEYWORDS = STRICT_MUSIC_KEYWORDS;
const NON_MUSIC_KEYWORDS = REJECT_KEYWORDS;
let _districtUrlCache: string[] | null = null;

async function fetchDistrictSitemapUrls(): Promise<string[]> {
  if (_districtUrlCache) return _districtUrlCache;
  const idx = await fetch(DISTRICT_SITEMAP_INDEX, { headers: { "User-Agent": DISTRICT_UA } }).then(r => r.text()).catch(() => "");
  const subSitemaps = Array.from(idx.matchAll(/<loc>([^<]+events[^<]+)<\/loc>/gi)).map(m => m[1]);
  const eventUrls: string[] = [];
  for (const sm of subSitemaps) {
    const xml = await fetch(sm, { headers: { "User-Agent": DISTRICT_UA } }).then(r => r.text()).catch(() => "");
    // sitemap of sitemaps?
    const nested = Array.from(xml.matchAll(/<loc>([^<]+\.xml[^<]*)<\/loc>/gi)).map(m => m[1]);
    if (nested.length) {
      for (const n of nested) {
        const x = await fetch(n, { headers: { "User-Agent": DISTRICT_UA } }).then(r => r.text()).catch(() => "");
        for (const m of x.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)) eventUrls.push(m[1]);
      }
    } else {
      for (const m of xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)) eventUrls.push(m[1]);
    }
  }
  _districtUrlCache = eventUrls;
  return eventUrls;
}

function filterDistrictUrlsForCity(urls: string[], city: CityConfig, max = 30): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    if (out.length >= max) break;
    const slug = url.toLowerCase();
    if (!slug.includes("/events/")) continue;
    if (!city.aliases.some(a => slug.includes(`-${a.replace(/\s+/g, "-")}-`) || slug.includes(`-${a.replace(/\s+/g, "-")}`))) continue;
    // exclude obviously non-music
    if (NON_MUSIC_KEYWORDS.some(k => slug.includes(`-${k}-`) || slug.includes(`-${k}`))) continue;
    // require at least one music keyword
    if (!MUSIC_KEYWORDS.some(k => slug.includes(k))) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

// District event pages embed JSON-LD inside the Next.js RSC payload as the
// JSON-encoded string value of a "children" property:
//   "children":"{\"@context\":\"http://schema.org\",\"@type\":\"Event\",...}"
// We find the escaped Event marker, walk back to the opening quote of the
// containing string literal, then read the string honoring \-escapes, and
// JSON.parse the decoded payload.
function extractDistrictEventJsonLd(html: string): any | null {
  const marker = '\\"@type\\":\\"Event\\"';
  const evIdx = html.indexOf(marker);
  if (evIdx < 0) return null;

  // Walk backwards from evIdx to find the opening unescaped `"` of the JSON string.
  // We look for `"` that is preceded by a non-`\` (or by `:"` pattern).
  let strStart = -1;
  for (let i = evIdx; i >= 1; i--) {
    if (html[i] === '"' && html[i - 1] !== "\\") {
      strStart = i + 1;
      break;
    }
  }
  if (strStart < 0) return null;

  // Walk forward from strStart, reading characters and decoding escapes,
  // tracking brace depth on the decoded stream, stop when depth returns to 0.
  let decoded = "";
  let depth = 0, inStr = false, esc = false, started = false;
  for (let i = strStart; i < html.length; i++) {
    const ch = html[i];
    // Handle escape sequences in the raw HTML (the outer JSON string).
    if (ch === "\\") {
      const nxt = html[i + 1];
      if (nxt === '"') { decoded += '"'; i++; }
      else if (nxt === "\\") { decoded += "\\"; i++; }
      else if (nxt === "n") { decoded += " "; i++; }
      else if (nxt === "t") { decoded += " "; i++; }
      else if (nxt === "/") { decoded += "/"; i++; }
      else if (nxt === "u" && /^[0-9a-fA-F]{4}$/.test(html.slice(i + 2, i + 6))) {
        decoded += String.fromCharCode(parseInt(html.slice(i + 2, i + 6), 16));
        i += 5;
      } else { decoded += ch; }
    } else if (ch === '"') {
      // Unescaped `"` ends the outer JSON string — stop.
      break;
    } else {
      decoded += ch;
    }

    // Update brace depth on the decoded character we just appended.
    const last = decoded[decoded.length - 1];
    if (inStr) {
      if (esc) { esc = false; }
      else if (last === "\\") { esc = true; }
      else if (last === '"') { inStr = false; }
    } else {
      if (last === '"') { inStr = true; }
      else if (last === "{") { depth++; started = true; }
      else if (last === "}") { depth--; if (started && depth === 0) break; }
    }
  }

  // Trim to the JSON object payload.
  const firstBrace = decoded.indexOf("{");
  const lastBrace = decoded.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  const payload = decoded.slice(firstBrace, lastBrace + 1);
  try { return JSON.parse(payload); }
  catch (e) { console.error("district jsonld parse failed", String(e).slice(0, 120)); return null; }
}

function flattenLocation(loc: any): { venue: string | null; address: string } {
  if (!loc) return { venue: null, address: "" };
  const arr = Array.isArray(loc) ? loc : [loc];
  const first = arr[0] ?? {};
  const venue = typeof first.name === "string" ? first.name : null;
  const addrObj = first.address ?? {};
  const addrStr = typeof addrObj === "string"
    ? addrObj
    : [addrObj.streetAddress, addrObj.addressLocality, addrObj.addressRegion].filter(Boolean).join(", ");
  return { venue, address: addrStr };
}

function deriveDistrictGenres(slug: string, name: string, desc: string): string[] {
  const hay = `${slug} ${name} ${desc}`.toLowerCase();
  const out = new Set<string>();
  if (/\b(drum.?n.?bass|d&b|dnb)\b/.test(hay)) out.add("Drum & Bass");
  if (/\bjungle\b/.test(hay)) out.add("Jungle");
  if (/\bgarage\b/.test(hay)) out.add("Garage");
  if (/\bdisco\b/.test(hay)) out.add("Disco");
  if (/\btechno\b/.test(hay)) out.add("Techno");
  if (/\bhouse\b/.test(hay)) out.add("House");
  if (/\b(electro|edm|electronic|club)\b/.test(hay)) out.add("Electronic");
  if (/\b(live|band|indie|rock|jazz|gig)\b/.test(hay)) out.add("Live");
  return Array.from(out);
}

async function runDistrict(city: CityConfig, limit: number, supabase: any) {
  const stats: any = {
    source: "district", city: city.key, listingUrl: DISTRICT_SITEMAP_INDEX,
    candidateLinks: 0, scrapedPages: 0, extracted: 0, upserted: 0, rejectedCity: 0,
    errors: [] as string[], samples: [] as string[],
  };
  let urls: string[] = [];
  try {
    urls = await fetchDistrictSitemapUrls();
  } catch (e: any) {
    stats.errors.push(`sitemap: ${e?.message ?? e}`);
    return stats;
  }
  const candidates = filterDistrictUrlsForCity(urls, city, 60);
  stats.candidateLinks = candidates.length;
  stats.samples = candidates.slice(0, 5);
  if (!candidates.length) {
    stats.errors.push(`no candidates after filter (sitemap had ${urls.length})`);
    return stats;
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const url of candidates) {
    if (stats.upserted >= limit) break;
    if (stats.scrapedPages >= 30) break;
    try {
      const html = await fetch(url, { headers: { "User-Agent": DISTRICT_UA } }).then(r => r.ok ? r.text() : "");
      stats.scrapedPages += 1;
      if (!html || html.length < 1000) { stats.errors.push(`empty html: ${url}`); continue; }
      const ev = extractDistrictEventJsonLd(html);
      if (!ev || !ev.name) { stats.errors.push(`no jsonld: ${url}`); continue; }
      stats.extracted += 1;

      const { venue, address } = flattenLocation(ev.location);
      const startDate: string = typeof ev.startDate === "string" ? ev.startDate : "";
      const event_date = startDate.slice(0, 10) || null;
      const event_time = startDate.length >= 16 ? startDate.slice(11, 16) : null;
      if (event_date && event_date < today) { stats.errors.push(`past: ${url}`); continue; }

      const desc: string = typeof ev.description === "string" ? ev.description : "";
      // City sanity check
      const hay = `${venue ?? ""} ${address} ${url} ${desc}`.toLowerCase();
      if (!city.aliases.some(a => hay.includes(a))) { stats.rejectedCity += 1; continue; }

      let image_url: string | null = null;
      const img = ev.image;
      if (typeof img === "string") image_url = img;
      else if (Array.isArray(img) && typeof img[0] === "string") image_url = img[0];
      else if (img && typeof img.url === "string") image_url = img.url;
      if (image_url && /\b(logo|favicon|icon|sprite)\b/i.test(image_url)) image_url = null;

      const blurb = desc ? desc.replace(/\s+/g, " ").trim().slice(0, 200) : null;
      const slugPart = url.split("/events/")[1]?.replace(/-buy-tickets$/, "") ?? "";
      const row = {
        title: String(ev.name).slice(0, 200),
        venue: venue ?? null,
        event_date,
        event_time,
        url,
        source: "district",
        city: city.key,
        blurb,
        genre: deriveDistrictGenres(slugPart, ev.name, desc),
        image_url,
        updated_at: new Date().toISOString(),
      };
      if (!isAcceptableMusicEvent({ title: row.title, blurb: row.blurb, url, genres: row.genre })) {
        stats.errors.push(`rejected non-music: ${url}`);
        continue;
      }
      const { error } = await supabase.from("curated_events").upsert(row, { onConflict: "url" });
      if (error) stats.errors.push(`upsert: ${error.message}`);
      else stats.upserted += 1;
    } catch (e: any) {
      stats.errors.push(`${url}: ${String(e?.message ?? e).slice(0, 120)}`);
    }
  }
  return stats;
}

async function runSource(cfg: SourceConfig, city: CityConfig, limit: number, fcKey: string, lovableKey: string, supabase: any) {
  if (cfg.key === "district") return await runDistrict(city, limit, supabase);

  const listingUrl = cfg.listingUrl(city);
  const stats: any = {
    source: cfg.key, city: city.key, listingUrl,
    candidateLinks: 0, scrapedPages: 0, extracted: 0, upserted: 0, rejectedCity: 0,
    errors: [] as string[], samples: [] as string[],
  };

  const listing = await firecrawlScrape(listingUrl, fcKey, ["links", "markdown"], 5000);
  if (!listing) { stats.errors.push("listing scrape failed"); return stats; }
  const rawLinks: string[] = listing?.data?.links ?? listing?.links ?? [];
  const listingMd: string = listing?.data?.markdown ?? listing?.markdown ?? "";

  const seen = new Set<string>();
  const candidates: string[] = [];
  const tryAdd = (link: string) => {
    if (typeof link !== "string") return;
    const url = link.split("#")[0].replace(/\/$/, "");
    if (seen.has(url)) return;
    if (!cfg.linkMatch.test(url)) return;
    if (cfg.linkReject.some((r) => r.test(url))) return;
    // Hard music-only URL filter: reject Bollywood / comedy / kids / etc.
    if (REJECT_KEYWORDS.some((k) => url.toLowerCase().includes(k))) return;
    seen.add(url);
    candidates.push(url);
  };

  for (const link of rawLinks) {
    tryAdd(link);
    if (candidates.length >= 30) break;
  }

  // Fallback: parse links out of markdown if no candidates found
  if (candidates.length === 0 && listingMd) {
    const urlRe = /(https?:\/\/[^\s)<>"']+)/g;
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(listingMd))) {
      tryAdd(m[1]);
      if (candidates.length >= 30) break;
    }
  }

  stats.candidateLinks = candidates.length;
  stats.samples = candidates.slice(0, 5);

  if (candidates.length === 0) { stats.errors.push("no candidate links matched"); return stats; }

  for (const url of candidates) {
    if (stats.upserted >= limit) break;
    if (stats.scrapedPages >= 25) break;
    try {
      const page = await firecrawlScrape(url, fcKey, ["markdown"], 3000);
      stats.scrapedPages += 1;
      const md: string = page?.data?.markdown ?? page?.markdown ?? "";
      const meta = page?.data?.metadata ?? page?.metadata ?? {};
      if (!md || md.length < 100) continue;
      const events = await extractWithAI(md, url, cfg.key, city, lovableKey);
      if (events.length === 0) continue;
      const ev = events[0];
      stats.extracted += 1;

      if (!venueMatchesCity(ev.venue, ev.blurb, url, md, city)) {
        stats.rejectedCity += 1;
        continue;
      }

      // Image fallback chain: AI → og:image → first markdown image
      let image_url: string | null = (typeof ev.image_url === "string" && ev.image_url.startsWith("http")) ? ev.image_url : null;
      if (!image_url) {
        const og = meta?.ogImage || meta?.["og:image"] || meta?.openGraph?.image;
        if (typeof og === "string" && og.startsWith("http")) image_url = og;
      }
      if (!image_url) image_url = pickImageFromMarkdown(md, url);
      // Filter out logos/icons
      if (image_url && /\b(logo|icon|favicon|sprite)\b/i.test(image_url)) image_url = null;

      const row = {
        title: String(ev.title).slice(0, 200),
        venue: ev.venue ?? null,
        event_date: ev.event_date ?? null,
        event_time: ev.event_time ?? null,
        url,
        source: cfg.key,
        city: city.key,
        blurb: ev.blurb ? String(ev.blurb).slice(0, 200) : null,
        genre: normalizeGenres(ev.genre),
        image_url,
        updated_at: new Date().toISOString(),
      };
      if (!isAcceptableMusicEvent({ title: row.title, blurb: row.blurb, url, genres: row.genre })) {
        stats.errors.push(`rejected non-music: ${url}`);
        continue;
      }
      const { error } = await supabase.from("curated_events").upsert(row, { onConflict: "url" });
      if (error) { stats.errors.push(`upsert: ${error.message}`); }
      else { stats.upserted += 1; }
    } catch (e: any) {
      stats.errors.push(String(e?.message ?? e));
    }
  }

  return stats;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!fcKey || !lovableKey) {
    return new Response(JSON.stringify({ error: "Missing API keys" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const requestedSource = body?.source as SourceKey | undefined;
  const requestedCity = (body?.city as CityKey | "all") || "bangalore";
  // Default mode is "all" when no explicit source is given, so a no-arg call
  // hits every source instead of only Skillboxes.
  const mode = body?.mode === "single" || requestedSource ? (body?.mode === "all" ? "all" : "single") : "all";
  const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 20);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const sourceTargets: SourceConfig[] = mode === "all"
    ? Object.values(SOURCES)
    : requestedSource && SOURCES[requestedSource] ? [SOURCES[requestedSource]] : [SOURCES.skillboxes];

  const cityTargets: CityConfig[] = requestedCity === "all"
    ? Object.values(CITIES)
    : CITIES[requestedCity] ? [CITIES[requestedCity]] : [CITIES.bangalore];

  const runs: any[] = [];
  let totalUpserted = 0;
  for (const cfg of sourceTargets) {
    for (const city of cityTargets) {
      // district.in uses a sitemap + direct SSR parsing path —
      // its listing page is a fully client-rendered SPA and Firecrawl
      // cannot reliably extract event links from it.
      const s = cfg.key === "district"
        ? await runDistrictSource(city, limit, supabase)
        : await runSource(cfg, city, limit, fcKey, lovableKey, supabase);
      runs.push(s);
      totalUpserted += s.upserted;
    }
  }

  return new Response(JSON.stringify({ ok: true, mode, upserted: totalUpserted, runs }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

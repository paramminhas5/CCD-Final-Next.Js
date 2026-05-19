/**
 * CuratedEvents — Scene Engine v3
 * Full recommendation engine with:
 * - Signal collection (clicks, saves) → sessionStorage + API
 * - Affinity scorer (genre × city overlap)
 * - Boost layer (freshness, featured, trending click count)
 * - URL state sync (shareable filtered views)
 * - Vibe + When + Genre + City dimensions
 */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "@/lib/compat-router";
import { supabase } from "@/lib/supabase-shim";

/* ── Types ───────────────────────────────────────────────────────────────── */
type CuratedEvent = {
  id: string; title: string; venue: string | null; event_date: string | null;
  event_time: string | null; url: string; source: string; blurb: string | null;
  genre: string[]; is_featured: boolean; city: string | null; image_url: string | null;
};

type EventSignal = { genreClicks: Record<string,number>; cityClicks: Record<string,number>; saved: string[]; dismissed: string[] };

/* ── Dimensions ──────────────────────────────────────────────────────────── */
const CITIES = [
  { key: "all",       label: "All India",   emoji: "🇮🇳" },
  { key: "bangalore", label: "Bengaluru",   emoji: "🌆" },
  { key: "mumbai",    label: "Mumbai",      emoji: "🌊" },
  { key: "delhi",     label: "Delhi",       emoji: "🏛" },
  { key: "pune",      label: "Pune",        emoji: "🎵" },
  { key: "goa",       label: "Goa",         emoji: "🌴" },
  { key: "hyderabad", label: "Hyderabad",   emoji: "💎" },
  { key: "chennai",   label: "Chennai",     emoji: "🌅" },
  { key: "kolkata",   label: "Kolkata",     emoji: "🎭" },
] as const;

const CITY_ALIASES: Record<string, string[]> = {
  bangalore: ["bangalore","bengaluru","blr"],
  mumbai:    ["mumbai","bombay"],
  delhi:     ["delhi","new delhi","ncr","gurgaon","gurugram","noida"],
  pune:      ["pune"],
  goa:       ["goa","panaji","anjuna","vagator","arambol","morjim"],
  hyderabad: ["hyderabad","hyd"],
  chennai:   ["chennai","madras"],
  kolkata:   ["kolkata","calcutta"],
};

const GENRES = [
  { key: "All",          emoji: "✦",  color: "bg-ink text-cream"          },
  { key: "House",        emoji: "🏠", color: "bg-orange text-cream"       },
  { key: "Techno",       emoji: "⚙", color: "bg-ink text-cream"          },
  { key: "Jungle",       emoji: "🌿", color: "bg-acid-yellow text-ink"    },
  { key: "Drum & Bass",  emoji: "🥁", color: "bg-electric-blue text-cream"},
  { key: "Disco",        emoji: "🪩", color: "bg-magenta text-cream"      },
  { key: "Garage",       emoji: "🚗", color: "bg-ink/80 text-cream"       },
  { key: "Ambient",      emoji: "🌌", color: "bg-electric-blue/80 text-cream"},
  { key: "Experimental", emoji: "🧪", color: "bg-magenta/80 text-cream"   },
  { key: "Psytrance",    emoji: "🔮", color: "bg-orange/80 text-cream"    },
  { key: "Live",         emoji: "🎸", color: "bg-acid-yellow text-ink"    },
  { key: "Electronic",   emoji: "⚡", color: "bg-ink text-cream"          },
];

const VIBES = [
  { key: "all",      label: "Everything",      kws: []                                                   },
  { key: "rave",     label: "Rave / Dark",     kws: ["rave","basement","underground","warehouse","hard"]  },
  { key: "rooftop",  label: "Rooftop / Open",  kws: ["rooftop","sunset","terrace","sundowner","open air"] },
  { key: "club",     label: "Club Night",      kws: ["club","night","dj","dance","disco","house","garage"]},
  { key: "festival", label: "Festival",        kws: ["festival","fest","stage","outdoor","grounds"]       },
  { key: "intimate", label: "Intimate",        kws: ["intimate","loft","studio","small","private"]        },
  { key: "culture",  label: "Arts / Culture",  kws: ["art","gallery","culture","exhibition","theatre"]    },
] as const;

const WHEN = [
  { key: "all",     label: "All Upcoming"  },
  { key: "tonight", label: "Tonight"       },
  { key: "weekend", label: "This Weekend"  },
  { key: "month",   label: "This Month"    },
] as const;

const SOURCE_LABEL: Record<string, string> = {
  manual: "CCD Pick", community: "Community", district: "District",
  insider: "Insider", highape: "HighApe", skillboxes: "Skillbox",
  "paytm-insider": "Paytm Insider", bookmyshow: "BookMyShow",
};

/* ── Signal store (sessionStorage) ──────────────────────────────────────── */
const SIG_KEY = "ccd_signals_v2";
const PREF_KEY = "ccd_prefs_v3";

function loadSignals(): EventSignal {
  try { return { genreClicks:{}, cityClicks:{}, saved:[], dismissed:[], ...JSON.parse(sessionStorage.getItem(SIG_KEY) ?? "{}") }; }
  catch { return { genreClicks:{}, cityClicks:{}, saved:[], dismissed:[] }; }
}
function saveSignals(s: EventSignal) { try { sessionStorage.setItem(SIG_KEY, JSON.stringify(s)); } catch {} }
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}"); } catch { return {}; } }
function savePrefs(p: object) { try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...loadPrefs(), ...p })); } catch {} }

function getSessionId(): string {
  let id = sessionStorage.getItem("ccd_sid");
  if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem("ccd_sid", id); }
  return id;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(d: string | null, t: string | null) {
  if (!d) return t || "TBA";
  try {
    const date = new Date(d + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const isToday    = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const base = isToday ? "Tonight" : isTomorrow ? "Tomorrow"
      : date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
    return `${base}${t ? ` · ${t}` : ""}`;
  } catch { return d; }
}

function getDaysUntil(d: string | null): number {
  if (!d) return 999;
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.round((new Date(d+"T00:00:00").getTime() - today.getTime()) / 86400000);
  } catch { return 999; }
}

function matchesCity(e: CuratedEvent, k: string) {
  if (k === "all") return true;
  const aliases = CITY_ALIASES[k] ?? [k];
  const text = `${e.city??""} ${e.venue??""} ${e.blurb??""}`.toLowerCase();
  return aliases.some(a => text.includes(a));
}

function matchesGenre(e: CuratedEvent, g: string) {
  if (g === "All") return true;
  return (e.genre??[]).some(x => x.toLowerCase().includes(g.toLowerCase()));
}

function matchesVibe(e: CuratedEvent, vibe: string) {
  if (vibe === "all") return true;
  const kws = VIBES.find(v => v.key === vibe)?.kws ?? [];
  const text = `${e.title} ${e.blurb??""} ${e.venue??""} ${(e.genre??[]).join(" ")}`.toLowerCase();
  return kws.some(k => text.includes(k));
}

function matchesWhen(e: CuratedEvent, when: string) {
  if (when === "all") return true;
  const days = getDaysUntil(e.event_date);
  if (when === "tonight") return days === 0;
  if (when === "weekend") {
    const dow = new Date().getDay();
    const fri = (5-dow+7)%7, sun = (0-dow+7)%7||7;
    return days >= fri && days <= sun;
  }
  if (when === "month") return days >= 0 && days <= 31;
  return true;
}

/* ── Recommendation scorer ───────────────────────────────────────────────── */
function scoreEvent(e: CuratedEvent, signals: EventSignal, genreFilter: string, trendingIds: Set<string>): number {
  let score = 0;

  // Featured boost
  if (e.is_featured) score += 150;

  // Freshness (days until)
  const days = getDaysUntil(e.event_date);
  if (days === 0) score += 80;
  else if (days <= 2) score += 50;
  else if (days <= 7) score += 30;
  else if (days <= 14) score += 15;

  // Trending
  if (trendingIds.has(e.id)) score += 60;

  // Genre affinity from signals
  const eventGenres = e.genre ?? [];
  for (const g of eventGenres) {
    const clicks = signals.genreClicks[g.toLowerCase()] ?? 0;
    score += clicks * 8;
  }

  // Active genre filter match
  if (genreFilter !== "All" && matchesGenre(e, genreFilter)) score += 40;

  // City affinity
  const city = (e.city ?? "").toLowerCase();
  for (const [c, clicks] of Object.entries(signals.cityClicks)) {
    if (city.includes(c)) score += clicks * 10;
  }

  // CCD pick premium
  if (e.source === "manual") score += 30;

  // Image quality proxy
  if (e.image_url) score += 10;
  if (e.blurb) score += 5;

  return score;
}

/* ── URL state sync ──────────────────────────────────────────────────────── */
function readUrlState() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return { city: p.get("city") ?? undefined, genre: p.get("genre") ?? undefined, vibe: p.get("vibe") ?? undefined, when: p.get("when") ?? undefined };
}

function pushUrlState(state: Record<string, string>) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) { if (v && v !== "all" && v !== "All") p.set(k, v); }
  const q = p.toString();
  const url = window.location.pathname + (q ? `?${q}` : "");
  window.history.replaceState(null, "", url);
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function UrgencyBadge({ days }: { days: number }) {
  if (days === 0) return <span className="bg-magenta text-cream text-[9px] font-bold px-2 py-0.5 uppercase animate-pulse">TONIGHT</span>;
  if (days === 1) return <span className="bg-orange text-cream text-[9px] font-bold px-2 py-0.5 uppercase">TOMORROW</span>;
  if (days <= 3) return <span className="bg-acid-yellow text-ink text-[9px] font-bold px-2 py-0.5 uppercase">THIS WEEK</span>;
  return null;
}

function SaveButton({ id, saved, onToggle }: { id: string; saved: string[]; onToggle: (id: string) => void }) {
  const isSaved = saved.includes(id);
  return (
    <button onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(id); }}
      className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center border-2 border-ink text-sm transition-all ${isSaved ? "bg-magenta text-cream scale-110" : "bg-cream/90 text-ink hover:bg-acid-yellow"}`}>
      {isSaved ? "♥" : "♡"}
    </button>
  );
}

function TrendingBadge({ id, trendingIds }: { id: string; trendingIds: Set<string> }) {
  if (!trendingIds.has(id)) return null;
  return <span className="bg-electric-blue text-cream text-[9px] font-bold px-2 py-0.5 uppercase">🔥 TRENDING</span>;
}

function HeroCard({ event, signals, trendingIds, onSignal, onToggleSave }:
  { event: CuratedEvent; signals: EventSignal; trendingIds: Set<string>; onSignal: (e: CuratedEvent) => void; onToggleSave: (id: string) => void }) {
  const days = getDaysUntil(event.event_date);
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={() => onSignal(event)}
      className="relative col-span-full flex flex-col justify-end overflow-hidden group min-h-[440px] md:min-h-[520px] border-4 border-ink">
      {event.image_url
        ? <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        : <div className="absolute inset-0 bg-gradient-to-br from-magenta via-ink to-electric-blue" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <SaveButton id={event.id} saved={signals.saved} onToggle={onToggleSave} />
      <div className="absolute top-0 left-0 bg-acid-yellow text-ink font-display text-xs px-4 py-2 uppercase border-b-4 border-r-4 border-ink">⭐ CCD PICK</div>
      <div className="relative z-10 p-6 md:p-10">
        <div className="flex flex-wrap gap-2 mb-4">
          <UrgencyBadge days={days} />
          <TrendingBadge id={event.id} trendingIds={trendingIds} />
          {event.city && <span className="text-[10px] font-bold px-3 py-1 border-2 border-cream/50 text-cream uppercase">{event.city.toUpperCase()}</span>}
          {(event.genre??[]).slice(0,3).map(g => <span key={g} className="text-[10px] font-bold px-2 py-1 bg-white/10 border border-white/20 text-cream uppercase">{g}</span>)}
        </div>
        <h3 className="font-display text-4xl md:text-6xl text-cream uppercase leading-none mb-3 max-w-3xl">{event.title}</h3>
        <p className="font-display text-acid-yellow text-xl mb-2">{formatDate(event.event_date, event.event_time)}</p>
        {event.venue && <p className="text-cream/70 font-medium mb-3">{event.venue}</p>}
        {event.blurb && <p className="text-cream/60 max-w-xl text-sm leading-relaxed mb-5 line-clamp-2">{event.blurb}</p>}
        <span className="inline-flex items-center gap-2 font-display text-acid-yellow text-sm border-b-2 border-acid-yellow pb-0.5 group-hover:gap-3 transition-all">GET TICKETS / RSVP →</span>
      </div>
    </a>
  );
}

function EventCard({ event, signals, trendingIds, isRecommended, onSignal, onToggleSave }:
  { event: CuratedEvent; signals: EventSignal; trendingIds: Set<string>; isRecommended?: boolean; onSignal: (e: CuratedEvent) => void; onToggleSave: (id: string) => void }) {
  const days = getDaysUntil(event.event_date);
  const isCCDPick = event.source === "manual";
  const isSaved = signals.saved.includes(event.id);
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={() => onSignal(event)}
      className={`relative block border-4 border-ink overflow-hidden group transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 ${isSaved ? "ring-2 ring-magenta ring-offset-2" : ""} ${isCCDPick ? "bg-magenta" : "bg-cream"}`}>
      <SaveButton id={event.id} saved={signals.saved} onToggle={onToggleSave} />
      {isRecommended && <div className="absolute top-0 left-0 bg-electric-blue text-cream font-display text-[9px] px-3 py-1 uppercase z-10 border-b-2 border-r-2 border-ink">✦ For You</div>}
      {event.image_url && (
        <div className="overflow-hidden border-b-4 border-ink h-40">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge days={days} />
            <TrendingBadge id={event.id} trendingIds={trendingIds} />
            <span className={`text-[9px] font-bold px-2 py-1 border-2 border-ink uppercase ${isCCDPick ? "bg-acid-yellow text-ink" : "bg-ink text-cream"}`}>
              {SOURCE_LABEL[event.source] ?? event.source}
            </span>
          </div>
          {event.city && <span className={`text-[9px] font-bold uppercase ${isCCDPick ? "text-cream/60" : "text-ink/50"}`}>📍 {event.city}</span>}
        </div>
        <h3 className={`font-display text-xl md:text-2xl uppercase leading-tight mb-2 pr-6 ${isCCDPick ? "text-cream" : "text-ink"}`}>{event.title}</h3>
        <p className={`font-display text-base mb-1 ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>{formatDate(event.event_date, event.event_time)}</p>
        {event.venue && <p className={`text-sm font-medium mb-2 ${isCCDPick ? "text-cream/70" : "text-ink/60"}`}>{event.venue}</p>}
        {event.blurb && <p className={`text-sm mb-3 line-clamp-2 ${isCCDPick ? "text-cream/70" : "text-ink/70"}`}>{event.blurb}</p>}
        {(event.genre??[]).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genre.slice(0,3).map(g => <span key={g} className={`text-[9px] uppercase px-2 py-0.5 font-bold border ${isCCDPick ? "border-cream/30 text-cream/80" : "border-ink/30 text-ink/70 bg-ink/5"}`}>{g}</span>)}
          </div>
        )}
        <span className={`font-display text-sm ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>RSVP →</span>
      </div>
    </a>
  );
}

function SceneStats({ events, trendingIds }: { events: CuratedEvent[]; trendingIds: Set<string> }) {
  const cities  = [...new Set(events.map(e => e.city).filter(Boolean))].length;
  const genres  = [...new Set(events.flatMap(e => e.genre??[]))].length;
  const soon    = events.filter(e => { const d = getDaysUntil(e.event_date); return d >= 0 && d <= 3; }).length;
  const trending = events.filter(e => trendingIds.has(e.id)).length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px border-4 border-ink bg-ink mb-8">
      {[
        { n: events.length, label: "upcoming events" },
        { n: cities, label: "cities active" },
        { n: genres, label: "genres covered" },
        { n: trending || soon, label: trending ? "trending now" : "happening soon" },
      ].map(({ n, label }) => (
        <div key={label} className="bg-cream p-4 text-center">
          <p className="font-display text-3xl md:text-4xl text-ink">{n}</p>
          <p className="font-display text-xs uppercase text-ink/50 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

function AffinityBar({ signals }: { signals: EventSignal }) {
  const topGenres = Object.entries(signals.genreClicks).sort(([,a],[,b]) => b-a).slice(0,4);
  const topCities = Object.entries(signals.cityClicks).sort(([,a],[,b]) => b-a).slice(0,2);
  if (topGenres.length === 0 && topCities.length === 0) return null;
  return (
    <div className="bg-ink/5 border-2 border-ink/10 p-3 mb-6 flex flex-wrap items-center gap-3">
      <span className="font-display text-[10px] uppercase text-ink/40">Your taste:</span>
      {topGenres.map(([g, n]) => (
        <span key={g} className="font-display text-[10px] uppercase bg-ink text-cream px-2 py-1">
          {g} <span className="opacity-40">({n})</span>
        </span>
      ))}
      {topCities.map(([c, n]) => (
        <span key={c} className="font-display text-[10px] uppercase bg-magenta/10 border border-magenta/30 text-magenta px-2 py-1">
          📍{c}
        </span>
      ))}
      <span className="text-[10px] text-ink/30 ml-auto">Feed adapts as you explore</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
const CuratedEvents = () => {
  const urlState = readUrlState();
  const prefs = loadPrefs();
  const [signals, setSignals] = useState<EventSignal>(loadSignals);
  const [trendingIds, setTrendingIds] = useState<Set<string>>(new Set());

  const [events, setEvents] = useState<CuratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [city,  setCity]  = useState<string>(urlState.city  ?? prefs.city  ?? "bangalore");
  const [genre, setGenre] = useState<string>(urlState.genre ?? prefs.genre ?? "All");
  const [vibe,  setVibe]  = useState<string>(urlState.vibe  ?? prefs.vibe  ?? "all");
  const [when,  setWhen]  = useState<string>(urlState.when  ?? "all");
  const [view,  setView]  = useState<"discover" | "watchlist">("discover");
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Sync URL
  useEffect(() => { pushUrlState({ city, genre, vibe, when }); savePrefs({ city, genre, vibe }); }, [city, genre, vibe, when]);

  // Fetch trending from API
  useEffect(() => {
    fetch("/api/event-signals/trending")
      .then(r => r.ok ? r.json() : [])
      .then((rows: { event_id: string; clicks: number }[]) => {
        setTrendingIds(new Set(rows.map(r => r.event_id)));
      }).catch(() => {});
  }, []);

  // Signal handlers
  const recordSignal = useCallback((event: CuratedEvent) => {
    setSignals(prev => {
      const next = { ...prev };
      // Record genre clicks
      for (const g of (event.genre ?? [])) {
        next.genreClicks = { ...next.genreClicks, [g.toLowerCase()]: (next.genreClicks[g.toLowerCase()]??0) + 1 };
      }
      // Record city click
      if (event.city) {
        const c = event.city.toLowerCase();
        next.cityClicks = { ...next.cityClicks, [c]: (next.cityClicks[c]??0) + 1 };
      }
      saveSignals(next);
      return next;
    });
    // Fire and forget to API
    const sessionId = getSessionId();
    fetch("/api/event-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, event_id: event.id, signal_type: "click", city: event.city, genre: event.genre?.[0] }),
    }).catch(() => {});
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSignals(prev => {
      const saved = prev.saved.includes(id) ? prev.saved.filter(s => s !== id) : [...prev.saved, id];
      const next = { ...prev, saved };
      saveSignals(next);
      // Record save signal
      const evt = events.find(e => e.id === id);
      if (evt && !prev.saved.includes(id)) {
        fetch("/api/event-signals", { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ session_id: getSessionId(), event_id: id, signal_type:"save", city:evt.city, genre:evt.genre?.[0] })
        }).catch(()=>{});
      }
      return next;
    });
  }, [events]);

  // Fetch events
  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      let { data } = await supabase.from("curated_events").select("*")
        .or(`event_date.gte.${today},event_date.is.null`)
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true, nullsFirst: false })
        .limit(150);
      if (!data || data.length === 0) {
        const { data: recent } = await supabase.from("curated_events").select("*")
          .order("created_at", { ascending: false }).limit(150);
        data = recent ?? [];
      }
      setEvents((data ?? []) as CuratedEvent[]);
      setLoading(false);
    })();
  }, []);

  // Scored + filtered events
  const filtered = useMemo(() => {
    return events
      .filter(e => matchesCity(e, city) && matchesGenre(e, genre) && matchesVibe(e, vibe) && matchesWhen(e, when))
      .filter(e => !signals.dismissed.includes(e.id))
      .sort((a, b) => scoreEvent(b, signals, genre, trendingIds) - scoreEvent(a, signals, genre, trendingIds));
  }, [events, city, genre, vibe, when, signals, trendingIds]);

  const savedEvents  = useMemo(() => events.filter(e => signals.saved.includes(e.id)), [events, signals.saved]);
  const featured     = filtered.find(e => e.is_featured) ?? filtered[0];
  const rest         = filtered.filter(e => e !== featured);
  const recommended  = useMemo(() => genre !== "All" ? rest.filter(e => matchesGenre(e, genre)).slice(0,3) : [], [rest, genre]);

  const activeFilters = [city !== "all", genre !== "All", vibe !== "all", when !== "all"].filter(Boolean).length;
  const genreObj = GENRES.find(g => g.key === genre);
  const visibleGenres = showAllGenres ? GENRES : GENRES.slice(0, 8);

  return (
    <section id="discover" className="border-t-4 border-ink">
      {/* Header */}
      <div className="bg-ink border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-2">/ SCENE ENGINE</p>
              <h2 className="font-display text-5xl md:text-7xl text-cream leading-none">WHAT'S ON.</h2>
              <p className="text-cream/50 font-medium mt-3 max-w-lg text-sm">
                Electronic & culture-forward events across India — personalised as you explore.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex border-4 border-cream/20">
                <button onClick={() => setView("discover")} className={`font-display text-xs uppercase px-4 py-2.5 transition-colors ${view === "discover" ? "bg-cream text-ink" : "text-cream/50 hover:text-cream"}`}>DISCOVER</button>
                <button onClick={() => setView("watchlist")} className={`font-display text-xs uppercase px-4 py-2.5 transition-colors relative ${view === "watchlist" ? "bg-cream text-ink" : "text-cream/50 hover:text-cream"}`}>
                  SAVED{signals.saved.length > 0 && <span className="ml-1.5 bg-magenta text-cream text-[9px] font-bold px-1.5 py-0.5">{signals.saved.length}</span>}
                </button>
              </div>
              <Link to="/submit-event" className="bg-acid-yellow text-ink font-display text-sm px-5 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap">+ SUBMIT EVENT</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-cream border-b-4 border-ink">
        <div className="container py-5 space-y-4">
          {/* Cities */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CITIES.map(c => (
              <button key={c.key} onClick={() => setCity(c.key)}
                className={`flex items-center gap-1.5 font-display text-xs px-3 py-2 border-4 border-ink uppercase whitespace-nowrap shrink-0 transition-all ${c.key === city ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>

          {/* When + Vibe row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">When:</span>
            {WHEN.map(w => (
              <button key={w.key} onClick={() => setWhen(w.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${w.key === when ? "bg-ink text-cream" : "text-ink hover:bg-acid-yellow"}`}>
                {w.label}
              </button>
            ))}
            <span className="w-px h-4 bg-ink/20 mx-2 hidden md:block" />
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">Vibe:</span>
            {VIBES.map(v => (
              <button key={v.key} onClick={() => setVibe(v.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${v.key === vibe ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">Genre:</span>
            {visibleGenres.map(g => (
              <button key={g.key} onClick={() => setGenre(g.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${g.key === genre ? `${g.color} border-ink` : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                {g.emoji} {g.key}
              </button>
            ))}
            <button onClick={() => setShowAllGenres(v => !v)} className="font-display text-xs px-3 py-1.5 border-2 border-ink/30 text-ink/40 uppercase hover:text-ink">
              {showAllGenres ? "Less ↑" : `+${GENRES.length-8}`}
            </button>
            {activeFilters > 0 && (
              <button onClick={() => { setCity("all"); setGenre("All"); setVibe("all"); setWhen("all"); }}
                className="ml-auto font-display text-[10px] uppercase text-ink/40 underline hover:text-ink">
                Reset ({activeFilters})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 md:py-12">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full bg-ink/5 border-4 border-ink/10 animate-pulse h-64" />
            {[...Array(6)].map((_,i) => <div key={i} className="bg-ink/5 border-4 border-ink/10 animate-pulse h-52" />)}
          </div>
        ) : view === "watchlist" ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <h3 className="font-display text-2xl text-ink uppercase">Your Watchlist</h3>
              <span className="font-display text-xs text-ink/50">{savedEvents.length} saved</span>
            </div>
            {savedEvents.length === 0 ? (
              <div className="border-4 border-dashed border-ink/30 p-12 text-center">
                <p className="font-display text-5xl text-ink/20 mb-3">♡</p>
                <p className="font-display text-2xl text-ink mb-2">NOTHING SAVED</p>
                <p className="text-ink/50 text-sm">Tap ♡ on any event to add it here.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedEvents.map(e => <EventCard key={e.id} event={e} signals={signals} trendingIds={trendingIds} onSignal={recordSignal} onToggleSave={toggleSave} />)}
              </div>
            )}
          </>
        ) : filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/30 p-14 text-center">
            <p className="font-display text-4xl text-ink mb-3">NOTHING YET</p>
            <p className="text-ink/50 text-sm mb-6">No events match these filters right now.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setCity("all"); setGenre("All"); setVibe("all"); setWhen("all"); }}
                className="font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">CLEAR FILTERS</button>
              <Link to="/submit-event" className="font-display text-sm uppercase bg-cream text-ink px-5 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">SUBMIT AN EVENT →</Link>
            </div>
          </div>
        ) : (
          <>
            <SceneStats events={filtered} trendingIds={trendingIds} />
            <AffinityBar signals={signals} />

            {featured && (
              <div className="mb-6">
                <HeroCard event={featured} signals={signals} trendingIds={trendingIds} onSignal={recordSignal} onToggleSave={toggleSave} />
              </div>
            )}

            {recommended.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-xs uppercase text-electric-blue border-b-2 border-electric-blue pb-0.5">✦ RECOMMENDED FOR YOU</span>
                  <span className="text-xs text-ink/40">matched to your {genre} taste</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommended.map(e => <EventCard key={e.id} event={e} signals={signals} trendingIds={trendingIds} isRecommended onSignal={recordSignal} onToggleSave={toggleSave} />)}
                </div>
                <div className="border-b-4 border-ink/10 mt-8 mb-8" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.filter(e => !recommended.includes(e)).map(e => (
                <EventCard key={e.id} event={e} signals={signals} trendingIds={trendingIds} onSignal={recordSignal} onToggleSave={toggleSave} />
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-ink/10">
              <p className="text-ink/30 text-xs font-mono uppercase">{filtered.length} events · ranked to your taste</p>
              <div className="flex items-center gap-4">
                {signals.saved.length > 0 && <button onClick={() => setView("watchlist")} className="font-display text-xs text-magenta uppercase hover:underline">♥ {signals.saved.length} saved</button>}
                <Link to="/submit-event" className="font-display text-xs text-ink/40 uppercase hover:text-ink underline">submit yours →</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CuratedEvents;

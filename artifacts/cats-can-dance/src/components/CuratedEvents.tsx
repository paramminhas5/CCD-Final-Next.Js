import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "@/lib/compat-router";
import { supabase } from "@/lib/supabase-shim";

/* ── Types ───────────────────────────────────────────────────────────────── */
type CuratedEvent = {
  id: string; title: string; venue: string | null; event_date: string | null;
  event_time: string | null; url: string; source: string; blurb: string | null;
  genre: string[]; is_featured: boolean; city: string | null; image_url: string | null;
};

/* ── Constants ───────────────────────────────────────────────────────────── */
const CITIES = [
  { key: "all",       label: "All India",  emoji: "🇮🇳" },
  { key: "bangalore", label: "Bengaluru",  emoji: "🌆" },
  { key: "mumbai",    label: "Mumbai",     emoji: "🌊" },
  { key: "delhi",     label: "Delhi",      emoji: "🏛️" },
  { key: "pune",      label: "Pune",       emoji: "🎵" },
  { key: "goa",       label: "Goa",        emoji: "🌴" },
  { key: "hyderabad", label: "Hyderabad",  emoji: "💎" },
  { key: "chennai",   label: "Chennai",    emoji: "🌅" },
  { key: "kolkata",   label: "Kolkata",    emoji: "🎭" },
] as const;

const CITY_ALIASES: Record<string, string[]> = {
  bangalore: ["bangalore","bengaluru","blr"],
  mumbai:    ["mumbai","bombay"],
  delhi:     ["delhi","new delhi","ncr","gurgaon","gurugram","noida"],
  pune:      ["pune"],
  goa:       ["goa","panaji","anjuna","vagator","arambol"],
  hyderabad: ["hyderabad","hyd"],
  chennai:   ["chennai","madras"],
  kolkata:   ["kolkata","calcutta"],
};

const GENRES = [
  { key: "All",          emoji: "✦"  },
  { key: "House",        emoji: "🏠" },
  { key: "Techno",       emoji: "⚙️" },
  { key: "Jungle",       emoji: "🌿" },
  { key: "Drum & Bass",  emoji: "🥁" },
  { key: "Disco",        emoji: "🪩" },
  { key: "Garage",       emoji: "🚗" },
  { key: "Ambient",      emoji: "🌌" },
  { key: "Experimental", emoji: "🧪" },
  { key: "Psytrance",    emoji: "🔮" },
  { key: "Live",         emoji: "🎸" },
  { key: "Electronic",   emoji: "⚡" },
];

const VIBES = [
  { key: "all",      label: "Everything",      color: "bg-ink text-cream"                        },
  { key: "rave",     label: "Rave / Basement",  color: "bg-magenta text-cream"                   },
  { key: "rooftop",  label: "Rooftop / Sunset", color: "bg-acid-yellow text-ink"                 },
  { key: "club",     label: "Club Night",       color: "bg-electric-blue text-cream"              },
  { key: "festival", label: "Festival",         color: "bg-orange text-cream"                    },
  { key: "intimate", label: "Intimate / Loft",  color: "bg-ink/80 text-cream"                    },
  { key: "culture",  label: "Arts & Culture",   color: "bg-cream text-ink border-ink" },
] as const;

const WHEN = [
  { key: "all",     label: "All Upcoming" },
  { key: "tonight", label: "Tonight"      },
  { key: "weekend", label: "This Weekend" },
  { key: "month",   label: "This Month"   },
] as const;

const SOURCE_LABEL: Record<string, string> = {
  skillboxes: "Skillbox", district: "District", insider: "Insider",
  sortmyscene: "SortMyScene", "paytm-insider": "Paytm Insider",
  highape: "HighApe", bookmyshow: "BookMyShow",
  manual: "CCD Pick", community: "Community",
};

const VIBE_KEYWORDS: Record<string, string[]> = {
  rave:      ["rave","basement","underground","warehouse","techno","hard","dark"],
  rooftop:   ["rooftop","sunset","terrace","sundowner","open air","outdoor","garden"],
  club:      ["club","night","dj","dance","house","disco","garage"],
  festival:  ["festival","fest","stage","outdoor","grounds","multi-day"],
  intimate:  ["intimate","loft","studio","acoustic","small","private"],
  culture:   ["art","gallery","culture","exhibition","film","theatre","talk","performance"],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(d: string | null, t: string | null) {
  if (!d) return t || "TBA";
  try {
    const date = new Date(d + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const isToday = date.toDateString() === today.toDateString();
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
    const event = new Date(d + "T00:00:00");
    return Math.round((event.getTime() - today.getTime()) / 86400000);
  } catch { return 999; }
}

function matchesCity(e: CuratedEvent, cityKey: string) {
  if (cityKey === "all") return true;
  const aliases = CITY_ALIASES[cityKey] ?? [cityKey];
  const combined = `${e.city ?? ""} ${e.venue ?? ""} ${e.blurb ?? ""}`.toLowerCase();
  return aliases.some(a => combined.includes(a));
}

function matchesGenre(e: CuratedEvent, genre: string) {
  if (genre === "All") return true;
  return (e.genre ?? []).some(g => g.toLowerCase().includes(genre.toLowerCase()));
}

function matchesVibe(e: CuratedEvent, vibe: string) {
  if (vibe === "all") return true;
  const kws = VIBE_KEYWORDS[vibe] ?? [];
  const combined = `${e.title} ${e.blurb ?? ""} ${e.venue ?? ""} ${(e.genre ?? []).join(" ")}`.toLowerCase();
  return kws.some(k => combined.includes(k));
}

function matchesWhen(e: CuratedEvent, when: string) {
  if (when === "all") return true;
  const days = getDaysUntil(e.event_date);
  if (when === "tonight") return days === 0;
  if (when === "weekend") {
    const today = new Date();
    const dow = today.getDay();
    const daysToFri = (5 - dow + 7) % 7;
    const daysToSun = (0 - dow + 7) % 7 || 7;
    return days >= daysToFri && days <= daysToSun;
  }
  if (when === "month") return days >= 0 && days <= 31;
  return true;
}

function scoreEvent(e: CuratedEvent, prefGenres: string[]): number {
  let score = 0;
  if (e.is_featured) score += 100;
  const days = getDaysUntil(e.event_date);
  if (days === 0) score += 50;
  else if (days <= 3) score += 30;
  else if (days <= 7) score += 15;
  if (prefGenres.length > 0) {
    const overlap = (e.genre ?? []).filter(g => prefGenres.some(p => g.toLowerCase().includes(p.toLowerCase())));
    score += overlap.length * 25;
  }
  return score;
}

const PREF_KEY = "ccd_event_prefs_v2";
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}"); } catch { return {}; }
}
function savePrefs(p: object) {
  try {
    const existing = loadPrefs();
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...existing, ...p }));
  } catch {}
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
      className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center border-2 border-ink transition-colors text-sm ${
        isSaved ? "bg-magenta text-cream" : "bg-cream/90 text-ink hover:bg-acid-yellow"}`}
      title={isSaved ? "Remove from watchlist" : "Save to watchlist"}>
      {isSaved ? "♥" : "♡"}
    </button>
  );
}

function HeroCard({ event, saved, onToggle }: { event: CuratedEvent; saved: string[]; onToggle: (id: string) => void }) {
  const days = getDaysUntil(event.event_date);
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="relative col-span-full flex flex-col justify-end overflow-hidden group min-h-[420px] md:min-h-[500px] border-4 border-ink">
      {event.image_url
        ? <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        : <div className="absolute inset-0 bg-gradient-to-br from-magenta via-ink to-electric-blue" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      <SaveButton id={event.id} saved={saved} onToggle={onToggle} />
      <div className="absolute top-0 left-0 bg-acid-yellow text-ink font-display text-xs px-4 py-1.5 uppercase border-b-4 border-r-4 border-ink">
        ⭐ CCD PICK
      </div>
      <div className="relative z-10 p-6 md:p-10">
        <div className="flex flex-wrap gap-2 mb-4">
          <UrgencyBadge days={days} />
          {event.city && <span className="text-[10px] font-bold px-3 py-1 border-2 border-cream/50 text-cream uppercase">{event.city.toUpperCase()}</span>}
          {(event.genre ?? []).slice(0,3).map(g => (
            <span key={g} className="text-[10px] font-bold px-3 py-1 bg-white/10 border border-white/20 text-cream uppercase backdrop-blur-sm">{g}</span>
          ))}
        </div>
        <h3 className="font-display text-4xl md:text-6xl text-cream uppercase leading-none mb-3 max-w-3xl">{event.title}</h3>
        <p className="font-display text-acid-yellow text-xl mb-2">{formatDate(event.event_date, event.event_time)}</p>
        {event.venue && <p className="text-cream/70 font-medium mb-3">{event.venue}</p>}
        {event.blurb && <p className="text-cream/60 max-w-xl text-sm leading-relaxed mb-5 line-clamp-2">{event.blurb}</p>}
        <span className="inline-flex items-center gap-2 font-display text-acid-yellow text-sm border-b-2 border-acid-yellow pb-0.5 group-hover:gap-3 transition-all">
          GET TICKETS / RSVP →
        </span>
      </div>
    </a>
  );
}

function EventCard({ event, saved, onToggle, isRecommended }: {
  event: CuratedEvent; saved: string[]; onToggle: (id: string) => void; isRecommended?: boolean;
}) {
  const days = getDaysUntil(event.event_date);
  const isCCDPick = event.source === "manual";
  const isSaved = saved.includes(event.id);
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className={`relative block border-4 border-ink overflow-hidden group transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 ${
        isSaved ? "ring-2 ring-magenta ring-offset-2" : ""} ${isCCDPick ? "bg-magenta" : "bg-cream"}`}>
      <SaveButton id={event.id} saved={saved} onToggle={onToggle} />
      {isRecommended && (
        <div className="absolute top-0 left-0 bg-electric-blue text-cream font-display text-[9px] px-3 py-1 uppercase z-10 border-b-2 border-r-2 border-ink">
          ✦ For You
        </div>
      )}
      {event.image_url && (
        <div className="overflow-hidden border-b-4 border-ink h-40">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge days={days} />
            <span className={`text-[9px] font-bold px-2 py-1 border-2 border-ink uppercase ${isCCDPick ? "bg-acid-yellow text-ink" : "bg-ink text-cream"}`}>
              {SOURCE_LABEL[event.source] ?? event.source}
            </span>
          </div>
          {event.city && <span className={`text-[9px] font-bold uppercase ${isCCDPick ? "text-cream/60" : "text-ink/50"}`}>📍 {event.city}</span>}
        </div>
        <h3 className={`font-display text-xl md:text-2xl uppercase leading-tight mb-2 pr-6 ${isCCDPick ? "text-cream" : "text-ink"}`}>
          {event.title}
        </h3>
        <p className={`font-display text-base mb-1 ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>
          {formatDate(event.event_date, event.event_time)}
        </p>
        {event.venue && <p className={`text-sm font-medium mb-2 ${isCCDPick ? "text-cream/70" : "text-ink/60"}`}>{event.venue}</p>}
        {event.blurb && <p className={`text-sm mb-3 line-clamp-2 ${isCCDPick ? "text-cream/70" : "text-ink/70"}`}>{event.blurb}</p>}
        {(event.genre ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genre.slice(0,3).map(g => (
              <span key={g} className={`text-[9px] uppercase px-2 py-0.5 font-bold border ${
                isCCDPick ? "border-cream/30 text-cream/80" : "border-ink/30 text-ink/70 bg-ink/5"}`}>{g}</span>
            ))}
          </div>
        )}
        <span className={`font-display text-sm ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>RSVP →</span>
      </div>
    </a>
  );
}

function SceneStats({ events }: { events: CuratedEvent[] }) {
  const cities = [...new Set(events.map(e => e.city).filter(Boolean))].length;
  const genres = [...new Set(events.flatMap(e => e.genre ?? []))].length;
  const soon = events.filter(e => getDaysUntil(e.event_date) <= 3 && getDaysUntil(e.event_date) >= 0).length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px border-4 border-ink bg-ink mb-8">
      {[
        { n: events.length, label: "upcoming events" },
        { n: cities, label: "cities active" },
        { n: genres, label: "genres covered" },
        { n: soon, label: "happening soon" },
      ].map(({ n, label }) => (
        <div key={label} className="bg-cream p-4 text-center">
          <p className="font-display text-3xl md:text-4xl text-ink">{n}</p>
          <p className="font-display text-xs uppercase text-ink/50 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
const CuratedEvents = () => {
  const prefs = loadPrefs();
  const [events, setEvents] = useState<CuratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>(prefs.city ?? "bangalore");
  const [genre, setGenre] = useState(prefs.genre ?? "All");
  const [vibe, setVibe] = useState(prefs.vibe ?? "all");
  const [when, setWhen] = useState<string>("all");
  const [view, setView] = useState<"discover" | "watchlist">("discover");
  const [saved, setSaved] = useState<string[]>(prefs.saved ?? []);
  const [showAllGenres, setShowAllGenres] = useState(false);

  useEffect(() => { savePrefs({ city, genre, vibe, saved }); }, [city, genre, vibe, saved]);

  const toggleSave = useCallback((id: string) => {
    setSaved(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      let { data } = await supabase
        .from("curated_events").select("*")
        .or(`event_date.gte.${today},event_date.is.null`)
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true, nullsFirst: false })
        .limit(120);
      if (!data || data.length === 0) {
        const { data: recent } = await supabase.from("curated_events").select("*")
          .order("created_at", { ascending: false }).limit(120);
        data = recent ?? [];
      }
      setEvents((data ?? []) as CuratedEvent[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const prefGenres = genre !== "All" ? [genre] : [];
    return events
      .filter(e => matchesCity(e, city) && matchesGenre(e, genre) && matchesVibe(e, vibe) && matchesWhen(e, when))
      .sort((a, b) => scoreEvent(b, prefGenres) - scoreEvent(a, prefGenres));
  }, [events, city, genre, vibe, when]);

  const savedEvents = useMemo(() => events.filter(e => saved.includes(e.id)), [events, saved]);
  const featured = filtered.find(e => e.is_featured) ?? filtered[0];
  const rest = filtered.filter(e => e !== featured);
  const recommended = useMemo(() => genre !== "All" ? rest.filter(e => matchesGenre(e, genre)).slice(0, 3) : [], [rest, genre]);
  const activeFilterCount = [city !== "all", genre !== "All", vibe !== "all", when !== "all"].filter(Boolean).length;
  const visibleGenres = showAllGenres ? GENRES : GENRES.slice(0, 8);

  return (
    <section id="discover" className="border-t-4 border-ink">
      {/* Header */}
      <div className="bg-ink border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-2">/ THE SCENE ENGINE</p>
              <h2 className="font-display text-5xl md:text-7xl text-cream leading-none">WHAT'S ON.</h2>
              <p className="text-cream/50 font-medium mt-3 max-w-lg text-sm">
                Electronic & culture-forward events across India — curated daily for the scene.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex border-4 border-cream/20">
                <button onClick={() => setView("discover")}
                  className={`font-display text-xs uppercase px-4 py-2.5 transition-colors ${view === "discover" ? "bg-cream text-ink" : "text-cream/50 hover:text-cream"}`}>
                  DISCOVER
                </button>
                <button onClick={() => setView("watchlist")}
                  className={`font-display text-xs uppercase px-4 py-2.5 transition-colors ${view === "watchlist" ? "bg-cream text-ink" : "text-cream/50 hover:text-cream"}`}>
                  SAVED{saved.length > 0 && <span className="ml-1.5 bg-magenta text-cream text-[9px] font-bold px-1.5 py-0.5">{saved.length}</span>}
                </button>
              </div>
              <Link to="/submit-event" className="bg-acid-yellow text-ink font-display text-sm px-5 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap">
                + SUBMIT EVENT
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-cream border-b-4 border-ink">
        <div className="container py-5 space-y-4">
          {/* City tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CITIES.map(c => (
              <button key={c.key} onClick={() => setCity(c.key)}
                className={`flex items-center gap-1.5 font-display text-xs px-3 py-2 border-4 border-ink uppercase whitespace-nowrap shrink-0 transition-all ${
                  c.key === city ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
          {/* When + Vibe */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">When:</span>
            {WHEN.map(w => (
              <button key={w.key} onClick={() => setWhen(w.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${
                  w.key === when ? "bg-ink text-cream" : "text-ink hover:bg-acid-yellow"}`}>
                {w.label}
              </button>
            ))}
            <span className="w-px h-4 bg-ink/20 mx-1 hidden md:block" />
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">Vibe:</span>
            {VIBES.map(v => (
              <button key={v.key} onClick={() => setVibe(v.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${
                  v.key === vibe ? v.color : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                {v.label}
              </button>
            ))}
          </div>
          {/* Genre */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-display text-[10px] uppercase text-ink/40 mr-1">Genre:</span>
            {visibleGenres.map(g => (
              <button key={g.key} onClick={() => setGenre(g.key)}
                className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${
                  g.key === genre ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                {g.emoji} {g.key}
              </button>
            ))}
            <button onClick={() => setShowAllGenres(v => !v)}
              className="font-display text-xs px-3 py-1.5 border-2 border-ink/30 text-ink/40 uppercase hover:text-ink transition-colors">
              {showAllGenres ? "Less ↑" : `+${GENRES.length - 8} more`}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={() => { setCity("all"); setGenre("All"); setVibe("all"); setWhen("all"); }}
                className="ml-auto font-display text-[10px] uppercase text-ink/40 underline hover:text-ink">
                Reset ({activeFilterCount})
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
              <span className="font-display text-xs text-ink/50 uppercase">{savedEvents.length} saved</span>
            </div>
            {savedEvents.length === 0 ? (
              <div className="border-4 border-dashed border-ink/30 p-12 text-center">
                <p className="font-display text-5xl text-ink/20 mb-3">♡</p>
                <p className="font-display text-2xl text-ink mb-2">NOTHING SAVED YET</p>
                <p className="text-ink/50 text-sm">Tap ♡ on any event to save it here.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedEvents.map(e => <EventCard key={e.id} event={e} saved={saved} onToggle={toggleSave} />)}
              </div>
            )}
          </>
        ) : filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/30 p-14 text-center">
            <p className="font-display text-4xl text-ink mb-3">NOTHING YET</p>
            <p className="text-ink/50 text-sm mb-6">No events match these filters right now. Try broadening your search.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setCity("all"); setGenre("All"); setVibe("all"); setWhen("all"); }}
                className="font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
                CLEAR FILTERS
              </button>
              <Link to="/submit-event" className="font-display text-sm uppercase bg-cream text-ink px-5 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">
                SUBMIT AN EVENT →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <SceneStats events={filtered} />

            {featured && (
              <div className="mb-6">
                <HeroCard event={featured} saved={saved} onToggle={toggleSave} />
              </div>
            )}

            {recommended.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-xs uppercase text-electric-blue border-b-2 border-electric-blue pb-0.5">
                    ✦ RECOMMENDED FOR YOU
                  </span>
                  <span className="text-xs text-ink/40">because you like {genre}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommended.map(e => <EventCard key={e.id} event={e} saved={saved} onToggle={toggleSave} isRecommended />)}
                </div>
                <div className="border-b-4 border-ink/10 mt-8 mb-8" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.filter(e => !recommended.includes(e)).map(e => (
                <EventCard key={e.id} event={e} saved={saved} onToggle={toggleSave} />
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-ink/10">
              <p className="text-ink/30 text-xs font-mono uppercase tracking-wider">
                {filtered.length} events · refreshed daily
              </p>
              <div className="flex items-center gap-4">
                {saved.length > 0 && (
                  <button onClick={() => setView("watchlist")} className="font-display text-xs text-magenta uppercase hover:underline">
                    ♥ {saved.length} saved
                  </button>
                )}
                <Link to="/submit-event" className="font-display text-xs text-ink/40 uppercase hover:text-ink underline">
                  submit yours →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CuratedEvents;

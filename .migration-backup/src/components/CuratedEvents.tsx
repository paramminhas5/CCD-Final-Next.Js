import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type CuratedEvent = {
  id: string;
  title: string;
  venue: string | null;
  event_date: string | null;
  event_time: string | null;
  url: string;
  source: string;
  blurb: string | null;
  genre: string[];
  is_featured: boolean;
  city: string | null;
  image_url: string | null;
};

const CITY_TABS = [
  { key: "all",       label: "All Cities" },
  { key: "bangalore", label: "Bangalore"  },
  { key: "mumbai",    label: "Mumbai"     },
  { key: "delhi",     label: "Delhi"      },
] as const;

const GENRE_FILTERS = ["All","House","Techno","Disco","Jungle","Drum & Bass","Garage","Electronic","Live"];

const CITY_ALIASES: Record<string, string[]> = {
  bangalore: ["bangalore","bengaluru","blr"],
  mumbai:    ["mumbai","bombay"],
  delhi:     ["delhi","new delhi","ncr","gurgaon","gurugram","noida"],
};

const SOURCE_LABEL: Record<string,string> = {
  skillboxes: "Skillbox", district: "District", insider: "Insider",
  sortmyscene: "SortMyScene", "paytm-insider": "Paytm Insider",
  highape: "HighApe", bookmyshow: "BookMyShow",
  manual: "CCD Pick", community: "Community",
};

function formatDate(d: string | null, t: string | null) {
  if (!d) return t || "TBA";
  try {
    const date = new Date(d);
    return `${date.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}${t ? ` · ${t}` : ""}`;
  } catch { return d; }
}

function matchesCity(e: CuratedEvent, cityKey: string) {
  if (cityKey === "all") return true;
  const aliases = CITY_ALIASES[cityKey] ?? [cityKey];
  const cityStr = (e.city ?? "").toLowerCase();
  if (aliases.some((a) => cityStr.includes(a))) return true;
  return aliases.some((a) => `${e.venue ?? ""} ${e.blurb ?? ""}`.toLowerCase().includes(a));
}

function matchesGenre(e: CuratedEvent, genre: string) {
  if (genre === "All") return true;
  return (e.genre ?? []).some((g) => g.toLowerCase().includes(genre.toLowerCase()));
}

// ── Featured hero card ────────────────────────────────────────────────────────
function FeaturedCard({ event }: { event: CuratedEvent }) {
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className="relative flex flex-col justify-end border-4 border-ink chunk-shadow overflow-hidden group min-h-[320px] md:col-span-2">
      {event.image_url
        ? <img src={event.image_url} alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="absolute inset-0 bg-magenta" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream bg-acid-yellow text-ink uppercase">⭐ FEATURED</span>
          {event.city && <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream text-cream uppercase">{event.city.toUpperCase()}</span>}
          <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream bg-ink/60 text-cream uppercase">{SOURCE_LABEL[event.source] ?? event.source}</span>
        </div>
        <h3 className="font-display text-3xl md:text-4xl text-cream mb-2 leading-tight">{event.title.toUpperCase()}</h3>
        <p className="font-display text-acid-yellow text-lg mb-1">{formatDate(event.event_date, event.event_time)}</p>
        {event.venue && <p className="text-cream/80 font-medium text-sm mb-3">{event.venue}</p>}
        {(event.genre ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.genre.slice(0,4).map((g) => (
              <span key={g} className="text-[10px] uppercase bg-cream/20 text-cream px-2 py-0.5 font-bold border border-cream/30">{g}</span>
            ))}
          </div>
        )}
        <span className="inline-block font-display text-acid-yellow text-sm border-b-2 border-acid-yellow">RSVP / TICKETS →</span>
      </div>
    </a>
  );
}

// ── Standard event card ───────────────────────────────────────────────────────
function EventCard({ event }: { event: CuratedEvent }) {
  const isCCDPick = event.source === "manual";
  const isCommunity = event.source === "community";
  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer"
      className={`block border-4 border-ink chunk-shadow overflow-hidden group hover:-translate-y-1 hover:translate-x-1 transition-transform ${isCCDPick ? "bg-magenta" : "bg-cream"}`}>
      {event.image_url && (
        <div className="overflow-hidden h-40 border-b-4 border-ink">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-1 border-2 border-ink uppercase ${
            isCCDPick ? "bg-acid-yellow text-ink" : isCommunity ? "bg-acid-yellow text-ink" : "bg-ink text-cream"}`}>
            {SOURCE_LABEL[event.source] ?? event.source}
          </span>
          {event.city && (
            <span className={`text-[10px] font-bold px-2 py-1 border-2 border-ink uppercase ${isCCDPick ? "bg-cream text-ink" : "text-ink/60"}`}>
              {event.city.toUpperCase()}
            </span>
          )}
        </div>
        <h3 className={`font-display text-xl md:text-2xl mb-2 leading-tight ${isCCDPick ? "text-cream" : "text-ink"}`}>
          {event.title.toUpperCase()}
        </h3>
        <p className={`font-display text-base mb-1 ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>
          {formatDate(event.event_date, event.event_time)}
        </p>
        {event.venue && <p className={`text-sm font-medium mb-2 ${isCCDPick ? "text-cream/80" : "text-ink/70"}`}>{event.venue}</p>}
        {event.blurb && <p className={`text-sm mb-3 line-clamp-2 ${isCCDPick ? "text-cream/80" : "text-ink/80"}`}>{event.blurb}</p>}
        {(event.genre ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genre.slice(0,3).map((g) => (
              <span key={g} className={`text-[10px] uppercase px-2 py-0.5 font-bold ${isCCDPick ? "bg-cream text-ink" : "bg-ink text-cream"}`}>{g}</span>
            ))}
          </div>
        )}
        <span className={`font-display text-sm ${isCCDPick ? "text-acid-yellow" : "text-magenta"}`}>RSVP →</span>
      </div>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const CuratedEvents = () => {
  const [events, setEvents] = useState<CuratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>("bangalore");
  const [genre, setGenre] = useState("All");

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      let { data } = await supabase
        .from("curated_events")
        .select("*")
        .or(`event_date.gte.${today},event_date.is.null`)
        .order("is_featured", { ascending: false })
        .order("event_date", { ascending: true, nullsFirst: false })
        .limit(60);

      if (!data || data.length === 0) {
        const { data: recent } = await supabase
          .from("curated_events").select("*")
          .order("created_at", { ascending: false }).limit(60);
        data = recent ?? [];
      }
      setEvents((data ?? []) as CuratedEvent[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() =>
    events.filter((e) => matchesCity(e, city) && matchesGenre(e, genre)),
    [events, city, genre]
  );

  const featured = filtered.filter((e) => e.is_featured);
  const rest = filtered.filter((e) => !e.is_featured);

  return (
    <section id="discover" className="border-t-4 border-ink">
      {/* Header */}
      <div className="bg-ink border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="font-display text-acid-yellow text-sm uppercase tracking-widest mb-2">/ DISCOVER</p>
              <h2 className="font-display text-5xl md:text-7xl text-cream leading-none">THE SCENE.</h2>
              <p className="text-cream/60 font-medium mt-3 max-w-xl">
                Hand-picked dance & electronic events across India — curated from the best platforms and the community.
              </p>
            </div>
            <Link to="/submit-event"
              className="self-start md:self-auto bg-acid-yellow text-ink font-display text-base px-5 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap">
              + SUBMIT YOUR EVENT
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* City tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CITY_TABS.map((c) => (
            <button key={c.key} type="button" onClick={() => setCity(c.key)}
              className={`font-display text-sm px-4 py-2 border-4 border-ink uppercase transition-transform ${
                c.key === city ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Genre filter */}
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b-2 border-ink/20">
          {GENRE_FILTERS.map((g) => (
            <button key={g} type="button" onClick={() => setGenre(g)}
              className={`font-display text-xs px-3 py-1.5 border-2 border-ink uppercase transition-colors ${
                g === genre ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-cream border-4 border-ink animate-pulse h-64" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/40 p-12 text-center">
            <p className="font-display text-3xl text-ink mb-3">NOTHING YET</p>
            <p className="text-ink/60 font-medium mb-6">
              {city === "all" ? "Check back soon — we refresh this daily." : `No ${CITY_TABS.find((c) => c.key === city)?.label} events yet. Try another city or genre.`}
            </p>
            <Link to="/submit-event"
              className="inline-block bg-ink text-cream font-display px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
              SUBMIT AN EVENT →
            </Link>
          </div>
        ) : (
          <>
            {/* Featured events */}
            {featured.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {featured.slice(0, 2).map((e) => <FeaturedCard key={e.id} event={e} />)}
              </div>
            )}

            {/* All events grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((e) => <EventCard key={e.id} event={e} />)}
            </div>

            <p className="text-ink/40 text-xs font-mono uppercase tracking-wider mt-8 text-right">
              {filtered.length} events · refreshed daily · <Link to="/submit-event" className="underline hover:text-ink/70">submit yours →</Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default CuratedEvents;

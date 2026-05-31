/**
 * SafeCuratedEvents — crash-proof curated events section for /events.
 *
 * Behaviour:
 *  - Fetches from /api/events/recommended (same endpoint as CuratedEventsTeaser)
 *  - If the API is unavailable / returns an error / times out → renders a
 *    static fallback grid of hand-curated Bangalore event sources instead
 *    of crashing or showing nothing.
 *  - "use client" directive not needed — this is a plain React component
 *    in the Next.js pages router; effects run client-side automatically.
 *
 * Three render states:
 *  1. loading   → skeleton pulse grid
 *  2. live data → up to 6 event cards with image, date, venue
 *  3. fallback  → static "discover" CTA block with source links
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Music, Compass, ExternalLink } from "lucide-react";
import { Link } from "@/lib/compat-router";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CuratedEvent {
  id: string;
  title: string;
  url: string;
  source: string;
  city: string | null;
  venue: string | null;
  event_date: string | null;
  event_time: string | null;
  blurb: string | null;
  genre: string[];
  image_url: string | null;
  is_featured: boolean;
}

// ── Source badge colours ───────────────────────────────────────────────────────
const SOURCE_BADGES: Record<string, { bg: string; label: string }> = {
  insider:    { bg: "bg-electric-blue text-cream", label: "Insider"   },
  district:   { bg: "bg-magenta text-cream",        label: "District"  },
  highape:    { bg: "bg-orange text-ink",           label: "HighApe"   },
  skillboxes: { bg: "bg-lime text-ink",             label: "Skillbox"  },
  editorial:  { bg: "bg-acid-yellow text-ink",      label: "Editorial" },
  manual:     { bg: "bg-ink text-cream",            label: "Curated"   },
  promoter:   { bg: "bg-hot-pink text-cream",       label: "Promoter"  },
};

// ── Fallback sources shown when the API is unavailable ────────────────────────
const FALLBACK_SOURCES = [
  {
    name: "Skillbox",
    href: "https://skillboxes.com",
    desc: "Bangalore's underground events board.",
    bg:   "bg-lime text-ink",
  },
  {
    name: "District",
    href: "https://in.district.com",
    desc: "Curated nightlife — tickets + discovery.",
    bg:   "bg-magenta text-cream",
  },
  {
    name: "Insider",
    href: "https://insider.in",
    desc: "India's biggest events platform.",
    bg:   "bg-electric-blue text-cream",
  },
  {
    name: "HighApe",
    href: "https://highape.com",
    desc: "Live music & club nights across India.",
    bg:   "bg-acid-yellow text-ink",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string | null): string {
  if (!d) return "TBA";
  try {
    const date  = new Date(d);
    const today = new Date();
    const tmrw  = new Date(); tmrw.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tmrw.toDateString())  return "Tomorrow";
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function EventCard({ event, index }: { event: CuratedEvent; index: number }) {
  const srcKey   = event.source?.startsWith("promoter:") ? "promoter" : (event.source ?? "manual");
  const badge    = SOURCE_BADGES[srcKey] ?? SOURCE_BADGES.manual;
  const location = [event.venue, event.city].filter(Boolean).join(", ") || "Bangalore";

  return (
    <motion.a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="group flex flex-col border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden border-b-4 border-ink shrink-0 bg-ink">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 bg-electric-blue flex items-center justify-center">
            <Music className="w-8 h-8 text-cream/40" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent pointer-events-none" />
        {/* Source badge */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-display uppercase border border-ink/40 ${badge.bg}`}>
          {badge.label}
        </span>
        {event.is_featured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-display uppercase border border-ink bg-acid-yellow text-ink">
            Featured
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-sm text-ink uppercase leading-tight mb-2 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-ink/60 mb-1">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{formatDate(event.event_date)}{event.event_time ? ` · ${event.event_time}` : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink/60 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        {(event.genre ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {event.genre.slice(0, 2).map((g) => (
              <span key={g} className="px-1.5 py-0.5 text-[10px] font-display uppercase bg-acid-yellow text-ink border border-ink">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.a>
  );
}



function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-4 border-ink bg-ink/5 animate-pulse">
          <div className="aspect-[4/3] bg-ink/10" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-ink/10 rounded w-3/4" />
            <div className="h-2.5 bg-ink/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FallbackBlock() {
  return (
    <div>
      <p className="text-ink/60 font-medium text-base mb-6">
        Our live events feed is offline right now. Find more events across India on these trusted platforms:
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {FALLBACK_SOURCES.map((src, i) => (
          <motion.a
            key={src.name}
            href={src.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex flex-col justify-between border-4 border-ink chunk-shadow p-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform ${src.bg}`}
          >
            <div>
              <h3 className="font-display text-2xl leading-none mb-2">{src.name.toUpperCase()}</h3>
              <p className="font-medium text-sm opacity-80 leading-snug">{src.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-4 font-display text-xs uppercase tracking-widest opacity-70">
              <ExternalLink className="w-3 h-3" />
              Visit →
            </div>
          </motion.a>
        ))}
      </div>
      <Link
        to="/discover"
        className="inline-flex items-center gap-2 bg-ink text-cream font-display text-sm uppercase px-6 py-3 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
      >
        <Compass className="w-4 h-4" />
        Open Discover →
      </Link>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
type FetchState = "idle" | "loading" | "done" | "error";

export default function SafeCuratedEvents() {
  const [events,    setEvents]    = useState<CuratedEvent[]>([]);
  const [total,     setTotal]     = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>("idle");

  useEffect(() => {
    let cancelled = false;
    setFetchState("loading");

    // Abort after 6 s so we don't sit on the loading skeleton forever
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);

    fetch("/api/events/recommended?tab=for_you&limit=6", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ events?: CuratedEvent[]; total?: number }>;
      })
      .then((data) => {
        if (cancelled) return;
        const rows = (data.events ?? []).slice(0, 6);
        setEvents(rows);
        setTotal(data.total ?? rows.length);
        setFetchState("done");
      })
      .catch(() => {
        if (!cancelled) setFetchState("error");
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Nothing to show after load and no error → omit section entirely
  if (fetchState === "done" && events.length === 0) return null;

  return (
    <section className="bg-cream border-t-4 border-ink py-12 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 border-b-4 border-ink pb-6">
          <div>
            <p className="font-display text-magenta text-xs md:text-sm uppercase tracking-widest mb-2">
              <Compass className="inline w-3.5 h-3.5 mr-1" />
              Also On In Bangalore
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-ink uppercase leading-tight">
              MORE TO EXPLORE.
            </h2>
            <p className="text-ink/60 text-sm mt-2">
              Curated from Skillbox, District, Insider and trusted promoters.
            </p>
          </div>
          {fetchState !== "error" && (
            <Link
              to="/discover"
              className="shrink-0 flex items-center gap-2 font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <Compass className="w-4 h-4" />
              Discover All Events →
            </Link>
          )}
        </div>

        {/* Content */}
        {fetchState === "loading" && <SkeletonGrid />}

        {fetchState === "error" && <FallbackBlock />}

        {fetchState === "done" && events.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {events.map((e, i) => (
                <EventCard key={e.id} event={e} index={i} />
              ))}
            </div>
            {total > 6 && (
              <div className="mt-8 flex justify-center">
                <Link
                  to="/discover"
                  className="flex items-center gap-3 font-display text-sm uppercase bg-acid-yellow text-ink px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                >
                  <Compass className="w-4 h-4" />
                  See All {total} Events on Discover →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

"use client";

/**
 * CuratedEventsTeaser — used on /events page.
 * Shows 4 upcoming curated events from the city of the first result,
 * with a strong CTA to /discover for the full grid.
 *
 * Intentionally lightweight — no tabs, no filters, no infinite scroll.
 * Those all live on /discover.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Music, ArrowRight, Compass } from "lucide-react";

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

// Source badge colours — mirrors CuratedEvents.tsx
const sourceBadges: Record<string, { bg: string; label: string }> = {
  insider:    { bg: "bg-electric-blue text-cream",  label: "Insider" },
  district:   { bg: "bg-magenta text-cream",         label: "District" },
  highape:    { bg: "bg-orange text-ink",            label: "HighApe" },
  skillboxes: { bg: "bg-lime text-ink",              label: "Skillbox" },
  editorial:  { bg: "bg-acid-yellow text-ink",       label: "Editorial" },
  manual:     { bg: "bg-ink text-cream",             label: "Curated" },
  promoter:   { bg: "bg-hot-pink text-cream",        label: "Promoter" },
};

function formatDate(d: string | null): string {
  if (!d) return "TBA";
  const date  = new Date(d);
  const today = new Date();
  const tmrw  = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tmrw.toDateString())  return "Tomorrow";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function TeaserCard({ event, index }: { event: CuratedEvent; index: number }) {
  const srcKey   = event.source?.startsWith("promoter:") ? "promoter" : event.source;
  const srcBadge = sourceBadges[srcKey] ?? sourceBadges.manual;

  return (
    <motion.a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
      className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden border-b-4 border-ink shrink-0">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-electric-blue flex items-center justify-center">
            <Music className="w-8 h-8 text-cream/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 text-[10px] font-display uppercase border border-ink ${srcBadge.bg}`}>
            {srcBadge.label}
          </span>
        </div>
        {event.is_featured && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-[10px] font-display uppercase border border-ink bg-acid-yellow text-ink">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-sm text-ink uppercase leading-tight mb-2 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-ink/60 mb-1">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{formatDate(event.event_date)}{event.event_time && ` · ${event.event_time}`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink/60 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{[event.venue, event.city].filter(Boolean).join(", ") || "TBA"}</span>
        </div>
        {/* Genre pills */}
        {(event.genre ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {(event.genre ?? []).slice(0, 2).map(g => (
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

export default function CuratedEventsTeaser() {
  const [events, setEvents]   = useState<CuratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    fetch("/api/events/recommended?tab=for_you&limit=4")
      .then(r => r.ok ? r.json() : { events: [], total: 0 })
      .then(data => {
        setEvents((data.events ?? []).slice(0, 4));
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Don't render section if nothing to show after loading
  if (!loading && events.length === 0) return null;

  return (
    <section className="bg-cream border-t-4 border-ink py-12 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 border-b-4 border-ink pb-6">
          <div>
            <p className="font-display text-magenta text-xs uppercase tracking-widest mb-2">
              <Compass className="inline w-3.5 h-3.5 mr-1" />
              Also On In India
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-ink uppercase leading-tight">
              MORE TO EXPLORE.
            </h2>
            <p className="text-ink/60 text-sm mt-2">
              Curated from Skillbox, District, Insider and trusted promoters across the country.
            </p>
          </div>
          <Link
            href="/discover"
            className="shrink-0 flex items-center gap-2 font-display text-sm uppercase bg-ink text-cream px-5 py-3 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Compass className="w-4 h-4" />
            Discover All Events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-4 border-ink bg-ink/5 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {events.map((event, i) => (
              <TeaserCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && total > 4 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/discover"
              className="flex items-center gap-3 font-display text-sm uppercase bg-acid-yellow text-ink px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
            >
              <Compass className="w-4 h-4" />
              See All {total} Events on Discover →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

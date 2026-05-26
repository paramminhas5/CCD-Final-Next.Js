"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MapPin, Calendar, ExternalLink, Music, TrendingUp,
  Sparkles, Star, Filter, X, Share2, Users, Zap,
  Compass, Flame, Ticket
} from "lucide-react";
import Link from "next/link";

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
  lineups?: { artist_name: string; artist_slug?: string; role: string; is_featured: boolean }[];
  score?: number;
  reasons?: string[];
}

interface EventSection {
  title: string;
  subtitle: string;
  events: { event: CuratedEvent; score: number; reasons: string[]; lineups: any[] }[];
}

type TabType = "for_you" | "trending" | "editors_picks" | "this_weekend";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "for_you", label: "For You", icon: Sparkles },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "editors_picks", label: "Editor's Picks", icon: Star },
  { id: "this_weekend", label: "This Weekend", icon: Calendar },
];

// CCD design system: each source gets an acid-yellow/magenta/orange badge
const sourceBadges: Record<string, { bg: string; label: string }> = {
  insider:   { bg: "bg-electric-blue text-cream",  label: "Insider" },
  district:  { bg: "bg-magenta text-cream",         label: "District" },
  highape:   { bg: "bg-orange text-ink",            label: "HighApe" },
  editorial: { bg: "bg-acid-yellow text-ink",       label: "Editorial" },
  manual:    { bg: "bg-ink text-cream",             label: "Curated" },
};

const reasonLabels: Record<string, { icon: React.ElementType; text: string }> = {
  genre_match:    { icon: Music,       text: "Matches your taste" },
  artist_you_like:{ icon: Heart,       text: "Artist you follow" },
  city_you_like:  { icon: MapPin,      text: "In your city" },
  venue_you_like: { icon: Compass,     text: "Venue you like" },
  worth_the_trip: { icon: Zap,         text: "Worth the trip" },
  in_your_city:   { icon: MapPin,      text: "In your city" },
  trending:       { icon: TrendingUp,  text: "Trending" },
  editors_pick:   { icon: Star,        text: "Editor's pick" },
  this_weekend:   { icon: Calendar,    text: "This weekend" },
};

const CITIES  = ["Mumbai", "Delhi", "Bangalore", "Pune", "Goa", "Hyderabad", "Chennai", "Kolkata"];
const GENRES  = ["Techno", "House", "D&B", "Jungle", "Garage", "Disco", "Ambient", "Experimental"];

export default function CuratedEvents() {
  const [events,       setEvents]       = useState<CuratedEvent[]>([]);
  const [sections,     setSections]     = useState<EventSection[]>([]);
  const [activeTab,    setActiveTab]    = useState<TabType>("for_you");
  const [selCity,      setSelCity]      = useState("");
  const [selGenre,     setSelGenre]     = useState("");
  const [savedEvents,  setSavedEvents]  = useState<Set<string>>(new Set());
  const [isLoading,    setIsLoading]    = useState(true);
  const [showFilters,  setShowFilters]  = useState(false);
  const [total,        setTotal]        = useState(0);
  const [offset,       setOffset]       = useState(0);
  const [hasMore,      setHasMore]      = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async (reset = false) => {
    const cur = reset ? 0 : offset;
    const params = new URLSearchParams({ tab: activeTab, limit: "12", offset: String(cur) });
    if (selCity)  params.set("city",  selCity);
    if (selGenre) params.set("genre", selGenre);
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/events/recommended?${params}`);
      const data = await res.json();
      if (reset) {
        setEvents(data.events   || []);
        setSections(data.sections || []);
        setOffset(12);
      } else {
        setEvents(prev => [...prev, ...(data.events || [])]);
        setOffset(cur + 12);
      }
      setTotal(data.total || 0);
      setHasMore((data.events || []).length === 12);
    } catch (err) {
      console.error("fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selCity, selGenre, offset]);

  useEffect(() => { fetchEvents(true); }, [activeTab, selCity, selGenre]);

  // Infinite scroll
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchEvents(false);
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, fetchEvents]);

  const handleSave = async (id: string) => {
    const saved = savedEvents.has(id);
    setSavedEvents(prev => { const n = new Set(prev); saved ? n.delete(id) : n.add(id); return n; });
    try {
      await fetch(`/api/events/${id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: saved ? "dismissed" : "save" }),
      });
    } catch {
      setSavedEvents(prev => { const n = new Set(prev); saved ? n.add(id) : n.delete(id); return n; });
    }
  };

  const handleShare = async (event: CuratedEvent) => {
    if (navigator.share) await navigator.share({ title: event.title, url: event.url });
    else await navigator.clipboard.writeText(event.url);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "TBA";
    const date  = new Date(d);
    const today = new Date();
    const tmrw  = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tmrw.toDateString())  return "Tomorrow";
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  const getDaysUntil = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  };

  return (
    <section className="bg-cream border-b-4 border-ink min-h-screen">
      {/* ── Sticky filter bar ── */}
      <div className="sticky top-0 z-40 bg-cream border-b-4 border-ink">
        <div className="container py-3">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-display text-xs text-ink/50 uppercase tracking-widest">Electronic Events Across India</p>
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 border-4 border-ink font-display text-xs uppercase transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${showFilters ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(selCity || selGenre) && <span className="w-2 h-2 bg-magenta border border-ink inline-block" />}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 border-4 border-ink font-display text-xs uppercase whitespace-nowrap transition-colors ${active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-4 border-t-4 border-ink mt-3">
                  <div>
                    <p className="font-display text-xs text-ink/50 uppercase tracking-widest mb-2">City</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterPill label="All Cities" active={!selCity} onClick={() => setSelCity("")} />
                      {CITIES.map(c => (
                        <FilterPill key={c} label={c} active={selCity === c} onClick={() => setSelCity(selCity === c ? "" : c)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-xs text-ink/50 uppercase tracking-widest mb-2">Genre</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterPill label="All Genres" active={!selGenre} onClick={() => setSelGenre("")} />
                      {GENRES.map(g => (
                        <FilterPill key={g} label={g} active={selGenre === g} onClick={() => setSelGenre(selGenre === g ? "" : g)} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container py-8">
        {/* Sectioned "For You" view */}
        {activeTab === "for_you" && sections.length > 0 && (
          <div className="space-y-12 mb-12">
            {sections.map((section, si) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}>
                <div className="mb-5 border-b-4 border-ink pb-3">
                  <h2 className="font-display text-2xl text-ink uppercase">{section.title}</h2>
                  <p className="text-sm text-ink/60 mt-1">{section.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {section.events.map(({ event, reasons, lineups }, idx) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      reasons={reasons}
                      lineups={lineups}
                      isSaved={savedEvents.has(event.id)}
                      onSave={() => handleSave(event.id)}
                      onShare={() => handleShare(event)}
                      formatDate={formatDate}
                      getDaysUntil={getDaysUntil}
                      index={idx}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Grid for other tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {events.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                reasons={event.reasons || []}
                lineups={event.lineups || []}
                isSaved={savedEvents.has(event.id)}
                onSave={() => handleSave(event.id)}
                onShare={() => handleShare(event)}
                formatDate={formatDate}
                getDaysUntil={getDaysUntil}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-4 border-ink bg-ink/5 h-80 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && events.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-4 border-ink bg-acid-yellow chunk-shadow p-12 text-center max-w-md mx-auto mt-8">
            <Compass className="w-12 h-12 text-ink/40 mx-auto mb-4" />
            <p className="font-display text-2xl text-ink mb-2">NO EVENTS FOUND</p>
            <p className="text-ink/60 text-sm">Try adjusting your filters or check back later.</p>
          </motion.div>
        )}

        <div ref={loadMoreRef} className="h-10" />

        {events.length > 0 && (
          <p className="text-center font-display text-xs text-ink/40 mt-4 uppercase">
            Showing {events.length} of {total} events
          </p>
        )}
      </div>
    </section>
  );
}

// ── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 border-2 border-ink font-display text-xs uppercase transition-colors ${active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}
    >
      {label}
    </button>
  );
}

// ── Event Card ───────────────────────────────────────────────────────────────
function EventCard({
  event, reasons, lineups, isSaved, onSave, onShare, formatDate, getDaysUntil, index,
}: {
  event: CuratedEvent;
  reasons: string[];
  lineups: any[];
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  formatDate: (d: string | null) => string;
  getDaysUntil: (d: string | null) => number | null;
  index: number;
}) {
  const daysUntil    = getDaysUntil(event.event_date);
  const srcBadge     = sourceBadges[event.source] ?? sourceBadges.manual;
  const primaryR     = reasons[0];
  const reasonInfo   = primaryR ? reasonLabels[primaryR] : null;
  const headliners   = lineups.filter(l => l.is_featured || l.role === "headliner").slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden border-b-4 border-ink">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-electric-blue flex items-center justify-center">
            <Music className="w-10 h-10 text-cream/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        {/* Source + urgency badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 text-[10px] font-display uppercase border border-ink ${srcBadge.bg}`}>
            {srcBadge.label}
          </span>
          {daysUntil !== null && daysUntil >= 0 && daysUntil <= 3 && (
            <span className="px-2 py-0.5 text-[10px] font-display uppercase border border-ink bg-magenta text-cream">
              {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d left`}
            </span>
          )}
          {event.is_featured && (
            <span className="px-2 py-0.5 text-[10px] font-display uppercase border border-ink bg-acid-yellow text-ink">
              Featured
            </span>
          )}
        </div>

        {/* Reason tag */}
        {reasonInfo && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-display uppercase bg-cream/90 text-ink border border-ink">
              <reasonInfo.icon className="w-3 h-3" />
              {reasonInfo.text}
            </span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.preventDefault(); onShare(); }} className="p-2 bg-cream border-2 border-ink hover:bg-acid-yellow transition-colors">
            <Share2 className="w-3.5 h-3.5 text-ink" />
          </button>
          <button onClick={e => { e.preventDefault(); onSave(); }} className={`p-2 border-2 border-ink transition-colors ${isSaved ? "bg-magenta" : "bg-cream hover:bg-acid-yellow"}`}>
            <Heart className={`w-3.5 h-3.5 ${isSaved ? "text-cream fill-current" : "text-ink"}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-base text-ink uppercase leading-tight mb-2 line-clamp-2">{event.title}</h3>

        <div className="flex items-center gap-2 text-xs text-ink/60 mb-1">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{formatDate(event.event_date)}{event.event_time && ` · ${event.event_time}`}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink/60 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{[event.venue, event.city].filter(Boolean).join(", ") || "TBA"}</span>
        </div>

        {/* Genres */}
        {event.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genre.slice(0, 3).map(g => (
              <span key={g} className="px-1.5 py-0.5 text-[10px] font-display uppercase bg-acid-yellow text-ink border border-ink">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Lineup */}
        {headliners.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-3 h-3 text-ink/40 shrink-0" />
            <p className="text-[11px] text-ink/60 truncate">
              {headliners.map(a => a.artist_name).join(", ")}
            </p>
          </div>
        )}

        {event.blurb && (
          <p className="text-xs text-ink/50 line-clamp-2 mb-3">{event.blurb}</p>
        )}

        {/* CTA */}
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 py-2 border-4 border-ink bg-ink text-cream font-display text-xs uppercase hover:bg-magenta transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <Ticket className="w-3.5 h-3.5" />
          Get Tickets ↗
        </a>
      </div>
    </motion.div>
  );
}

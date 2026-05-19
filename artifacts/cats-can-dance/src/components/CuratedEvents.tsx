"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MapPin, Calendar, Clock, ExternalLink, Music, TrendingUp, 
  Sparkles, Star, ChevronDown, Filter, X, Share2, Users, Zap,
  Compass, Flame, Ticket
} from "lucide-react";
import Image from "next/image";
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

const tabs: { id: TabType; label: string; icon: any }[] = [
  { id: "for_you", label: "For You", icon: Sparkles },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "editors_picks", label: "Editor's Picks", icon: Star },
  { id: "this_weekend", label: "This Weekend", icon: Calendar },
];

const sourceBadges: Record<string, { color: string; label: string }> = {
  insider: { color: "bg-purple-500/20 text-purple-300", label: "Insider" },
  district: { color: "bg-blue-500/20 text-blue-300", label: "District" },
  highape: { color: "bg-pink-500/20 text-pink-300", label: "HighApe" },
  editorial: { color: "bg-amber-500/20 text-amber-300", label: "Editorial" },
  manual: { color: "bg-gray-500/20 text-gray-300", label: "Curated" },
};

const reasonLabels: Record<string, { icon: any; text: string }> = {
  genre_match: { icon: Music, text: "Matches your taste" },
  artist_you_like: { icon: Heart, text: "Artist you follow" },
  city_you_like: { icon: MapPin, text: "City you like" },
  venue_you_like: { icon: Compass, text: "Venue you like" },
  worth_the_trip: { icon: Zap, text: "Worth the trip" },
  in_your_city: { icon: MapPin, text: "In your city" },
  trending: { icon: TrendingUp, text: "Trending now" },
  editors_pick: { icon: Star, text: "Editor's pick" },
  this_weekend: { icon: Calendar, text: "This weekend" },
};

export default function CuratedEvents() {
  const [events, setEvents] = useState<CuratedEvent[]>([]);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("for_you");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Goa", "Hyderabad", "Chennai", "Kolkata"];
  const genres = ["Techno", "House", "D&B", "Hip-Hop", "Indie", "Experimental", "Ambient", "Disco"];

  const fetchEvents = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    const params = new URLSearchParams({
      tab: activeTab,
      limit: "12",
      offset: currentOffset.toString(),
    });
    if (selectedCity) params.set("city", selectedCity);
    if (selectedGenre) params.set("genre", selectedGenre);

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/recommended?${params}`);
      const data = await res.json();

      if (reset) {
        setEvents(data.events || []);
        setSections(data.sections || []);
        setOffset(12);
      } else {
        setEvents(prev => [...prev, ...(data.events || [])]);
        setOffset(currentOffset + 12);
      }

      setTotal(data.total || 0);
      setHasMore((data.events || []).length === 12);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedCity, selectedGenre, offset]);

  useEffect(() => {
    fetchEvents(true);
  }, [activeTab, selectedCity, selectedGenre]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        fetchEvents(false);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, fetchEvents]);

  const handleSave = async (eventId: string) => {
    const isSaved = savedEvents.has(eventId);

    // Optimistic UI
    setSavedEvents(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    // Track interaction
    try {
      await fetch(`/api/events/${eventId}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSaved ? "dismissed" : "save" }),
      });
    } catch (err) {
      // Revert on error
      setSavedEvents(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
    }
  };

  const handleShare = async (event: CuratedEvent) => {
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        url: event.url,
      });
    } else {
      await navigator.clipboard.writeText(event.url);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
              <p className="text-sm text-white/50">Electronic & culture-forward events across India</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(selectedCity || selectedGenre) && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-4">
                  {/* City filter */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">City</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCity("")}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                          !selectedCity ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        All Cities
                      </button>
                      {cities.map(city => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city === selectedCity ? "" : city)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                            selectedCity === city ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre filter */}
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Genre</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedGenre("")}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                          !selectedGenre ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        All Genres
                      </button>
                      {genres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => setSelectedGenre(genre === selectedGenre ? "" : genre)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                            selectedGenre === genre ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sectioned view for "For You" */}
        {activeTab === "for_you" && sections.length > 0 && (
          <div className="space-y-8 mb-8">
            {sections.map((section, sectionIdx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
              >
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <p className="text-sm text-white/40">{section.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Grid view for other tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 h-80 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && events.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Compass className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-white/40 text-sm">
              Try adjusting your filters or check back later for new events.
            </p>
          </motion.div>
        )}

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* Footer info */}
        {events.length > 0 && (
          <p className="text-center text-xs text-white/20 mt-4">
            Showing {events.length} of {total} events
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Event Card Component ───────────────────────────────────────────────────

function EventCard({
  event,
  reasons,
  lineups,
  isSaved,
  onSave,
  onShare,
  formatDate,
  getDaysUntil,
  index,
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
  const daysUntil = getDaysUntil(event.event_date);
  const sourceBadge = sourceBadges[event.source] || sourceBadges.manual;
  const primaryReason = reasons[0];
  const reasonInfo = primaryReason ? reasonLabels[primaryReason] : null;

  const featuredArtists = lineups.filter(l => l.is_featured || l.role === 'headliner').slice(0, 3);
  const otherArtists = lineups.filter(l => !l.is_featured && l.role !== 'headliner').slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 border border-white/5 hover:border-white/10"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
            <Music className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sourceBadge.color}`}>
            {sourceBadge.label}
          </span>
          {event.is_featured && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300">
              Featured
            </span>
          )}
          {daysUntil !== null && daysUntil <= 3 && daysUntil >= 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300">
              {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil}d`}
            </span>
          )}
        </div>

        {/* Reason badge */}
        {reasonInfo && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/80 backdrop-blur-sm">
              <reasonInfo.icon className="w-3 h-3" />
              {reasonInfo.text}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); onShare(); }}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onSave(); }}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isSaved ? "bg-rose-500/80 text-white" : "bg-black/50 hover:bg-black/70"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-white/90 transition-colors">
          {event.title}
        </h3>

        {/* Date & Location */}
        <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(event.event_date)}
            {event.event_time && (
              <span className="text-white/20">· {event.event_time}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/40 mb-3">
          <MapPin className="w-3 h-3" />
          {event.venue || "TBA"}
          {event.city && (
            <span className="text-white/20">, {event.city}</span>
          )}
        </div>

        {/* Genres */}
        {event.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genre.slice(0, 3).map(g => (
              <span key={g} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/50">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Lineup preview */}
        {(featuredArtists.length > 0 || otherArtists.length > 0) && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3 h-3 text-white/30" />
            <div className="flex -space-x-1.5">
              {featuredArtists.map((artist, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-white/10 border border-black flex items-center justify-center text-[8px] font-medium"
                  title={artist.artist_name}
                >
                  {artist.artist_name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-white/30">
              {featuredArtists.length > 0 && `${featuredArtists.map(a => a.artist_name).join(", ")}`}
              {otherArtists.length > 0 && ` +${otherArtists.length} more`}
            </span>
          </div>
        )}

        {/* Blurb */}
        {event.blurb && (
          <p className="text-xs text-white/30 line-clamp-2 mb-3">{event.blurb}</p>
        )}

        {/* CTA */}
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors group/link"
        >
          <Ticket className="w-3.5 h-3.5" />
          Get Tickets
          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </a>
      </div>
    </motion.div>
  );
}

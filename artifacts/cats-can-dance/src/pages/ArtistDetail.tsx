"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Music, ExternalLink, Instagram, Globe, Mail,
  ChevronDown, ChevronUp, Heart, Share2, Download, Users, TrendingUp,
  Award, Radio, Disc, Mic2, Headphones, Star, Clock, Zap, Target,
  BarChart3, Route, Flag, Sparkles, ArrowRight, Play, Pause,
  Link2, Building2, PartyPopper, Milestone, BookOpen, Newspaper,
  FileText, Image as ImageIcon, Video, Copy, CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Artist {
  id: string;
  slug: string;
  name: string;
  based_city: string | null;
  from_city: string | null;
  bio: string | null;
  why: string | null;
  genres: string[];
  festivals: string[];
  instagram: string | null;
  soundcloud: string | null;
  bandcamp: string | null;
  spotify: string | null;
  website: string | null;
  booking_email: string | null;
  manager_email: string | null;
  labels: string | null;
  members: string | null;
  photo_url: string | null;
  fee_min_inr: number | null;
  fee_max_inr: number | null;
  fee_currency: string;
  open_to_bookings: boolean;
  available_cities: string[];
  featured: boolean;
  status: string;
  gallery: any[];
  videos: any[];
  claimed_by: string | null;
  enrichment_status: string;
}

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  artist_b_id: string;
  connection_type: string;
  strength: number;
  shared_events: string[];
  shared_venues: string[];
  notes: string | null;
}

interface Appearance {
  id: string;
  event_name: string;
  venue: string | null;
  city: string | null;
  event_date: string | null;
  year: number | null;
  role: string;
}

interface Milestone {
  id: string;
  date: string;
  year: number | null;
  type: string;
  title: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  event_name: string | null;
  related_artist_slug: string | null;
  related_artist_name: string | null;
  importance: number;
  is_featured: boolean;
}

interface SocialStats {
  instagram_followers: number | null;
  soundcloud_followers: number | null;
  soundcloud_plays: number | null;
  spotify_monthly_listeners: number | null;
}

interface CoolFact {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

interface ArtistStats {
  total_gigs: number;
  total_cities: number;
  total_venues: number;
  total_connections: number;
  years_active: number;
  b2b_count: number;
  festival_count: number;
}

type SectionType = 
  | "overview" 
  | "connections" 
  | "gigography" 
  | "journey" 
  | "press" 
  | "epk" 
  | "stats";

const sectionTabs: { id: SectionType; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Star },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "gigography", label: "Gigography", icon: Route },
  { id: "journey", label: "Journey", icon: Milestone },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "press", label: "Press", icon: Newspaper },
  { id: "epk", label: "EPK", icon: FileText },
];

const milestoneIcons: Record<string, any> = {
  first_gig: Play,
  festival_debut: PartyPopper,
  label_signing: Disc,
  release: Disc,
  milestone_followers: TrendingUp,
  tour: Route,
  b2b: Users,
  residency: Building2,
  award: Award,
  radio_show: Radio,
};

const roleColors: Record<string, string> = {
  headliner: "bg-amber-500/20 text-amber-300",
  performer: "bg-blue-500/20 text-blue-300",
  b2b: "bg-purple-500/20 text-purple-300",
  support: "bg-gray-500/20 text-gray-300",
};

export default function ArtistDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<{
    artist: Artist | null;
    connections: Connection[];
    appearances: Appearance[];
    milestones: Milestone[];
    socialStats: SocialStats | null;
    stats: ArtistStats;
    facts: CoolFact[];
  } | null>(null);

  const [activeSection, setActiveSection] = useState<SectionType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/artists/${slug}/full`)
      .then(r => r.json())
      .then(data => {
        setData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [slug]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = async () => {
    if (!data?.artist) return;
    const url = `${window.location.origin}/artists/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: data.artist.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (!data?.artist) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/40">
        Artist not found
      </div>
    );
  }

  const { artist, connections, appearances, milestones, socialStats, stats, facts } = data;
  const years = [...new Set(appearances.map(a => a.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const filteredAppearances = selectedYear === "all" 
    ? appearances 
    : appearances.filter(a => a.year === selectedYear);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── Hero Section ───────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          {artist.photo_url ? (
            <Image
              src={artist.photo_url}
              alt={artist.name}
              fill
              className="object-cover opacity-30 blur-sm scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/10"
            >
              {artist.photo_url ? (
                <Image src={artist.photo_url} alt={artist.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Music className="w-12 h-12 text-white/20" />
                </div>
              )}
              {artist.featured && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-medium backdrop-blur-sm">
                  Featured
                </div>
              )}
            </motion.div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{artist.name}</h1>
                  {artist.claimed_by && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                      Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mb-4">
                  {artist.based_city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {artist.based_city}
                    </span>
                  )}
                  {artist.from_city && artist.from_city !== artist.based_city && (
                    <span className="text-white/30">Originally from {artist.from_city}</span>
                  )}
                  {stats.years_active > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {stats.years_active} years active
                    </span>
                  )}
                </div>

                {/* Genres */}
                {artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {artist.genres.map(g => (
                      <span key={g} className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/60 border border-white/5">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social links */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {artist.instagram && (
                    <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </a>
                  )}
                  {artist.soundcloud && (
                    <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors">
                      <Headphones className="w-3.5 h-3.5" /> SoundCloud
                    </a>
                  )}
                  {artist.spotify && (
                    <a href={artist.spotify} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors">
                      <Disc className="w-3.5 h-3.5" /> Spotify
                    </a>
                  )}
                  {artist.bandcamp && (
                    <a href={artist.bandcamp} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors">
                      <Music className="w-3.5 h-3.5" /> Bandcamp
                    </a>
                  )}
                  {artist.website && (
                    <a href={artist.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <StatBadge icon={Route} value={stats.total_gigs} label="Gigs" />
                  <StatBadge icon={MapPin} value={stats.total_cities} label="Cities" />
                  <StatBadge icon={Link2} value={stats.total_connections} label="Connections" />
                  <StatBadge icon={Users} value={stats.b2b_count} label="B2Bs" />
                  {socialStats?.instagram_followers && (
                    <StatBadge 
                      icon={TrendingUp} 
                      value={formatNumber(socialStats.instagram_followers)} 
                      label="Followers" 
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {artist.open_to_bookings && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Book This Artist
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <Link
                    href={`/artists/${slug}/epk`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download EPK
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {sectionTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-white/40 hover:text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Content Sections ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "overview" && (
              <OverviewSection 
                artist={artist} 
                facts={facts} 
                stats={stats}
                appearances={appearances.slice(0, 5)}
                connections={connections.slice(0, 6)}
                milestones={milestones.filter(m => m.is_featured).slice(0, 4)}
                expandedBio={expandedBio}
                setExpandedBio={setExpandedBio}
              />
            )}

            {activeSection === "connections" && (
              <ConnectionsSection connections={connections} artistSlug={slug} />
            )}

            {activeSection === "gigography" && (
              <GigographySection 
                appearances={appearances}
                filteredAppearances={filteredAppearances}
                years={years}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            )}

            {activeSection === "journey" && (
              <JourneySection milestones={milestones} />
            )}

            {activeSection === "stats" && (
              <StatsSection stats={stats} appearances={appearances} socialStats={socialStats} />
            )}

            {activeSection === "press" && (
              <PressSection artist={artist} />
            )}

            {activeSection === "epk" && (
              <EPKSection artist={artist} stats={stats} facts={facts} appearances={appearances} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
      <Icon className="w-3.5 h-3.5 text-white/40" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

function OverviewSection({ 
  artist, facts, stats, appearances, connections, milestones, expandedBio, setExpandedBio 
}: any) {
  return (
    <div className="space-y-8">
      {/* Bio */}
      {artist.bio && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">About</h3>
          <p className={`text-sm leading-relaxed text-white/70 ${expandedBio ? "" : "line-clamp-4"}`}>
            {artist.bio}
          </p>
          {artist.bio.length > 300 && (
            <button
              onClick={() => setExpandedBio(!expandedBio)}
              className="flex items-center gap-1 mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {expandedBio ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expandedBio ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Cool Facts */}
      {facts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Cool Facts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {facts.map((fact: CoolFact, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-white/[0.03] border border-white/5 p-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="text-2xl mb-2">{fact.icon}</div>
                <div className="text-xs text-white/40 mb-1">{fact.label}</div>
                <div className="text-lg font-bold mb-1">{fact.value}</div>
                <div className="text-xs text-white/30">{fact.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Gigs */}
      {appearances.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Recent Gigs</h3>
            <button className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {appearances.map((gig: Appearance, i: number) => (
              <motion.div
                key={gig.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{gig.event_name}</div>
                  <div className="text-xs text-white/40">
                    {gig.venue} {gig.city && `· ${gig.city}`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[gig.role] || roleColors.performer}`}>
                  {gig.role}
                </span>
                <div className="text-xs text-white/30">{gig.year}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Connections Preview */}
      {connections.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Connections</h3>
            <span className="text-xs text-white/30">{stats.total_connections} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {connections.map((conn: Connection, i: number) => {
              const partnerSlug = conn.artist_a_slug === artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
              return (
                <Link
                  key={i}
                  href={`/artists/${partnerSlug}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                    {partnerSlug.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{partnerSlug}</div>
                    <div className="text-[10px] text-white/30">
                      {conn.connection_type} · {conn.shared_events.length} events
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones Preview */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Journey Highlights</h3>
          <div className="space-y-3">
            {milestones.map((m: Milestone, i: number) => {
              const Icon = milestoneIcons[m.type] || Star;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.title}</div>
                    {m.description && (
                      <div className="text-xs text-white/40 mt-0.5">{m.description}</div>
                    )}
                    <div className="text-[10px] text-white/30 mt-1">
                      {m.year} {m.city && `· ${m.city}`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionsSection({ connections, artistSlug }: { connections: Connection[]; artistSlug: string }) {
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = filterType === "all" 
    ? connections 
    : connections.filter(c => c.connection_type === filterType);

  const types = [...new Set(connections.map(c => c.connection_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
            filterType === "all" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          All ({connections.length})
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors capitalize ${
              filterType === type ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {type} ({connections.filter(c => c.connection_type === type).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((conn, i) => {
          const partnerSlug = conn.artist_a_slug === artistSlug ? conn.artist_b_slug : conn.artist_a_slug;
          return (
            <motion.div
              key={`${conn.artist_a_slug}-${conn.artist_b_slug}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-white/[0.03] border border-white/5 p-4 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-start gap-3">
                <Link href={`/artists/${partnerSlug}`}>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold hover:bg-white/15 transition-colors">
                    {partnerSlug.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/artists/${partnerSlug}`} className="text-sm font-semibold hover:text-white/80 transition-colors">
                    {partnerSlug}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      conn.connection_type === 'b2b' ? 'bg-purple-500/20 text-purple-300' :
                      conn.connection_type === 'collab' ? 'bg-blue-500/20 text-blue-300' :
                      conn.connection_type === 'label' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {conn.connection_type}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(10)].map((_, j) => (
                        <div
                          key={j}
                          className={`w-1 h-3 rounded-full ${
                            j < conn.strength ? 'bg-white/40' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {conn.shared_events.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] text-white/30 mb-1">Shared events:</div>
                      <div className="flex flex-wrap gap-1">
                        {conn.shared_events.slice(0, 3).map(e => (
                          <span key={e} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/40">
                            {e}
                          </span>
                        ))}
                        {conn.shared_events.length > 3 && (
                          <span className="text-[10px] text-white/30">+{conn.shared_events.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {conn.shared_venues.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/30">
                      <MapPin className="w-3 h-3" />
                      {conn.shared_venues.slice(0, 3).join(", ")}
                    </div>
                  )}

                  {conn.notes && (
                    <p className="mt-2 text-xs text-white/30 italic">{conn.notes}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GigographySection({ 
  appearances, filteredAppearances, years, selectedYear, setSelectedYear 
}: any) {
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              viewMode === "list" ? "bg-white/10 text-white" : "text-white/40"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              viewMode === "timeline" ? "bg-white/10 text-white" : "text-white/40"
            }`}
          >
            Timeline
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedYear("all")}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              selectedYear === "all" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All Years
          </button>
          {years.map((year: number) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year === selectedYear ? "all" : year)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedYear === year ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-xs text-white/40">
        <span>{filteredAppearances.length} gigs shown</span>
        <span>{new Set(filteredAppearances.map((a: any) => a.city).filter(Boolean)).size} cities</span>
        <span>{new Set(filteredAppearances.map((a: any) => a.venue).filter(Boolean)).size} venues</span>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAppearances.map((gig: Appearance, i: number) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group"
            >
              <div className="w-14 text-center flex-shrink-0">
                <div className="text-lg font-bold">{gig.year || "?"}</div>
                <div className="text-[10px] text-white/30">
                  {gig.event_date ? new Date(gig.event_date).toLocaleDateString("en-IN", { month: "short" }) : ""}
                </div>
              </div>

              <div className="w-px h-10 bg-white/10" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{gig.event_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[gig.role] || roleColors.performer}`}>
                    {gig.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  {gig.venue && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {gig.venue}
                    </span>
                  )}
                  {gig.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gig.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-white/20" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
          {filteredAppearances.map((gig: Appearance, i: number) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative mb-6"
            >
              <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-white/20 border-2 border-[#0a0a0a]" />
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-xs text-white/30 mb-1">{gig.year}</div>
                <div className="text-sm font-medium">{gig.event_name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  {gig.venue && <span>{gig.venue}</span>}
                  {gig.city && <span>{gig.city}</span>}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${roleColors[gig.role] || roleColors.performer}`}>
                    {gig.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function JourneySection({ milestones }: { milestones: Milestone[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const types = [...new Set(milestones.map(m => m.type))];
  const filtered = filterType === "all" ? milestones : milestones.filter(m => m.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
            filterType === "all" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          All ({milestones.length})
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors capitalize ${
              filterType === type ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

        {filtered.map((milestone, i) => {
          const Icon = milestoneIcons[milestone.type] || Star;
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative mb-8 group"
            >
              <div className={`absolute -left-5 top-2 w-4 h-4 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center ${
                milestone.is_featured ? 'bg-amber-500/30' : 'bg-white/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  milestone.is_featured ? 'bg-amber-400' : 'bg-white/40'
                }`} />
              </div>

              <div className={`p-5 rounded-xl border transition-all ${
                milestone.is_featured 
                  ? 'bg-amber-500/[0.03] border-amber-500/20' 
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    milestone.is_featured ? 'bg-amber-500/10' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 ${milestone.is_featured ? 'text-amber-300' : 'text-white/40'}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{milestone.title}</span>
                      {milestone.is_featured && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>

                    {milestone.description && (
                      <p className="text-xs text-white/50 mb-2">{milestone.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/30">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {milestone.year || milestone.date.split('-')[0]}
                      </span>
                      {milestone.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {milestone.city}
                        </span>
                      )}
                      {milestone.venue && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {milestone.venue}
                        </span>
                      )}
                      {milestone.related_artist_slug && (
                        <Link 
                          href={`/artists/${milestone.related_artist_slug}`}
                          className="flex items-center gap-1 text-white/40 hover:text-white/60"
                        >
                          <Users className="w-3 h-3" /> {milestone.related_artist_name || milestone.related_artist_slug}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatsSection({ stats, appearances, socialStats }: any) {
  // Compute yearly breakdown
  const byYear = appearances.reduce((acc: any, gig: Appearance) => {
    const y = gig.year || 0;
    if (!acc[y]) acc[y] = { count: 0, cities: new Set(), venues: new Set() };
    acc[y].count++;
    if (gig.city) acc[y].cities.add(gig.city);
    if (gig.venue) acc[y].venues.add(gig.venue);
    return acc;
  }, {});

  const yearData = Object.entries(byYear)
    .map(([year, data]: [string, any]) => ({
      year: parseInt(year),
      gigs: data.count,
      cities: data.cities.size,
      venues: data.venues.size,
    }))
    .sort((a, b) => a.year - b.year);

  // City breakdown
  const cityData = appearances.reduce((acc: Record<string, number>, gig: Appearance) => {
    if (gig.city) acc[gig.city] = (acc[gig.city] || 0) + 1;
    return acc;
  }, {});
  const topCities = Object.entries(cityData)
    .map(([city, count]) => ({ city, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Venue breakdown
  const venueData = appearances.reduce((acc: Record<string, { count: number; city: string }>, gig: Appearance) => {
    if (gig.venue) {
      if (!acc[gig.venue]) acc[gig.venue] = { count: 0, city: gig.city || "Unknown" };
      acc[gig.venue].count++;
    }
    return acc;
  }, {});
  const topVenues = Object.entries(venueData)
    .map(([venue, data]) => ({ venue, count: (data as any).count, city: (data as any).city }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxGigs = Math.max(...yearData.map(d => d.gigs), 1);
  const maxCityCount = Math.max(...topCities.map(c => c.count), 1);
  const maxVenueCount = Math.max(...topVenues.map(v => v.count as number), 1);

  return (
    <div className="space-y-8">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Gigs" value={stats.total_gigs} icon={Route} />
        <MetricCard label="Cities Played" value={stats.total_cities} icon={MapPin} />
        <MetricCard label="Venues" value={stats.total_venues} icon={Building2} />
        <MetricCard label="Connections" value={stats.total_connections} icon={Link2} />
        <MetricCard label="B2B Partners" value={stats.b2b_count} icon={Users} />
        <MetricCard label="Festivals" value={stats.festival_count} icon={PartyPopper} />
        <MetricCard label="Years Active" value={stats.years_active} icon={Clock} />
        {socialStats?.instagram_followers && (
          <MetricCard label="IG Followers" value={formatNumber(socialStats.instagram_followers)} icon={TrendingUp} />
        )}
      </div>

      {/* Yearly chart */}
      {yearData.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Gigs Per Year</h3>
          <div className="flex items-end gap-2 h-40">
            {yearData.map(d => (
              <div key={d.year} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-white/30">{d.gigs}</div>
                <div 
                  className="w-full rounded-t-md bg-white/10 hover:bg-white/20 transition-colors relative group"
                  style={{ height: `${(d.gigs / maxGigs) * 100}%`, minHeight: '4px' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-black/80 text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {d.gigs} gigs · {d.cities} cities · {d.venues} venues
                  </div>
                </div>
                <div className="text-[10px] text-white/40">{d.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top cities */}
      {topCities.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Top Cities</h3>
          <div className="space-y-3">
            {topCities.map(c => (
              <div key={c.city} className="flex items-center gap-3">
                <div className="w-24 text-xs text-white/40">{c.city}</div>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-white/15 transition-all"
                    style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-white/60 text-right">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top venues */}
      {topVenues.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Top Venues</h3>
          <div className="space-y-3">
            {topVenues.map(v => (
              <div key={v.venue} className="flex items-center gap-3">
                <div className="w-32">
                  <div className="text-xs text-white/40 truncate">{v.venue}</div>
                  <div className="text-[10px] text-white/20">{v.city}</div>
                </div>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-white/15 transition-all"
                    style={{ width: `${(v.count / maxVenueCount) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-white/60 text-right">{v.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
      <Icon className="w-4 h-4 text-white/20 mb-2" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-white/30">{label}</div>
    </div>
  );
}

function PressSection({ artist }: { artist: Artist }) {
  // Placeholder — would fetch from artist_press table
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-8 text-center">
        <Newspaper className="w-10 h-10 text-white/10 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Press & Media</h3>
        <p className="text-sm text-white/40 max-w-md mx-auto mb-4">
          Press mentions, reviews, and interviews for {artist.name}. 
          This section is populated from the artist_press table.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-white/30">
          <span className="px-2 py-1 rounded bg-white/5">Reviews</span>
          <span className="px-2 py-1 rounded bg-white/5">Interviews</span>
          <span className="px-2 py-1 rounded bg-white/5">Premieres</span>
          <span className="px-2 py-1 rounded bg-white/5">Features</span>
        </div>
      </div>
    </div>
  );
}

function EPKSection({ artist, stats, facts, appearances }: any) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadEPK = async () => {
    setDownloading(true);
    // In production, this would generate a PDF
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* EPK Header */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <div className="flex items-start gap-4">
          {artist.photo_url && (
            <Image 
              src={artist.photo_url} 
              alt={artist.name} 
              width={120} 
              height={120} 
              className="rounded-xl object-cover"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{artist.name}</h2>
            <p className="text-sm text-white/50 mb-3">
              {artist.genres.join(" · ")} · {artist.based_city}
            </p>
            <p className="text-sm text-white/40 leading-relaxed mb-4">
              {artist.bio?.slice(0, 200)}...
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-white/30">
              <span>{stats.total_gigs}+ gigs</span>
              <span>·</span>
              <span>{stats.total_cities} cities</span>
              <span>·</span>
              <span>{stats.years_active} years active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facts for Press */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {facts.slice(0, 6).map((fact: CoolFact, i: number) => (
          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-lg mb-1">{fact.icon}</div>
            <div className="text-xs text-white/30">{fact.label}</div>
            <div className="text-sm font-semibold">{fact.value}</div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Contact</h3>
        <div className="space-y-3">
          {artist.booking_email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-white/30" />
              <span className="text-sm">{artist.booking_email}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(artist.booking_email)}
                className="text-white/20 hover:text-white/40"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}
          {artist.manager_email && (
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-white/30" />
              <span className="text-sm">{artist.manager_email}</span>
              <span className="text-[10px] text-white/20">(Management)</span>
            </div>
          )}
          {artist.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-white/30" />
              <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white/80">
                {artist.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Social & Streaming</h3>
        <div className="flex flex-wrap gap-2">
          {artist.instagram && (
            <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
          )}
          {artist.soundcloud && (
            <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
              <Headphones className="w-4 h-4" /> SoundCloud
            </a>
          )}
          {artist.spotify && (
            <a href={artist.spotify} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
              <Disc className="w-4 h-4" /> Spotify
            </a>
          )}
          {artist.bandcamp && (
            <a href={artist.bandcamp} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
              <Music className="w-4 h-4" /> Bandcamp
            </a>
          )}
        </div>
      </div>

      {/* Tech Specs */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Technical</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/30 text-xs mb-1">Available for</div>
            <div>{artist.available_cities.length > 0 ? artist.available_cities.join(", ") : "All cities"}</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Fee Range</div>
            <div>
              {artist.fee_min_inr && artist.fee_max_inr 
                ? `₹${artist.fee_min_inr.toLocaleString()} - ₹${artist.fee_max_inr.toLocaleString()}`
                : "Contact for rates"
              }
            </div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Status</div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${artist.open_to_bookings ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {artist.open_to_bookings ? "Open for bookings" : "Not taking bookings"}
            </div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Genres</div>
            <div>{artist.genres.join(", ")}</div>
          </div>
        </div>
      </div>

      {/* Download CTA */}
      <button
        onClick={handleDownloadEPK}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            Generating EPK...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Press Kit (PDF)
          </>
        )}
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

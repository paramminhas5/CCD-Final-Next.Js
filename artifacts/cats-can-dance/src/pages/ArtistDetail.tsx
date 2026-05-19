import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Play, PartyPopper, Disc, TrendingUp, Route, Users, Building2, Award, Radio,
  Star, MapPin, Calendar, Music, Share2, Copy, Check, ExternalLink, Instagram,
  Globe, Mail, Headphones, ChevronDown, ChevronUp, BarChart3, Newspaper, FileText,
  BookOpen, Ticket, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Artist {
  id: string;
  slug: string;
  name: string;
  based_city?: string;
  from_city?: string;
  bio?: string;
  genres: string[];
  photo_url?: string;
  instagram?: string;
  soundcloud?: string;
  spotify?: string;
  website?: string;
  booking_email?: string;
  manager_email?: string;
  featured: boolean;
  claimed_by?: string;
  open_to_bookings: boolean;
  fee_min_inr?: number;
  fee_max_inr?: number;
  available_cities: string[];
  labels?: string;
  videos?: any[];
  gallery?: any[];
}

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  connection_type: string;
  strength: number;
  shared_events: string[];
  shared_venues: string[];
  notes?: string;
}

interface Appearance {
  event_name: string;
  venue?: string;
  city?: string;
  event_date?: string;
  year?: number;
  role: string;
}

interface Milestone {
  type: string;
  title: string;
  description?: string;
  year?: number;
  date: string;
  city?: string;
  venue?: string;
  is_featured?: boolean;
  related_artist_slug?: string;
  related_artist_name?: string;
}

interface SocialStats {
  instagram_followers?: number;
  soundcloud_followers?: number;
  spotify_monthly_listeners?: number;
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

interface CoolFact {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

const sectionTabs = [
  { id: "overview", label: "Overview", icon: Star },
  { id: "connections", label: "Connections", icon: Users },
  { id: "gigography", label: "Gigography", icon: MapPin },
  { id: "journey", label: "Journey", icon: Route },
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
  const router = useRouter();
  const slug = (router.query?.slug as string) || "";
  const { toast } = useToast();

  const [data, setData] = useState<{
    artist: Artist | null;
    connections: Connection[];
    appearances: Appearance[];
    milestones: Milestone[];
    socialStats: SocialStats | null;
    stats: ArtistStats;
    facts: CoolFact[];
  } | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setFetchError(null);
    setUsedFallback(false);

    fetch(`/api/artists/${slug}/full`)
      .then(async (r) => {
        if (!r.ok) {
          console.warn(`/full failed with ${r.status}, falling back to /basic`);
          setUsedFallback(true);
          const basicRes = await fetch(`/api/artists/${slug}/basic`);
          if (!basicRes.ok) throw new Error(`basic also failed: ${basicRes.status}`);
          const basicData = await basicRes.json();
          setData({
            artist: basicData.artist,
            connections: [],
            appearances: basicData.appearances || [],
            milestones: [],
            socialStats: null,
            stats: basicData.stats || {
              total_gigs: 0,
              total_cities: 0,
              total_venues: 0,
              total_connections: 0,
              years_active: 0,
              b2b_count: 0,
              festival_count: 0,
            },
            facts: [],
          });
          toast({
            title: "Limited data available",
            description: "Showing artist profile with basic info only. Some sections may be empty.",
            variant: "default",
          });
          return;
        }
        const fullData = await r.json();
        setData({
          artist: fullData.artist,
          connections: fullData.connections || [],
          appearances: fullData.appearances || [],
          milestones: fullData.milestones || [],
          socialStats: fullData.socialStats || null,
          stats: fullData.stats || {
            total_gigs: 0,
            total_cities: 0,
            total_venues: 0,
            total_connections: 0,
            years_active: 0,
            b2b_count: 0,
            festival_count: 0,
          },
          facts: fullData.facts || [],
        });
      })
      .catch((err) => {
        console.error("Failed to fetch artist:", err);
        setFetchError(err.message || "Failed to load artist data");
        toast({
          title: "Error loading artist",
          description: err.message || "Please try again later.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug, toast]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied to clipboard", description: text });
  };

  const handleShare = async () => {
    if (!data?.artist) return;
    const url = `${window.location.origin}/artists/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: data.artist.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: url });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-cream/60 animate-pulse">Loading artist profile…</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-red-400 text-lg">⚠️ {fetchError}</div>
        <p className="text-cream/50 text-sm text-center max-w-md">
          There was a problem loading this artist&apos;s profile. This may be due to recent database changes.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
        <Link href="/artists">
          <Button variant="ghost" className="text-cream/60">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
          </Button>
        </Link>
      </div>
    );
  }

  if (!data?.artist) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-cream/60 text-lg">Artist not found</div>
        <Link href="/artists">
          <Button variant="ghost" className="text-cream/60">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
          </Button>
        </Link>
      </div>
    );
  }

  const { artist, connections, appearances, milestones, socialStats, stats, facts } = data;
  const years = [...new Set(appearances.map(a => a.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const filteredAppearances = selectedYear === "all"
    ? appearances
    : appearances.filter(a => a.year === parseInt(selectedYear));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-cream">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 h-80 overflow-hidden">
          {artist.photo_url ? (
            <img src={artist.photo_url} alt="" className="w-full h-full object-cover opacity-30 blur-sm" />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-purple-900/30 to-[#0a0a0f]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-cream/10 bg-cream/5">
                {artist.photo_url ? (
                  <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cream/30">
                    <Music className="w-12 h-12" />
                  </div>
                )}
              </div>
              {artist.featured && (
                <Badge className="mt-2 bg-amber-500/20 text-amber-300 border-amber-500/30">
                  <Star className="w-3 h-3 mr-1" /> Featured
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{artist.name}</h1>
              {artist.claimed_by && (
                <Badge variant="outline" className="mt-1 border-green-500/30 text-green-400">
                  <Check className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2 text-cream/60 text-sm">
                {artist.based_city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {artist.based_city}
                  </span>
                )}
                {artist.from_city && artist.from_city !== artist.based_city && (
                  <span className="text-cream/40">Originally from {artist.from_city}</span>
                )}
                {stats.years_active > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {stats.years_active} years active
                  </span>
                )}
              </div>

              {artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {artist.genres.map(g => (
                    <Badge key={g} variant="secondary" className="bg-cream/10 text-cream/80 hover:bg-cream/15">
                      {g}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {artist.instagram && (
                  <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                      <Instagram className="w-4 h-4 mr-1.5" /> Instagram
                    </Button>
                  </a>
                )}
                {artist.soundcloud && (
                  <a href={artist.soundcloud} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                      <Headphones className="w-4 h-4 mr-1.5" /> SoundCloud
                    </Button>
                  </a>
                )}
                {artist.spotify && (
                  <a href={artist.spotify} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                      <Music className="w-4 h-4 mr-1.5" /> Spotify
                    </Button>
                  </a>
                )}
                {artist.website && (
                  <a href={artist.website} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                      <Globe className="w-4 h-4 mr-1.5" /> Website
                    </Button>
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                {stats.total_gigs > 0 && <StatBadge icon={MapPin} value={stats.total_gigs} label="gigs" />}
                {stats.total_cities > 0 && <StatBadge icon={MapPin} value={stats.total_cities} label="cities" />}
                {stats.total_connections > 0 && <StatBadge icon={Users} value={stats.total_connections} label="connections" />}
                {socialStats?.instagram_followers && (
                  <StatBadge icon={Instagram} value={formatNumber(socialStats.instagram_followers)} label="followers" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {artist.open_to_bookings && (
                  <Button onClick={() => setShowBookingModal(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Mail className="w-4 h-4 mr-1.5" /> Book Artist
                  </Button>
                )}
                <Button variant="outline" onClick={handleShare} className="border-cream/20 text-cream/70">
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
                <Button variant="outline" onClick={() => handleCopy(`${window.location.origin}/artists/${slug}`, "link")} className="border-cream/20 text-cream/70">
                  {copiedField === "link" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  {copiedField === "link" ? "Copied" : "Copy Link"}
                </Button>
              </div>

              {usedFallback && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                  ⚠️ Showing limited profile data. Some sections may be unavailable due to recent database changes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-cream/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {sectionTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              const hasData =
                tab.id === "overview" ? true :
                tab.id === "connections" ? connections.length > 0 :
                tab.id === "gigography" ? appearances.length > 0 :
                tab.id === "journey" ? milestones.length > 0 :
                tab.id === "stats" ? stats.total_gigs > 0 :
                tab.id === "press" ? true :
                tab.id === "epk" ? true :
                true;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-cream/10 text-cream"
                      : "text-cream/50 hover:text-cream/70 hover:bg-cream/5"
                  } ${!hasData ? "opacity-40" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeSection === "overview" && (
          <OverviewSection
            artist={artist}
            facts={facts}
            stats={stats}
            appearances={appearances}
            connections={connections}
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
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-cream/60">
      <Icon className="w-4 h-4 text-cream/40" />
      <span className="font-semibold text-cream">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function OverviewSection({
  artist, facts, stats, appearances, connections, milestones, expandedBio, setExpandedBio
}: any) {
  return (
    <div className="space-y-8">
      {artist.bio && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cream/50" /> About
          </h3>
          <div className={`text-cream/70 leading-relaxed ${expandedBio ? "" : "line-clamp-4"}`}>
            {artist.bio}
          </div>
          {artist.bio.length > 300 && (
            <button
              onClick={() => setExpandedBio(!expandedBio)}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              {expandedBio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expandedBio ? "Show less" : "Read more"}
            </button>
          )}
        </section>
      )}

      {facts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Cool Facts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {facts.map((fact: CoolFact, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-cream/5 border border-cream/10">
                <div className="text-2xl mb-1">{fact.icon}</div>
                <div className="text-xs text-cream/50 uppercase tracking-wider">{fact.label}</div>
                <div className="text-lg font-bold text-cream">{fact.value}</div>
                <div className="text-xs text-cream/40 mt-0.5">{fact.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {appearances.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cream/50" /> Recent Gigs
          </h3>
          <div className="space-y-2">
            {appearances.slice(0, 6).map((gig: Appearance, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-cream/5 border border-cream/10">
                <div className="text-xs text-cream/40 w-16 shrink-0 text-right">
                  <div className="font-mono">{gig.year || "?"}</div>
                  {gig.event_date && (
                    <div>{new Date(gig.event_date).toLocaleDateString("en-IN", { month: "short" })}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-cream truncate">{gig.event_name}</div>
                  <div className="text-sm text-cream/50">
                    {gig.venue && <span>{gig.venue}</span>}
                    {gig.city && <span className="text-cream/30"> · {gig.city}</span>}
                  </div>
                </div>
                <Badge className={`shrink-0 ${roleColors[gig.role] || roleColors.performer}`}>
                  {gig.role}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {connections.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-cream/50" /> Connections
          </h3>
          <div className="text-sm text-cream/50 mb-2">{stats.total_connections} total</div>
          <div className="flex flex-wrap gap-2">
            {connections.slice(0, 8).map((conn: Connection, i: number) => {
              const partnerSlug = conn.artist_a_slug === artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
              return (
                <Link key={i} href={`/artists/${partnerSlug}`}>
                  <Badge variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10 cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-cream/10 flex items-center justify-center text-xs mr-1.5">
                      {partnerSlug.charAt(0).toUpperCase()}
                    </span>
                    {partnerSlug}
                    <span className="ml-1.5 text-cream/40">
                      {conn.connection_type} · {conn.shared_events.length} events
                    </span>
                  </Badge>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Route className="w-5 h-5 text-cream/50" /> Journey Highlights
          </h3>
          <div className="space-y-2">
            {milestones.slice(0, 4).map((m: Milestone, i: number) => {
              const Icon = milestoneIcons[m.type] || Star;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-cream/5 border border-cream/10">
                  <div className="w-8 h-8 rounded-lg bg-cream/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-cream/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-cream">{m.title}</div>
                    {m.description && (
                      <div className="text-sm text-cream/50 mt-0.5">{m.description}</div>
                    )}
                    <div className="text-xs text-cream/40 mt-1">
                      {m.year} {m.city && `· ${m.city}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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

  if (connections.length === 0) {
    return (
      <div className="text-center py-16 text-cream/40">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No connections found for this artist yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 rounded-full text-sm border ${filterType === "all" ? "bg-cream/10 border-cream/30 text-cream" : "border-cream/20 text-cream/50 hover:bg-cream/5"}`}
        >
          All
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm border capitalize ${filterType === type ? "bg-cream/10 border-cream/30 text-cream" : "border-cream/20 text-cream/50 hover:bg-cream/5"}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((conn, i) => {
          const partnerSlug = conn.artist_a_slug === artistSlug ? conn.artist_b_slug : conn.artist_a_slug;
          return (
            <div key={i} className="p-4 rounded-xl bg-cream/5 border border-cream/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-lg font-bold text-cream/70">
                  {partnerSlug.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/artists/${partnerSlug}`} className="font-medium text-cream hover:text-purple-400 truncate block">
                    {partnerSlug}
                  </Link>
                  <div className="text-sm text-cream/50 capitalize">{conn.connection_type}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {[...Array(10)].map((_, j) => (
                  <div
                    key={j}
                    className={`h-1.5 flex-1 rounded-full ${j < conn.strength ? "bg-purple-500/60" : "bg-cream/10"}`}
                  />
                ))}
              </div>

              {conn.shared_events.length > 0 && (
                <div className="mt-2 text-sm text-cream/50">
                  Shared events:
                  {conn.shared_events.slice(0, 3).map(e => (
                    <span key={e} className="ml-1 text-cream/40">{e}</span>
                  ))}
                  {conn.shared_events.length > 3 && (
                    <span className="text-cream/30"> +{conn.shared_events.length - 3} more</span>
                  )}
                </div>
              )}

              {conn.shared_venues.length > 0 && (
                <div className="mt-1 text-xs text-cream/40">
                  {conn.shared_venues.slice(0, 3).join(", ")}
                </div>
              )}

              {conn.notes && (
                <div className="mt-2 text-xs text-cream/40 italic">{conn.notes}</div>
              )}
            </div>
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

  if (appearances.length === 0) {
    return (
      <div className="text-center py-16 text-cream/40">
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No gig history found for this artist yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="bg-cream/5 border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream"
        >
          <option value="all">All years</option>
          {years.map((year: number) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === "list" ? "bg-cream/10 text-cream" : "text-cream/50 hover:bg-cream/5"}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === "timeline" ? "bg-cream/10 text-cream" : "text-cream/50 hover:bg-cream/5"}`}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-cream/50">
        <span>{filteredAppearances.length} gigs shown</span>
        <span>{new Set(filteredAppearances.map((a: any) => a.city).filter(Boolean)).size} cities</span>
        <span>{new Set(filteredAppearances.map((a: any) => a.venue).filter(Boolean)).size} venues</span>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAppearances.map((gig: Appearance, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-cream/5 border border-cream/10">
              <div className="text-xs text-cream/40 w-14 shrink-0 text-right font-mono">
                <div className="font-bold">{gig.year || "?"}</div>
                {gig.event_date && (
                  <div>{new Date(gig.event_date).toLocaleDateString("en-IN", { month: "short" })}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-cream">{gig.event_name}</div>
                <div className="flex items-center gap-2 text-sm text-cream/50">
                  {gig.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gig.venue}
                    </span>
                  )}
                  {gig.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gig.city}
                    </span>
                  )}
                </div>
              </div>
              <Badge className={`shrink-0 ${roleColors[gig.role] || roleColors.performer}`}>
                {gig.role}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative pl-6 border-l border-cream/10 space-y-6">
          {filteredAppearances.map((gig: Appearance, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[29px] w-3 h-3 rounded-full bg-cream/20 border-2 border-[#0a0a0f]" />
              <div className="text-xs text-cream/40 font-mono mb-1">{gig.year}</div>
              <div className="font-medium text-cream">{gig.event_name}</div>
              <div className="text-sm text-cream/50">
                {gig.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{gig.venue}</span>}
                {gig.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{gig.city}</span>}
              </div>
              <Badge className={`mt-1 ${roleColors[gig.role] || roleColors.performer}`}>
                {gig.role}
              </Badge>
            </div>
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

  if (milestones.length === 0) {
    return (
      <div className="text-center py-16 text-cream/40">
        <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No milestones recorded for this artist yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 rounded-full text-sm border ${filterType === "all" ? "bg-cream/10 border-cream/30 text-cream" : "border-cream/20 text-cream/50 hover:bg-cream/5"}`}
        >
          All
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm border capitalize ${filterType === type ? "bg-cream/10 border-cream/30 text-cream" : "border-cream/20 text-cream/50 hover:bg-cream/5"}`}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="relative pl-6 border-l border-cream/10 space-y-6">
        {filtered.map((milestone, i) => {
          const Icon = milestoneIcons[milestone.type] || Star;
          return (
            <div key={i} className="relative">
              <div className="absolute -left-[29px] w-8 h-8 rounded-lg bg-cream/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-cream/60" />
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium text-cream flex items-center gap-2">
                    {milestone.title}
                    {milestone.is_featured && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        <Star className="w-3 h-3 mr-0.5" /> Featured
                      </Badge>
                    )}
                  </div>
                  {milestone.description && (
                    <div className="text-sm text-cream/50 mt-1">{milestone.description}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-cream/40">
                <span className="font-mono">{milestone.year || milestone.date.split('-')[0]}</span>
                {milestone.city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{milestone.city}</span>
                )}
                {milestone.venue && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{milestone.venue}</span>
                )}
                {milestone.related_artist_slug && (
                  <Link href={`/artists/${milestone.related_artist_slug}`} className="flex items-center gap-1 text-purple-400 hover:text-purple-300">
                    <Users className="w-3 h-3" />
                    {milestone.related_artist_name || milestone.related_artist_slug}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsSection({ stats, appearances, socialStats }: any) {
  if (appearances.length === 0) {
    return (
      <div className="text-center py-16 text-cream/40">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No gig data available for statistics.</p>
      </div>
    );
  }

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

  const cityData = appearances.reduce((acc: Record<string, number>, gig: Appearance) => {
    if (gig.city) acc[gig.city] = (acc[gig.city] || 0) + 1;
    return acc;
  }, {});
  const topCities = Object.entries(cityData)
    .map(([city, count]) => ({ city, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const venueData = appearances.reduce((acc: Record<string, any>, gig: Appearance) => {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Gigs" value={stats.total_gigs} icon={MapPin} />
        <MetricCard label="Cities" value={stats.total_cities} icon={MapPin} />
        <MetricCard label="Venues" value={stats.total_venues} icon={Building2} />
        <MetricCard label="Connections" value={stats.total_connections} icon={Users} />
        {socialStats?.instagram_followers && (
          <MetricCard label="IG Followers" value={formatNumber(socialStats.instagram_followers)} icon={Instagram} />
        )}
        {socialStats?.soundcloud_followers && (
          <MetricCard label="SC Followers" value={formatNumber(socialStats.soundcloud_followers)} icon={Headphones} />
        )}
        {socialStats?.spotify_monthly_listeners && (
          <MetricCard label="Spotify Monthly" value={formatNumber(socialStats.spotify_monthly_listeners)} icon={Music} />
        )}
      </div>

      {yearData.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Gigs Per Year</h3>
          <div className="space-y-2">
            {yearData.map(d => (
              <div key={d.year} className="flex items-center gap-3">
                <div className="w-12 text-sm text-cream/50 font-mono text-right">{d.year}</div>
                <div className="flex-1 h-6 bg-cream/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-purple-500/40 rounded-full transition-all"
                    style={{ width: `${(d.gigs / maxGigs) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs text-cream/70">
                    {d.gigs} gigs · {d.cities} cities · {d.venues} venues
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topCities.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Top Cities</h3>
          <div className="space-y-2">
            {topCities.map(c => (
              <div key={c.city} className="flex items-center gap-3">
                <div className="w-24 text-sm text-cream/50 truncate">{c.city}</div>
                <div className="flex-1 h-5 bg-cream/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-blue-500/40 rounded-full"
                    style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs text-cream/70">
                    {c.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topVenues.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Top Venues</h3>
          <div className="space-y-2">
            {topVenues.map(v => (
              <div key={v.venue} className="flex items-center gap-3">
                <div className="w-32 text-sm text-cream/50 truncate">{v.venue}</div>
                <div className="text-xs text-cream/30 w-16">{v.city}</div>
                <div className="flex-1 h-5 bg-cream/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-green-500/40 rounded-full"
                    style={{ width: `${(v.count / maxVenueCount) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs text-cream/70">
                    {v.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="p-4 rounded-xl bg-cream/5 border border-cream/10 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-cream/40" />
      <div className="text-2xl font-bold text-cream">{value}</div>
      <div className="text-xs text-cream/50 mt-0.5">{label}</div>
    </div>
  );
}

function PressSection({ artist }: { artist: Artist }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-cream/50" /> Press & Media
      </h3>
      <p className="text-cream/50">
        Press mentions, reviews, and interviews for {artist.name}.
        This section is populated from the artist_press table.
      </p>
      <div className="flex flex-wrap gap-2">
        {["Reviews", "Interviews", "Premieres", "Features"].map(tag => (
          <Badge key={tag} variant="outline" className="border-cream/20 text-cream/50">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function EPKSection({ artist, stats, facts, appearances }: any) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadEPK = async () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-cream/5 border border-cream/10">
        {artist.photo_url && (
          <img src={artist.photo_url} alt={artist.name} className="w-32 h-32 rounded-xl object-cover" />
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{artist.name}</h2>
          <p className="text-cream/60 mt-1">{artist.genres.join(" · ")} · {artist.based_city}</p>
          <p className="text-cream/50 mt-2 text-sm">{artist.bio?.slice(0, 200)}...</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-cream/50">
            <span>{stats.total_gigs}+ gigs</span>
            <span>·</span>
            <span>{stats.total_cities} cities</span>
            <span>·</span>
            <span>{stats.years_active} years active</span>
          </div>
        </div>
      </div>

      {facts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Quick Facts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {facts.slice(0, 6).map((fact: CoolFact, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-cream/5 border border-cream/10">
                <div className="text-xl">{fact.icon}</div>
                <div className="text-xs text-cream/50 mt-1">{fact.label}</div>
                <div className="font-bold text-cream">{fact.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold mb-3">Contact</h3>
        <div className="space-y-2">
          {artist.booking_email && (
            <a href={`mailto:${artist.booking_email}`} className="flex items-center gap-2 text-cream/70 hover:text-cream">
              <Mail className="w-4 h-4" /> {artist.booking_email}
            </a>
          )}
          {artist.manager_email && (
            <a href={`mailto:${artist.manager_email}`} className="flex items-center gap-2 text-cream/70 hover:text-cream">
              <Mail className="w-4 h-4" /> {artist.manager_email} (Management)
            </a>
          )}
          {artist.website && (
            <a href={artist.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-cream/70 hover:text-cream">
              <Globe className="w-4 h-4" /> {artist.website}
            </a>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Social</h3>
        <div className="flex flex-wrap gap-2">
          {artist.instagram && (
            <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
              <Badge variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                <Instagram className="w-3 h-3 mr-1" /> Instagram
              </Badge>
            </a>
          )}
          {artist.soundcloud && (
            <a href={artist.soundcloud} target="_blank" rel="noreferrer">
              <Badge variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                <Headphones className="w-3 h-3 mr-1" /> SoundCloud
              </Badge>
            </a>
          )}
          {artist.spotify && (
            <a href={artist.spotify} target="_blank" rel="noreferrer">
              <Badge variant="outline" className="border-cream/20 text-cream/70 hover:bg-cream/10">
                <Music className="w-3 h-3 mr-1" /> Spotify
              </Badge>
            </a>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Technical</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-cream/5 border border-cream/10">
            <div className="text-cream/50">Available for</div>
            <div className="text-cream">{artist.available_cities.length > 0 ? artist.available_cities.join(", ") : "All cities"}</div>
          </div>
          <div className="p-3 rounded-lg bg-cream/5 border border-cream/10">
            <div className="text-cream/50">Fee Range</div>
            <div className="text-cream">
              {artist.fee_min_inr && artist.fee_max_inr
                ? `₹${artist.fee_min_inr.toLocaleString()} - ₹${artist.fee_max_inr.toLocaleString()}`
                : "Contact for rates"
              }
            </div>
          </div>
          <div className="p-3 rounded-lg bg-cream/5 border border-cream/10">
            <div className="text-cream/50">Status</div>
            <div className="text-cream">{artist.open_to_bookings ? "Open for bookings" : "Not taking bookings"}</div>
          </div>
          <div className="p-3 rounded-lg bg-cream/5 border border-cream/10">
            <div className="text-cream/50">Genres</div>
            <div className="text-cream">{artist.genres.join(", ")}</div>
          </div>
        </div>
      </section>

      <Button onClick={handleDownloadEPK} disabled={downloading} className="w-full bg-purple-600 hover:bg-purple-700">
        {downloading ? "Generating..." : "Download EPK PDF"}
      </Button>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MapPin, Calendar, Music, Share2, Copy, Check, ExternalLink, Instagram,
  Globe, Mail, Headphones, ChevronDown, ChevronUp, Users, ArrowLeft,
  Ticket, Star, Play, TrendingUp, Route, Building2, Award, Radio,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Marquee from "@/components/Marquee";
import { useToast } from "@/hooks/use-toast";
import ArtistAudioEmbed from "@/components/ArtistAudioEmbed";
import ArtistGigChart from "@/components/ArtistGigChart";
import ArtistConnectionGraph from "@/components/ArtistConnectionGraph";

interface Artist {
  id: string; slug: string; name: string;
  based_city?: string; from_city?: string;
  bio?: string; genres: string[];
  photo_url?: string; instagram?: string; soundcloud?: string;
  spotify?: string; website?: string; booking_email?: string;
  manager_email?: string; featured: boolean; claimed_by?: string;
  open_to_bookings: boolean; fee_min_inr?: number; fee_max_inr?: number;
  available_cities: string[]; labels?: string;
  videos?: any[]; gallery?: any[];
}
interface Connection {
  artist_a_slug: string; artist_b_slug: string;
  connection_type: string; strength: number;
  shared_events: string[]; shared_venues: string[];
  notes?: string;
}
interface Appearance {
  event_name: string; venue?: string; city?: string;
  event_date?: string; year?: number; role: string;
}
interface Milestone {
  type: string; title: string; description?: string;
  year?: number; date: string; city?: string; venue?: string;
  is_featured?: boolean; related_artist_slug?: string; related_artist_name?: string;
}
interface SocialStats {
  instagram_followers?: number; soundcloud_followers?: number; spotify_monthly_listeners?: number;
}
interface ArtistStats {
  total_gigs: number; total_cities: number; total_venues: number;
  total_connections: number; years_active: number; b2b_count: number; festival_count: number;
}
interface CoolFact { icon: string; label: string; value: string; detail: string; }

const TABS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "gigography", label: "GIGS" },
  { id: "connections", label: "CONNECTIONS" },
  { id: "journey", label: "JOURNEY" },
  { id: "stats", label: "STATS" },
  { id: "epk", label: "EPK" },
];

const milestoneIcons: Record<string, any> = {
  first_gig: Play, festival_debut: Star, label_signing: Award,
  release: Music, milestone_followers: TrendingUp, tour: Route,
  b2b: Users, residency: Building2, award: Award, radio_show: Radio,
};

const ROLE_COLOURS: Record<string, string> = {
  headliner: "bg-acid-yellow text-ink",
  performer: "bg-electric-blue text-cream",
  b2b: "bg-magenta text-cream",
  support: "bg-ink text-cream",
};
const roleTag = (role: string) =>
  `px-2 py-0.5 border-2 border-ink font-display text-xs ${ROLE_COLOURS[role] ?? "bg-ink text-cream"}`;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function ArtistDetailPage() {
  const router = useRouter();
  const slug = (router.query?.slug as string) || "";
  const { toast } = useToast();

  const [data, setData] = useState<{
    artist: Artist | null; connections: Connection[]; appearances: Appearance[];
    milestones: Milestone[]; socialStats: SocialStats | null;
    stats: ArtistStats; facts: CoolFact[];
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [copied, setCopied] = useState(false);

  const emptyStats: ArtistStats = { total_gigs: 0, total_cities: 0, total_venues: 0, total_connections: 0, years_active: 0, b2b_count: 0, festival_count: 0 };

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true); setFetchError(null); setUsedFallback(false);

    fetch(`/api/artists/${slug}/full`)
      .then(async (r) => {
        if (!r.ok) {
          setUsedFallback(true);
          const b = await fetch(`/api/artists/${slug}/basic`);
          if (!b.ok) throw new Error(`Artist not found (${b.status})`);
          const bd = await b.json();
          setData({ artist: bd.artist, connections: [], appearances: bd.appearances || [], milestones: [], socialStats: null, stats: bd.stats || emptyStats, facts: [] });
          return;
        }
        const d = await r.json();
        setData({ artist: d.artist, connections: d.connections || [], appearances: d.appearances || [], milestones: d.milestones || [], socialStats: d.socialStats || null, stats: d.stats || emptyStats, facts: d.facts || [] });
      })
      .catch((e) => { setFetchError(e.message || "Failed to load artist"); })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleShare = async () => {
    if (!data?.artist) return;
    const url = `${window.location.origin}/artists/${slug}`;
    if (navigator.share) { await navigator.share({ title: data.artist.name, url }); }
    else { await navigator.clipboard.writeText(url); toast({ title: "Link copied!" }); }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  };

  if (isLoading) return (
    <main className="bg-cream min-h-screen">
      <Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink animate-pulse">LOADING…</p>
      </div>
      <Footer />
    </main>
  );

  if (fetchError || !data?.artist) return (
    <main className="bg-cream min-h-screen">
      <Nav />
      <div className="container py-24">
        <div className="border-4 border-ink bg-magenta chunk-shadow p-8 inline-block max-w-md">
          <p className="font-display text-2xl text-cream mb-3">{fetchError || "ARTIST NOT FOUND"}</p>
          <Link href="/artists" className="inline-flex items-center gap-2 bg-cream text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
            <ArrowLeft className="w-4 h-4" /> BACK TO ARTISTS
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );

  const { artist, connections, appearances, milestones, socialStats, stats, facts } = data;
  const years = [...new Set(appearances.map((a) => a.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const filteredAppearances = selectedYear === "all" ? appearances : appearances.filter((a) => a.year === parseInt(selectedYear));

  return (
    <main className="bg-background text-foreground">
      <SEO
        title={`${artist.name} — Cats Can Dance Artist`}
        description={artist.bio?.slice(0, 155) || `${artist.name} on Cats Can Dance — ${artist.genres?.join(", ")}`}
        path={`/artists/${slug}`}
      />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative border-b-4 border-ink pt-28 md:pt-36 pb-0 overflow-hidden bg-ink">
        {/* blurred bg photo */}
        {artist.photo_url && (
          <div className="absolute inset-0">
            <img src={artist.photo_url} alt="" className="w-full h-full object-cover opacity-20 blur-md scale-110" />
          </div>
        )}
        <div className="relative container pb-0">
          <div className="flex flex-col md:flex-row gap-6 items-end pb-0">
            {/* Photo */}
            <div className="shrink-0">
              <div className="w-36 h-36 md:w-48 md:h-48 border-4 border-cream overflow-hidden chunk-shadow bg-acid-yellow">
                {artist.photo_url ? (
                  <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-ink/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pb-6">
              {artist.featured && (
                <span className="inline-block bg-acid-yellow text-ink font-display text-xs px-3 py-1 border-2 border-cream mb-2">
                  ✦ FEATURED
                </span>
              )}
              {artist.claimed_by && (
                <span className="inline-block ml-2 bg-lime text-ink font-display text-xs px-3 py-1 border-2 border-cream mb-2">
                  ✓ VERIFIED
                </span>
              )}
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-cream leading-[0.9]">
                {artist.name.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-cream/70 text-sm">
                {artist.based_city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{artist.based_city}</span>
                )}
                {stats.years_active > 0 && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{stats.years_active} yrs active</span>
                )}
                {stats.total_gigs > 0 && (
                  <span>{stats.total_gigs} gigs</span>
                )}
              </div>

              {/* Genre tags */}
              {artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {artist.genres.map((g) => (
                    <span key={g} className="bg-acid-yellow text-ink font-display text-xs px-2 py-1 border-2 border-cream">
                      {g.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="flex flex-wrap gap-2 mt-4">
                {artist.instagram && (
                  <a href={`https://instagram.com/${artist.instagram.replace("@", "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-cream text-ink font-display text-xs px-3 py-2 border-2 border-cream hover:bg-acid-yellow transition-colors">
                    <Instagram className="w-3.5 h-3.5" /> IG
                  </a>
                )}
                {artist.soundcloud && (
                  <a href={artist.soundcloud} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-cream text-ink font-display text-xs px-3 py-2 border-2 border-cream hover:bg-acid-yellow transition-colors">
                    <Headphones className="w-3.5 h-3.5" /> SC
                  </a>
                )}
                {artist.spotify && (
                  <a href={artist.spotify} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-cream text-ink font-display text-xs px-3 py-2 border-2 border-cream hover:bg-acid-yellow transition-colors">
                    <Music className="w-3.5 h-3.5" /> SPOTIFY
                  </a>
                )}
                {artist.website && (
                  <a href={artist.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-cream text-ink font-display text-xs px-3 py-2 border-2 border-cream hover:bg-acid-yellow transition-colors">
                    <Globe className="w-3.5 h-3.5" /> WEB
                  </a>
                )}
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 bg-transparent text-cream font-display text-xs px-3 py-2 border-2 border-cream/40 hover:border-cream hover:bg-cream/10 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> SHARE
                </button>
                <button onClick={() => handleCopy(`${typeof window !== "undefined" ? window.location.origin : ""}/artists/${slug}`)}
                  className="flex items-center gap-1.5 bg-transparent text-cream font-display text-xs px-3 py-2 border-2 border-cream/40 hover:border-cream hover:bg-cream/10 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "COPIED" : "COPY LINK"}
                </button>
              </div>

              {/* Book button */}
              {artist.open_to_bookings && artist.booking_email && (
                <div className="mt-4">
                  <a href={`mailto:${artist.booking_email}?subject=Booking enquiry — ${artist.name}`}
                    className="inline-flex items-center gap-2 bg-magenta text-cream font-display px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
                    <Mail className="w-4 h-4" /> BOOK ARTIST →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tab nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-cream border-b-4 border-ink">
        <div className="container">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const hasData =
                tab.id === "overview" ? true :
                tab.id === "gigography" ? appearances.length > 0 :
                tab.id === "connections" ? connections.length > 0 :
                tab.id === "journey" ? milestones.length > 0 :
                tab.id === "stats" ? stats.total_gigs > 0 : true;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-display text-xs px-4 py-3 border-r-4 border-ink whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                  } ${!hasData ? "opacity-40" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="bg-cream bg-grain border-b-4 border-ink">
        <div className="container py-10 md:py-14">

          {usedFallback && (
            <div className="border-4 border-ink bg-orange chunk-shadow p-4 mb-6 inline-block">
              <p className="font-display text-sm text-ink">⚠ LIMITED DATA — some sections may be empty</p>
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-10">
              {/* Bio */}
              {artist.bio && (
                <section>
                  <h2 className="font-display text-3xl text-ink mb-4">ABOUT</h2>
                  <div className="border-4 border-ink bg-cream chunk-shadow p-6 max-w-3xl">
                    <p className={`text-ink/80 leading-relaxed text-lg ${expandedBio ? "" : "line-clamp-4"}`}>
                      {artist.bio}
                    </p>
                    {artist.bio.length > 300 && (
                      <button onClick={() => setExpandedBio(!expandedBio)}
                        className="mt-3 flex items-center gap-1 font-display text-sm text-ink hover:text-magenta transition-colors">
                        {expandedBio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedBio ? "READ LESS" : "READ MORE"}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Audio embeds */}
              <section className="max-w-xl">
                <ArtistAudioEmbed
                  soundcloud={artist.soundcloud}
                  spotify={artist.spotify}
                  artistName={artist.name}
                />
              </section>

              {/* Cool Facts */}
              {facts.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl text-ink mb-4">QUICK FACTS</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {facts.map((fact, i) => (
                      <div key={i} className="border-4 border-ink chunk-shadow p-4 bg-cream">
                        <div className="text-2xl mb-1">{fact.icon}</div>
                        <p className="font-display text-xs text-ink/50 mb-0.5">{fact.label.toUpperCase()}</p>
                        <p className="font-display text-2xl text-ink">{fact.value}</p>
                        <p className="text-xs text-ink/50 mt-0.5">{fact.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent gigs */}
              {appearances.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl text-ink mb-4">RECENT GIGS</h2>
                  <div className="space-y-2 max-w-2xl">
                    {appearances.slice(0, 6).map((gig, i) => (
                      <div key={i} className="border-4 border-ink bg-cream chunk-shadow p-4 flex items-center gap-4">
                        <div className="w-12 text-right shrink-0">
                          <p className="font-display text-sm text-ink">{gig.year || "?"}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-ink truncate">{gig.event_name}</p>
                          <p className="text-xs text-ink/50">
                            {[gig.venue, gig.city].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className={roleTag(gig.role)}>{gig.role.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  {appearances.length > 6 && (
                    <button onClick={() => setActiveTab("gigography")}
                      className="mt-4 font-display text-sm text-ink underline hover:text-magenta transition-colors">
                      VIEW ALL {appearances.length} GIGS →
                    </button>
                  )}
                </section>
              )}

              {/* Connections preview */}
              {connections.length > 0 && (
                <section>
                  <h2 className="font-display text-3xl text-ink mb-4">CONNECTIONS</h2>
                  <div className="flex flex-wrap gap-2">
                    {connections.slice(0, 8).map((conn, i) => {
                      const partner = conn.artist_a_slug === artist.slug ? conn.artist_b_slug : conn.artist_a_slug;
                      return (
                        <Link key={i} href={`/artists/${partner}`}
                          className="border-4 border-ink bg-cream chunk-shadow px-4 py-2 font-display text-sm text-ink hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                          {partner.replace(/-/g, " ").toUpperCase()}
                          <span className="ml-2 font-sans text-xs text-ink/50 normal-case">{conn.connection_type}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* GIGOGRAPHY */}
          {activeTab === "gigography" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-3xl text-ink">GIGOGRAPHY</h2>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border-4 border-ink bg-cream font-display text-sm text-ink px-3 py-2 focus:outline-none"
                >
                  <option value="all">ALL YEARS</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <p className="font-display text-sm text-ink/50">{filteredAppearances.length} GIGS</p>
              </div>

              {appearances.length === 0 ? (
                <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-6 inline-block">
                  <p className="font-display text-xl text-ink">NO GIG HISTORY YET.</p>
                </div>
              ) : (
                <div className="space-y-2 max-w-3xl">
                  {filteredAppearances.map((gig, i) => (
                    <div key={i} className="border-4 border-ink bg-cream chunk-shadow p-4 flex items-center gap-4">
                      <div className="w-14 text-right shrink-0">
                        <p className="font-display text-sm text-ink">{gig.year || "?"}</p>
                        {gig.event_date && (
                          <p className="text-xs text-ink/40 font-mono">
                            {new Date(gig.event_date).toLocaleDateString("en-IN", { month: "short" })}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-ink truncate">{gig.event_name}</p>
                        <p className="text-xs text-ink/50">{[gig.venue, gig.city].filter(Boolean).join(" · ")}</p>
                      </div>
                      <span className={roleTag(gig.role)}>{gig.role.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONNECTIONS */}
          {activeTab === "connections" && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl text-ink">CONNECTIONS</h2>
              <ArtistConnectionGraph slug={artist.slug} connections={connections} />
            </div>
          )}

          {/* JOURNEY */}
          {activeTab === "journey" && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl text-ink">JOURNEY</h2>
              {milestones.length === 0 ? (
                <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-6 inline-block">
                  <p className="font-display text-xl text-ink">NO MILESTONES RECORDED YET.</p>
                </div>
              ) : (
                <div className="relative pl-8 border-l-4 border-ink space-y-6 max-w-2xl">
                  {milestones.map((m, i) => {
                    const Icon = milestoneIcons[m.type] || Star;
                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-[2.15rem] w-8 h-8 border-4 border-ink bg-acid-yellow flex items-center justify-center">
                          <Icon className="w-4 h-4 text-ink" />
                        </div>
                        <div className="border-4 border-ink bg-cream chunk-shadow p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-display text-lg text-ink">{m.title.toUpperCase()}</p>
                            {m.is_featured && (
                              <span className="bg-acid-yellow text-ink font-display text-xs px-2 py-0.5 border-2 border-ink shrink-0">★ FEATURED</span>
                            )}
                          </div>
                          {m.description && <p className="text-sm text-ink/70 mb-2">{m.description}</p>}
                          <div className="flex flex-wrap gap-2 text-xs font-display text-ink/50">
                            <span>{m.year || m.date.split("-")[0]}</span>
                            {m.city && <span>· {m.city.toUpperCase()}</span>}
                            {m.related_artist_slug && (
                              <Link href={`/artists/${m.related_artist_slug}`} className="text-magenta hover:underline">
                                · {(m.related_artist_name || m.related_artist_slug).toUpperCase()}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <div className="space-y-8">
              <h2 className="font-display text-3xl text-ink">STATS</h2>
              {stats.total_gigs === 0 ? (
                <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-6 inline-block">
                  <p className="font-display text-xl text-ink">NO GIG DATA AVAILABLE.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "GIGS", value: stats.total_gigs },
                      { label: "CITIES", value: stats.total_cities },
                      { label: "VENUES", value: stats.total_venues },
                      { label: "CONNECTIONS", value: stats.total_connections },
                      ...(socialStats?.instagram_followers ? [{ label: "IG FOLLOWERS", value: fmt(socialStats.instagram_followers) }] : []),
                      ...(socialStats?.soundcloud_followers ? [{ label: "SC FOLLOWERS", value: fmt(socialStats.soundcloud_followers) }] : []),
                      ...(socialStats?.spotify_monthly_listeners ? [{ label: "SPOTIFY MONTHLY", value: fmt(socialStats.spotify_monthly_listeners) }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="border-4 border-ink bg-cream chunk-shadow p-5 text-center">
                        <p className="font-display text-4xl text-ink">{value}</p>
                        <p className="font-display text-xs text-ink/50 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Gig history chart */}
                  <div className="max-w-2xl">
                    <ArtistGigChart appearances={appearances} />
                  </div>

                  {/* Top cities */}
                  {(() => {
                    const counts = appearances.reduce((acc: Record<string, number>, a) => { if (a.city) acc[a.city] = (acc[a.city] || 0) + 1; return acc; }, {});
                    const top = Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 6);
                    const max = top[0]?.[1] || 1;
                    return top.length > 0 ? (
                      <div>
                        <h3 className="font-display text-xl text-ink mb-3">TOP CITIES</h3>
                        <div className="space-y-2 max-w-lg">
                          {top.map(([city, count]) => (
                            <div key={city} className="flex items-center gap-3">
                              <span className="font-display text-sm text-ink w-28 shrink-0 truncate">{city.toUpperCase()}</span>
                              <div className="flex-1 h-6 border-4 border-ink bg-cream overflow-hidden">
                                <div className="h-full bg-ink transition-all" style={{ width: `${(count / max) * 100}%` }} />
                              </div>
                              <span className="font-display text-sm text-ink w-6 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          )}

          {/* EPK */}
          {activeTab === "epk" && (
            <div className="space-y-8 max-w-3xl">
              <h2 className="font-display text-3xl text-ink">ELECTRONIC PRESS KIT</h2>

              {/* Header card */}
              <div className="border-4 border-ink bg-cream chunk-shadow p-6 flex gap-5">
                {artist.photo_url && (
                  <img src={artist.photo_url} alt={artist.name} className="w-24 h-24 object-cover border-4 border-ink shrink-0" />
                )}
                <div>
                  <p className="font-display text-3xl text-ink">{artist.name.toUpperCase()}</p>
                  <p className="font-display text-sm text-ink/50 mt-1">
                    {[artist.genres.join(" · "), artist.based_city].filter(Boolean).join(" — ")}
                  </p>
                  {artist.bio && <p className="text-sm text-ink/70 mt-2 line-clamp-3">{artist.bio}</p>}
                  <div className="flex flex-wrap gap-3 mt-3 font-display text-xs text-ink/50">
                    {stats.total_gigs > 0 && <span>{stats.total_gigs}+ GIGS</span>}
                    {stats.total_cities > 0 && <span>{stats.total_cities} CITIES</span>}
                    {stats.years_active > 0 && <span>{stats.years_active} YRS ACTIVE</span>}
                  </div>
                </div>
              </div>

              {/* Booking */}
              <div className="border-4 border-ink bg-orange chunk-shadow p-5">
                <p className="font-display text-lg text-ink mb-3">BOOKING & CONTACT</p>
                <div className="space-y-2">
                  {artist.booking_email && (
                    <a href={`mailto:${artist.booking_email}`} className="flex items-center gap-2 text-ink hover:text-magenta font-display text-sm transition-colors">
                      <Mail className="w-4 h-4" /> {artist.booking_email}
                    </a>
                  )}
                  {artist.manager_email && (
                    <a href={`mailto:${artist.manager_email}`} className="flex items-center gap-2 text-ink hover:text-magenta font-display text-sm transition-colors">
                      <Mail className="w-4 h-4" /> {artist.manager_email} <span className="text-ink/50 font-sans">(management)</span>
                    </a>
                  )}
                  {artist.website && (
                    <a href={artist.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:text-magenta font-display text-sm transition-colors">
                      <Globe className="w-4 h-4" /> {artist.website}
                    </a>
                  )}
                </div>
              </div>

              {/* Fee */}
              {(artist.fee_min_inr || artist.fee_max_inr) && (
                <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-5">
                  <p className="font-display text-lg text-ink mb-1">FEE RANGE</p>
                  <p className="font-display text-3xl text-ink">
                    {artist.fee_min_inr && artist.fee_max_inr
                      ? `₹${artist.fee_min_inr.toLocaleString("en-IN")} – ₹${artist.fee_max_inr.toLocaleString("en-IN")}`
                      : "Contact for rates"}
                  </p>
                </div>
              )}

              {/* Availability */}
              <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                <p className="font-display text-lg text-ink mb-2">AVAILABILITY</p>
                <p className="font-display text-sm text-ink">{artist.open_to_bookings ? "✓ OPEN FOR BOOKINGS" : "✗ NOT TAKING BOOKINGS"}</p>
                {artist.available_cities.length > 0 && (
                  <p className="text-sm text-ink/60 mt-1">Available in: {artist.available_cities.join(", ")}</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <Marquee bg="bg-ink" />
      <Footer />
    </main>
  );
}

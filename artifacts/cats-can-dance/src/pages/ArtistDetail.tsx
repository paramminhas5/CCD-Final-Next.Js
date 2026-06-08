/**
 * ArtistDetail — magazine-style artist profile.
 *
 * Layout:
 *   1. Cover hero       — full-bleed, editorial. Sticky BOOK CTA.
 *   2. Sticky tab nav   — HOME / GIGS / CONNECTIONS / JOURNEY / STATS / EPK / BOOK
 *   3. HOME             — snapshot of every other tab. Bio + audio dominant,
 *                         then a contact-sheet grid linking into the deep tabs.
 *   4. GIGS             — full gigography with year filter
 *   5. CONNECTIONS      — connection graph
 *   6. JOURNEY          — timeline of milestones
 *   7. STATS            — counters + chart + top cities
 *   8. EPK              — press kit
 *   9. BOOK             — inline booking inquiry form + calendar
 *                         (artist controls open/closed via Artist Portal)
 *
 * Booking auto-availability: artist_dates with status = "confirmed" or
 * "tentative" mark days busy on the calendar. status = "available" marks
 * open slots. Form is gated by `open_to_bookings`.
 */
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin, Calendar, Music, Share2, Copy, Check, ExternalLink, Instagram,
  Globe, Mail, Headphones, ChevronDown, ChevronUp, Users, ArrowLeft,
  Ticket, Star, Play, TrendingUp, Route, Building2, Award, Radio,
  Send,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Marquee from "@/components/Marquee";
import { useToast } from "@/hooks/use-toast";
import ArtistAudioEmbed from "@/components/ArtistAudioEmbed";
import ArtistGigChart from "@/components/ArtistGigChart";
import ArtistConnectionGraph from "@/components/ArtistConnectionGraph";
import SimilarArtists from "@/components/SimilarArtists";
import FollowButton from "@/components/FollowButton";
import BookingForm from "@/components/booking/BookingForm";
import { useArtistFollowerCount } from "@/hooks/useSocialProof";

// ───────────────────────── Types ─────────────────────────
interface Artist {
  id: string; slug: string; name: string;
  based_city?: string; from_city?: string;
  bio?: string; genres: string[];
  photo_url?: string; instagram?: string; soundcloud?: string;
  spotify?: string; bandcamp?: string; website?: string; booking_email?: string;
  manager_email?: string; featured: boolean; claimed_by?: string;
  open_to_bookings: boolean; fee_min_inr?: number; fee_max_inr?: number;
  available_cities: string[]; labels?: string;
  videos?: any[]; gallery?: any[];
}
interface Connection {
  artist_a_slug: string; artist_b_slug: string;
  connection_type: string; strength: number;
  shared_events: string[]; shared_venues: string[]; notes?: string;
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
interface ArtistDate {
  id: string; city: string; venue?: string | null; event_date: string;
  status: "confirmed" | "tentative" | "available"; ticket_url?: string | null;
}
interface Discography {
  id: string; title: string; release_type: string; release_date?: string | null;
  year?: number | null; label?: string | null; artwork_url?: string | null;
  spotify_url?: string | null; soundcloud_url?: string | null;
  bandcamp_url?: string | null; description?: string | null;
}
interface PressItem {
  id: string; title: string; publication: string; author?: string | null;
  excerpt?: string | null; url?: string | null; type: string;
  date_published?: string | null; is_featured: boolean; quote_for_epk?: string | null;
}

const TABS = [
  { id: "home",        label: "HOME" },
  { id: "gigography",  label: "GIGS" },
  { id: "connections", label: "CONNECTIONS" },
  { id: "journey",     label: "JOURNEY" },
  { id: "stats",       label: "STATS" },
  { id: "epk",         label: "EPK" },
  { id: "book",        label: "BOOK" },
] as const;
type TabId = typeof TABS[number]["id"];

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

const formatDateLine = (iso?: string): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
};

// ───────────────────────── Availability Calendar ─────────────────────────
// 6-month strip showing days as marked busy / tentative / available based on
// the artist's saved dates. Auto-updates as artist edits their calendar from
// the portal.

// ───────────────────────── Availability Strip (v2) ───────────────────────────
// Reads from /api/artist-calendar which merges availability_blocks + artist_dates
// into a single day-status map. Falls back to the old upcomingDates prop if the
// API is unavailable (backward compat).

type DayStatus = "busy" | "tentative" | "available" | "open";

interface CalendarAPIResponse {
  days: Record<string, DayStatus>;
  blocks: any[];
  gigs: any[];
  open_to_bookings: boolean;
  available_cities: string[];
}

const STATUS_DISPLAY: Record<DayStatus, { bg: string; text: string; border: string; label: string }> = {
  busy:      { bg: "bg-magenta",         text: "text-cream",   border: "border-ink",    label: "Busy" },
  tentative: { bg: "bg-electric-blue",   text: "text-cream",   border: "border-ink",    label: "Tour leg" },
  available: { bg: "bg-lime",            text: "text-ink",     border: "border-ink",    label: "Open slot" },
  open:      { bg: "bg-cream",           text: "text-ink/50",  border: "border-ink/10", label: "Open" },
};

function AvailabilityStrip({
  artistSlug,
  dates: fallbackDates,
}: {
  artistSlug: string;
  dates: ArtistDate[];
}) {
  const [calData, setCalData] = useState<CalendarAPIResponse | null>(null);
  const [calLoading, setCalLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const toDate = new Date(today.getFullYear(), today.getMonth() + 6, 0);
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`;

    fetch(`/api/artist-calendar?slug=${encodeURIComponent(artistSlug)}&from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setCalData(data))
      .catch(() => setCalData(null))
      .finally(() => setCalLoading(false));
  }, [artistSlug]);

  // Merge: API data wins, fallback to old artist_dates prop
  const byDay = useMemo<Record<string, DayStatus>>(() => {
    if (calData?.days) return calData.days;
    // Legacy fallback from upcomingDates
    const m: Record<string, DayStatus> = {};
    for (const d of fallbackDates) {
      const key = d.event_date.slice(0, 10);
      const mapped: DayStatus =
        d.status === "confirmed" ? "busy" :
        d.status === "tentative" ? "tentative" :
        "available";
      if (!m[key] || mapped === "busy") m[key] = mapped;
    }
    return m;
  }, [calData, fallbackDates]);

  // Build 6-month grid
  const months = useMemo(() => {
    const out: { label: string; year: number; month: number; days: { day: number; iso: string }[] }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const days: { day: number; iso: string }[] = [];
      for (let dd = 1; dd <= lastDay; dd++) {
        const cell = new Date(d.getFullYear(), d.getMonth(), dd);
        const iso = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        if (cell >= today) days.push({ day: dd, iso });
      }
      out.push({ label: monthName, year: d.getFullYear(), month: d.getMonth(), days });
    }
    return out;
  }, []);

  const hasAnyData = Object.keys(byDay).length > 0 || fallbackDates.length > 0;
  if (!calLoading && !hasAnyData) return null;

  // Blocks summary (from API)
  const upcomingBlocks = (calData?.blocks ?? [])
    .filter((b: any) => b.end_date >= new Date().toISOString().split("T")[0])
    .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="border-4 border-ink bg-cream p-5">
        {/* Header + legend */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="font-display text-sm uppercase text-ink">Next 6 Months</p>
            {calData?.available_cities && calData.available_cities.length > 0 && (
              <p className="text-xs text-ink/50 mt-0.5">
                Available in: {calData.available_cities.slice(0, 4).join(" · ")}
                {calData.available_cities.length > 4 ? ` +${calData.available_cities.length - 4}` : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] font-display uppercase">
            {(["available", "tentative", "busy"] as DayStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 border-2 border-ink inline-block ${STATUS_DISPLAY[s].bg}`} />
                {STATUS_DISPLAY[s].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-ink/15 bg-cream inline-block" /> Open
            </span>
          </div>
        </div>

        {calLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-ink/5 animate-pulse border-2 border-ink/10" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map(m => (
              <div key={`${m.year}-${m.month}`} className="border-2 border-ink/20 p-3">
                <p className="font-display text-xs uppercase text-ink/70 mb-2">{m.label}</p>
                <div className="grid grid-cols-7 gap-0.5">
                  {m.days.map(({ day, iso }) => {
                    const status: DayStatus = byDay[iso] ?? "open";
                    const s = STATUS_DISPLAY[status];
                    return (
                      <span
                        key={iso}
                        title={`${iso} — ${s.label}`}
                        className={`text-[10px] font-display flex items-center justify-center w-full aspect-square border ${s.bg} ${s.text} ${s.border}`}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tour legs / blocks summary — only shown if the API returned structured blocks */}
      {upcomingBlocks.length > 0 && (
        <div className="space-y-2">
          <p className="font-display text-xs uppercase text-ink/50 tracking-widest">Upcoming Activity</p>
          {upcomingBlocks.map((b: any) => {
            const kindMeta: Record<string, { bg: string; text: string; label: string }> = {
              tour_leg:    { bg: "bg-electric-blue", text: "text-cream", label: "Tour leg" },
              unavailable: { bg: "bg-magenta",       text: "text-cream", label: "Unavailable" },
              available:   { bg: "bg-lime",           text: "text-ink",  label: "Open slot" },
            };
            const meta = kindMeta[b.kind] ?? kindMeta.available;
            return (
              <div key={b.id} className="flex items-center gap-3 border-2 border-ink/20 bg-cream p-3">
                <span className={`shrink-0 font-display text-[10px] uppercase px-2 py-0.5 border border-ink ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
                <span className="font-display text-xs text-ink/70 uppercase">
                  {b.start_date === b.end_date ? b.start_date : `${b.start_date} → ${b.end_date}`}
                </span>
                {(b.label || (b.cities ?? []).length > 0) && (
                  <span className="text-xs text-ink/50 truncate">
                    {[b.label, (b.cities ?? []).slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Main page ─────────────────────────

interface ArtistDetailProps {
  /** Minimal artist shape pre-fetched by getStaticProps (SSR/ISR). */
  initialArtist?: {
    id: string; slug: string; name: string;
    bio?: string; based_city?: string; genres: string[];
    photo_url?: string; instagram?: string; soundcloud?: string;
    spotify?: string; open_to_bookings?: boolean; claimed_by?: string; featured?: boolean;
  } | null;
  /** Slug from getStaticProps — available before router.query hydrates. */
  slug?: string;
  /**
   * Full pre-fetched profile from App Router server component.
   * When provided, skips ALL client-side fetches — data is already complete.
   * Passed by app/artists/[slug]/ArtistDetailClient.tsx.
   */
  initialProfile?: {
    artist: Artist; connections: Connection[]; appearances: Appearance[];
    milestones: Milestone[]; socialStats: SocialStats | null;
    stats: ArtistStats; facts: CoolFact[]; upcomingDates: ArtistDate[];
    discography: Discography[]; press: PressItem[]; socialHistory: any[];
  } | null;
}

export default function ArtistDetailPage({ initialArtist, slug: slugProp, initialProfile }: ArtistDetailProps = {}) {
  const router = useRouter();
  const slug = slugProp || (router.query?.slug as string) || "";
  const { toast } = useToast();

  // Seed the data state from SSR props so content renders on first paint.
  // The full enriched profile is fetched client-side below.
  const emptyStats: ArtistStats = { total_gigs: 0, total_cities: 0, total_venues: 0, total_connections: 0, years_active: 0, b2b_count: 0, festival_count: 0 };

  const [data, setData] = useState<{
    artist: Artist | null; connections: Connection[]; appearances: Appearance[];
    milestones: Milestone[]; socialStats: SocialStats | null;
    stats: ArtistStats; facts: CoolFact[]; upcomingDates: ArtistDate[];
    discography: Discography[]; press: PressItem[];
    socialHistory: any[];
  } | null>(
    // App Router: full profile pre-fetched server-side — use it directly, skip all fetches
    initialProfile
      ? initialProfile
      // Pages Router: minimal artist from getStaticProps — seed hero, fetch full profile client-side
      : initialArtist
        ? {
            artist: initialArtist as unknown as Artist,
            connections: [], appearances: [], milestones: [],
            socialStats: null, stats: emptyStats, facts: [],
            upcomingDates: [], discography: [], press: [], socialHistory: [],
          }
        : null
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  // Skip loading when full profile provided (App Router) or minimal artist (Pages Router ISR)
  const [isLoading, setIsLoading] = useState(!initialProfile && !initialArtist);
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [copied, setCopied] = useState(false);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const bookSectionRef = useRef<HTMLDivElement | null>(null);

  // ── Social proof hook — must be called unconditionally (Rules of Hooks) ──
  // Called here, before any early returns, using `slug` which is always available.
  const followerCount = useArtistFollowerCount(slug);

  useEffect(() => {
    if (!slug) return;
    // App Router: full profile was pre-fetched server-side — nothing to do here
    if (initialProfile) return;

    setIsLoading(true); setFetchError(null); setUsedFallback(false);

    fetch(`/api/artists/${slug}/full`)
      .then(async (r) => {
        if (!r.ok) {
          setUsedFallback(true);
          const b = await fetch(`/api/artists/${slug}/basic`);
          if (!b.ok) throw new Error(`Artist not found (${b.status})`);
          const bd = await b.json();
          setData({
            artist: bd.artist, connections: [], appearances: bd.appearances || [],
            milestones: [], socialStats: null, stats: bd.stats || emptyStats, facts: [],
            upcomingDates: bd.upcomingDates || [],
            discography: [], press: [], socialHistory: [],
          });
          return;
        }
        const d = await r.json();
        setData({
          artist: d.artist, connections: d.connections || [], appearances: d.appearances || [],
          milestones: d.milestones || [], socialStats: d.socialStats || null,
          stats: d.stats || emptyStats, facts: d.facts || [],
          upcomingDates: d.upcomingDates || [],
          discography: d.discography || [], press: d.press || [],
          socialHistory: d.socialHistory || [],
        });
      })
      .catch((e) => { setFetchError(e.message || "Failed to load artist"); })
      .finally(() => setIsLoading(false));
  }, [slug, initialProfile]);

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

  const goToTab = (id: TabId) => {
    setActiveTab(id);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  // ── Derive page-level data only when the full artist is available ──
  // All hooks are called above this point — early returns below do NOT violate Rules of Hooks.
  const artist = data?.artist ?? null;
  const connections   = data?.connections   ?? [];
  const appearances   = data?.appearances   ?? [];
  const milestones    = data?.milestones    ?? [];
  const socialStats   = data?.socialStats   ?? null;
  const stats         = data?.stats         ?? emptyStats;
  const facts         = data?.facts         ?? [];
  const upcomingDates = data?.upcomingDates ?? [];
  const discography   = data?.discography   ?? [];
  const press         = data?.press         ?? [];
  const socialHistory = data?.socialHistory ?? [];
  const years = [...new Set(appearances.map((a) => a.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
  const filteredAppearances = selectedYear === "all" ? appearances : appearances.filter((a) => a.year === parseInt(selectedYear));

  // Auto-availability flag: if the artist hasn't explicitly set
  // open_to_bookings = false and they have at least one upcoming
  // "available" date → considered actively booking. Either way the toggle in
  // their portal wins.
  const isBookable = artist ? artist.open_to_bookings !== false : false;
  const hasOpenSlot = upcomingDates.some(d => d.status === "available");

  // ── Loading / error gates — all hooks already called above, no Rules of Hooks violation ──
  if (isLoading) return (
    <main className="bg-cream min-h-screen">
      <Nav />
      <div className="container py-32 text-center">
        <p className="font-display text-4xl text-ink animate-pulse">LOADING…</p>
      </div>
      <Footer />
    </main>
  );

  if (fetchError || !artist) return (
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

  return (
    <main className="bg-background text-foreground">
      <SEO
        title={`${artist.name} — Cats Can Dance Artist`}
        description={artist.bio?.slice(0, 155) || `${artist.name} on Cats Can Dance — ${artist.genres?.join(", ")}`}
        path={`/artists/${slug}`}
      />
      <Nav />

      {/* ─── COVER HERO (magazine cover) ───────────────────────────── */}
      <section className="relative border-b-4 border-ink pt-28 md:pt-36 pb-0 overflow-hidden bg-ink">
        {artist.photo_url && (
          <div className="absolute inset-0">
            <img src={artist.photo_url} alt="" className="w-full h-full object-cover opacity-25 blur-md scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          </div>
        )}
        <div className="relative container pb-0">
          {/* Issue line */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display text-acid-yellow text-xs uppercase tracking-[0.3em]">/ CCD ARTIST PROFILE</span>
            <span className="font-display text-cream/40 text-xs uppercase tracking-widest">No. {artist.id?.slice(0, 4) ?? "—"}</span>
          </div>

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
              <div className="flex flex-wrap gap-2 mb-2">
                {artist.featured && (
                  <span className="inline-block bg-acid-yellow text-ink font-display text-xs px-3 py-1 border-2 border-cream">
                    ✦ FEATURED
                  </span>
                )}
                {artist.claimed_by && (
                  <span className="inline-block bg-lime text-ink font-display text-xs px-3 py-1 border-2 border-cream">
                    ✓ VERIFIED
                  </span>
                )}
                {isBookable && (
                  <span className="inline-block bg-magenta text-cream font-display text-xs px-3 py-1 border-2 border-cream">
                    ◉ BOOKINGS OPEN
                  </span>
                )}
                {!artist.claimed_by && (
                  <Link href={`/artist/dashboard?claim=${artist.id}`}
                    className="inline-block bg-cream/10 text-cream font-display text-xs px-3 py-1 border-2 border-cream/40 hover:border-cream hover:bg-cream/20 transition-colors">
                    Are you {artist.name.split(" ")[0]}? Claim →
                  </Link>
                )}
              </div>

              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-cream leading-[0.85] mb-3 break-words">
                {artist.name.toUpperCase()}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-cream/70 text-sm">
                {artist.based_city && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{artist.based_city}</span>
                )}
                {stats.years_active > 0 && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{stats.years_active} yrs active</span>
                )}
                {stats.total_gigs > 0 && <span>{stats.total_gigs} gigs</span>}
                {followerCount !== null && followerCount > 0 && (
                  <span className="flex items-center gap-1 text-acid-yellow">
                    <Users className="w-3.5 h-3.5" />
                    {followerCount.toLocaleString("en-IN")} {followerCount === 1 ? "follower" : "followers"} on CCD
                  </span>
                )}
              </div>

              {artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {artist.genres.map((g) => (
                    <span key={g} className="bg-acid-yellow text-ink font-display text-xs px-2 py-1 border-2 border-cream">
                      {g.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

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
                <FollowButton artistSlug={artist.slug} artistName={artist.name} />
              </div>

              {/* Sticky-ish primary CTA — book now */}
              {isBookable && (
                <div className="mt-5">
                  <button onClick={() => goToTab("book")}
                    className="inline-flex items-center gap-2 bg-magenta text-cream font-display text-base md:text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
                    <Ticket className="w-4 h-4" /> BOOK {artist.name.split(" ")[0].toUpperCase()} →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── STICKY TAB NAV ─────────────────────────────────────────── */}
      <div ref={tabsRef} className="sticky top-0 z-30 bg-cream border-b-4 border-ink">
        <div className="container">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const hasData =
                tab.id === "home" ? true :
                tab.id === "gigography" ? appearances.length > 0 :
                tab.id === "connections" ? connections.length > 0 :
                tab.id === "journey" ? milestones.length > 0 :
                tab.id === "stats" ? stats.total_gigs > 0 :
                tab.id === "book" ? isBookable :
                true;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-display text-xs px-4 py-3 border-r-4 border-ink whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                  } ${!hasData ? "opacity-40" : ""} ${tab.id === "book" && isBookable ? "bg-magenta text-cream hover:bg-ink" : ""} ${tab.id === "book" && activeTab === "book" ? "bg-ink text-cream" : ""}`}
                >
                  {tab.label}
                  {tab.id === "book" && isBookable && activeTab !== "book" && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-acid-yellow rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT ────────────────────────────────────────────── */}
      <div className="bg-cream bg-grain border-b-4 border-ink">
        <div className="container py-10 md:py-14">

          {usedFallback && (
            <div className="border-4 border-ink bg-orange chunk-shadow p-4 mb-6 inline-block">
              <p className="font-display text-sm text-ink">⚠ LIMITED DATA — some sections may be empty</p>
            </div>
          )}

          {/* ════════════ HOME (magazine snapshot) ════════════ */}
          {activeTab === "home" && (
            <div className="space-y-12">
              {/* Lead spread: bio + audio */}
              <section className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
                <div>
                  <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-3">/ THE STORY</p>
                  {artist.bio ? (
                    <div className="border-4 border-ink bg-cream chunk-shadow p-6">
                      <p className={`text-ink/85 leading-relaxed text-lg md:text-xl first-letter:text-5xl first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:leading-none ${expandedBio ? "" : "line-clamp-6"}`}>
                        {artist.bio}
                      </p>
                      {artist.bio.length > 300 && (
                        <button onClick={() => setExpandedBio(!expandedBio)}
                          className="mt-4 flex items-center gap-1 font-display text-sm text-ink hover:text-magenta transition-colors">
                          {expandedBio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {expandedBio ? "READ LESS" : "READ MORE"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border-4 border-ink bg-acid-yellow p-6">
                      <p className="font-display text-xl text-ink">{artist.name.toUpperCase()} hasn't written a bio yet.</p>
                      <p className="text-ink/70 text-sm mt-1">Check back soon, or hit them up at <a href="/book" className="underline">/book</a> for a direct introduction.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <ArtistAudioEmbed
                    soundcloud={artist.soundcloud}
                    spotify={artist.spotify}
                    bandcamp={(artist as any).bandcamp}
                    artistName={artist.name}
                  />
                  {(artist.fee_min_inr || artist.fee_max_inr) && (
                    <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-5">
                      <p className="font-display text-xs uppercase text-ink/60 tracking-widest">FEE RANGE</p>
                      <p className="font-display text-2xl text-ink mt-1">
                        {artist.fee_min_inr && artist.fee_max_inr
                          ? `₹${artist.fee_min_inr.toLocaleString("en-IN")} – ₹${artist.fee_max_inr.toLocaleString("en-IN")}`
                          : "Contact for rates"}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Pull quote / facts strip */}
              {facts.length > 0 && (
                <section>
                  <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-3">/ QUICK FACTS</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {facts.slice(0, 4).map((fact, i) => (
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

              {/* Snapshot grid: each block is a peek into a tab */}
              <section>
                <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-3">/ INSIDE THIS ISSUE</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Recent gigs preview */}
                  {appearances.length > 0 && (
                    <button onClick={() => goToTab("gigography")} className="text-left border-4 border-ink bg-cream chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="font-display text-xl text-ink uppercase">Recent gigs</p>
                        <span className="font-display text-xs text-ink/40">→ {appearances.length}</span>
                      </div>
                      <div className="space-y-2">
                        {appearances.slice(0, 3).map((gig, i) => (
                          <div key={i} className="flex items-baseline gap-3 border-b-2 border-ink/10 pb-2 last:border-b-0">
                            <span className="font-display text-xs text-ink/50 w-10 shrink-0">{gig.year || "—"}</span>
                            <span className="font-display text-sm text-ink truncate flex-1">{gig.event_name}</span>
                            <span className={roleTag(gig.role)}>{gig.role.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-display text-xs text-magenta mt-3 underline">SEE FULL GIGOGRAPHY →</p>
                    </button>
                  )}

                  {/* Connections preview */}
                  {connections.length > 0 && (
                    <button onClick={() => goToTab("connections")} className="text-left border-4 border-ink bg-electric-blue text-cream chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="font-display text-xl uppercase">Connections</p>
                        <span className="font-display text-xs text-cream/60">→ {connections.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {connections.slice(0, 8).map((c, i) => {
                          const partner = c.artist_a_slug === artist.slug ? c.artist_b_slug : c.artist_a_slug;
                          return (
                            <span key={i} className="bg-cream text-ink text-[11px] font-display uppercase px-2 py-1 border border-cream">
                              {partner.replace(/-/g, " ")}
                            </span>
                          );
                        })}
                      </div>
                      <p className="font-display text-xs text-acid-yellow mt-3 underline">EXPLORE THE GRAPH →</p>
                    </button>
                  )}

                  {/* Journey preview */}
                  {milestones.length > 0 && (
                    <button onClick={() => goToTab("journey")} className="text-left border-4 border-ink bg-magenta text-cream chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="font-display text-xl uppercase">Journey</p>
                        <span className="font-display text-xs text-cream/60">→ {milestones.length}</span>
                      </div>
                      <div className="space-y-2">
                        {milestones.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex items-baseline gap-3 border-b-2 border-cream/15 pb-2 last:border-b-0">
                            <span className="font-display text-xs text-cream/60 w-12 shrink-0">{m.year || m.date.slice(0,4)}</span>
                            <span className="font-display text-sm truncate flex-1">{m.title}</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-display text-xs text-acid-yellow mt-3 underline">SEE THE TIMELINE →</p>
                    </button>
                  )}

                  {/* Stats preview */}
                  {stats.total_gigs > 0 && (
                    <button onClick={() => goToTab("stats")} className="text-left border-4 border-ink bg-acid-yellow text-ink chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                      <p className="font-display text-xl uppercase mb-3">By the numbers</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-display text-3xl">{stats.total_gigs}</span><p className="font-display text-[10px] uppercase text-ink/60">GIGS</p></div>
                        <div><span className="font-display text-3xl">{stats.total_cities}</span><p className="font-display text-[10px] uppercase text-ink/60">CITIES</p></div>
                        <div><span className="font-display text-3xl">{stats.total_venues}</span><p className="font-display text-[10px] uppercase text-ink/60">VENUES</p></div>
                        <div><span className="font-display text-3xl">{stats.total_connections}</span><p className="font-display text-[10px] uppercase text-ink/60">CONNECTIONS</p></div>
                      </div>
                      <p className="font-display text-xs text-magenta mt-3 underline">DEEP-DIVE →</p>
                    </button>
                  )}

                  {/* EPK preview */}
                  <button onClick={() => goToTab("epk")} className="text-left border-4 border-ink bg-cream text-ink chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                    <p className="font-display text-xl uppercase mb-3">Press kit</p>
                    <p className="text-ink/70 text-sm leading-relaxed mb-3">
                      Bio, contact, links and downloadable assets — everything a venue or promoter needs.
                    </p>
                    <p className="font-display text-xs text-magenta underline">OPEN EPK →</p>
                  </button>

                  {/* Book preview */}
                  {isBookable && (
                    <button onClick={() => goToTab("book")} className="text-left border-4 border-ink bg-ink text-cream chunk-shadow p-5 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform col-span-full">
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="font-display text-2xl uppercase">Book {artist.name.split(" ")[0]}</p>
                        <span className="bg-magenta text-cream font-display text-[10px] uppercase px-2 py-1 border-2 border-acid-yellow">BOOKINGS OPEN</span>
                      </div>
                      <p className="text-cream/80 text-sm leading-relaxed mb-3 max-w-xl">
                        Send a direct booking request — no middleman, no commission. Reply lands in their inbox the same day.
                        {hasOpenSlot && " They have open slots in the calendar this season."}
                      </p>
                      <p className="font-display text-sm text-acid-yellow underline">SEND A REQUEST →</p>
                    </button>
                  )}
                </div>
              </section>

              {/* Upcoming dates ribbon */}
              {upcomingDates.length > 0 && (
                <section>
                  <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-3">/ UPCOMING DATES</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {upcomingDates.slice(0, 8).map((d) => (
                      <div key={d.id} className="shrink-0 border-4 border-ink bg-cream chunk-shadow px-4 py-3 min-w-[200px]">
                        <p className="font-display text-sm uppercase text-ink">{formatDateLine(d.event_date)}</p>
                        <p className="font-display text-base text-ink mt-0.5">{d.city}</p>
                        {d.venue && <p className="text-xs text-ink/60">{d.venue}</p>}
                        <span className={`inline-block mt-1 font-display text-[10px] uppercase px-1.5 py-0.5 border ${
                          d.status === "confirmed" ? "bg-magenta text-cream border-ink"
                          : d.status === "tentative" ? "bg-acid-yellow text-ink border-ink"
                          : "bg-lime text-ink border-ink"
                        }`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ════════════ GIGOGRAPHY ════════════ */}
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

          {/* ════════════ CONNECTIONS ════════════ */}
          {activeTab === "connections" && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl text-ink">CONNECTIONS</h2>
              <ArtistConnectionGraph slug={artist.slug} connections={connections} />
            </div>
          )}

          {/* ════════════ JOURNEY ════════════ */}
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

          {/* ════════════ STATS ════════════ */}
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
                  <div className="max-w-2xl">
                    <ArtistGigChart appearances={appearances} socialHistory={socialHistory} />
                  </div>
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

          {/* ════════════ EPK ════════════ */}
          {activeTab === "epk" && (
            <div className="space-y-8 max-w-3xl">
              {/* Header + share */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-1">/ ELECTRONIC PRESS KIT</p>
                  <h2 className="font-display text-3xl text-ink">EPK</h2>
                </div>
                <div className="flex gap-2">
                  <a href={`/artists/${artist.slug}/epk`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-acid-yellow text-ink chunk-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform">
                    <ExternalLink className="w-3 h-3" /> Share EPK
                  </a>
                  {!artist.claimed_by && (
                    <Link href={`/artist/dashboard?claim=${artist.id}`}
                      className="flex items-center gap-1.5 font-display text-xs uppercase px-4 py-2 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
                      Are you {artist.name.split(" ")[0]}? Claim →
                    </Link>
                  )}
                </div>
              </div>

              {/* Artist card */}
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

              {/* Press quotes (featured first) */}
              {press.filter(p => p.quote_for_epk).length > 0 && (
                <div className="space-y-3">
                  <p className="font-display text-xs uppercase text-ink/50 tracking-widest">/ PRESS QUOTES</p>
                  {press.filter(p => p.quote_for_epk).map((p) => (
                    <blockquote key={p.id} className="border-l-4 border-magenta pl-4 py-1">
                      <p className="text-ink/80 italic text-base">"{p.quote_for_epk}"</p>
                      <footer className="font-display text-xs text-ink/50 mt-1 uppercase">
                        — {p.publication}{p.author ? `, ${p.author}` : ""}
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-2 text-magenta hover:underline">↗</a>}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              )}

              {/* Press coverage list */}
              {press.length > 0 && (
                <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                  <p className="font-display text-lg text-ink mb-4">PRESS COVERAGE</p>
                  <div className="space-y-3">
                    {press.map((p) => (
                      <div key={p.id} className="flex items-start justify-between gap-3 border-b-2 border-ink/10 pb-3 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-display text-[10px] uppercase bg-electric-blue text-cream px-2 py-0.5">{p.type}</span>
                            {p.is_featured && <span className="font-display text-[10px] bg-acid-yellow text-ink px-2 py-0.5 border border-ink">★</span>}
                          </div>
                          <p className="font-display text-sm text-ink">{p.title}</p>
                          <p className="text-xs text-ink/50">{p.publication}{p.date_published ? ` · ${p.date_published}` : ""}</p>
                          {p.excerpt && <p className="text-xs text-ink/60 mt-1 line-clamp-2">{p.excerpt}</p>}
                        </div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer"
                            className="shrink-0 font-display text-xs uppercase px-3 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Read
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discography */}
              {discography.length > 0 && (
                <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                  <p className="font-display text-lg text-ink mb-4">DISCOGRAPHY</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {discography.map((r) => (
                      <div key={r.id} className="flex gap-3 border-2 border-ink/20 p-3">
                        {r.artwork_url
                          ? <img src={r.artwork_url} alt={r.title} className="w-14 h-14 object-cover border-2 border-ink shrink-0" />
                          : <div className="w-14 h-14 bg-ink/10 border-2 border-ink flex items-center justify-center shrink-0"><Music className="w-5 h-5 text-ink/30" /></div>
                        }
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-display text-[9px] uppercase bg-ink text-cream px-1.5 py-0.5">{r.release_type}</span>
                            {r.year && <span className="font-display text-[9px] text-ink/40">{r.year}</span>}
                          </div>
                          <p className="font-display text-sm text-ink truncate">{r.title}</p>
                          {r.label && <p className="text-[10px] text-ink/50">{r.label}</p>}
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {r.spotify_url && <a href={r.spotify_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow transition-colors">Spotify</a>}
                            {r.soundcloud_url && <a href={r.soundcloud_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow transition-colors">SC</a>}
                            {r.bandcamp_url && <a href={r.bandcamp_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow transition-colors">BC</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      <Mail className="w-4 h-4" /> {artist.manager_email} <span className="text-ink/50 font-sans text-xs">(management)</span>
                    </a>
                  )}
                  {artist.website && (
                    <a href={artist.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ink hover:text-magenta font-display text-sm transition-colors">
                      <Globe className="w-4 h-4" /> {artist.website}
                    </a>
                  )}
                </div>
                <button onClick={() => goToTab("book")}
                  className="mt-4 inline-flex items-center gap-2 bg-ink text-cream font-display text-xs uppercase px-4 py-2 border-2 border-ink hover:bg-magenta transition-colors">
                  Or send a marketplace request →
                </button>
              </div>

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

              <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                <p className="font-display text-lg text-ink mb-2">AVAILABILITY</p>
                <p className="font-display text-sm text-ink">{isBookable ? "✓ OPEN FOR BOOKINGS" : "✗ NOT TAKING BOOKINGS"}</p>
                {artist.available_cities.length > 0 && (
                  <p className="text-sm text-ink/60 mt-1">Available in: {artist.available_cities.join(", ")}</p>
                )}
              </div>

              {/* Claim CTA for unclaimed profiles */}
              {!artist.claimed_by && (
                <div className="border-4 border-ink bg-ink text-cream p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-xl uppercase">Is this your profile?</p>
                    <p className="text-cream/60 text-sm mt-1">Claim it to edit your bio, add releases, manage bookings and share your EPK.</p>
                  </div>
                  <Link href={`/artist/dashboard?claim=${artist.id}`}
                    className="shrink-0 font-display text-sm uppercase bg-magenta text-cream px-5 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform whitespace-nowrap">
                    CLAIM PROFILE →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ════════════ BOOK (inline form) ════════════ */}
          {activeTab === "book" && (
            <div ref={bookSectionRef} className="space-y-8 max-w-4xl">
              <div>
                <p className="font-display text-magenta text-xs uppercase tracking-[0.3em] mb-2">/ DIRECT BOOKING</p>
                <h2 className="font-display text-4xl md:text-5xl text-ink uppercase">Book {artist.name}</h2>
                <p className="text-ink/70 mt-2 max-w-xl">
                  Direct booking inquiry. The artist replies via email — no middleman, no commission.
                </p>
              </div>

              {!isBookable ? (
                <div className="border-4 border-ink bg-magenta chunk-shadow p-6 max-w-md">
                  <p className="font-display text-2xl text-cream uppercase mb-2">Not currently booking</p>
                  <p className="text-cream/80 text-sm">
                    {artist.name} has marked themselves as not taking bookings right now. Try the
                    <Link href="/book" className="underline ml-1">marketplace</Link> for similar artists.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
                  {/* Side panel: availability + cities + fee */}
                  <aside className="space-y-4">
                    <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                      <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-2">Status</p>
                      <p className="font-display text-2xl text-ink">◉ BOOKINGS OPEN</p>
                      {hasOpenSlot && (
                        <p className="text-sm text-magenta font-display mt-1">
                          OPEN SLOTS THIS SEASON
                        </p>
                      )}
                    </div>

                    {artist.available_cities.length > 0 && (
                      <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-5">
                        <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-2">Available cities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {artist.available_cities.map(c => (
                            <span key={c} className="bg-ink text-cream font-display text-xs uppercase px-2 py-1 border-2 border-ink">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(artist.fee_min_inr || artist.fee_max_inr) && (
                      <div className="border-4 border-ink bg-electric-blue text-cream chunk-shadow p-5">
                        <p className="font-display text-xs uppercase text-cream/70 tracking-widest mb-1">Fee range</p>
                        <p className="font-display text-2xl">
                          {artist.fee_min_inr && artist.fee_max_inr
                            ? `₹${artist.fee_min_inr.toLocaleString("en-IN")} – ₹${artist.fee_max_inr.toLocaleString("en-IN")}`
                            : "On request"}
                        </p>
                      </div>
                    )}

                    {artist.booking_email && (
                      <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                        <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Or email direct</p>
                        <a href={`mailto:${artist.booking_email}?subject=Booking enquiry — ${artist.name}`}
                          className="font-display text-sm text-ink underline break-all">
                          {artist.booking_email}
                        </a>
                      </div>
                    )}
                  </aside>

                  {/* Inline form */}
                  <div className="space-y-5">
                    <BookingForm
                      artistSlug={artist.slug}
                      artistName={artist.name}
                      source="artist_profile"
                    />
                  </div>
                </div>
              )}

              {/* Calendar strip */}
              <section>
                <h3 className="font-display text-xl text-ink uppercase mb-3">Live Calendar</h3>
                <p className="text-sm text-ink/60 mb-4">
                  The artist updates their calendar from the portal. Days marked busy or
                  tentative typically aren't bookable; days marked as open slots are looking for a show.
                </p>
                <AvailabilityStrip artistSlug={artist.slug} dates={upcomingDates} />
              </section>

              {/* Browse other artists */}
              <div className="border-4 border-ink bg-ink text-cream chunk-shadow p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl uppercase">Looking for someone else?</p>
                  <p className="text-cream/60 text-sm mt-1">Browse the full marketplace — filter by city, genre, and budget.</p>
                </div>
                <Link href="/book" className="bg-acid-yellow text-ink font-display px-5 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
                  BROWSE MARKETPLACE →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      <SimilarArtists
        slug={artist.slug}
        genres={artist.genres}
        connections={connections}
      />
      <Marquee bg="bg-ink" />
      <Footer />

      {/* ─── STICKY MOBILE CTA ─── */}
      {isBookable && activeTab !== "book" && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-magenta border-t-4 border-ink p-3 md:hidden">
          <button onClick={() => goToTab("book")}
            className="w-full bg-cream text-ink font-display text-base uppercase py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
            BOOK {artist.name.split(" ")[0].toUpperCase()} →
          </button>
        </div>
      )}
    </main>
  );
}

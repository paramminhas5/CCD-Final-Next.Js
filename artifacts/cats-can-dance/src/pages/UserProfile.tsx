"use client";
/**
 * User Profile Page — /profile
 * Shows followed artists, upcoming shows, saved events, cities, taste profile,
 * fan XP tier badge, and preference settings.
 * Auth: Clerk required — redirects to /sign-in if not logged in.
 */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Music, Heart, MapPin, Calendar, Settings, Users,
  Loader2, ExternalLink, Bell, Star, Zap, Trophy,
  ChevronRight, Ticket,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

interface TasteProfile {
  user_id: string;
  liked_artist_slugs: string[];
  cities: string[];
  genres: string[];
  updated_at?: string;
}

interface FanProfile {
  xp: number;
  ccd_points: number;
  tier: "newcomer" | "regular" | "maker" | "legend";
  total_interactions: number;
}

interface Artist {
  id: string; slug: string; name: string;
  genres: string[]; photo_url?: string; based_city?: string;
}

interface UpcomingShow {
  id: string;
  artist_slug: string;
  artist_name: string;
  event_date: string;
  city: string;
  venue?: string | null;
  status: string;
  ticket_url?: string | null;
}

const INDIA_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Goa", "Hyderabad", "Pune", "Chennai", "Kolkata"];
const GENRE_LIST = ["House", "Techno", "Jungle / D&B", "UK Garage", "Disco", "Ambient", "Experimental", "Psytrance"];

// ─── Fan tier config ──────────────────────────────────────────────────────────
const TIER_META: Record<string, { label: string; bg: string; text: string; minXp: number; maxXp: number; icon: string }> = {
  newcomer: { label: "Newcomer",  bg: "bg-ink/20",          text: "text-ink",   minXp: 0,    maxXp: 100,  icon: "🌱" },
  regular:  { label: "Regular",   bg: "bg-electric-blue",   text: "text-cream", minXp: 100,  maxXp: 500,  icon: "🎧" },
  maker:    { label: "Maker",     bg: "bg-magenta",         text: "text-cream", minXp: 500,  maxXp: 2000, icon: "🔥" },
  legend:   { label: "Legend",    bg: "bg-acid-yellow",     text: "text-ink",   minXp: 2000, maxXp: 9999, icon: "👑" },
};

function FanTierBadge({ fanProfile }: { fanProfile: FanProfile }) {
  const tier = fanProfile.tier ?? "newcomer";
  const meta = TIER_META[tier] ?? TIER_META["newcomer"];
  const xp = fanProfile.xp ?? 0;
  const progress = Math.min(100, Math.round(((xp - meta.minXp) / (meta.maxXp - meta.minXp)) * 100));

  return (
    <div className="border-4 border-ink bg-cream chunk-shadow p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 border-4 border-ink ${meta.bg} flex items-center justify-center text-xl shrink-0`}>
          {meta.icon}
        </div>
        <div>
          <p className="font-display text-xs uppercase text-ink/50">Your Tier</p>
          <p className={`font-display text-2xl uppercase ${meta.text === "text-ink" ? "text-ink" : "text-ink"}`}>
            {meta.label}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-xs uppercase text-ink/50">XP</p>
          <p className="font-display text-xl text-ink">{xp.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Progress bar */}
      {tier !== "legend" && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-display text-[10px] uppercase text-ink/40">{meta.label}</span>
            <span className="font-display text-[10px] uppercase text-ink/40">
              {Object.entries(TIER_META).find(([k]) => k !== tier && TIER_META[k as keyof typeof TIER_META].minXp > meta.minXp)?.[1]?.label ?? "Legend"}
            </span>
          </div>
          <div className="h-3 border-2 border-ink bg-cream overflow-hidden">
            <div
              className={`h-full ${meta.bg} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-display text-[10px] text-ink/40 mt-1">
            {(meta.maxXp - xp).toLocaleString("en-IN")} XP to next tier
          </p>
        </div>
      )}

      {tier === "legend" && (
        <p className="font-display text-xs uppercase text-ink/50 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> Maximum tier achieved
        </p>
      )}

      <div className="flex gap-4 pt-1 border-t border-ink/10">
        <div>
          <p className="font-display text-xs uppercase text-ink/40">CCD Points</p>
          <p className="font-display text-lg text-ink">{fanProfile.ccd_points?.toLocaleString("en-IN") ?? 0}</p>
        </div>
        <div>
          <p className="font-display text-xs uppercase text-ink/40">Interactions</p>
          <p className="font-display text-lg text-ink">{fanProfile.total_interactions?.toLocaleString("en-IN") ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming show card ─────────────────────────────────────────────────────
function UpcomingShowCard({ show }: { show: UpcomingShow }) {
  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
    catch { return iso; }
  };

  return (
    <div className="border-4 border-ink bg-cream chunk-shadow p-4 flex items-start gap-3">
      <div className="border-4 border-ink bg-acid-yellow px-2 py-1 text-center shrink-0 min-w-[52px]">
        <p className="font-display text-[9px] uppercase text-ink/60">
          {new Date(show.event_date).toLocaleDateString("en-IN", { month: "short" })}
        </p>
        <p className="font-display text-2xl leading-tight text-ink">
          {new Date(show.event_date).getDate()}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/artists/${show.artist_slug}`} className="font-display text-base uppercase text-ink hover:text-magenta transition-colors truncate block">
          {show.artist_name}
        </Link>
        <p className="text-sm text-ink/60 truncate">
          {[show.venue, show.city].filter(Boolean).join(" · ")}
        </p>
        <span className={`inline-block mt-1 font-display text-[10px] uppercase px-1.5 py-0.5 border ${
          show.status === "confirmed" ? "bg-acid-yellow text-ink border-ink"
          : "bg-electric-blue text-cream border-ink"
        }`}>
          {show.status}
        </span>
      </div>
      {show.ticket_url && (
        <a
          href={show.ticket_url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-display text-[10px] uppercase px-2 py-1.5 border-2 border-ink hover:bg-acid-yellow transition-colors flex items-center gap-1"
        >
          <Ticket className="w-3 h-3" /> Tix
        </a>
      )}
    </div>
  );
}

// ─── Followed artist mini-card ────────────────────────────────────────────────
function FollowedArtistCard({ slug, onUnfollow }: { slug: string; onUnfollow: (s: string) => void }) {
  const [artist, setArtist] = useState<Artist | null>(null);

  useEffect(() => {
    fetch(`/api/artists/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setArtist(data))
      .catch(() => {});
  }, [slug]);

  if (!artist) {
    return (
      <div className="border-4 border-ink bg-ink/5 animate-pulse aspect-square" />
    );
  }

  const ACCENTS = ["bg-electric-blue","bg-magenta","bg-acid-yellow","bg-orange","bg-lime"];
  const accent = ACCENTS[artist.name.charCodeAt(0) % ACCENTS.length];

  return (
    <div className="group relative border-4 border-ink overflow-hidden chunk-shadow">
      <Link href={`/artists/${artist.slug}`}>
        <div className="relative aspect-square">
          {artist.photo_url ? (
            <>
              <img src={artist.photo_url} alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full ${accent} flex items-center justify-center`}>
              <Music className="w-8 h-8 opacity-20" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="font-display text-cream text-xs uppercase truncate">{artist.name}</p>
            {artist.based_city && (
              <p className="text-cream/60 text-[10px] flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{artist.based_city}
              </p>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={() => onUnfollow(slug)}
        className="absolute top-2 right-2 w-7 h-7 border-2 border-ink bg-cream/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-magenta hover:border-magenta hover:text-cream"
        title="Unfollow"
      >
        <Heart className="w-3.5 h-3.5 fill-magenta text-magenta group-hover:fill-cream group-hover:text-cream" />
      </button>
    </div>
  );
}

// ─── Preferences editor ────────────────────────────────────────────────────────
function PreferencesPanel({
  profile, userId, onSaved,
}: {
  profile: TasteProfile;
  userId: string;
  onSaved: (p: TasteProfile) => void;
}) {
  const [cities, setCities] = useState<string[]>(profile.cities ?? []);
  const [genres, setGenres] = useState<string[]>(profile.genres ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleCity = (c: string) =>
    setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleGenre = (g: string) =>
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cities, genres }),
      });
      onSaved({ ...profile, cities, genres });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Cities */}
      <div>
        <p className="font-display text-sm uppercase text-ink/60 tracking-widest mb-3">Your Cities</p>
        <div className="flex flex-wrap gap-2">
          {INDIA_CITIES.map(c => (
            <button
              key={c}
              onClick={() => toggleCity(c)}
              className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                cities.includes(c) ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <p className="font-display text-sm uppercase text-ink/60 tracking-widest mb-3">Your Genres</p>
        <div className="flex flex-wrap gap-2">
          {GENRE_LIST.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                genres.includes(g) ? "bg-magenta text-cream border-magenta" : "bg-cream text-ink hover:bg-acid-yellow"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 font-display text-sm uppercase px-6 py-3 border-4 border-ink bg-ink text-cream chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Preferences"}
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<UpcomingShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"following" | "shows" | "preferences">("following");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/sign-in"); return; }
    const userId = user.id;

    // Load taste profile, fan profile, and upcoming shows in parallel
    Promise.all([
      fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => null),
      fetch(`/api/fan-profiles?userId=${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/user/artist-gigs?userId=${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([tasteData, fanData, gigsData]) => {
      setProfile(tasteData ?? { user_id: userId, liked_artist_slugs: [], cities: [], genres: [] });
      setFanProfile(fanData ?? null);
      setUpcomingShows(Array.isArray(gigsData) ? gigsData : []);
      setLoading(false);
    });
  }, [isLoaded, isSignedIn, user]);

  async function unfollowArtist(slug: string) {
    if (!user || !profile) return;
    await fetch("/api/user/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, artistSlug: slug, action: "unfollow" }),
    });
    setProfile(p => p ? { ...p, liked_artist_slugs: p.liked_artist_slugs.filter(s => s !== slug) } : p);
  }

  if (!isLoaded || loading) {
    return (
      <main className="bg-cream min-h-screen">
        <Nav />
        <div className="container pt-32 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ink mx-auto" />
        </div>
        <Footer />
      </main>
    );
  }

  const followed = profile?.liked_artist_slugs ?? [];
  const cities = profile?.cities ?? [];
  const genres = profile?.genres ?? [];

  return (
    <main className="bg-cream text-ink min-h-screen">
      <SEO
        title="My Profile — Cats Can Dance"
        description="Your followed artists, saved events and taste preferences."
        path="/profile"
      />
      <Nav />

      {/* ── Profile header ── */}
      <section className="bg-ink pt-28 pb-12 border-b-4 border-ink">
        <div className="container">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 border-4 border-acid-yellow bg-acid-yellow overflow-hidden shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName ?? "You"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-3xl text-ink">
                    {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl text-cream uppercase leading-tight">
                {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "My Profile"}
              </h1>
              <p className="text-cream/50 text-sm mt-1">{user?.emailAddresses?.[0]?.emailAddress}</p>
              {/* Taste summary */}
              <div className="flex flex-wrap gap-3 mt-3">
                {followed.length > 0 && (
                  <span className="flex items-center gap-1 font-display text-xs text-acid-yellow uppercase">
                    <Heart className="w-3.5 h-3.5 fill-acid-yellow" /> {followed.length} artists
                  </span>
                )}
                {cities.length > 0 && (
                  <span className="flex items-center gap-1 font-display text-xs text-cream/60 uppercase">
                    <MapPin className="w-3.5 h-3.5" /> {cities.slice(0, 3).join(", ")}
                  </span>
                )}
                {genres.length > 0 && (
                  <span className="flex items-center gap-1 font-display text-xs text-cream/60 uppercase">
                    <Music className="w-3.5 h-3.5" /> {genres.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-20 bg-cream border-b-4 border-ink">
        <div className="container flex gap-0">
          {[
            { key: "following" as const,   label: `Following (${followed.length})`, icon: Heart },
            { key: "shows" as const,       label: `Shows${upcomingShows.length > 0 ? ` (${upcomingShows.length})` : ""}`, icon: Ticket },
            { key: "preferences" as const, label: "Preferences", icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 font-display text-xs uppercase px-5 py-3 border-r-4 border-ink transition-colors ${
                  activeTab === tab.key ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                }`}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="container py-10 md:py-14">

        {/* FOLLOWING */}
        {activeTab === "following" && (
          <div className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl uppercase text-ink">Following</h2>
                <p className="text-ink/60 text-sm mt-1">
                  Artists you follow get shown in your personalised event recommendations.
                </p>
              </div>
              <Link href="/artists" className="font-display text-xs uppercase text-magenta hover:underline">
                Find Artists →
              </Link>
            </div>

            {followed.length === 0 ? (
              <div className="border-4 border-ink bg-acid-yellow p-10 text-center max-w-md">
                <Heart className="w-10 h-10 text-ink/30 mx-auto mb-3" />
                <p className="font-display text-xl text-ink uppercase mb-2">Not Following Anyone Yet</p>
                <p className="text-sm text-ink/60 mb-4">
                  Follow artists from their profile pages to get personalised event recommendations.
                </p>
                <Link href="/artists"
                  className="inline-block font-display text-sm uppercase px-5 py-2 border-4 border-ink bg-ink text-cream chunk-shadow hover:bg-magenta transition-colors">
                  Browse Artists →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {followed.map(slug => (
                  <FollowedArtistCard key={slug} slug={slug} onUnfollow={unfollowArtist} />
                ))}
              </div>
            )}

            {/* Your cities upcoming events */}
            {cities.length > 0 && (
              <div className="border-t-4 border-ink pt-8">
                <h3 className="font-display text-2xl uppercase text-ink mb-4">Events In Your Cities</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {cities.map(c => (
                    <Link key={c} href={`/scene/${c.toLowerCase()}`}
                      className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
                      {c} →
                    </Link>
                  ))}
                </div>
                <Link href="/events"
                  className="inline-block font-display text-sm uppercase px-5 py-2 border-4 border-ink bg-acid-yellow text-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  See All Events →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SHOWS */}
        {activeTab === "shows" && (
          <div className="space-y-8">
            {/* Fan tier badge */}
            {fanProfile && (
              <div className="max-w-md">
                <FanTierBadge fanProfile={fanProfile} />
              </div>
            )}

            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl uppercase text-ink">Upcoming Shows</h2>
                <p className="text-ink/60 text-sm mt-1">
                  From artists you follow — in your cities.
                </p>
              </div>
              <Link href="/events" className="font-display text-xs uppercase text-magenta hover:underline">
                All Events →
              </Link>
            </div>

            {upcomingShows.length === 0 ? (
              <div className="border-4 border-ink bg-acid-yellow p-10 text-center max-w-md">
                <Ticket className="w-10 h-10 text-ink/30 mx-auto mb-3" />
                <p className="font-display text-xl text-ink uppercase mb-2">No Upcoming Shows</p>
                <p className="text-sm text-ink/60 mb-4">
                  Follow more artists and set your cities to see their upcoming dates here.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/artists" className="font-display text-sm uppercase px-4 py-2 border-4 border-ink bg-ink text-cream hover:bg-magenta transition-colors">
                    Browse Artists →
                  </Link>
                  <button onClick={() => setActiveTab("preferences")} className="font-display text-sm uppercase px-4 py-2 border-4 border-ink text-ink hover:bg-acid-yellow transition-colors">
                    Set Cities →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {upcomingShows.map((show) => (
                  <UpcomingShowCard key={show.id} show={show} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PREFERENCES */}
        {activeTab === "preferences" && profile && (
          <div className="space-y-8 max-w-2xl">
            <div>
              <h2 className="font-display text-3xl uppercase text-ink mb-2">Your Preferences</h2>
              <p className="text-ink/60 text-sm">
                These power the <strong>"For You"</strong> tab in events and personalise your Discover page.
              </p>
            </div>
            <PreferencesPanel
              profile={profile}
              userId={user?.id ?? ""}
              onSaved={setProfile}
            />

            {/* Digest email opt-in hint */}
            <div className="border-4 border-ink bg-electric-blue p-5 flex items-start gap-4">
              <Bell className="w-6 h-6 text-cream shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-sm text-cream uppercase mb-1">Weekly Digest</p>
                <p className="text-cream/80 text-sm">
                  Every Monday you'll get a roundup of upcoming events in your cities.
                  Make sure your cities are set above and your email is confirmed.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── CTAs ── */}
      <section className="bg-ink border-y-4 border-ink py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl text-cream uppercase">Discover More</h3>
            <p className="text-cream/60 text-sm mt-1">Find artists, scenes, and events across India.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/discover" className="bg-acid-yellow text-ink font-display text-sm uppercase px-5 py-2 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Discover
            </Link>
            <Link href="/artists" className="bg-cream text-ink font-display text-sm uppercase px-5 py-2 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Artists
            </Link>
            <Link href="/events" className="bg-magenta text-cream font-display text-sm uppercase px-5 py-2 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Events
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

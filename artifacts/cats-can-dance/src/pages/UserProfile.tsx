"use client";
/**
 * User Profile Page — /profile
 * Shows followed artists, saved events, cities, and taste profile.
 * Auth: Clerk required — redirects to /sign-in if not logged in.
 */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Music, Heart, MapPin, Calendar, Settings, Users,
  Loader2, ExternalLink, Bell, BellOff,
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

interface Artist {
  id: string; slug: string; name: string;
  genres: string[]; photo_url?: string; based_city?: string;
}

interface CuratedEvent {
  id: string; title: string; url: string;
  event_date?: string; venue?: string; city?: string; genre: string[];
  image_url?: string;
}

const INDIA_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Goa", "Hyderabad", "Pune", "Chennai", "Kolkata"];
const GENRE_LIST = ["House", "Techno", "Jungle / D&B", "UK Garage", "Disco", "Ambient", "Experimental", "Psytrance"];

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"following" | "preferences">("following");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/sign-in"); return; }
    const userId = user.id;
    fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        setProfile(data ?? { user_id: userId, liked_artist_slugs: [], cities: [], genres: [] });
        setLoading(false);
      })
      .catch(() => {
        setProfile({ user_id: userId, liked_artist_slugs: [], cities: [], genres: [] });
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
            { key: "following" as const, label: `Following (${followed.length})`, icon: Heart },
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

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Music, MapPin, Search, X, AlertTriangle } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";

interface DBArtist {
  id: string;
  slug: string;
  name: string;
  members?: string;
  from_city?: string;
  based_city?: string;
  genres: string[];
  festivals: string[];
  bio?: string;
  why?: string;
  instagram?: string;
  soundcloud?: string;
  website?: string;
  booking_email?: string;
  photo_url?: string;
  labels?: string;
  fee_min_inr?: number;
  fee_max_inr?: number;
  videos?: any[];
  gallery?: any[];
}

function cityOf(a: DBArtist): string {
  return a.based_city || a.from_city || "";
}

function cover(a: DBArtist): string | null {
  if (a.photo_url) return a.photo_url;
  if (a.gallery && a.gallery.length > 0) {
    const first = a.gallery[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    if (first?.src) return first.src;
  }
  return null;
}

type SortMode = "az" | "city" | "genre";

// Rotating accent colours for cards with no photo
const CARD_ACCENTS = [
  "bg-acid-yellow text-ink",
  "bg-electric-blue text-cream",
  "bg-magenta text-cream",
  "bg-orange text-ink",
  "bg-lime text-ink",
];

export default function ArtistsPage() {
  const [artists, setArtists] = useState<DBArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>("az");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/artists");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setArtists((data ?? []) as DBArtist[]);
      } catch (e: any) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allCities = useMemo(() => {
    const s = new Set<string>();
    for (const a of artists) {
      const c = cityOf(a);
      if (c) s.add(c.split(",")[0].trim());
    }
    return Array.from(s).sort();
  }, [artists]);

  const allGenres = useMemo(() => {
    const s = new Set<string>();
    for (const a of artists) for (const g of a.genres ?? []) s.add(g);
    return Array.from(s).sort();
  }, [artists]);

  const toggleGenre = (g: string) => {
    const next = new Set(activeGenres);
    next.has(g) ? next.delete(g) : next.add(g);
    setActiveGenres(next);
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    let rows = artists.filter((a) => {
      if (city !== "All" && !cityOf(a).toLowerCase().includes(city.toLowerCase())) return false;
      if (activeGenres.size > 0 && !(a.genres ?? []).some((g) => activeGenres.has(g))) return false;
      if (!ql) return true;
      return (
        a.name.toLowerCase().includes(ql) ||
        (a.genres ?? []).join(" ").toLowerCase().includes(ql) ||
        cityOf(a).toLowerCase().includes(ql) ||
        (a.bio ?? "").toLowerCase().includes(ql) ||
        (a.labels ?? "").toLowerCase().includes(ql)
      );
    });
    if (sort === "city") rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || a.name.localeCompare(b.name));
    else if (sort === "genre") rows = [...rows].sort((a, b) => ((a.genres ?? [])[0] ?? "").localeCompare((b.genres ?? [])[0] ?? "") || a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [artists, q, city, activeGenres, sort]);

  return (
    <main className="bg-background text-foreground">
      <SEO
        title="Artists — Cats Can Dance | India's Electronic Music Directory"
        description="Discover India's top electronic music artists. Browse DJs, producers, and live acts from Bangalore, Mumbai, Delhi and beyond."
        path="/artists"
      />
      <Nav />

      <PageHero
        eyebrow="ARTISTS"
        title={<>THE<br/>ROSTER.</>}
        bg="bg-electric-blue"
        textColor="text-cream"
        eyebrowColor="text-acid-yellow"
      />

      <Marquee bg="bg-ink" />

      {/* Filter bar */}
      <div className="sticky top-0 z-30 bg-cream border-b-4 border-ink">
        <div className="container py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search artists…"
                className="w-full pl-9 pr-8 py-2 border-4 border-ink bg-cream font-sans text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/20 transition-colors"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City filter */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2 border-4 border-ink bg-cream font-display text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
            >
              <option value="All">ALL CITIES</option>
              {allCities.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="px-3 py-2 border-4 border-ink bg-cream font-display text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
            >
              <option value="az">A → Z</option>
              <option value="city">CITY</option>
              <option value="genre">GENRE</option>
            </select>
          </div>

          {/* Genre pills */}
          {allGenres.length > 0 && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {allGenres.map((g) => {
                const active = activeGenres.has(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1 border-2 border-ink font-display text-xs whitespace-nowrap transition-colors ${
                      active
                        ? "bg-ink text-cream"
                        : "bg-transparent text-ink hover:bg-acid-yellow"
                    }`}
                  >
                    {g.toUpperCase()}
                  </button>
                );
              })}
              {activeGenres.size > 0 && (
                <button
                  onClick={() => setActiveGenres(new Set())}
                  className="px-3 py-1 border-2 border-ink/40 font-display text-xs text-ink/50 hover:border-ink hover:text-ink transition-colors whitespace-nowrap"
                >
                  CLEAR ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <section className="bg-cream border-b-4 border-ink py-10 md:py-16 bg-grain min-h-[60vh]">
        <div className="container">

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array(16).fill(null).map((_, i) => (
                <div key={i} className="aspect-square border-4 border-ink bg-ink/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="border-4 border-ink bg-magenta chunk-shadow p-8 max-w-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-8 h-8 text-cream shrink-0" />
                <p className="font-display text-xl text-cream">COULDN'T LOAD ARTISTS</p>
              </div>
              <p className="text-cream/80 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-cream text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
              >
                RETRY
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 inline-block">
              <Music className="w-10 h-10 text-ink mb-3" />
              <p className="font-display text-2xl text-ink mb-2">NO ARTISTS MATCH</p>
              <p className="text-ink/70 text-sm mb-4">
                {artists.length === 0
                  ? "No artists found in the database."
                  : "Try adjusting your filters."}
              </p>
              {(q || city !== "All" || activeGenres.size > 0) && (
                <button
                  onClick={() => { setQ(""); setCity("All"); setActiveGenres(new Set()); }}
                  className="bg-ink text-cream font-display px-5 py-2 border-4 border-ink hover:bg-ink/80 transition-colors"
                >
                  CLEAR FILTERS
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Count line */}
              <p className="font-display text-sm text-ink/50 mb-4">
                {filtered.length} ARTISTS
                {activeGenres.size > 0 && " · FILTERED BY GENRE"}
              </p>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((a, i) => {
                  const img = cover(a);
                  const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                  const isLarge = i % 9 === 0;

                  return (
                    <Link
                      key={a.id}
                      href={`/artists/${a.slug}`}
                      className={`group relative border-4 border-ink overflow-hidden chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform ${
                        isLarge ? "col-span-2 row-span-2" : "aspect-square"
                      }`}
                    >
                      {img ? (
                        <>
                          <img
                            src={img}
                            alt={a.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                        </>
                      ) : (
                        <div className={`absolute inset-0 ${accent} flex items-end p-0`}>
                          <div className="w-full h-full flex items-center justify-center opacity-10">
                            <Music className="w-16 h-16" />
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className={`font-display text-sm leading-tight truncate ${img ? "text-cream" : accent.includes("text-ink") ? "text-ink" : "text-cream"}`}>
                          {a.name.toUpperCase()}
                        </p>
                        {cityOf(a) && (
                          <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${img ? "text-cream/60" : accent.includes("text-ink") ? "text-ink/60" : "text-cream/60"}`}>
                            <MapPin className="w-3 h-3 shrink-0" />
                            {cityOf(a)}
                          </p>
                        )}
                        {(a.genres ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(a.genres ?? []).slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="text-[10px] px-1.5 py-0.5 bg-acid-yellow text-ink font-display border border-ink"
                              >
                                {g.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-12 border-4 border-ink bg-orange chunk-shadow p-6 inline-block">
                <p className="font-display text-2xl text-ink mb-2">ARE YOU AN ARTIST?</p>
                <p className="text-ink/70 text-sm mb-4">Get listed in the CCD artist directory.</p>
                <Link
                  href="/for-artists"
                  className="inline-block bg-ink text-cream font-display px-5 py-2 border-4 border-ink hover:bg-ink/80 transition-colors"
                >
                  JOIN THE ROSTER →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

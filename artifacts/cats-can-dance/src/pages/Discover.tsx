import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import CuratedEvents from "@/components/CuratedEvents";
import { CITY_SCENES, GLOBAL_SCENES, GENRE_PAGES } from "@/content/scenes";
import {
  MapPin, Globe, Music2, Compass, ArrowRight, Play,
  Search, X, Calendar, Music, Zap, ChevronRight,
} from "lucide-react";

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow, title, subtitle, accent = "bg-acid-yellow",
}: {
  eyebrow: string; title: string; subtitle?: string; accent?: string;
}) {
  return (
    <div className="border-b-4 border-ink pb-6 mb-8">
      <span className={`inline-block font-display text-xs uppercase px-3 py-1 border-2 border-ink mb-3 ${accent} text-ink`}>
        {eyebrow}
      </span>
      <h2 className="font-display text-4xl md:text-5xl text-ink uppercase leading-tight">{title}</h2>
      {subtitle && <p className="text-ink/60 mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

// ─── City tile ───────────────────────────────────────────────────────────────
function CityTile({ city }: { city: (typeof CITY_SCENES)[0] }) {
  return (
    <Link
      href={`/scene/${city.slug}`}
      className={`group relative border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-6 flex flex-col justify-between min-h-[220px] ${city.accentColor}`}
    >
      <div>
        <p className={`font-display text-xs uppercase tracking-widest mb-1 ${city.textColor} opacity-70`}>
          India
        </p>
        <h3 className={`font-display text-3xl md:text-4xl uppercase leading-tight ${city.textColor}`}>
          {city.name}
        </h3>
      </div>
      <div>
        <p className={`text-sm mb-3 ${city.textColor} opacity-80`}>{city.tagline}</p>
        <div className="flex flex-wrap gap-1">
          {city.activeGenres.slice(0, 3).map(g => (
            <span key={g} className="text-[10px] font-display uppercase px-2 py-0.5 bg-cream/20 text-cream border border-cream/40">
              {g}
            </span>
          ))}
        </div>
      </div>
      <ArrowRight className={`absolute top-4 right-4 w-5 h-5 ${city.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Link>
  );
}

// ─── Global scene tile ────────────────────────────────────────────────────────
function GlobalSceneTile({ scene }: { scene: (typeof GLOBAL_SCENES)[0] }) {
  return (
    <Link
      href={`/scenes/${scene.slug}`}
      className={`group border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 flex flex-col gap-3 ${scene.accentColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-display text-[10px] uppercase tracking-widest ${scene.textColor} opacity-60`}>
            {scene.city} · {scene.decade}
          </p>
          <h3 className={`font-display text-xl uppercase leading-tight mt-1 ${scene.textColor}`}>
            {scene.name}
          </h3>
        </div>
        <span className={`font-display text-xs px-2 py-0.5 border border-current ${scene.textColor} opacity-50`}>
          {scene.bpm} BPM
        </span>
      </div>
      <p className={`text-sm line-clamp-2 ${scene.textColor} opacity-70`}>{scene.tagline}</p>
      <p className={`text-xs font-display uppercase ${scene.textColor} opacity-50 group-hover:opacity-100 transition-opacity`}>
        Explore →
      </p>
    </Link>
  );
}

// ─── Genre tile ───────────────────────────────────────────────────────────────
function GenreTile({ genre }: { genre: (typeof GENRE_PAGES)[0] }) {
  return (
    <Link
      href={`/genres/${genre.slug}`}
      className={`group border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 ${genre.accentColor}`}
    >
      <p className={`font-display text-[10px] uppercase tracking-widest mb-1 ${genre.textColor} opacity-60`}>
        {genre.bpm} BPM · {genre.origin}
      </p>
      <h3 className={`font-display text-2xl uppercase ${genre.textColor}`}>{genre.name}</h3>
      <p className={`text-xs mt-2 line-clamp-2 ${genre.textColor} opacity-70`}>{genre.tagline}</p>
    </Link>
  );
}

// ─── "What's On This Weekend" strip ─────────────────────────────────────────
interface CityCount { city: string; count: number; }

function WhatsOnStrip() {
  const [cityCounts, setCityCounts] = useState<CityCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/curated-events?limit=50")
      .then(r => r.json())
      .then((events: any[]) => {
        if (!Array.isArray(events)) return;
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = events.filter(e => {
          if (!e.event_date) return false;
          const d = new Date(e.event_date);
          return d >= now && d <= weekFromNow;
        });
        const counts: Record<string, number> = {};
        for (const e of upcoming) {
          if (e.city) counts[e.city] = (counts[e.city] || 0) + 1;
        }
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([city, count]) => ({ city, count }));
        setCityCounts(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && cityCounts.length === 0) return null;

  return (
    <div className="bg-acid-yellow border-b-4 border-ink">
      <div className="container py-4">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-ink animate-pulse" />
            <span className="font-display text-xs uppercase tracking-widest text-ink whitespace-nowrap">
              This Weekend
            </span>
          </div>
          <div className="w-px h-4 bg-ink/30 shrink-0" />
          {loading ? (
            Array(4).fill(null).map((_, i) => (
              <div key={i} className="h-7 w-28 bg-ink/10 animate-pulse shrink-0" />
            ))
          ) : (
            cityCounts.map(({ city, count }) => {
              const citySlug = CITY_SCENES.find(c =>
                c.name.toLowerCase() === city.toLowerCase()
              )?.slug;
              const pill = (
                <span className="font-display text-sm text-ink whitespace-nowrap">
                  {city}
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 bg-ink text-acid-yellow text-[10px] font-display rounded-none">
                    {count}
                  </span>
                </span>
              );
              return citySlug ? (
                <Link
                  key={city}
                  href={`/scene/${citySlug}`}
                  className="shrink-0 border-2 border-ink px-3 py-1 hover:bg-ink hover:text-acid-yellow transition-colors flex items-center gap-1 group"
                >
                  {pill}
                  <ChevronRight className="w-3 h-3 text-ink group-hover:text-acid-yellow opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ) : (
                <span key={city} className="shrink-0 border-2 border-ink px-3 py-1 flex items-center">
                  {pill}
                </span>
              );
            })
          )}
          {!loading && cityCounts.length > 0 && (
            <>
              <div className="w-px h-4 bg-ink/30 shrink-0" />
              <button
                className="shrink-0 font-display text-xs uppercase text-ink/60 hover:text-ink transition-colors whitespace-nowrap"
                onClick={() => {
                  const el = document.getElementById("events");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                See all below ↓
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Universal Search ─────────────────────────────────────────────────────────
interface SearchResult {
  type: "artist" | "city" | "genre" | "scene";
  label: string;
  sublabel?: string;
  href: string;
  accent?: string;
  textColor?: string;
}

function UniversalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [artistResults, setArtistResults] = useState<SearchResult[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const staticResults: SearchResult[] = [
    ...CITY_SCENES.map(c => ({
      type: "city" as const,
      label: c.name,
      sublabel: c.tagline,
      href: `/scene/${c.slug}`,
      accent: c.accentColor,
      textColor: c.textColor,
    })),
    ...GENRE_PAGES.map(g => ({
      type: "genre" as const,
      label: g.name,
      sublabel: `${g.bpm} BPM · ${g.origin}`,
      href: `/genres/${g.slug}`,
      accent: g.accentColor,
      textColor: g.textColor,
    })),
    ...GLOBAL_SCENES.map(s => ({
      type: "scene" as const,
      label: s.name,
      sublabel: `${s.city} · ${s.decade}`,
      href: `/scenes/${s.slug}`,
      accent: s.accentColor,
      textColor: s.textColor,
    })),
  ];

  const q = query.trim().toLowerCase();

  const filteredStatic = q.length >= 2
    ? staticResults.filter(r =>
        r.label.toLowerCase().includes(q) ||
        (r.sublabel?.toLowerCase().includes(q) ?? false)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    if (q.length < 2) { setArtistResults([]); return; }
    setLoadingArtists(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists?limit=5`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const filtered = data
          .filter((a: any) =>
            a.name?.toLowerCase().includes(q) ||
            a.based_city?.toLowerCase().includes(q) ||
            (a.genres ?? []).join(" ").toLowerCase().includes(q)
          )
          .slice(0, 4)
          .map((a: any) => ({
            type: "artist" as const,
            label: a.name,
            sublabel: [a.based_city, (a.genres ?? [])[0]].filter(Boolean).join(" · "),
            href: `/artists/${a.slug}`,
          }));
        setArtistResults(filtered);
      } catch { /* skip */ }
      finally { setLoadingArtists(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const allResults: SearchResult[] = [...artistResults, ...filteredStatic];

  const grouped = allResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    artist: "Artists", city: "Cities", genre: "Genres", scene: "Global Scenes",
  };
  const typeIcons: Record<string, React.ReactNode> = {
    artist: <Music className="w-3 h-3" />,
    city: <MapPin className="w-3 h-3" />,
    genre: <Zap className="w-3 h-3" />,
    scene: <Globe className="w-3 h-3" />,
  };

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const showDropdown = open && q.length >= 2;

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      <div className={`flex items-center border-4 border-ink bg-cream transition-colors ${open ? "border-magenta" : ""}`}>
        <Search className="w-5 h-5 text-ink/40 ml-4 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search artists, cities, genres, scenes…"
          className="flex-1 px-4 py-4 bg-transparent font-display text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          aria-label="Search everything"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setArtistResults([]); inputRef.current?.focus(); }}
            className="mr-4 text-ink/40 hover:text-ink transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 border-4 border-ink border-t-0 bg-cream shadow-[8px_8px_0_#1a1a1a] max-h-[70vh] overflow-y-auto">
          {loadingArtists && allResults.length === 0 && (
            <div className="p-4">
              <div className="h-5 bg-ink/10 animate-pulse w-32 mb-2" />
              <div className="h-5 bg-ink/10 animate-pulse w-48" />
            </div>
          )}
          {!loadingArtists && allResults.length === 0 && (
            <div className="p-6 text-center">
              <p className="font-display text-sm text-ink/50 uppercase">Nothing found for "{query}"</p>
              <p className="text-xs text-ink/40 mt-1">Try "house", "bengaluru", or an artist name</p>
            </div>
          )}
          {Object.entries(grouped).map(([type, results]) => (
            <div key={type}>
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-ink/10">
                <span className="text-ink/40">{typeIcons[type]}</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-ink/50">
                  {typeLabels[type]}
                </span>
              </div>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(r.href)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-acid-yellow transition-colors border-b border-ink/10 last:border-b-0 group"
                >
                  {r.accent && r.type !== "artist" && (
                    <span className={`shrink-0 w-3 h-3 border border-ink ${r.accent}`} />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-sm text-ink uppercase truncate group-hover:text-ink">
                      {r.label}
                    </p>
                    {r.sublabel && (
                      <p className="text-xs text-ink/50 truncate mt-0.5">{r.sublabel}</p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ink/30 group-hover:text-ink ml-auto shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          ))}
          {allResults.length > 0 && (
            <div className="px-4 py-2 border-t-4 border-ink bg-ink/5">
              <p className="font-display text-[10px] uppercase text-ink/30 tracking-widest">
                Press Enter to select · Esc to close
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Discover — Indian Electronic Music Events & Scenes",
      description: "Find the best electronic music events across India, curated by Cats Can Dance. Explore city scenes, genres, and the underground.",
      url: "https://catscandance.com/discover",
      about: CITY_SCENES.map(c => ({
        "@type": "Place",
        name: c.name,
        url: `https://catscandance.com/scene/${c.slug}`,
        description: c.tagline,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://catscandance.com/" },
        { "@type": "ListItem", position: 2, name: "Discover", item: "https://catscandance.com/discover" },
      ],
    },
  ];

  return (
    <main className="bg-cream text-ink">
      <SEO
        title="Discover Events — Cats Can Dance | Best Electronic Music Events in India"
        description="Find curated electronic music events across India — Bengaluru, Mumbai, Delhi, Goa and beyond. House, Techno, Jungle, Garage. Updated daily from Skillbox, District, Insider and more."
        path="/discover"
        keywords="india electronic music events, best techno house events India, discover underground events bangalore mumbai delhi goa, cats can dance curated events"
        jsonLd={jsonLd}
      />
      <Nav />

      {/* ── What's On This Weekend strip ── */}
      <div className="pt-[72px] md:pt-[80px]">
        <WhatsOnStrip />
      </div>

      {/* ── Discover Hero ── */}
      <section className="bg-ink border-b-4 border-ink pt-14 pb-16 md:pt-16 md:pb-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)",
          }}
        />
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-3">
                <Compass className="inline w-4 h-4 mr-2" />
                Curated Events · India
              </p>
              <h1 className="font-display text-cream text-5xl md:text-7xl leading-[0.88] uppercase">
                WHAT'S<br />
                <span className="text-acid-yellow">ON</span><br />
                TONIGHT.
              </h1>
              <p className="text-cream/60 mt-4 max-w-md text-base">
                The best electronic music events across India, pulled daily from Skillbox, District, Insider, HighApe — and hand-picked by us.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/submit-event"
                className="font-display text-xs uppercase bg-cream text-ink px-5 py-2.5 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
              >
                + Submit Your Night
              </Link>
              <Link
                href="/promoters"
                className="font-display text-xs uppercase bg-transparent text-cream px-5 py-2.5 border-4 border-cream/30 hover:border-cream transition-colors"
              >
                Trusted Promoters
              </Link>
            </div>
          </div>
          {/* Search bar */}
          <UniversalSearch />
        </div>
      </section>

      {/* ── Curated Events Grid (main content) ── */}
      <section id="events">
        <CuratedEvents />
      </section>

      {/* ── Indian Cities ── */}
      <section id="indian-scenes" className="container py-16 md:py-24">
        <SectionHeader
          eyebrow="Indian Scenes"
          title="The Cities"
          subtitle="Six cities. Six distinct sounds. One underground."
          accent="bg-acid-yellow"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITY_SCENES.map(city => (
            <CityTile key={city.slug} city={city} />
          ))}
        </div>
      </section>

      {/* ── Genre Wheel ── */}
      <section className="bg-ink border-y-4 border-ink py-16 md:py-24">
        <div className="container">
          <div className="border-b-4 border-cream/20 pb-6 mb-8">
            <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow mb-3">
              Genres
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-cream uppercase leading-tight">
              Pick Your Sound
            </h2>
            <p className="text-cream/50 mt-2 max-w-2xl">
              Every genre explained — origin, BPM, Indian scene, starter tracks.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {GENRE_PAGES.map(genre => (
              <GenreTile key={genre.slug} genre={genre} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Scenes ── */}
      <section id="global-scenes" className="container py-16 md:py-24">
        <SectionHeader
          eyebrow="Global Origins"
          title="Where It Started"
          subtitle="The cities and scenes that created the music you hear in India's clubs."
          accent="bg-electric-blue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GLOBAL_SCENES.map(scene => (
            <GlobalSceneTile key={scene.slug} scene={scene} />
          ))}
        </div>
      </section>

      {/* ── Promoter CTA ── */}
      <section className="bg-magenta border-y-4 border-ink py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl text-cream uppercase">Run a credible night?</h3>
            <p className="text-cream/80 mt-1">Get on the discover feed. Apply to become a verified promoter.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/submit-event"
              className="bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
            >
              Submit Your Night →
            </Link>
            <Link
              href="/promoters"
              className="bg-cream text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
            >
              Browse Promoters
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cross-link: Discover ↔ CCD Events ── */}
      <section className="bg-acid-yellow border-b-4 border-ink py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display text-ink text-xs uppercase tracking-widest mb-1">/ CCD ORIGINALS</p>
            <p className="font-display text-ink text-xl md:text-2xl leading-tight">
              Want CCD's own underground episodes?
            </p>
            <p className="text-ink/60 text-sm font-medium mt-0.5">
              RSVP-only nights — House, Disco, Jungle, Garage, D&B.
            </p>
          </div>
          <Link
            href="/events"
            className="shrink-0 bg-ink text-cream font-display text-sm px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform whitespace-nowrap"
          >
            See CCD Events →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

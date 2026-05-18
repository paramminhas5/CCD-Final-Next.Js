import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-shim";

type EnrichmentLog = { tier?: number; boiler_room?: boolean; rank?: number };
type DBArtist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[];
  bio: string | null; instagram: string | null; soundcloud: string | null;
  website: string | null; booking_email: string | null; photo_url: string | null;
  featured: boolean; labels: string | null;
  enrichment_log: EnrichmentLog | null;
};

const TIER_LABELS: Record<number, string> = { 1:"Global", 2:"Boiler Room", 3:"Intl. Label", 4:"Festival", 5:"Underground" };
const TIER_BG: Record<number, string> = { 1:"bg-magenta", 2:"bg-ink", 3:"bg-cream", 4:"bg-cream", 5:"bg-cream" };
const TIER_TEXT: Record<number, string> = { 1:"text-cream", 2:"text-cream", 3:"text-ink", 4:"text-ink", 5:"text-ink" };

const ensureUrl = (s: string | null) => (s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null);
const cityOf = (a: DBArtist) => a.based_city || a.from_city || "";
const tierOf = (a: DBArtist): number => (a.enrichment_log as any)?.tier ?? 5;
const rankOf = (a: DBArtist): number => (a.enrichment_log as any)?.rank ?? 999;
const isBoilerRoom = (a: DBArtist): boolean => !!(a.enrichment_log as any)?.boiler_room;

const TierBadge = ({ tier }: { tier: number }) => (
  <span className={`text-[9px] font-display uppercase px-1.5 py-0.5 border-2 border-ink ${TIER_BG[tier]} ${TIER_TEXT[tier]}`}>
    {TIER_LABELS[tier] ?? "Rising"}
  </span>
);
const BRBadge = () => (
  <span className="text-[9px] font-display uppercase px-1.5 py-0.5 border-2 border-ink bg-ink text-cream">◉ BR</span>
);

const ArtistCard = ({ a }: { a: DBArtist }) => {
  const tier = tierOf(a);
  const br = isBoilerRoom(a);
  const dark = tier <= 2;
  return (
    <a
      href={`/artists/${a.slug}`}
      className={`text-left border-4 border-ink chunk-shadow p-5 flex flex-col gap-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform ${TIER_BG[tier]}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-display text-xl leading-tight uppercase truncate ${dark ? "text-cream" : "text-ink"}`}>{a.name}</h3>
          {a.members && <p className={`text-xs mt-0.5 ${dark ? "text-cream/60" : "text-ink/60"}`}>{a.members}</p>}
          <p className={`text-xs mt-1 ${dark ? "text-cream/60" : "text-ink/60"}`}>{cityOf(a)}</p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <TierBadge tier={tier} />
          {br && tier > 1 && <BRBadge />}
        </div>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {a.genres.slice(0, 3).map((g) => (
          <span key={g} className={`text-[10px] font-display uppercase px-2 py-0.5 border-2 ${dark ? "border-cream/40 text-cream/80" : "border-ink bg-acid-yellow text-ink"}`}>{g}</span>
        ))}
      </div>
      {a.bio && <p className={`text-sm line-clamp-2 ${dark ? "text-cream/80" : "text-ink/80"}`}>{a.bio}</p>}
      {a.labels && <p className={`text-xs font-display ${dark ? "text-cream/60" : "text-ink/60"}`}>{a.labels}</p>}
      {a.festivals.length > 0 && (
        <p className={`text-xs line-clamp-1 mt-auto pt-1 ${dark ? "text-cream/50" : "text-ink/50"}`}>{a.festivals.slice(0, 2).join(" · ")}</p>
      )}
    </a>
  );
};

type SortMode = "tier" | "az" | "city";

const ArtistsPage = () => {
  const [artists, setArtists] = useState<DBArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<SortMode>("tier");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,instagram,soundcloud,website,booking_email,photo_url,featured,labels,enrichment_log")
        .eq("status", "approved")
        .order("name", { ascending: true });
      if (error) console.error("artists fetch", error);
      setArtists((data ?? []) as DBArtist[]);
      setLoading(false);
    })();
  }, []);

  const allCities = useMemo(() => {
    const s = new Set<string>();
    for (const a of artists) { const c = cityOf(a); if (c) s.add(c.split(",")[0].trim()); }
    return Array.from(s).sort();
  }, [artists]);

  const allGenres = useMemo(() => {
    const s = new Set<string>();
    for (const a of artists) for (const g of a.genres) s.add(g);
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
      if (tierFilter !== null && tierOf(a) !== tierFilter) return false;
      if (activeGenres.size > 0 && !a.genres.some((g) => activeGenres.has(g))) return false;
      if (!ql) return true;
      return (
        a.name.toLowerCase().includes(ql) ||
        a.genres.join(" ").toLowerCase().includes(ql) ||
        cityOf(a).toLowerCase().includes(ql) ||
        (a.bio ?? "").toLowerCase().includes(ql) ||
        a.festivals.join(" ").toLowerCase().includes(ql) ||
        (a.labels ?? "").toLowerCase().includes(ql)
      );
    });
    if (sort === "city") rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || a.name.localeCompare(b.name));
    else if (sort === "az") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name));
    return rows;
  }, [artists, q, city, activeGenres, tierFilter, sort]);

  const featuredArtists = useMemo(() => artists.filter((a) => a.featured), [artists]);
  const tierCounts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const a of artists) { const t = tierOf(a); c[t] = (c[t] ?? 0) + 1; }
    return c;
  }, [artists]);

  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "India's Top Electronic Artists — Cats Can Dance",
    itemListElement: artists.slice(0, 30).map((a, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "MusicGroup", name: a.name, genre: a.genres.join(", ") },
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Artists — India's Top Electronic DJs & Producers | Cats Can Dance"
        description="81 festival-credentialed Indian electronic artists — from Coachella headliners to Boiler Room alumni and underground heroes. Filter by city, genre, and tier."
        path="/artists"
        keywords="Indian electronic DJs, India techno house artists, book Indian DJ, Magnetic Fields lineup, Boiler Room India, Coachella Indian artists"
        jsonLd={itemListLd}
      />
      <Nav />
      <PageHero eyebrow="Artists" title="India's Electronic Artists">
        <p className="text-cream/90 max-w-2xl">
          81 festival-credentialed DJs and producers — from Coachella headliners to underground heroes.
          Pure electronic, no Bollywood.
        </p>
      </PageHero>

      {!loading && featuredArtists.length > 0 && (
        <section className="container py-10 border-b-4 border-ink">
          <h2 className="font-display text-2xl uppercase text-ink mb-2">🌍 Global Breakthrough</h2>
          <p className="text-sm text-ink/60 mb-6">Indian-origin acts playing Coachella, Boiler Room London, and global clubs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featuredArtists.map((a) => <ArtistCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      <section className="container py-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block font-display text-sm text-ink mb-1">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, genre, festival, label, city…" className="border-4 border-ink" />
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 px-3 border-4 border-ink bg-cream font-display max-w-[200px]">
              <option value="All">All cities</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="h-10 px-3 border-4 border-ink bg-cream font-display">
              <option value="tier">By Tier</option>
              <option value="az">A–Z</option>
              <option value="city">By City</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setTierFilter(null)} className={`text-xs font-display uppercase px-3 py-1.5 border-4 border-ink ${tierFilter === null ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
            All ({artists.length})
          </button>
          {[1,2,3,4,5].map((t) => (
            <button key={t} onClick={() => setTierFilter(tierFilter === t ? null : t)}
              className={`text-xs font-display uppercase px-3 py-1.5 border-4 border-ink ${tierFilter === t ? "bg-magenta text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
              {TIER_LABELS[t]} ({tierCounts[t] ?? 0})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {allGenres.map((g) => {
            const active = activeGenres.has(g);
            return (
              <button key={g} onClick={() => toggleGenre(g)}
                className={`text-xs font-display uppercase px-3 py-1.5 border-4 border-ink ${active ? "bg-magenta text-cream" : "bg-cream text-ink hover:bg-acid-yellow"}`}>
                {g}
              </button>
            );
          })}
          {activeGenres.size > 0 && (
            <button onClick={() => setActiveGenres(new Set())} className="text-xs font-display underline text-ink/70 px-2">Clear genres</button>
          )}
        </div>

        <p className="font-display text-sm text-ink/60 mb-4">
          {loading ? "Loading…" : `Showing ${filtered.length} of ${artists.length} artists`}
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/40 p-12 text-center">
            <p className="font-display text-2xl text-ink mb-2">No artists match.</p>
            <p className="text-ink/60">Try clearing filters or a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => <ArtistCard key={a.id} a={a} />)}
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div className="mt-12 border-t-4 border-ink pt-8">
            <h3 className="font-display text-sm uppercase text-ink/60 mb-3">Tier Guide</h3>
            <div className="flex flex-wrap gap-3">
              {[1,2,3,4,5].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <TierBadge tier={t} />
                  <span className="text-xs text-ink/60">{TIER_LABELS[t]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2"><BRBadge /><span className="text-xs text-ink/60">Boiler Room alumni</span></div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default ArtistsPage;

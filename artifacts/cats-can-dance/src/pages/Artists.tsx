import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-shim";

type DBArtist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[];
  bio: string | null; why: string | null;
  instagram: string | null; soundcloud: string | null;
  website: string | null; booking_email: string | null;
  photo_url: string | null; labels: string | null;
  fee_min_inr: number | null; fee_max_inr: number | null;
  fee_currency: string; open_to_bookings: boolean;
};

const cityOf = (a: DBArtist) => a.based_city || a.from_city || "";
const ensureUrl = (s: string | null) => (s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null);

function ArtistCard({ a }: { a: DBArtist }) {
  const city = cityOf(a);
  const igUrl = a.instagram ? ensureUrl(a.instagram) : null;
  const scUrl = a.soundcloud ? ensureUrl(a.soundcloud) : null;
  const initials = a.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="bg-cream border-4 border-ink chunk-shadow flex flex-col overflow-hidden group">
      {/* Photo or initials placeholder */}
      <a href={`/artists/${a.slug}`} className="block">
        {a.photo_url ? (
          <img src={a.photo_url} alt={a.name}
            className="w-full h-48 object-cover border-b-4 border-ink group-hover:brightness-90 transition-all" />
        ) : (
          <div className="w-full h-48 bg-ink border-b-4 border-ink flex items-center justify-center group-hover:bg-magenta transition-colors">
            <span className="font-display text-6xl text-cream/20 leading-none">{initials}</span>
          </div>
        )}
      </a>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <a href={`/artists/${a.slug}`} className="block hover:text-magenta transition-colors">
            <h3 className="font-display text-xl text-ink leading-tight uppercase">{a.name}</h3>
          </a>
          {a.members && <p className="text-xs text-ink/50 mt-0.5">{a.members}</p>}
          {city && <p className="text-xs text-ink/50 mt-0.5">{city}</p>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {a.genres.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border-2 border-ink">{g}</span>
          ))}
        </div>

        {(a.why || a.bio) && (
          <p className="text-sm text-ink/70 line-clamp-2 flex-1">{a.why || a.bio}</p>
        )}

        {a.labels && (
          <p className="text-xs text-ink/50 font-display">{a.labels}</p>
        )}

        {a.festivals.length > 0 && (
          <p className="text-xs text-ink/40 line-clamp-1">{a.festivals.slice(0, 3).join(" · ")}</p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t-2 border-ink/10">
          <a href={`/artists/${a.slug}`}
            className="flex-1 text-center font-display text-xs uppercase bg-ink text-cream px-3 py-2 border-2 border-ink hover:bg-magenta transition-colors">
            View Profile
          </a>
          {scUrl && (
            <a href={scUrl} target="_blank" rel="noreferrer"
              className="font-display text-xs uppercase bg-[#ff5500] text-cream px-3 py-2 border-2 border-ink hover:opacity-80 transition-opacity"
              title="SoundCloud">SC</a>
          )}
          {igUrl && (
            <a href={igUrl} target="_blank" rel="noreferrer"
              className="font-display text-xs uppercase bg-cream text-ink px-3 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors"
              title="Instagram">IG</a>
          )}
          {a.booking_email && (
            <a href={`mailto:${a.booking_email}`}
              className="font-display text-xs uppercase bg-acid-yellow text-ink px-3 py-2 border-2 border-ink hover:bg-magenta hover:text-cream transition-colors"
              title="Book">✉</a>
          )}
        </div>
      </div>
    </div>
  );
}

type SortMode = "az" | "city" | "genre";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<DBArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>("az");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,why,instagram,soundcloud,website,booking_email,photo_url,labels,fee_min_inr,fee_max_inr,fee_currency,open_to_bookings")
        .eq("status", "approved")
        .order("name", { ascending: true });
      if (error) console.error("artists fetch", error);
      setArtists((data ?? []) as DBArtist[]);
      setLoading(false);
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
      if (activeGenres.size > 0 && !a.genres.some((g) => activeGenres.has(g))) return false;
      if (!ql) return true;
      return (
        a.name.toLowerCase().includes(ql) ||
        a.genres.join(" ").toLowerCase().includes(ql) ||
        cityOf(a).toLowerCase().includes(ql) ||
        (a.bio ?? "").toLowerCase().includes(ql) ||
        (a.why ?? "").toLowerCase().includes(ql) ||
        a.festivals.join(" ").toLowerCase().includes(ql) ||
        (a.labels ?? "").toLowerCase().includes(ql)
      );
    });
    if (sort === "city") rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || a.name.localeCompare(b.name));
    else if (sort === "genre") rows = [...rows].sort((a, b) => (a.genres[0] ?? "").localeCompare(b.genres[0] ?? "") || a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [artists, q, city, activeGenres, sort]);

  const withSoundcloud = useMemo(() => artists.filter((a) => a.soundcloud), [artists]);

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Artists — India's Electronic DJs & Producers | Cats Can Dance"
        description={`${artists.length} festival-credentialed Indian electronic artists. Find, discover, and book DJs and producers across India.`}
        path="/artists"
        keywords="Indian electronic DJs, India techno house artists, book Indian DJ, Magnetic Fields, DGTL, Echoes of Earth"
      />
      <Nav />
      <PageHero eyebrow="Artists" title="India's Electronic Artists">
        <p className="text-cream/90 max-w-2xl">
          {artists.length > 0 ? `${artists.length} ` : ""}Festival-credentialed DJs and producers.
          Pure electronic — filter, discover, book.
        </p>
      </PageHero>

      <section className="container py-8">
        {/* Search + filters */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block font-display text-sm text-ink mb-1">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Name, genre, festival, label, city…" className="border-4 border-ink" />
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="h-10 px-3 border-4 border-ink bg-cream font-display max-w-[200px]">
              <option value="All">All cities</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-10 px-3 border-4 border-ink bg-cream font-display">
              <option value="az">A–Z</option>
              <option value="city">By City</option>
              <option value="genre">By Genre</option>
            </select>
          </div>
        </div>

        {/* Genre pills */}
        {allGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allGenres.map((g) => {
              const active = activeGenres.has(g);
              return (
                <button key={g} onClick={() => toggleGenre(g)}
                  className={`text-xs font-display uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                    active ? "bg-magenta text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                  }`}>
                  {g}
                </button>
              );
            })}
            {activeGenres.size > 0 && (
              <button onClick={() => setActiveGenres(new Set())}
                className="text-xs font-display underline text-ink/50 px-2">Clear</button>
            )}
          </div>
        )}

        <p className="font-display text-sm text-ink/50 mb-6">
          {loading ? "Loading…" : `${filtered.length} artist${filtered.length !== 1 ? "s" : ""}`}
          {withSoundcloud.length > 0 && !loading && (
            <span className="ml-3 text-[#ff5500]">· {withSoundcloud.length} on SoundCloud</span>
          )}
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/30 p-16 text-center">
            <p className="font-display text-3xl text-ink mb-3 uppercase">No artists match.</p>
            <p className="text-ink/50">Try clearing filters or a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(loading ? Array(12).fill(null) : filtered).map((a, i) =>
              a ? <ArtistCard key={a.id} a={a} /> : (
                <div key={i} className="bg-cream border-4 border-ink/20 h-64 animate-pulse" />
              )
            )}
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div className="mt-16 border-t-4 border-ink pt-8 text-center">
            <p className="font-display text-ink/50 text-sm mb-4">Are you an artist? Get your profile on CCD.</p>
            <a href="/for-artists"
              className="inline-block font-display text-sm uppercase bg-acid-yellow text-ink px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Submit your profile →
            </a>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type DBArtist = {
  id: string;
  slug: string;
  name: string;
  members: string | null;
  from_city: string | null;
  based_city: string | null;
  genres: string[];
  festivals: string[];
  bio: string | null;
  instagram: string | null;
  website: string | null;
  booking_email: string | null;
  photo_url: string | null;
};

const ensureUrl = (s: string | null) => (s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null);
const cityOf = (a: DBArtist) => a.based_city || a.from_city || "";

const ArtistCard = ({ a }: { a: DBArtist }) => (
  <a
    href={`/artists/${a.slug}`}
    className="text-left bg-cream border-4 border-ink chunk-shadow p-5 flex flex-col gap-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
  >
    <header className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-xl text-ink leading-tight uppercase">{a.name}</h3>
        {a.members && <p className="text-xs text-ink/60 mt-0.5">{a.members}</p>}
        <p className="text-xs text-ink/60 mt-1">
          {cityOf(a)}
          {a.from_city && a.based_city && a.from_city !== a.based_city ? ` · from ${a.from_city}` : ""}
        </p>
      </div>

    </header>
    <div className="flex flex-wrap gap-1.5">
      {a.genres.slice(0, 3).map((g) => (
        <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border-2 border-ink">
          {g}
        </span>
      ))}
    </div>
    {a.bio && <p className="text-sm text-ink/80 line-clamp-3">{a.bio.split("\n")[0]}</p>}
    {a.festivals.length > 0 && (
      <p className="text-xs text-ink/60 mt-auto pt-2 line-clamp-1">
        <span className="font-display">CREDITS:</span> {a.festivals.slice(0, 3).join(" · ")}
      </p>
    )}
  </a>
);

const ArtistsPage = () => {
  const [artists, setArtists] = useState<DBArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"az" | "city">("az");
  const [open, setOpen] = useState<DBArtist | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,instagram,website,booking_email,photo_url")
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
    const next = new Set(genres);
    next.has(g) ? next.delete(g) : next.add(g);
    setGenres(next);
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    let rows = artists.filter((a) => {
      if (city !== "All" && !cityOf(a).toLowerCase().includes(city.toLowerCase())) return false;
      if (genres.size > 0 && !a.genres.some((g) => genres.has(g))) return false;
      if (!ql) return true;
      return (
        a.name.toLowerCase().includes(ql) ||
        a.genres.join(" ").toLowerCase().includes(ql) ||
        cityOf(a).toLowerCase().includes(ql) ||
        (a.bio ?? "").toLowerCase().includes(ql) ||
        a.festivals.join(" ").toLowerCase().includes(ql)
      );
    });
    if (sort === "city") rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [artists, q, city, genres, sort]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "India's Top Electronic Artists — Cats Can Dance",
    itemListElement: artists.slice(0, 30).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "MusicGroup", name: a.name, genre: a.genres.join(", ") },
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Artists — India's Top Electronic DJs & Producers | Cats Can Dance"
        description="A directory of India's top electronic artists — searchable by city, genre, and stage credits."
        path="/artists"
        keywords="Indian electronic DJs, India techno house artists, book Indian DJ, Magnetic Fields lineup"
        jsonLd={itemListLd}
      />
      <Nav />
      <PageHero eyebrow="Artists" title="India's Electronic Artists">
        <p className="text-cream/90 max-w-2xl">
          Festival-credentialed DJs and producers — pure electronic, no Bollywood.
          Filter by city, genre, and stage credits.
        </p>
      </PageHero>

      <section className="container py-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block font-display text-sm text-ink mb-1">Search</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, genre, festival, city…"
              className="border-4 border-ink"
            />
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 px-3 border-4 border-ink bg-cream font-display max-w-[200px]"
            >
              <option value="All">All cities</option>
              {allCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "az" | "city")}
              className="h-10 px-3 border-4 border-ink bg-cream font-display"
            >
              <option value="az">A–Z</option>
              <option value="city">By city</option>
            </select>
          </div>

        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {allGenres.map((g) => {
            const active = genres.has(g);
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`text-xs font-display uppercase px-3 py-1.5 border-4 border-ink ${
                  active ? "bg-magenta text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                }`}
              >
                {g}
              </button>
            );
          })}
          {genres.size > 0 && (
            <button onClick={() => setGenres(new Set())} className="text-xs font-display underline text-ink/70 px-2">
              Clear
            </button>
          )}
        </div>

        <p className="font-display text-sm text-ink/60 mb-4">
          {loading ? "Loading…" : `Showing ${filtered.length} of ${artists.length}`}
        </p>
        {!loading && filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/40 p-12 text-center">
            <p className="font-display text-2xl text-ink mb-2">No artists match.</p>
            <p className="text-ink/60">Try clearing filters or a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <ArtistCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl bg-cream border-4 border-ink">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl uppercase text-ink">
                  {open.name}
                </DialogTitle>
                {open.members && <p className="text-sm text-ink/60">{open.members}</p>}
              </DialogHeader>
              <div className="space-y-3 text-sm text-ink">
                {(open.from_city || open.based_city) && (
                  <p>
                    {open.based_city && (
                      <>
                        <strong className="font-display">Based:</strong> {open.based_city}
                      </>
                    )}
                    {open.from_city && open.from_city !== open.based_city && (
                      <>
                        {" · "}
                        <strong className="font-display">From:</strong> {open.from_city}
                      </>
                    )}
                  </p>
                )}
                {open.genres.length > 0 && (
                  <p>
                    <strong className="font-display">Genres:</strong> {open.genres.join(" / ")}
                  </p>
                )}
                {open.festivals.length > 0 && (
                  <p>
                    <strong className="font-display">Festivals:</strong> {open.festivals.join(", ")}
                  </p>
                )}
                {open.bio && <p className="text-ink/80 whitespace-pre-line">{open.bio}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  {open.instagram && /^[a-z0-9._]+$/i.test(open.instagram) && (
                    <a
                      href={`https://instagram.com/${open.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-magenta text-cream font-display px-3 py-2 border-4 border-ink chunk-shadow text-xs"
                    >
                      @{open.instagram}
                    </a>
                  )}
                  {ensureUrl(open.website) && (
                    <a
                      href={ensureUrl(open.website)!}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-cream text-ink font-display px-3 py-2 border-4 border-ink chunk-shadow text-xs"
                    >
                      Website
                    </a>
                  )}
                  {open.booking_email && (
                    <a
                      href={`mailto:${open.booking_email}`}
                      className="bg-acid-yellow text-ink font-display px-3 py-2 border-4 border-ink chunk-shadow text-xs"
                    >
                      Book
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ArtistsPage;

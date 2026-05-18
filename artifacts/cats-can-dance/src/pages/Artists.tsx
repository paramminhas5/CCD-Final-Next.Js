import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-shim";

type DBArtist = {
  id: string; slug: string; name: string; members: string | null;
  from_city: string | null; based_city: string | null;
  genres: string[]; festivals: string[];
  bio: string | null; why: string | null;
  instagram: string | null; soundcloud: string | null; website: string | null;
  booking_email: string | null; photo_url: string | null; labels: string | null;
  fee_min_inr: number | null; fee_max_inr: number | null;
  videos: { youtube_id?: string; title?: string }[];
  gallery: { url: string }[];
};

const cityOf = (a: DBArtist) => a.based_city || a.from_city || "";
const ensureUrl = (s: string | null) =>
  s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null;

// Generate a stable pastel-ish bg from name
const nameBg = (name: string) => {
  const colors = [
    "bg-magenta", "bg-electric-blue", "bg-ink",
    "bg-orange", "bg-acid-yellow",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
};
const nameTextColor = (bg: string) =>
  bg === "bg-acid-yellow" ? "text-ink" : "text-cream";

// Grab first YouTube thumbnail or null
const ytThumb = (a: DBArtist): string | null => {
  const vid = Array.isArray(a.videos) ? a.videos.find((v) => v.youtube_id) : null;
  return vid?.youtube_id
    ? `https://img.youtube.com/vi/${vid.youtube_id}/mqdefault.jpg`
    : null;
};

const cover = (a: DBArtist) =>
  a.photo_url ||
  (Array.isArray(a.gallery) && a.gallery[0]?.url) ||
  ytThumb(a);

function ArtistCard({ a, size = "md" }: { a: DBArtist; size?: "sm" | "md" | "lg" }) {
  const bg = nameBg(a.name);
  const tc = nameTextColor(bg);
  const img = cover(a);
  const initials = a.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const scUrl = a.soundcloud ? ensureUrl(a.soundcloud) : null;
  const igUrl = a.instagram ? ensureUrl(a.instagram.startsWith("http") ? a.instagram : `https://instagram.com/${a.instagram.replace(/^@/, "")}`) : null;

  return (
    <a
      href={`/artists/${a.slug}`}
      className={`group relative block overflow-hidden border-4 border-ink chunk-shadow
        hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all
        ${size === "lg" ? "aspect-[3/4]" : size === "sm" ? "aspect-square" : "aspect-[4/5]"}`}
    >
      {/* Cover image or colour block */}
      {img ? (
        <img
          src={img} alt={a.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className={`absolute inset-0 ${bg} flex items-center justify-center`}>
          <span className={`font-display leading-none select-none ${tc}
            ${size === "sm" ? "text-4xl" : "text-6xl md:text-8xl"} opacity-30`}>
            {initials}
          </span>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <p className="font-display text-cream leading-tight uppercase
          text-base md:text-lg truncate">
          {a.name}
        </p>
        {cityOf(a) && (
          <p className="text-cream/60 text-xs mt-0.5 truncate">{cityOf(a)}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {a.genres.slice(0, 2).map((g) => (
            <span key={g}
              className="text-[9px] font-display uppercase bg-acid-yellow text-ink px-1.5 py-0.5 leading-none">
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* SC/IG badges top-right */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {scUrl && (
          <span onClick={(e) => { e.preventDefault(); window.open(scUrl, "_blank"); }}
            className="text-[9px] font-display bg-[#ff5500] text-cream px-1.5 py-1 leading-none border border-cream/20">
            SC
          </span>
        )}
        {igUrl && (
          <span onClick={(e) => { e.preventDefault(); window.open(igUrl, "_blank"); }}
            className="text-[9px] font-display bg-cream/10 text-cream px-1.5 py-1 leading-none border border-cream/20 backdrop-blur-sm">
            IG
          </span>
        )}
      </div>
    </a>
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
        .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,why,instagram,soundcloud,website,booking_email,photo_url,labels,fee_min_inr,fee_max_inr,videos,gallery")
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
        (a.why ?? "").toLowerCase().includes(ql) ||
        (a.festivals ?? []).join(" ").toLowerCase().includes(ql) ||
        (a.labels ?? "").toLowerCase().includes(ql)
      );
    });
    if (sort === "city") rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b)) || a.name.localeCompare(b.name));
    else if (sort === "genre") rows = [...rows].sort((a, b) => ((a.genres ?? [])[0] ?? "").localeCompare((b.genres ?? [])[0] ?? "") || a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [artists, q, city, activeGenres, sort]);

  const withMedia = useMemo(() => artists.filter((a) => cover(a)), [artists]);

  return (
    <div className="min-h-screen bg-ink">
      <SEO
        title="Artists — India's Electronic DJs & Producers | Cats Can Dance"
        description={`${artists.length || ""}  festival-credentialed Indian electronic artists. Discover and book DJs and producers across India.`}
        path="/artists"
        keywords="Indian electronic DJs, India techno house artists, book Indian DJ, Magnetic Fields, DGTL"
      />
      <Nav />

      {/* ── Compact sticky header ──────────────────────────────────────────── */}
      <div className="sticky top-[60px] md:top-[72px] z-40 bg-ink border-b-4 border-cream/10 pt-4 pb-3 px-4 md:px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <h1 className="font-display text-cream text-2xl md:text-3xl uppercase leading-none">
              Artists
              {!loading && <span className="text-cream/30 ml-3 text-base font-display">/ {artists.length}</span>}
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="border-2 border-cream/20 bg-cream/5 text-cream placeholder:text-cream/30 h-8 text-sm w-full sm:w-48"
            />
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="h-8 px-2 border-2 border-cream/20 bg-ink text-cream font-display text-xs">
              <option value="All">All cities</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-8 px-2 border-2 border-cream/20 bg-ink text-cream font-display text-xs">
              <option value="az">A–Z</option>
              <option value="city">City</option>
              <option value="genre">Genre</option>
            </select>
          </div>
        </div>

        {/* Genre pills */}
        {allGenres.length > 0 && (
          <div className="max-w-screen-2xl mx-auto flex flex-wrap gap-1.5 mt-2">
            {allGenres.map((g) => {
              const active = activeGenres.has(g);
              return (
                <button key={g} onClick={() => toggleGenre(g)}
                  className={`text-[10px] font-display uppercase px-2 py-1 border border-cream/20 transition-colors ${
                    active ? "bg-magenta text-cream border-magenta" : "bg-transparent text-cream/50 hover:text-cream hover:border-cream/50"
                  }`}>
                  {g}
                </button>
              );
            })}
            {activeGenres.size > 0 && (
              <button onClick={() => setActiveGenres(new Set())}
                className="text-[10px] font-display text-cream/30 hover:text-cream px-1 underline">
                clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Instagram-style grid ───────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-2 md:px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {Array(24).fill(null).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-cream/5 animate-pulse border-4 border-cream/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-display text-cream/30 text-3xl uppercase mb-3">No artists match.</p>
            <button onClick={() => { setQ(""); setCity("All"); setActiveGenres(new Set()); }}
              className="font-display text-cream/50 text-sm underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <p className="font-display text-cream/30 text-xs mb-3 px-1">
              {filtered.length} artists
              {withMedia.length > 0 && ` · ${withMedia.length} with media`}
              {activeGenres.size > 0 && ` · filtered by genre`}
            </p>

            {/* Grid — varying sizes for visual interest */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {filtered.map((a, i) => {
                // Every 7th starting at 0 gets a large card (2-col span)
                const isLarge = i % 7 === 0 && cover(a);
                return (
                  <div
                    key={a.id}
                    className={isLarge ? "col-span-2 row-span-1" : ""}
                  >
                    <ArtistCard
                      a={a}
                      size={isLarge ? "lg" : i % 5 === 3 ? "sm" : "md"}
                    />
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-16 py-12 border-t border-cream/10 text-center">
              <p className="font-display text-cream/40 text-sm mb-4 uppercase">
                Are you an artist?
              </p>
              <a href="/for-artists"
                className="inline-block font-display text-sm uppercase bg-acid-yellow text-ink px-6 py-3 border-4 border-acid-yellow chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
                Get on CCD →
              </a>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

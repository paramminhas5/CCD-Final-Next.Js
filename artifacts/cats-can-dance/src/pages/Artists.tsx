import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Music, MapPin, Search, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  if (a.videos && a.videos.length > 0) {
    const first = a.videos[0];
    if (typeof first === "string") return first;
    if (first?.thumbnail) return first.thumbnail;
    if (first?.cover) return first.cover;
  }
  return null;
}

type SortMode = "az" | "city" | "genre";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<DBArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>("az");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("artists")
          .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,why,instagram,soundcloud,website,booking_email,photo_url,labels,fee_min_inr,fee_max_inr,videos,gallery")
          .eq("status", "approved")
          .order("name", { ascending: true });

        if (error) {
          console.error("artists fetch error:", error);
          setError(error.message);
          toast({
            title: "Error loading artists",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setArtists((data ?? []) as DBArtist[]);
          if ((data ?? []).length === 0) {
            const { data: allData, error: allError } = await supabase
              .from("artists")
              .select("id,slug,name,members,from_city,based_city,genres,festivals,bio,why,instagram,soundcloud,website,booking_email,photo_url,labels,fee_min_inr,fee_max_inr,videos,gallery")
              .order("name", { ascending: true })
              .limit(5);

            if (!allError && (allData ?? []).length > 0) {
              setError("No approved artists found. Artists exist but may have a different status value. Check the 'status' column in your database.");
            }
          }
        }
      } catch (e: any) {
        console.error("Unexpected error fetching artists:", e);
        setError(e.message || "Unexpected error");
        toast({
          title: "Error loading artists",
          description: e.message || "Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

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
    <div className="min-h-screen bg-[#0a0a0f] text-cream">
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight shrink-0">Artists</h1>

            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-cream/20 bg-cream/5 text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-cream/40"
                />
                {q && (
                  <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-cream/20 bg-cream/5 text-cream text-sm focus:outline-none focus:border-cream/40"
              >
                <option value="All">All cities</option>
                {allCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="px-3 py-1.5 rounded-lg border border-cream/20 bg-cream/5 text-cream text-sm focus:outline-none focus:border-cream/40"
              >
                <option value="az">A–Z</option>
                <option value="city">City</option>
                <option value="genre">Genre</option>
              </select>
            </div>
          </div>

          {allGenres.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {allGenres.map((g) => {
                const active = activeGenres.has(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
                      active
                        ? "bg-cream/15 border-cream/40 text-cream"
                        : "border-cream/15 text-cream/50 hover:border-cream/30 hover:text-cream/70"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
              {activeGenres.size > 0 && (
                <button
                  onClick={() => setActiveGenres(new Set())}
                  className="px-2 py-0.5 rounded-full text-xs text-cream/40 hover:text-cream/60 border border-cream/10 hover:border-cream/20"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array(24).fill(null).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-cream/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <AlertTriangle className="w-12 h-12 text-amber-500/60 mb-4" />
            <h2 className="text-lg font-semibold text-cream/80 mb-2">Couldn&apos;t load artists</h2>
            <p className="text-cream/50 text-sm text-center max-w-md mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline" className="border-cream/20 text-cream/70">
                Retry
              </Button>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-cream/5 border border-cream/10 max-w-lg">
              <p className="text-xs text-cream/40 mb-2 font-semibold uppercase tracking-wider">Debugging tips:</p>
              <ul className="text-xs text-cream/40 space-y-1 list-disc list-inside">
                <li>Check that the <code className="text-cream/60 bg-cream/10 px-1 rounded">artists</code> table exists in Supabase</li>
                <li>Verify the <code className="text-cream/60 bg-cream/10 px-1 rounded">status</code> column has values like &quot;approved&quot;</li>
                <li>Check browser console for Supabase connection errors</li>
                <li>Ensure RLS policies allow reading the artists table</li>
              </ul>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Music className="w-12 h-12 text-cream/20 mb-4" />
            <h2 className="text-lg font-semibold text-cream/60 mb-2">No artists match</h2>
            <p className="text-cream/40 text-sm text-center">
              {artists.length === 0
                ? "No artists found in the database. Add some artists to get started."
                : "Try adjusting your filters or search query."
              }
            </p>
            {artists.length > 0 && (q || city !== "All" || activeGenres.size > 0) && (
              <Button
                onClick={() => { setQ(""); setCity("All"); setActiveGenres(new Set()); }}
                variant="outline"
                className="mt-4 border-cream/20 text-cream/70"
              >
                <X className="w-4 h-4 mr-1.5" /> Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-cream/40 mb-4">
              <span>{filtered.length} artists</span>
              {withMedia.length > 0 && <span>· {withMedia.length} with media</span>}
              {activeGenres.size > 0 && <span>· filtered by genre</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((a, i) => {
                const isLarge = i % 7 === 0 && cover(a);
                const img = cover(a);
                return (
                  <Link
                    key={a.id}
                    href={`/artists/${a.slug}`}
                    className={`group relative rounded-xl overflow-hidden bg-cream/5 border border-cream/10 hover:border-cream/20 transition-all ${
                      isLarge ? "col-span-2 row-span-2" : "aspect-square"
                    }`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cream/20">
                        <Music className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="font-semibold text-cream text-sm truncate">{a.name}</div>
                      {cityOf(a) && (
                        <div className="text-xs text-cream/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {cityOf(a)}
                        </div>
                      )}
                      {(a.genres ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(a.genres ?? []).slice(0, 2).map(g => (
                            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream/10 text-cream/70">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <p className="text-cream/40 text-sm">
                Are you an artist?{" "}
                <Link href="/for-artists" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Join the roster
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

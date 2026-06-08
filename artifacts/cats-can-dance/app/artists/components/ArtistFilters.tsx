"use client";
/**
 * ArtistFilters — the interactive filter/search bar + filtered grid.
 *
 * This is the only client component on the artists list page.
 * It receives the full artist list from the server (already fetched,
 * zero network cost) and does all filtering/sorting in memory on the client.
 *
 * Pattern:
 *   Server (page.tsx) fetches all artists → passes as prop
 *   Client (this)     handles search/filter/sort state
 *   Server (ArtistGrid) renders the result list (re-used here)
 */
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import ArtistGrid, { cityOf } from "./ArtistGrid";
import type { Artist } from "@/lib/db/types";

type SortMode = "az" | "city" | "genre";

interface Props {
  artists: Artist[];
}

export default function ArtistFilters({ artists }: Props) {
  const [q,            setQ]            = useState("");
  const [city,         setCity]         = useState("All");
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [sort,         setSort]         = useState<SortMode>("az");
  const [bookingsOnly, setBookingsOnly] = useState(false);

  // ── Derived option lists ────────────────────────────────────────────────────
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
    for (const a of artists) for (const g of (a.genres ?? [])) s.add(g);
    return Array.from(s).sort();
  }, [artists]);

  const toggleGenre = (g: string) => {
    setActiveGenres((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    let rows = artists.filter((a) => {
      if (city !== "All" && !cityOf(a).toLowerCase().includes(city.toLowerCase())) return false;
      if (activeGenres.size > 0 && !(a.genres ?? []).some((g) => activeGenres.has(g)))  return false;
      if (bookingsOnly && !a.open_to_bookings) return false;
      if (!ql) return true;
      return (
        a.name.toLowerCase().includes(ql) ||
        (a.genres ?? []).join(" ").toLowerCase().includes(ql) ||
        cityOf(a).toLowerCase().includes(ql) ||
        (a.bio    ?? "").toLowerCase().includes(ql) ||
        (a.labels ?? "").toLowerCase().includes(ql)
      );
    });

    if (sort === "city")  rows = [...rows].sort((a, b) => cityOf(a).localeCompare(cityOf(b))   || a.name.localeCompare(b.name));
    else if (sort === "genre") rows = [...rows].sort((a, b) => ((a.genres ?? [])[0] ?? "").localeCompare((b.genres ?? [])[0] ?? "") || a.name.localeCompare(b.name));
    else rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    return rows;
  }, [artists, q, city, activeGenres, sort, bookingsOnly]);

  const hasActiveFilters = q || city !== "All" || activeGenres.size > 0 || bookingsOnly;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
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
                <button
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City */}
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

            {/* Bookings toggle */}
            <button
              onClick={() => setBookingsOnly((b) => !b)}
              className={[
                "px-3 py-2 border-4 border-ink font-display text-xs uppercase whitespace-nowrap transition-colors",
                bookingsOnly ? "bg-magenta text-cream" : "bg-transparent text-ink hover:bg-acid-yellow",
              ].join(" ")}
            >
              {bookingsOnly ? "◉ BOOKINGS OPEN ×" : "◉ BOOKINGS OPEN"}
            </button>
          </div>

          {/* Genre pills */}
          {allGenres.length > 0 && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {allGenres.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={[
                    "px-3 py-1 border-2 border-ink font-display text-xs whitespace-nowrap transition-colors",
                    activeGenres.has(g) ? "bg-ink text-cream" : "bg-transparent text-ink hover:bg-acid-yellow",
                  ].join(" ")}
                >
                  {g.toUpperCase()}
                </button>
              ))}
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

      {/* ── Results grid ──────────────────────────────────────────────────── */}
      <section className="bg-cream border-b-4 border-ink py-10 md:py-16 bg-grain min-h-[60vh]">
        <div className="container">
          {filtered.length === 0 && hasActiveFilters ? (
            <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 inline-block">
              <p className="font-display text-2xl text-ink mb-2">NO ARTISTS MATCH</p>
              <p className="text-ink/70 text-sm mb-4">Try adjusting your filters.</p>
              <button
                onClick={() => { setQ(""); setCity("All"); setActiveGenres(new Set()); setBookingsOnly(false); }}
                className="bg-ink text-cream font-display px-5 py-2 border-4 border-ink hover:bg-ink/80 transition-colors"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <ArtistGrid artists={filtered} />
          )}
        </div>
      </section>
    </>
  );
}

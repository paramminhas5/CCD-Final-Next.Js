"use client";
/**
 * Artist Marketplace — /book
 * Browse artists available for booking, filter by city/genre/fee,
 * and send a booking inquiry directly.
 */
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, MapPin, Music, X, ChevronDown, CalendarDays, Zap, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BookingForm from "@/components/booking/BookingForm";
import { useAuth } from "@clerk/react";

interface Artist {
  id: string; slug: string; name: string;
  based_city?: string; from_city?: string;
  bio?: string; genres: string[]; photo_url?: string;
  fee_min_inr?: number; fee_max_inr?: number; fee_currency?: string;
  open_to_bookings: boolean; available_cities: string[];
  labels?: string; why?: string;
  // v2 marketplace fields
  availability_signal?: "available" | "tour_leg" | "unknown" | "busy";
  city_match?: boolean;
}

// ─── Booking inquiry dialog ───────────────────────────────────────────────────
function BookingDialog({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-ink bg-acid-yellow sticky top-0 z-10">
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Booking Request</p>
            <h2 className="font-display text-2xl text-ink uppercase">{artist.name}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 border-4 border-ink bg-ink text-cream flex items-center justify-center hover:bg-magenta transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-0">
          <BookingForm
            artistSlug={artist.slug}
            artistName={artist.name}
            source="marketplace"
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shortlist Button ─────────────────────────────────────────────────────────
function ShortlistButton({ artistSlug, artistName }: { artistSlug: string; artistName: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isSignedIn) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const hdrs = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      if (saved) {
        await fetch(`/api/shortlist/${artistSlug}`, { method: "DELETE", headers: hdrs });
        setSaved(false);
      } else {
        const r = await fetch("/api/shortlist", {
          method: "POST", headers: hdrs,
          body: JSON.stringify({ artist_slug: artistSlug }),
        });
        if (r.status === 404) {
          // Promoter profile not registered yet
          window.location.href = "/promoter/dashboard";
          return;
        }
        setSaved(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  return (
    <button onClick={toggle} disabled={loading}
      title={saved ? "Remove from shortlist" : "Add to shortlist"}
      className={`w-10 shrink-0 border-4 border-ink flex items-center justify-center transition-colors disabled:opacity-50 ${
        saved ? "bg-acid-yellow text-ink hover:bg-magenta hover:text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
      }`}>
      {loading ? <Zap className="w-3.5 h-3.5 animate-pulse" /> :
        saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Artist card ──────────────────────────────────────────────────────────────
function ArtistBookCard({ artist, onBook }: { artist: Artist; onBook: (a: Artist) => void }) {
  const city = artist.based_city || artist.from_city;
  const ACCENTS = ["bg-electric-blue text-cream","bg-magenta text-cream","bg-acid-yellow text-ink","bg-orange text-ink","bg-lime text-ink"];
  const accent = ACCENTS[artist.name.charCodeAt(0) % ACCENTS.length];

  return (
    <article className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
      {/* Photo / placeholder */}
      <Link href={`/artists/${artist.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden border-b-4 border-ink">
          {artist.photo_url ? (
            <img src={artist.photo_url} alt={artist.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy" />
          ) : (
            <div className={`w-full h-full ${accent} flex items-center justify-center`}>
              <Music className="w-12 h-12 opacity-20" />
            </div>
          )}
          {/* Fee badge */}
          {artist.fee_min_inr && (
            <span className="absolute top-3 right-3 font-display text-[10px] uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
              From ₹{(artist.fee_min_inr / 1000).toFixed(0)}k
            </span>
          )}
          {/* Availability signal badge — shown when searching by date */}
          {artist.availability_signal ? (
            <span className={`absolute top-3 left-3 font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${
              artist.availability_signal === "available"  ? "bg-lime text-ink" :
              artist.availability_signal === "tour_leg"   ? "bg-electric-blue text-cream" :
              artist.availability_signal === "busy"       ? "bg-magenta text-cream" :
              "bg-ink/60 text-cream"
            }`}>
              {artist.availability_signal === "available" ? "✓ Open slot" :
               artist.availability_signal === "tour_leg"  ? "◎ Tour leg" :
               artist.availability_signal === "busy"      ? "✗ Busy" : "Check"}
            </span>
          ) : (
            <span className={`absolute top-3 left-3 font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${artist.open_to_bookings ? "bg-lime text-ink" : "bg-ink/60 text-cream"}`}>
              {artist.open_to_bookings ? "Available" : "Check"}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/artists/${artist.slug}`}>
          <h3 className="font-display text-xl text-ink uppercase leading-tight hover:text-magenta transition-colors mb-1">
            {artist.name}
          </h3>
        </Link>

        {city && (
          <p className="flex items-center gap-1 text-xs text-ink/60 mb-2">
            <MapPin className="w-3 h-3 shrink-0" />{city}
          </p>
        )}

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mb-3">
          {artist.genres.slice(0, 3).map(g => (
            <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border border-ink">
              {g}
            </span>
          ))}
        </div>

        {/* Available cities */}
        {artist.available_cities.length > 0 && (
          <p className="text-[11px] text-ink/50 font-display uppercase mb-3">
            Available in: {artist.available_cities.slice(0, 3).join(" · ")}
            {artist.available_cities.length > 3 ? ` +${artist.available_cities.length - 3}` : ""}
          </p>
        )}

        {/* Bio snippet */}
        {artist.bio && (
          <p className="text-xs text-ink/60 line-clamp-2 mb-4">{artist.bio}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onBook(artist)}
            className="flex-1 py-2.5 border-4 border-ink bg-ink text-cream font-display text-xs uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Request Booking →
          </button>
          <ShortlistButton artistSlug={artist.slug} artistName={artist.name} />
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const CITIES = ["All Cities", "Bengaluru", "Mumbai", "Delhi", "Goa", "Hyderabad", "Pune", "Chennai", "Kolkata"];
const GENRES = ["All Genres", "Techno", "House", "Jungle", "Drum & Bass", "UK Garage", "Disco", "Ambient", "Experimental"];
const BUDGETS = [
  { label: "Any Budget", max: undefined },
  { label: "Under ₹10k", max: 10000 },
  { label: "Under ₹25k", max: 25000 },
  { label: "Under ₹50k", max: 50000 },
  { label: "Under ₹1L", max: 100000 },
];

export default function BookArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All Cities");
  const [genre, setGenre] = useState("All Genres");
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [bookingArtist, setBookingArtist] = useState<Artist | null>(null);

  // Date-aware search: when a date is set, we use /api/marketplace/artists-v2
  const [searchDate, setSearchDate] = useState("");
  const [dateSearchActive, setDateSearchActive] = useState(false);

  // Fetch artists — switches endpoint based on whether a date+city is active
  useEffect(() => {
    setLoading(true);
    const cityParam = city !== "All Cities" ? city : "";
    const genreParam = genre !== "All Genres" ? genre : "";
    const selectedBudget = BUDGETS[budgetIdx];

    let url: string;
    if (dateSearchActive && searchDate && cityParam) {
      // v2: date + city aware — returns availability_signal on each artist
      const params = new URLSearchParams({ date: searchDate });
      if (cityParam) params.set("city", cityParam);
      if (genreParam) params.set("genre", genreParam);
      if (selectedBudget.max) params.set("fee_max", String(selectedBudget.max));
      url = `/api/marketplace/artists-v2?${params.toString()}`;
    } else {
      // v1: classic endpoint, filter client-side
      url = "/api/artists?limit=100";
    }

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArtists(data.filter((a: Artist) => a.open_to_bookings !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, genre, budgetIdx, searchDate, dateSearchActive]);

  const selectedBudget = BUDGETS[budgetIdx];

  // Client-side filtering (applied on top of server results for v1, text search always client-side)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artists.filter(a => {
      if (q && !(
        a.name.toLowerCase().includes(q) ||
        (a.bio ?? "").toLowerCase().includes(q) ||
        (a.genres ?? []).join(" ").toLowerCase().includes(q) ||
        (a.based_city ?? "").toLowerCase().includes(q)
      )) return false;
      // City filter only needed in v1 mode (v2 handles server-side)
      if (!dateSearchActive && city !== "All Cities") {
        const inCity = (a.based_city ?? "").toLowerCase().includes(city.toLowerCase()) ||
          (a.available_cities ?? []).some(c => c.toLowerCase().includes(city.toLowerCase()));
        if (!inCity) return false;
      }
      if (!dateSearchActive && genre !== "All Genres") {
        if (!(a.genres ?? []).some(g => g.toLowerCase().includes(genre.toLowerCase()))) return false;
      }
      if (!dateSearchActive && selectedBudget.max && a.fee_min_inr && a.fee_min_inr > selectedBudget.max) return false;
      return true;
    });
  }, [artists, query, city, genre, budgetIdx, dateSearchActive]);

  return (
    <main className="bg-cream text-ink min-h-screen">
      <SEO
        title="Book An Artist — Cats Can Dance | India's Underground Music Marketplace"
        description="Browse and book India's top underground electronic music artists. Filter by city, genre, and budget. Direct booking inquiries."
        path="/book"
        keywords="book dj india, hire electronic music artist india, booking dj bangalore mumbai delhi, underground music booking"
      />
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-ink pt-28 pb-14 md:pt-36 md:pb-20 border-b-4 border-ink">
        <div className="container">
          <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow mb-4">
            Artist Marketplace
          </span>
          <h1 className="font-display text-[12vw] md:text-[7vw] text-cream uppercase leading-[0.85] mb-4">
            Book An<br /><span className="text-acid-yellow">Artist</span>
          </h1>
          <p className="text-cream/70 max-w-xl leading-relaxed mb-8">
            Browse India's underground electronic music artists. Filter by city, genre, and budget.
            Send a direct booking inquiry — no middleman.
          </p>

          {/* ── Airbnb-style date + city search bar ── */}
          <div className="border-4 border-cream/30 bg-cream/10 backdrop-blur-sm max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-4 sm:divide-y-0 sm:divide-x-4 divide-cream/20">
              {/* Date */}
              <label className="block p-4 cursor-pointer group">
                <span className="flex items-center gap-1.5 font-display text-[10px] uppercase text-acid-yellow tracking-widest mb-1.5">
                  <CalendarDays className="w-3 h-3" /> Event Date
                </span>
                <input
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="w-full bg-transparent text-cream font-sans text-sm focus:outline-none placeholder:text-cream/40"
                />
              </label>
              {/* City (reuse the city state) */}
              <label className="block p-4 cursor-pointer">
                <span className="flex items-center gap-1.5 font-display text-[10px] uppercase text-acid-yellow tracking-widest mb-1.5">
                  <MapPin className="w-3 h-3" /> City
                </span>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-transparent text-cream font-sans text-sm focus:outline-none appearance-none"
                >
                  {CITIES.map(c => <option key={c} value={c} className="text-ink">{c}</option>)}
                </select>
              </label>
              {/* Search trigger */}
              <div className="p-4 flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    if (searchDate && city !== "All Cities") {
                      setDateSearchActive(true);
                    } else {
                      setDateSearchActive(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-4 border-acid-yellow bg-acid-yellow text-ink font-display text-xs uppercase hover:bg-cream transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {dateSearchActive ? "Searching" : "Find Artists"}
                </button>
              </div>
            </div>
            {dateSearchActive && searchDate && city !== "All Cities" && (
              <div className="px-4 py-2 border-t-4 border-cream/20 flex items-center gap-3">
                <span className="font-display text-xs uppercase text-acid-yellow flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Showing availability for {city} on {new Date(searchDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button
                  onClick={() => { setDateSearchActive(false); setSearchDate(""); }}
                  className="ml-auto text-cream/50 hover:text-cream font-display text-[10px] uppercase"
                >
                  Clear ×
                </button>
              </div>
            )}
          </div>

          {/* Text search */}
          <div className="relative max-w-lg mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, genre, city…"
              className="w-full pl-10 pr-4 py-3 border-4 border-cream/20 bg-cream/5 text-cream placeholder:text-cream/40 font-sans text-sm focus:outline-none focus:border-acid-yellow/60 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-20 bg-cream border-b-4 border-ink">
        <div className="container py-3 flex flex-wrap gap-3 items-center">
          {/* City */}
          <div className="relative">
            <select value={city} onChange={e => setCity(e.target.value)}
              className="border-4 border-ink bg-cream font-display text-xs uppercase px-3 py-2 pr-7 text-ink focus:outline-none focus:bg-acid-yellow appearance-none">
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink pointer-events-none" />
          </div>

          {/* Genre */}
          <div className="relative">
            <select value={genre} onChange={e => setGenre(e.target.value)}
              className="border-4 border-ink bg-cream font-display text-xs uppercase px-3 py-2 pr-7 text-ink focus:outline-none focus:bg-acid-yellow appearance-none">
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink pointer-events-none" />
          </div>

          {/* Budget */}
          <div className="relative">
            <select value={budgetIdx} onChange={e => setBudgetIdx(parseInt(e.target.value))}
              className="border-4 border-ink bg-cream font-display text-xs uppercase px-3 py-2 pr-7 text-ink focus:outline-none focus:bg-acid-yellow appearance-none">
              {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink pointer-events-none" />
          </div>

          {/* Clear */}
          {(city !== "All Cities" || genre !== "All Genres" || budgetIdx !== 0 || query) && (
            <button
              onClick={() => { setCity("All Cities"); setGenre("All Genres"); setBudgetIdx(0); setQuery(""); }}
              className="font-display text-xs uppercase text-ink/50 hover:text-magenta border-2 border-ink/30 px-3 py-2 transition-colors"
            >
              Clear ×
            </button>
          )}

          <p className="ml-auto font-display text-xs text-ink/50 uppercase tracking-widest">
            {loading ? "Loading…" : `${filtered.length} artist${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Availability signal legend — shown when date search is active */}
        {dateSearchActive && (
          <div className="container pb-2 flex flex-wrap gap-3 items-center">
            <span className="font-display text-[10px] uppercase text-ink/50 tracking-widest">Signal:</span>
            {[
              { signal: "available", label: "Open slot", cls: "bg-lime text-ink" },
              { signal: "tour_leg",  label: "Tour leg",  cls: "bg-electric-blue text-cream" },
              { signal: "unknown",   label: "Unknown",   cls: "bg-ink/50 text-cream" },
              { signal: "busy",      label: "Busy",      cls: "bg-magenta text-cream" },
            ].map(s => (
              <span key={s.signal} className={`font-display text-[10px] uppercase px-2 py-0.5 border border-ink ${s.cls}`}>
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Artist Grid ── */}
      <section className="container py-10 md:py-14">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(12).fill(null).map((_, i) => (
              <div key={i} className="border-4 border-ink bg-ink/5 animate-pulse aspect-square" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-10 text-center max-w-md mx-auto">
            <Music className="w-12 h-12 text-ink/30 mx-auto mb-4" />
            <p className="font-display text-2xl text-ink uppercase mb-2">No Artists Match</p>
            <p className="text-ink/60 text-sm">Try adjusting your filters or clearing the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(a => (
              <ArtistBookCard key={a.id} artist={a} onBook={setBookingArtist} />
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="bg-ink border-y-4 border-ink py-14">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-cream uppercase mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Browse & Filter", body: "Find artists by city, genre, and budget. Each profile shows their full gigography, connections and EPK." },
              { step: "02", title: "Send a Request", body: "Fill out the booking form with your event details. No signup needed — just your email." },
              { step: "03", title: "Direct Response", body: "The artist gets notified directly and responds to your email. No middleman, no commission." },
            ].map(s => (
              <div key={s.step} className="border-4 border-cream/20 bg-white/5 p-6">
                <p className="font-display text-5xl text-acid-yellow mb-3">{s.step}</p>
                <h3 className="font-display text-xl text-cream uppercase mb-2">{s.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Are you an artist? ── */}
      <section className="bg-magenta border-b-4 border-ink py-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl text-cream uppercase">Are You An Artist?</h3>
            <p className="text-cream/80 mt-1">Get listed and receive direct booking inquiries from venues and promoters.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/for-artists" className="bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Get Listed →
            </Link>
            <Link href="/artists" className="bg-cream text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Browse All Artists
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Booking dialog */}
      {bookingArtist && (
        <BookingDialog artist={bookingArtist} onClose={() => setBookingArtist(null)} />
      )}
    </main>
  );
}

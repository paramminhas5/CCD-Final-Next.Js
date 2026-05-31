"use client";
/**
 * TalentDirectory — /talent
 *
 * All-roles talent marketplace. Extends the artist directory to cover
 * musicians, photographers, videographers, lighting designers, mix engineers,
 * production crew, and MCs.
 *
 * Features:
 *   - Kind selector (category tabs) with count per role
 *   - City + genre + date search (date-aware via /api/marketplace/artists-v2)
 *   - Kind badge on every card
 *   - Shortlist button (Bookmark) on every card
 *   - "Book / Hire / Commission" CTA copy varies by kind
 *   - Availability signal badges when searching by date
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, MapPin, X, ChevronDown, CalendarDays,
  Zap, Bookmark, BookmarkCheck, Music,
} from "lucide-react";
import { useAuth } from "@clerk/react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BookingForm from "@/components/booking/BookingForm";
import {
  TALENT_KIND_META, TALENT_KIND_ORDER, type TalentKind,
} from "@/lib/talent-config";


// ── Types ─────────────────────────────────────────────────────────────────────
interface TalentProfile {
  id: string; slug: string; name: string; kind: string;
  based_city?: string; from_city?: string;
  bio?: string; genres: string[]; photo_url?: string;
  fee_min_inr?: number; fee_max_inr?: number;
  open_to_bookings: boolean; available_cities: string[];
  labels?: string; why?: string;
  availability_signal?: "available" | "tour_leg" | "unknown" | "busy";
  city_match?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CITIES = ["All Cities","Bengaluru","Mumbai","Delhi","Goa","Hyderabad","Pune","Chennai","Kolkata"];
const GENRES = ["All Genres","Techno","House","Jungle","Drum & Bass","UK Garage","Disco","Ambient","Experimental"];
const BUDGETS = [
  { label: "Any Budget", max: undefined },
  { label: "Under ₹10k",  max: 10000 },
  { label: "Under ₹25k",  max: 25000 },
  { label: "Under ₹50k",  max: 50000 },
  { label: "Under ₹1L",   max: 100000 },
];

// ── Shortlist button ───────────────────────────────────────────────────────────
function ShortlistBtn({ slug, name }: { slug: string; name: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy]   = useState(false);

  async function toggle() {
    if (!isSignedIn) { window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`; return; }
    setBusy(true);
    try {
      const token = await getToken();
      const hdrs = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      if (saved) {
        await fetch(`/api/shortlist/${slug}`, { method: "DELETE", headers: hdrs });
        setSaved(false);
      } else {
        const r = await fetch("/api/shortlist", { method: "POST", headers: hdrs, body: JSON.stringify({ artist_slug: slug }) });
        if (r.status === 404) { window.location.href = "/promoter/dashboard"; return; }
        setSaved(true);
      }
    } catch { /* silent */ }
    finally { setBusy(false); }
  }

  return (
    <button onClick={toggle} disabled={busy} title={saved ? "Remove from shortlist" : "Add to shortlist"}
      className={`w-9 h-9 shrink-0 border-4 border-ink flex items-center justify-center transition-colors disabled:opacity-50 ${saved ? "bg-acid-yellow" : "bg-cream hover:bg-acid-yellow/50"}`}>
      {busy ? <Zap className="w-3.5 h-3.5 animate-pulse" /> :
        saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Talent card ────────────────────────────────────────────────────────────────
function TalentCard({ talent, onBook }: { talent: TalentProfile; onBook: (t: TalentProfile) => void }) {
  const kind = (talent.kind ?? "musician") as TalentKind;
  const meta = TALENT_KIND_META[kind] ?? TALENT_KIND_META.musician;
  const city = talent.based_city ?? talent.from_city;

  return (
    <article className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
      {/* Photo */}
      <Link href={`/artists/${talent.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden border-b-4 border-ink">
          {talent.photo_url ? (
            <img src={talent.photo_url} alt={talent.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className={`w-full h-full ${meta.colour} ${meta.textColour} flex items-center justify-center`}>
              <span className="text-4xl opacity-30">{meta.emoji}</span>
            </div>
          )}
          {/* Fee badge */}
          {talent.fee_min_inr && (
            <span className="absolute top-3 right-3 font-display text-[10px] uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
              From ₹{(talent.fee_min_inr / 1000).toFixed(0)}k
            </span>
          )}
          {/* Availability signal */}
          {talent.availability_signal ? (
            <span className={`absolute top-3 left-3 font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${
              talent.availability_signal === "available" ? "bg-lime text-ink" :
              talent.availability_signal === "tour_leg"  ? "bg-electric-blue text-cream" :
              talent.availability_signal === "busy"      ? "bg-magenta text-cream" : "bg-ink/60 text-cream"
            }`}>
              {talent.availability_signal === "available" ? "✓ Open" :
               talent.availability_signal === "tour_leg"  ? "◎ Tour" :
               talent.availability_signal === "busy"      ? "✗ Busy" : "—"}
            </span>
          ) : (
            <span className={`absolute top-3 left-3 font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${talent.open_to_bookings ? "bg-lime text-ink" : "bg-ink/60 text-cream"}`}>
              {talent.open_to_bookings ? "Available" : "Check"}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Kind badge */}
        <span className={`inline-block font-display text-[10px] uppercase px-2 py-0.5 border border-ink mb-2 ${meta.colour} ${meta.textColour}`}>
          {meta.emoji} {meta.label}
        </span>

        <Link href={`/artists/${talent.slug}`}>
          <h3 className="font-display text-xl text-ink uppercase leading-tight hover:text-magenta transition-colors mb-1">{talent.name}</h3>
        </Link>

        {city && (
          <p className="flex items-center gap-1 text-xs text-ink/60 mb-2">
            <MapPin className="w-3 h-3 shrink-0" />{city}
          </p>
        )}

        {talent.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {talent.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border border-ink">{g}</span>
            ))}
          </div>
        )}

        {talent.bio && <p className="text-xs text-ink/60 line-clamp-2 mb-4">{talent.bio}</p>}

        <div className="flex gap-2">
          <button onClick={() => onBook(talent)}
            className="flex-1 py-2.5 border-4 border-ink bg-ink text-cream font-display text-xs uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            {meta.bookingVerb} {talent.name.split(" ")[0]} →
          </button>
          <ShortlistBtn slug={talent.slug} name={talent.name} />
        </div>
      </div>
    </article>
  );
}


// ── Booking dialog ─────────────────────────────────────────────────────────────
function TalentBookingDialog({ talent, onClose }: { talent: TalentProfile; onClose: () => void }) {
  const meta = TALENT_KIND_META[(talent.kind as TalentKind)] ?? TALENT_KIND_META.musician;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className={`flex items-center justify-between p-5 border-b-4 border-ink ${meta.colour} sticky top-0 z-10`}>
          <div>
            <p className={`font-display text-xs uppercase tracking-widest ${meta.textColour} opacity-60`}>
              {meta.bookingVerb} {meta.label}
            </p>
            <h2 className={`font-display text-2xl uppercase ${meta.textColour}`}>{talent.name}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 border-4 border-ink bg-ink text-cream flex items-center justify-center hover:bg-magenta transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <BookingForm
          artistSlug={talent.slug}
          artistName={talent.name}
          source="marketplace"
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TalentDirectoryPage() {
  const [allTalent, setAllTalent]     = useState<TalentProfile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedKind, setSelectedKind] = useState<TalentKind | "all">("all");
  const [query, setQuery]             = useState("");
  const [city, setCity]               = useState("All Cities");
  const [genre, setGenre]             = useState("All Genres");
  const [budgetIdx, setBudgetIdx]     = useState(0);
  const [searchDate, setSearchDate]   = useState("");
  const [dateActive, setDateActive]   = useState(false);
  const [bookingTalent, setBookingTalent] = useState<TalentProfile | null>(null);

  // Fetch — date-aware if date+city set
  useEffect(() => {
    setLoading(true);
    const cityParam  = city !== "All Cities" ? city : "";
    const genreParam = genre !== "All Genres" ? genre : "";
    const budget     = BUDGETS[budgetIdx];

    let url: string;
    if (dateActive && searchDate && cityParam) {
      const p = new URLSearchParams({ date: searchDate, city: cityParam });
      if (genreParam) p.set("genre", genreParam);
      if (budget.max)  p.set("fee_max", String(budget.max));
      url = `/api/marketplace/artists-v2?${p.toString()}`;
    } else {
      url = "/api/artists?limit=200";
    }

    fetch(url).then(r => r.json())
      .then(d => setAllTalent(Array.isArray(d) ? d.filter((t: TalentProfile) => t.open_to_bookings !== false) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, genre, budgetIdx, searchDate, dateActive]);

  // Kind counts from loaded data
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTalent.length };
    for (const t of allTalent) {
      const k = t.kind ?? "musician";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [allTalent]);

  // Filtered
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTalent.filter(t => {
      if (selectedKind !== "all" && t.kind !== selectedKind) return false;
      if (q && !(
        t.name.toLowerCase().includes(q) ||
        (t.bio ?? "").toLowerCase().includes(q) ||
        (t.genres ?? []).join(" ").toLowerCase().includes(q) ||
        (t.based_city ?? "").toLowerCase().includes(q)
      )) return false;
      if (!dateActive) {
        if (city !== "All Cities") {
          const inCity = (t.based_city ?? "").toLowerCase().includes(city.toLowerCase()) ||
            (t.available_cities ?? []).some((c: string) => c.toLowerCase().includes(city.toLowerCase()));
          if (!inCity) return false;
        }
        if (genre !== "All Genres" && !(t.genres ?? []).some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))) return false;
        const budget = BUDGETS[budgetIdx];
        if (budget.max && t.fee_min_inr && t.fee_min_inr > budget.max) return false;
      }
      return true;
    });
  }, [allTalent, selectedKind, query, city, genre, budgetIdx, dateActive]);

  const currentMeta = selectedKind !== "all" ? TALENT_KIND_META[selectedKind] : null;

  return (
    <main className="bg-cream text-ink min-h-screen">
      <SEO
        title="Talent Directory — Cats Can Dance | Book Musicians, Photographers, Lighting & More"
        description="Find and book musicians, DJs, photographers, videographers, lighting designers, mix engineers, and production crew across India. Direct bookings, no middleman."
        path="/talent"
        keywords="book musician india, hire photographer event india, lighting designer booking, mix engineer india, event production crew"
      />
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-ink pt-28 pb-14 md:pt-36 md:pb-20 border-b-4 border-ink">
        <div className="container">
          <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow mb-4">
            Talent Platform
          </span>
          <h1 className="font-display text-[10vw] md:text-[6vw] text-cream uppercase leading-[0.85] mb-4">
            Find Your<br /><span className="text-acid-yellow">Talent</span>
          </h1>
          <p className="text-cream/70 max-w-xl leading-relaxed mb-8">
            Musicians, photographers, videographers, lighting designers, mix engineers, and production crew —
            all in one place. Direct bookings. No commission.
          </p>

          {/* Date + city search */}
          <div className="border-4 border-cream/30 bg-cream/10 backdrop-blur-sm max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-4 sm:divide-y-0 sm:divide-x-4 divide-cream/20">
              <label className="block p-4 cursor-pointer">
                <span className="flex items-center gap-1.5 font-display text-[10px] uppercase text-acid-yellow tracking-widest mb-1.5">
                  <CalendarDays className="w-3 h-3" /> Date
                </span>
                <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
                  className="w-full bg-transparent text-cream font-sans text-sm focus:outline-none" />
              </label>
              <label className="block p-4">
                <span className="flex items-center gap-1.5 font-display text-[10px] uppercase text-acid-yellow tracking-widest mb-1.5">
                  <MapPin className="w-3 h-3" /> City
                </span>
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="w-full bg-transparent text-cream font-sans text-sm focus:outline-none appearance-none">
                  {CITIES.map(c => <option key={c} value={c} className="text-ink">{c}</option>)}
                </select>
              </label>
              <div className="p-4 flex items-end">
                <button type="button"
                  onClick={() => setDateActive(!!(searchDate && city !== "All Cities"))}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-4 border-acid-yellow bg-acid-yellow text-ink font-display text-xs uppercase hover:bg-cream transition-colors">
                  <Search className="w-4 h-4" />
                  {dateActive ? "Searching" : "Search"}
                </button>
              </div>
            </div>
            {dateActive && (
              <div className="px-4 py-2 border-t-4 border-cream/20 flex items-center gap-3">
                <span className="font-display text-xs uppercase text-acid-yellow flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  {city !== "All Cities" ? city : "All cities"} · {new Date(searchDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => { setDateActive(false); setSearchDate(""); }}
                  className="ml-auto text-cream/50 hover:text-cream font-display text-[10px] uppercase">Clear ×</button>
              </div>
            )}
          </div>

          {/* Text search */}
          <div className="relative max-w-lg mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, skill, city…"
              className="w-full pl-10 pr-4 py-3 border-4 border-cream/20 bg-cream/5 text-cream placeholder:text-cream/40 font-sans text-sm focus:outline-none focus:border-acid-yellow/60 transition-colors" />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Kind selector ── */}
      <div className="bg-ink border-b-4 border-ink overflow-x-auto">
        <div className="container flex gap-0 min-w-max">
          {/* All */}
          <button onClick={() => setSelectedKind("all")}
            className={`flex items-center gap-2 font-display text-xs uppercase px-5 py-3 border-r-4 border-ink/30 whitespace-nowrap transition-colors ${selectedKind === "all" ? "bg-acid-yellow text-ink" : "text-cream/60 hover:text-cream hover:bg-cream/10"}`}>
            All Talent
            <span className="text-[10px] opacity-60">({kindCounts.all})</span>
          </button>
          {TALENT_KIND_ORDER.map(kind => {
            const m = TALENT_KIND_META[kind];
            const count = kindCounts[kind] ?? 0;
            return (
              <button key={kind} onClick={() => setSelectedKind(kind)}
                className={`flex items-center gap-2 font-display text-xs uppercase px-5 py-3 border-r-4 border-ink/30 whitespace-nowrap transition-colors ${
                  selectedKind === kind ? `${m.colour} ${m.textColour}` : "text-cream/60 hover:text-cream hover:bg-cream/10"
                }`}>
                {m.emoji} {m.plural}
                {count > 0 && <span className="text-[10px] opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
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
          {/* Genre (only relevant for musicians) */}
          {(selectedKind === "all" || selectedKind === "musician") && (
            <div className="relative">
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="border-4 border-ink bg-cream font-display text-xs uppercase px-3 py-2 pr-7 text-ink focus:outline-none focus:bg-acid-yellow appearance-none">
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink pointer-events-none" />
            </div>
          )}
          {/* Budget */}
          <div className="relative">
            <select value={budgetIdx} onChange={e => setBudgetIdx(parseInt(e.target.value))}
              className="border-4 border-ink bg-cream font-display text-xs uppercase px-3 py-2 pr-7 text-ink focus:outline-none focus:bg-acid-yellow appearance-none">
              {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink pointer-events-none" />
          </div>
          {/* Clear */}
          {(city !== "All Cities" || genre !== "All Genres" || budgetIdx !== 0 || query || dateActive) && (
            <button onClick={() => { setCity("All Cities"); setGenre("All Genres"); setBudgetIdx(0); setQuery(""); setDateActive(false); setSearchDate(""); }}
              className="font-display text-xs uppercase text-ink/50 hover:text-magenta border-2 border-ink/30 px-3 py-2 transition-colors">
              Clear ×
            </button>
          )}
          <p className="ml-auto font-display text-xs text-ink/50 uppercase tracking-widest">
            {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {/* Availability signal legend */}
        {dateActive && (
          <div className="container pb-2 flex flex-wrap gap-3 items-center">
            {[
              { s: "available", l: "Open slot",  cls: "bg-lime text-ink" },
              { s: "tour_leg",  l: "Tour leg",   cls: "bg-electric-blue text-cream" },
              { s: "unknown",   l: "Unknown",    cls: "bg-ink/40 text-cream" },
              { s: "busy",      l: "Busy",       cls: "bg-magenta text-cream" },
            ].map(x => (
              <span key={x.s} className={`font-display text-[10px] uppercase px-2 py-0.5 border border-ink ${x.cls}`}>{x.l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <section className="container py-10 md:py-14">
        {/* Selected kind header */}
        {currentMeta && (
          <div className="mb-8 border-4 border-ink p-6 flex items-center gap-4">
            <span className="text-4xl">{currentMeta.emoji}</span>
            <div>
              <h2 className="font-display text-2xl uppercase text-ink">{currentMeta.plural}</h2>
              <p className="text-sm text-ink/60 mt-0.5">{currentMeta.description}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(12).fill(null).map((_, i) => <div key={i} className="border-4 border-ink bg-ink/5 animate-pulse aspect-square" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-10 text-center max-w-md mx-auto">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="font-display text-2xl text-ink uppercase mb-2">No Results</p>
            <p className="text-ink/60 text-sm">Try adjusting your filters or clearing the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(t => <TalentCard key={t.id} talent={t} onBook={setBookingTalent} />)}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="bg-ink border-y-4 border-ink py-14">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl text-cream uppercase mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Browse & Filter", body: "Find talent by role, city, genre, and budget. Every profile shows packages, pricing, and availability." },
              { step: "02", title: "Send a Request", body: "Pick a package or describe your needs. The talent sees your brief directly — no middleman, no commission." },
              { step: "03", title: "Confirm & Brief", body: "Chat in-app, agree terms, and confirm. You'll both get email updates at every step." },
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

      {/* ── Are you talent? ── */}
      <section className="bg-magenta border-b-4 border-ink py-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl text-cream uppercase">Are You a Creative?</h3>
            <p className="text-cream/80 mt-1">Get listed — musicians, photographers, videographers, lighting, engineers, production.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/for-artists" className="bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Get Listed →
            </Link>
            <Link href="/artists" className="bg-cream text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Artist Directory
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Booking dialog */}
      {bookingTalent && <TalentBookingDialog talent={bookingTalent} onClose={() => setBookingTalent(null)} />}
    </main>
  );
}

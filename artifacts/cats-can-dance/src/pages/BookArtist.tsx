"use client";
/**
 * Artist Marketplace — /book
 * Browse artists available for booking, filter by city/genre/fee,
 * and send a booking inquiry directly.
 */
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Music, X, ChevronDown, Send, Check, Loader2 } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

interface Artist {
  id: string; slug: string; name: string;
  based_city?: string; from_city?: string;
  bio?: string; genres: string[]; photo_url?: string;
  fee_min_inr?: number; fee_max_inr?: number; fee_currency?: string;
  open_to_bookings: boolean; available_cities: string[];
  labels?: string; why?: string;
}

// ─── Booking inquiry dialog ───────────────────────────────────────────────────
function BookingDialog({ artist, onClose }: { artist: Artist; onClose: () => void }) {
  const [form, setForm] = useState({
    requester_name: "",
    requester_email: "",
    requester_phone: "",
    purpose: "",
    event_date: "",
    venue: "",
    budget: "",
    notes: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/booking-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_slug: artist.slug,
          artist_name: artist.name,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-ink bg-acid-yellow">
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Booking Request</p>
            <h2 className="font-display text-2xl text-ink uppercase">{artist.name}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 border-4 border-ink bg-ink text-cream flex items-center justify-center hover:bg-magenta transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-ink bg-acid-yellow flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-ink" />
            </div>
            <h3 className="font-display text-2xl text-ink uppercase mb-2">Request Sent!</h3>
            <p className="text-ink/70 mb-6">Your booking inquiry for <strong>{artist.name}</strong> has been submitted. They'll be in touch via your email.</p>
            <button onClick={onClose} className="font-display text-sm uppercase px-6 py-3 border-4 border-ink bg-ink text-cream chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Your Name *</label>
                <input required value={form.requester_name} onChange={set("requester_name")} placeholder="Venue / Promoter name"
                  className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/30 transition-colors" />
              </div>
              <div>
                <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Email *</label>
                <input required type="email" value={form.requester_email} onChange={set("requester_email")} placeholder="your@email.com"
                  className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/30 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Phone (optional)</label>
              <input value={form.requester_phone} onChange={set("requester_phone")} placeholder="+91 98765 43210"
                className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/30 transition-colors" />
            </div>

            {/* Event details */}
            <div className="border-t-4 border-ink pt-4">
              <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-3">Event Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Event Type *</label>
                  <select required value={form.purpose} onChange={set("purpose")}
                    className="w-full border-4 border-ink bg-cream px-3 py-2 font-display text-xs uppercase text-ink focus:outline-none">
                    <option value="">Select…</option>
                    <option value="Club night">Club Night</option>
                    <option value="Festival">Festival</option>
                    <option value="Rooftop party">Rooftop Party</option>
                    <option value="Warehouse rave">Warehouse Rave</option>
                    <option value="Corporate event">Corporate Event</option>
                    <option value="Private party">Private Party</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Event Date</label>
                  <input type="date" value={form.event_date} onChange={set("event_date")}
                    className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/30 transition-colors" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Venue / City</label>
                <input value={form.venue} onChange={set("venue")} placeholder="e.g. Bar Wild, Bengaluru"
                  className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/30 transition-colors" />
              </div>
              <div>
                <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Budget (INR)</label>
                <select value={form.budget} onChange={set("budget")}
                  className="w-full border-4 border-ink bg-cream px-3 py-2 font-display text-xs uppercase text-ink focus:outline-none">
                  <option value="">Not specified</option>
                  <option value="Under ₹10,000">Under ₹10,000</option>
                  <option value="₹10,000–₹25,000">₹10,000–₹25,000</option>
                  <option value="₹25,000–₹50,000">₹25,000–₹50,000</option>
                  <option value="₹50,000–₹1,00,000">₹50,000–₹1,00,000</option>
                  <option value="₹1,00,000+">₹1,00,000+</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Additional Notes</label>
              <textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Expected crowd size, set duration, any other details…"
                className="w-full border-4 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-acid-yellow/30 transition-colors resize-none" />
            </div>

            {error && (
              <p className="text-sm text-cream bg-magenta border-2 border-ink px-3 py-2 font-display">{error}</p>
            )}

            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 border-4 border-ink bg-ink text-cream font-display text-sm uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending…" : "Send Booking Request"}
            </button>
          </form>
        )}
      </div>
    </div>
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
          {/* Booking status */}
          <span className={`absolute top-3 left-3 font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${artist.open_to_bookings ? "bg-lime text-ink" : "bg-ink/60 text-cream"}`}>
            {artist.open_to_bookings ? "Available" : "Check"}
          </span>
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

        <button
          onClick={() => onBook(artist)}
          className="w-full py-2.5 border-4 border-ink bg-ink text-cream font-display text-xs uppercase chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          Request Booking →
        </button>
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

  useEffect(() => {
    fetch("/api/artists?limit=100")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArtists(data.filter((a: Artist) => a.open_to_bookings !== false));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedBudget = BUDGETS[budgetIdx];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artists.filter(a => {
      // Text search
      if (q && !(
        a.name.toLowerCase().includes(q) ||
        (a.bio ?? "").toLowerCase().includes(q) ||
        (a.genres ?? []).join(" ").toLowerCase().includes(q) ||
        (a.based_city ?? "").toLowerCase().includes(q)
      )) return false;
      // City
      if (city !== "All Cities") {
        const inCity = (a.based_city ?? "").toLowerCase().includes(city.toLowerCase()) ||
          (a.available_cities ?? []).some(c => c.toLowerCase().includes(city.toLowerCase()));
        if (!inCity) return false;
      }
      // Genre
      if (genre !== "All Genres") {
        if (!(a.genres ?? []).some(g => g.toLowerCase().includes(genre.toLowerCase()))) return false;
      }
      // Budget
      if (selectedBudget.max && a.fee_min_inr && a.fee_min_inr > selectedBudget.max) return false;
      return true;
    });
  }, [artists, query, city, genre, budgetIdx]);

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

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search artists, genres, cities…"
              className="w-full pl-10 pr-4 py-4 border-4 border-cream/40 bg-cream/10 text-cream placeholder:text-cream/40 font-sans focus:outline-none focus:border-acid-yellow transition-colors"
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

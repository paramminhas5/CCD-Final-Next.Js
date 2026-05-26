import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Music, ExternalLink, Instagram, Globe, Mail } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

interface Promoter {
  id: string; slug: string; name: string;
  city: string | null; cities: string[];
  blurb: string | null; genres: string[];
  instagram: string | null; website: string | null;
  booking_email: string | null; logo_url: string | null;
  trusted: boolean; crawl_urls?: any[];
}
interface CuratedEvent {
  id: string; title: string; url: string;
  event_date?: string; venue?: string; genre: string[]; image_url?: string;
}

const ensureUrl = (s: string | null) =>
  s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null;

interface Props { slug: string; }

export default function PromoterDetail({ slug }: Props) {
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [events, setEvents] = useState<CuratedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/promoters`).then(r => r.json()),
      fetch(`/api/curated-events?limit=8`).then(r => r.json()).catch(() => []),
    ]).then(([promoters, allEvents]) => {
      const found = Array.isArray(promoters) ? promoters.find((p: Promoter) => p.slug === slug) : null;
      if (!found) { setError("Promoter not found"); setLoading(false); return; }
      setPromoter(found);
      // Filter curated events by source matching promoter name (approximate)
      const nameWords = found.name.toLowerCase().split(" ");
      const filtered = Array.isArray(allEvents)
        ? allEvents.filter((e: CuratedEvent) =>
            nameWords.some(w => e.title?.toLowerCase().includes(w))
          ).slice(0, 6)
        : [];
      setEvents(filtered);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <main className="bg-cream min-h-screen"><Nav />
      <div className="container pt-32 text-center"><p className="font-display text-4xl text-ink animate-pulse">LOADING…</p></div>
      <Footer />
    </main>
  );

  if (error || !promoter) return (
    <main className="bg-cream min-h-screen"><Nav />
      <div className="container pt-24">
        <div className="border-4 border-ink bg-magenta chunk-shadow p-8 inline-block max-w-md">
          <p className="font-display text-2xl text-cream mb-3">{error || "PROMOTER NOT FOUND"}</p>
          <Link href="/promoters" className="inline-flex items-center gap-2 bg-cream text-ink font-display px-5 py-2 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
            <ArrowLeft className="w-4 h-4" /> BACK TO PROMOTERS
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );

  const allCities = [...new Set([promoter.city, ...promoter.cities].filter(Boolean))];

  return (
    <main className="bg-cream text-ink">
      <SEO
        title={`${promoter.name} — Promoter | Cats Can Dance`}
        description={promoter.blurb || `${promoter.name} — trusted electronic music promoter in ${allCities.join(", ") || "India"}.`}
        path={`/promoters/${slug}`}
      />
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-ink border-b-4 border-ink pt-28 pb-16">
        <div className="container">
          <Link href="/promoters" className="inline-flex items-center gap-1 font-display text-xs uppercase mb-6 text-cream/70 hover:text-cream transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Promoters
          </Link>
          <div className="flex items-start gap-6">
            {promoter.logo_url ? (
              <div className="shrink-0 w-20 h-20 border-4 border-cream overflow-hidden bg-acid-yellow">
                <img src={promoter.logo_url} alt={promoter.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ) : (
              <div className="shrink-0 w-20 h-20 border-4 border-cream bg-acid-yellow flex items-center justify-center">
                <Music className="w-8 h-8 text-ink" />
              </div>
            )}
            <div>
              {promoter.trusted && (
                <span className="inline-block bg-acid-yellow text-ink font-display text-xs px-3 py-1 border-2 border-cream mb-2">
                  ✓ TRUSTED PROMOTER
                </span>
              )}
              <h1 className="font-display text-5xl md:text-7xl text-cream uppercase leading-[0.9]">
                {promoter.name}
              </h1>
              {allCities.length > 0 && (
                <p className="flex items-center gap-1 text-cream/70 mt-3 text-sm">
                  <MapPin className="w-3.5 h-3.5" /> {allCities.join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── About + Genres ── */}
      <section className="container py-12 border-b-4 border-ink">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            {promoter.blurb && (
              <>
                <h2 className="font-display text-2xl uppercase mb-4">About</h2>
                <p className="text-ink/70 leading-relaxed text-lg">{promoter.blurb}</p>
              </>
            )}
            {/* Genre tags */}
            {promoter.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {promoter.genres.map(g => (
                  <Link key={g} href={`/genres/${g.toLowerCase().replace(/[&\s]+/g, "-")}`}
                    className="text-xs font-display uppercase bg-acid-yellow text-ink px-3 py-1 border-2 border-ink hover:bg-ink hover:text-cream transition-colors">
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Links */}
          <div className="space-y-3">
            <h2 className="font-display text-2xl uppercase mb-4">Links</h2>
            {promoter.instagram && (
              <a href={`https://instagram.com/${promoter.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 border-4 border-ink bg-cream chunk-shadow p-4 hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <Instagram className="w-5 h-5 text-ink" />
                <span className="font-display text-sm uppercase">@{promoter.instagram.replace("@","")}</span>
                <ExternalLink className="w-4 h-4 text-ink/50 ml-auto" />
              </a>
            )}
            {ensureUrl(promoter.website) && (
              <a href={ensureUrl(promoter.website)!} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 border-4 border-ink bg-cream chunk-shadow p-4 hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <Globe className="w-5 h-5 text-ink" />
                <span className="font-display text-sm uppercase">Website</span>
                <ExternalLink className="w-4 h-4 text-ink/50 ml-auto" />
              </a>
            )}
            {promoter.booking_email && (
              <a href={`mailto:${promoter.booking_email}`}
                className="flex items-center gap-3 border-4 border-ink bg-acid-yellow chunk-shadow p-4 hover:bg-magenta hover:text-cream hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <Mail className="w-5 h-5 text-ink" />
                <span className="font-display text-sm uppercase">Book / Enquire</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Events ── */}
      {events.length > 0 && (
        <section className="container py-12 border-b-4 border-ink">
          <h2 className="font-display text-3xl uppercase mb-6">Recent Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer"
                className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                {ev.image_url && (
                  <div className="aspect-[16/9] overflow-hidden border-b-4 border-ink">
                    <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display text-sm uppercase text-ink leading-tight">{ev.title}</h3>
                  {ev.event_date && (
                    <p className="text-ink/60 text-xs mt-1">
                      {new Date(ev.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  )}
                  {ev.venue && <p className="text-ink/50 text-xs">{ev.venue}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ev.genre.slice(0, 2).map(g => (
                      <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border border-ink">{g}</span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-magenta border-b-4 border-ink py-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl text-cream uppercase">Run your own night?</h3>
            <p className="text-cream/80 mt-1">Get your events featured on CCD.</p>
          </div>
          <Link href="/submit-event" className="bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
            Submit Your Night →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

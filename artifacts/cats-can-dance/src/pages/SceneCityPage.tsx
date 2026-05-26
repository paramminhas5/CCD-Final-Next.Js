import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Music, Users, ArrowLeft, ExternalLink } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CITY_SCENES, GENRE_PAGES } from "@/content/scenes";

interface Props { slug: string; }

interface Artist {
  id: string; slug: string; name: string; genres: string[];
  photo_url?: string; based_city?: string; from_city?: string;
}
interface CuratedEvent {
  id: string; title: string; url: string; event_date?: string;
  venue?: string; genre: string[]; image_url?: string;
}
interface Promoter {
  id: string; slug: string; name: string; blurb?: string;
  genres: string[]; instagram?: string; logo_url?: string;
}

export default function SceneCityPage({ slug }: Props) {
  const scene = CITY_SCENES.find(c => c.slug === slug);
  const [artists,   setArtists]   = useState<Artist[]>([]);
  const [events,    setEvents]    = useState<CuratedEvent[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!scene) return;
    const cityParam = encodeURIComponent(scene.name);
    Promise.all([
      fetch(`/api/artists?city=${cityParam}&limit=8`).then(r => r.json()).catch(() => []),
      fetch(`/api/curated-events?city=${cityParam}&limit=6`).then(r => r.json()).catch(() => []),
      fetch(`/api/promoters`).then(r => r.json()).catch(() => []),
    ]).then(([a, e, p]) => {
      setArtists(Array.isArray(a) ? a.slice(0, 8) : []);
      setEvents(Array.isArray(e) ? e.slice(0, 6) : []);
      // Filter promoters by city client-side
      const cityLower = scene.name.toLowerCase();
      setPromoters(Array.isArray(p) ? p.filter((pr: Promoter) =>
        (pr as any).city?.toLowerCase().includes(cityLower) ||
        ((pr as any).cities ?? []).some((c: string) => c.toLowerCase().includes(cityLower))
      ).slice(0, 6) : []);
      setLoading(false);
    });
  }, [slug, scene]);

  if (!scene) {
    return (
      <main className="bg-cream min-h-screen">
        <Nav />
        <div className="container pt-32 pb-20 text-center">
          <h1 className="font-display text-4xl text-ink">City not found.</h1>
          <Link href="/discover" className="mt-6 inline-block font-display text-magenta">← Back to Discover</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const relatedGenres = GENRE_PAGES.filter(g => scene.activeGenres.some(ag => ag.toLowerCase().includes(g.slug)));

  return (
    <main className="bg-cream text-ink">
      <SEO
        title={`${scene.name} Electronic Music Scene | Cats Can Dance`}
        description={`${scene.tagline} Discover artists, events, promoters and venues from ${scene.name}'s underground electronic music scene.`}
        path={`/scene/${scene.slug}`}
        keywords={`${scene.name.toLowerCase()} electronic music, ${scene.name.toLowerCase()} underground, ${scene.activeGenres.join(", ").toLowerCase()}`}
      />
      <Nav />

      {/* ── Hero ── */}
      <section className={`${scene.accentColor} border-b-4 border-ink pt-28 pb-16 md:pt-36 md:pb-24`}>
        <div className="container">
          <Link href="/discover" className={`inline-flex items-center gap-1 font-display text-xs uppercase mb-6 ${scene.textColor} opacity-70 hover:opacity-100 transition-opacity`}>
            <ArrowLeft className="w-3 h-3" /> All Cities
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className={`font-display text-xs uppercase tracking-widest mb-2 ${scene.textColor} opacity-70`}>
                <MapPin className="inline w-3 h-3 mr-1" />India
              </p>
              <h1 className={`font-display text-[14vw] md:text-[9vw] leading-[0.85] uppercase ${scene.textColor}`}>
                {scene.name}
              </h1>
              <p className={`text-xl md:text-2xl mt-4 ${scene.textColor} opacity-80 max-w-2xl`}>
                {scene.tagline}
              </p>
            </div>
          </div>
          <p className={`mt-6 max-w-2xl ${scene.textColor} opacity-70 leading-relaxed`}>
            {scene.description}
          </p>
          {/* Genre tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {scene.activeGenres.map(g => (
              <span key={g} className="px-3 py-1 border-2 border-current font-display text-xs uppercase text-current opacity-80">
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Venues ── */}
      <section className="border-b-4 border-ink bg-acid-yellow">
        <div className="container py-8 flex flex-wrap gap-6 items-center">
          <p className="font-display text-xs uppercase text-ink/60 tracking-widest">Key venues</p>
          {scene.keyVenues.map(v => (
            <span key={v} className="font-display text-ink text-sm border-2 border-ink px-3 py-1">{v}</span>
          ))}
        </div>
      </section>

      {/* ── Artists from this city ── */}
      <section className="container py-14 border-b-4 border-ink">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-ink/50 mb-1">Artists</p>
            <h2 className="font-display text-3xl md:text-4xl uppercase text-ink">From {scene.name}</h2>
          </div>
          <Link href={`/artists?city=${scene.name}`} className="font-display text-xs uppercase text-magenta hover:underline">
            All artists →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array(8).fill(null).map((_, i) => <div key={i} className="aspect-square border-4 border-ink bg-ink/5 animate-pulse" />)}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {artists.map((a, i) => {
              const ACCENTS = ["bg-electric-blue","bg-magenta","bg-acid-yellow","bg-orange","bg-lime"];
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <Link key={a.id} href={`/artists/${a.slug}`}
                  className="group relative aspect-square border-4 border-ink overflow-hidden chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                  {a.photo_url ? (
                    <>
                      <img src={a.photo_url} alt={a.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 ${accent} flex items-center justify-center`}>
                      <Music className="w-8 h-8 text-ink/20" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-cream text-xs uppercase truncate">{a.name}</p>
                    {a.genres?.[0] && <p className="text-cream/60 text-[10px]">{a.genres[0]}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-4 border-ink bg-acid-yellow p-8 inline-block">
            <p className="font-display text-lg text-ink">No artists found for {scene.name} yet.</p>
            <p className="text-ink/60 text-sm mt-1">Check back as we grow the database.</p>
          </div>
        )}
      </section>

      {/* ── Upcoming Events ── */}
      <section className="bg-ink border-b-4 border-ink py-14">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-acid-yellow/70 mb-1">Events</p>
              <h2 className="font-display text-3xl md:text-4xl uppercase text-cream">Upcoming in {scene.name}</h2>
            </div>
            <Link href="/events" className="font-display text-xs uppercase text-acid-yellow hover:underline">
              All events →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array(3).fill(null).map((_, i) => <div key={i} className="border-4 border-ink/40 bg-white/5 h-48 animate-pulse" />)}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(ev => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer"
                  className="group border-4 border-cream/20 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  {ev.image_url && (
                    <div className="aspect-[16/9] overflow-hidden border-2 border-cream/20 mb-3">
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    </div>
                  )}
                  <h3 className="font-display text-cream uppercase text-sm leading-tight mb-1">{ev.title}</h3>
                  {ev.event_date && <p className="text-cream/50 text-xs">{new Date(ev.event_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>}
                  {ev.venue && <p className="text-cream/40 text-xs mt-0.5">{ev.venue}</p>}
                </a>
              ))}
            </div>
          ) : (
            <div className="border-4 border-cream/20 p-8 text-center">
              <p className="font-display text-cream/60 text-lg">No upcoming events found.</p>
              <p className="text-cream/40 text-sm mt-1">We update regularly — check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Promoters ── */}
      {!loading && promoters.length > 0 && (
        <section className="container py-14 border-b-4 border-ink">
          <div className="mb-8">
            <p className="font-display text-xs uppercase tracking-widest text-ink/50 mb-1">Promoters</p>
            <h2 className="font-display text-3xl md:text-4xl uppercase text-ink">Who Runs {scene.name}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoters.map(p => (
              <div key={p.id} className="border-4 border-ink bg-cream chunk-shadow p-5">
                <h3 className="font-display text-xl uppercase text-ink">{p.name}</h3>
                {p.blurb && <p className="text-sm text-ink/70 mt-2 line-clamp-2">{p.blurb}</p>}
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.genres.slice(0, 3).map(g => (
                    <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border border-ink">{g}</span>
                  ))}
                </div>
                {p.instagram && (
                  <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-3 font-display text-xs uppercase text-ink hover:text-magenta transition-colors">
                    @{p.instagram} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Related Genres ── */}
      {relatedGenres.length > 0 && (
        <section className="bg-acid-yellow border-b-4 border-ink py-12">
          <div className="container">
            <p className="font-display text-xs uppercase tracking-widest text-ink/50 mb-6">Genres You'll Hear</p>
            <div className="flex flex-wrap gap-3">
              {relatedGenres.map(g => (
                <Link key={g.slug} href={`/genres/${g.slug}`}
                  className="border-4 border-ink bg-ink text-cream font-display text-sm uppercase px-4 py-2 chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  {g.name} →
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

/**
 * ArtistEPK — shareable standalone press kit page.
 * Route: /artists/[slug]/epk
 * Clean, printable layout. No Nav distractions. Share link first.
 */
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import {
  Mail, Globe, Instagram, Headphones, Music, MapPin,
  ExternalLink, Copy, Check, Printer, ArrowLeft,
} from "lucide-react";
import SEO from "@/components/SEO";

interface Artist {
  id: string; slug: string; name: string;
  based_city?: string; from_city?: string; bio?: string;
  genres: string[]; photo_url?: string; instagram?: string;
  soundcloud?: string; spotify?: string; bandcamp?: string;
  website?: string; booking_email?: string; manager_email?: string;
  featured: boolean; claimed_by?: string;
  open_to_bookings: boolean; fee_min_inr?: number; fee_max_inr?: number;
  available_cities: string[]; labels?: string; why?: string;
}
interface Discography {
  id: string; title: string; release_type: string; release_date?: string | null;
  year?: number | null; label?: string | null; artwork_url?: string | null;
  spotify_url?: string | null; soundcloud_url?: string | null;
  bandcamp_url?: string | null;
}
interface PressItem {
  id: string; title: string; publication: string; author?: string | null;
  excerpt?: string | null; url?: string | null; type: string;
  date_published?: string | null; is_featured: boolean; quote_for_epk?: string | null;
}
interface ArtistStats {
  total_gigs: number; total_cities: number; total_venues: number;
  years_active: number; b2b_count: number;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function ArtistEPK() {
  const [, navigate] = useLocation();
  const { slug } = useParams<{ slug: string }>();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [discography, setDiscography] = useState<Discography[]>([]);
  const [press, setPress] = useState<PressItem[]>([]);
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [socialStats, setSocialStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/artists/${slug}/full`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setArtist(d.artist);
        setDiscography(d.discography || []);
        setPress(d.press || []);
        setStats(d.stats || null);
        setSocialStats(d.socialStats || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="font-display text-2xl text-ink animate-pulse">LOADING EPK…</p>
    </div>
  );

  if (!artist) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-ink mb-4">ARTIST NOT FOUND</p>
        <Link href="/artists" className="font-display text-sm uppercase text-magenta underline">← Back to Artists</Link>
      </div>
    </div>
  );

  const featuredQuotes = press.filter(p => p.quote_for_epk);

  return (
    <main className="bg-cream min-h-screen">
      <SEO
        title={`${artist.name} EPK — Electronic Press Kit`}
        description={artist.bio?.slice(0, 155) || `${artist.name} — Electronic Press Kit. ${artist.genres?.join(", ")}`}
        path={`/artists/${slug}/epk`}
      />

      {/* Top bar */}
      <div className="bg-ink border-b-4 border-ink print:hidden">
        <div className="container py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href={`/artists/${slug}`} className="flex items-center gap-1.5 font-display text-xs uppercase text-cream/70 hover:text-cream transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {artist.name}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/40 text-cream hover:border-cream hover:bg-cream/10 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-1.5 border-2 border-cream/40 text-cream hover:border-cream hover:bg-cream/10 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="container py-12 max-w-4xl space-y-10">

        {/* ── MASTHEAD ── */}
        <header className="border-4 border-ink bg-ink text-cream p-8 chunk-shadow">
          <p className="font-display text-xs uppercase text-acid-yellow tracking-[0.3em] mb-4">
            / ELECTRONIC PRESS KIT · CATS CAN DANCE
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {artist.photo_url ? (
              <img src={artist.photo_url} alt={artist.name}
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-4 border-cream shrink-0" />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-acid-yellow border-4 border-cream flex items-center justify-center shrink-0">
                <Music className="w-12 h-12 text-ink/40" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-5xl sm:text-6xl text-cream uppercase leading-[0.85] mb-3">
                {artist.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-3 text-cream/60 text-sm font-display uppercase">
                {(artist.based_city || artist.from_city) && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{artist.based_city || artist.from_city}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {artist.genres.map(g => (
                  <span key={g} className="font-display text-xs uppercase px-2 py-1 bg-acid-yellow text-ink border-2 border-cream">{g}</span>
                ))}
              </div>
              {artist.labels && (
                <p className="text-cream/60 text-sm mt-3 font-display uppercase">{artist.labels}</p>
              )}
            </div>
          </div>
        </header>

        {/* ── STATS BAR ── */}
        {stats && (stats.total_gigs > 0 || stats.years_active > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              stats.total_gigs > 0 && { label: "Gigs", value: stats.total_gigs + "+" },
              stats.total_cities > 0 && { label: "Cities", value: stats.total_cities },
              stats.years_active > 0 && { label: "Yrs active", value: stats.years_active },
              socialStats?.instagram_followers && { label: "IG followers", value: fmt(socialStats.instagram_followers) },
              socialStats?.soundcloud_followers && { label: "SC followers", value: fmt(socialStats.soundcloud_followers) },
              socialStats?.spotify_monthly_listeners && { label: "Spotify monthly", value: fmt(socialStats.spotify_monthly_listeners) },
            ].filter(Boolean).slice(0, 4).map((s: any) => (
              <div key={s.label} className="border-4 border-ink bg-cream chunk-shadow p-4 text-center">
                <p className="font-display text-3xl text-ink">{s.value}</p>
                <p className="font-display text-xs text-ink/50 uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── BIO ── */}
        {artist.bio && (
          <section className="border-4 border-ink bg-cream chunk-shadow p-6">
            <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-4">/ BIO</p>
            <p className="text-ink/85 leading-relaxed text-lg first-letter:text-5xl first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:leading-none">
              {artist.bio}
            </p>
            {artist.why && (
              <p className="mt-4 pt-4 border-t-2 border-ink/20 font-display text-base text-magenta">
                "{artist.why}"
              </p>
            )}
          </section>
        )}

        {/* ── PRESS QUOTES ── */}
        {featuredQuotes.length > 0 && (
          <section>
            <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-4">/ PRESS</p>
            <div className="space-y-4">
              {featuredQuotes.map(p => (
                <blockquote key={p.id} className="border-l-4 border-magenta pl-5 py-1">
                  <p className="text-ink/85 italic text-xl leading-snug">"{p.quote_for_epk}"</p>
                  <footer className="font-display text-xs text-ink/50 mt-2 uppercase flex items-center gap-2">
                    <span>— {p.publication}{p.author ? `, ${p.author}` : ""}</span>
                    {p.date_published && <span>· {p.date_published}</span>}
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-magenta hover:underline flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" /> Read
                      </a>
                    )}
                  </footer>
                </blockquote>
              ))}
            </div>
            {/* All press items */}
            {press.filter(p => !p.quote_for_epk).length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {press.filter(p => !p.quote_for_epk).map(p => (
                  <div key={p.id} className="border-2 border-ink/20 p-3 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display text-[9px] uppercase bg-electric-blue text-cream px-1.5 py-0.5 mr-1">{p.type}</span>
                      <span className="font-display text-xs text-ink">{p.title}</span>
                      <p className="text-[10px] text-ink/50">{p.publication}{p.date_published ? ` · ${p.date_published}` : ""}</p>
                    </div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-magenta shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── DISCOGRAPHY ── */}
        {discography.length > 0 && (
          <section>
            <p className="font-display text-xs uppercase text-ink/50 tracking-widest mb-4">/ DISCOGRAPHY</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {discography.map(r => (
                <div key={r.id} className="border-4 border-ink bg-cream chunk-shadow overflow-hidden">
                  {r.artwork_url
                    ? <img src={r.artwork_url} alt={r.title} className="w-full aspect-square object-cover border-b-4 border-ink" />
                    : <div className="w-full aspect-square bg-ink/5 border-b-4 border-ink flex items-center justify-center"><Music className="w-8 h-8 text-ink/20" /></div>
                  }
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-display text-[9px] uppercase bg-ink text-cream px-1.5 py-0.5">{r.release_type}</span>
                      {r.year && <span className="font-display text-[9px] text-ink/40">{r.year}</span>}
                    </div>
                    <p className="font-display text-xs text-ink leading-tight">{r.title}</p>
                    {r.label && <p className="text-[9px] text-ink/50 mt-0.5">{r.label}</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.spotify_url && <a href={r.spotify_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow">Spotify</a>}
                      {r.soundcloud_url && <a href={r.soundcloud_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow">SC</a>}
                      {r.bandcamp_url && <a href={r.bandcamp_url} target="_blank" rel="noreferrer" className="font-display text-[9px] uppercase px-1.5 py-0.5 border border-ink hover:bg-acid-yellow">BC</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BOOKING & CONTACT ── */}
        <section className="border-4 border-ink bg-orange chunk-shadow p-6 grid sm:grid-cols-2 gap-6">
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-3">/ BOOKING & CONTACT</p>
            <div className="space-y-2">
              {artist.booking_email && (
                <a href={`mailto:${artist.booking_email}`} className="flex items-center gap-2 font-display text-sm text-ink hover:text-magenta transition-colors">
                  <Mail className="w-4 h-4 shrink-0" /> {artist.booking_email}
                </a>
              )}
              {artist.manager_email && (
                <a href={`mailto:${artist.manager_email}`} className="flex items-center gap-2 font-display text-sm text-ink hover:text-magenta transition-colors">
                  <Mail className="w-4 h-4 shrink-0" /> {artist.manager_email}
                  <span className="text-ink/50 font-sans text-xs">(mgmt)</span>
                </a>
              )}
              {artist.website && (
                <a href={artist.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-display text-sm text-ink hover:text-magenta transition-colors">
                  <Globe className="w-4 h-4 shrink-0" /> {artist.website}
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-3">/ LINKS</p>
            <div className="flex flex-wrap gap-2">
              {artist.instagram && (
                <a href={`https://instagram.com/${artist.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-2 border-2 border-ink bg-cream hover:bg-acid-yellow transition-colors">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {artist.soundcloud && (
                <a href={artist.soundcloud} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-2 border-2 border-ink bg-cream hover:bg-acid-yellow transition-colors">
                  <Headphones className="w-3.5 h-3.5" /> SoundCloud
                </a>
              )}
              {artist.spotify && (
                <a href={artist.spotify} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 font-display text-xs uppercase px-3 py-2 border-2 border-ink bg-cream hover:bg-acid-yellow transition-colors">
                  <Music className="w-3.5 h-3.5" /> Spotify
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── FEE & AVAILABILITY ── */}
        {(artist.fee_min_inr || artist.fee_max_inr || artist.available_cities.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {(artist.fee_min_inr || artist.fee_max_inr) && (
              <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-5">
                <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-1">Fee Range</p>
                <p className="font-display text-2xl text-ink">
                  {artist.fee_min_inr && artist.fee_max_inr
                    ? `₹${artist.fee_min_inr.toLocaleString("en-IN")} – ₹${artist.fee_max_inr.toLocaleString("en-IN")}`
                    : "Contact for rates"}
                </p>
              </div>
            )}
            {artist.available_cities.length > 0 && (
              <div className="border-4 border-ink bg-cream chunk-shadow p-5">
                <p className="font-display text-xs uppercase text-ink/60 tracking-widest mb-2">Available in</p>
                <div className="flex flex-wrap gap-1.5">
                  {artist.available_cities.map(c => (
                    <span key={c} className="font-display text-xs uppercase px-2 py-1 border-2 border-ink bg-cream">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="border-t-4 border-ink pt-6 flex items-center justify-between gap-4 flex-wrap print:hidden">
          <p className="font-display text-xs text-ink/40 uppercase">
            EPK generated by Cats Can Dance · catscandance.com
          </p>
          <div className="flex gap-3">
            <Link href={`/artists/${slug}`}
              className="font-display text-xs uppercase px-4 py-2 border-2 border-ink hover:bg-acid-yellow transition-colors">
              Full Profile →
            </Link>
            <Link href={`/artists/${slug}?tab=book`}
              className="font-display text-xs uppercase px-4 py-2 border-2 border-ink bg-magenta text-cream hover:bg-ink transition-colors">
              Book {artist.name.split(" ")[0]} →
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

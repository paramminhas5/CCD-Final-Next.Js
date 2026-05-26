import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, MapPin, Music } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { GENRE_PAGES, GLOBAL_SCENES } from "@/content/scenes";

interface Props { slug: string; }
interface Artist { id: string; slug: string; name: string; genres: string[]; photo_url?: string; based_city?: string; }

export default function GenrePage({ slug }: Props) {
  const genre = GENRE_PAGES.find(g => g.slug === slug);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!genre) return;
    fetch(`/api/artists?genre=${encodeURIComponent(genre.name)}&limit=12`)
      .then(r => r.json())
      .then(d => { setArtists(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug, genre]);

  if (!genre) {
    return (
      <main className="bg-cream min-h-screen"><Nav />
        <div className="container pt-32 text-center">
          <h1 className="font-display text-4xl text-ink">Genre not found.</h1>
          <Link href="/discover" className="mt-4 inline-block font-display text-magenta">← Discover</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const globalScene = genre.relatedGlobalScene ? GLOBAL_SCENES.find(s => s.slug === genre.relatedGlobalScene) : null;

  return (
    <main className="bg-cream text-ink">
      <SEO
        title={`${genre.name} — Genre Guide | Cats Can Dance`}
        description={`${genre.tagline} ${genre.description.slice(0, 120)}… Discover Indian artists, key tracks and where to hear ${genre.name} in India.`}
        path={`/genres/${genre.slug}`}
        keywords={`${genre.name.toLowerCase()} music india, ${genre.name.toLowerCase()} artists india, ${genre.origin.toLowerCase()} ${genre.name.toLowerCase()}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "MusicGenre",
            name: genre.name,
            description: genre.description,
            url: `https://catscandance.com/genres/${genre.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://catscandance.com/" },
              { "@type": "ListItem", position: 2, name: "Discover", item: "https://catscandance.com/discover" },
              { "@type": "ListItem", position: 3, name: genre.name, item: `https://catscandance.com/genres/${genre.slug}` },
            ],
          },
        ]}
      />
      <Nav />

      {/* ── Hero ── */}
      <section className={`${genre.accentColor} border-b-4 border-ink pt-28 pb-16 md:pt-36 md:pb-24`}>
        <div className="container">
          <Link href="/discover" className={`inline-flex items-center gap-1 font-display text-xs uppercase mb-6 ${genre.textColor} opacity-70 hover:opacity-100 transition-opacity`}>
            <ArrowLeft className="w-3 h-3" /> All Genres
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${genre.textColor} opacity-70`}>
                  {genre.bpm} BPM
                </span>
                <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${genre.textColor} opacity-70`}>
                  {genre.origin}
                </span>
                <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${genre.textColor} opacity-70`}>
                  {genre.originDecade}
                </span>
              </div>
              <h1 className={`font-display text-[16vw] md:text-[10vw] leading-[0.85] uppercase ${genre.textColor}`}>
                {genre.name}
              </h1>
              <p className={`text-xl mt-4 ${genre.textColor} opacity-80 max-w-2xl`}>{genre.tagline}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About the genre ── */}
      <section className="container py-14 border-b-4 border-ink">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl uppercase mb-4">What Is {genre.name}?</h2>
            <p className="text-ink/70 leading-relaxed">{genre.description}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl uppercase mb-4">The Indian Scene</h2>
            <p className="text-ink/70 leading-relaxed">{genre.indianScene}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {genre.keyIndianArtists.map(a => (
                <span key={a} className="font-display text-xs uppercase px-3 py-1 border-2 border-ink bg-acid-yellow text-ink">{a}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Starter Tracks ── */}
      <section className="bg-ink border-b-4 border-ink py-14">
        <div className="container">
          <h2 className="font-display text-3xl text-cream uppercase mb-8">
            Start Here: <span className="text-acid-yellow">3 Essential Tracks</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {genre.starterTracks.map((track, i) => (
              <div key={i} className="border-4 border-cream/20 bg-white/5 p-4">
                <div className="aspect-video bg-black mb-3 border-2 border-cream/10 overflow-hidden">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${track.youtubeId}`}
                    title={track.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <p className="font-display text-cream text-sm uppercase">{track.title}</p>
                <p className="text-cream/50 text-xs mt-1">{track.artist}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Landmarks ── */}
      <section className="bg-acid-yellow border-b-4 border-ink py-12">
        <div className="container">
          <h2 className="font-display text-2xl uppercase text-ink mb-4">Where It Was Made</h2>
          <div className="flex flex-wrap gap-3">
            {genre.globalLandmarks.map(l => (
              <span key={l} className="font-display text-xs uppercase px-3 py-1.5 border-2 border-ink bg-ink text-cream">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Scene Link ── */}
      {globalScene && (
        <section className="container py-14 border-b-4 border-ink">
          <h2 className="font-display text-2xl uppercase mb-6">Where {genre.name} Comes From</h2>
          <Link href={`/scenes/${globalScene.slug}`}
            className={`block border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-8 max-w-lg ${globalScene.accentColor}`}>
            <p className={`font-display text-xs uppercase tracking-widest mb-2 ${globalScene.textColor} opacity-70`}>{globalScene.city} · {globalScene.decade}</p>
            <h3 className={`font-display text-3xl uppercase ${globalScene.textColor}`}>{globalScene.name}</h3>
            <p className={`mt-2 text-sm ${globalScene.textColor} opacity-70`}>{globalScene.tagline}</p>
            <p className={`mt-4 font-display text-xs uppercase ${globalScene.textColor} opacity-60`}>Explore this scene →</p>
          </Link>
        </section>
      )}

      {/* ── Indian Artists ── */}
      <section className="container py-14 border-b-4 border-ink">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl uppercase">Indian {genre.name} Artists</h2>
          <Link href={`/artists?genre=${genre.name}`} className="font-display text-xs uppercase text-magenta hover:underline">All →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array(8).fill(null).map((_,i) => <div key={i} className="aspect-square border-4 border-ink bg-ink/5 animate-pulse" />)}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artists.slice(0, 8).map((a, i) => {
              const ACCENTS = ["bg-electric-blue","bg-magenta","bg-acid-yellow","bg-orange","bg-lime"];
              const acc = ACCENTS[i % ACCENTS.length];
              return (
                <Link key={a.id} href={`/artists/${a.slug}`}
                  className="group relative aspect-square border-4 border-ink overflow-hidden chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform">
                  {a.photo_url ? (
                    <><img src={a.photo_url} alt={a.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" /></>
                  ) : (
                    <div className={`absolute inset-0 ${acc} flex items-center justify-center`}><Music className="w-8 h-8 text-ink/20" /></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-display text-cream text-xs uppercase truncate">{a.name}</p>
                    {a.based_city && <p className="text-cream/60 text-[10px] flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{a.based_city}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-4 border-ink bg-acid-yellow p-8">
            <p className="font-display text-ink text-lg">No {genre.name} artists in database yet.</p>
            <p className="text-ink/60 text-sm mt-1">Know someone? <Link href="/for-artists" className="underline">Submit them →</Link></p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

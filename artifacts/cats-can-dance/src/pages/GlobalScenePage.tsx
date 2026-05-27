import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { GLOBAL_SCENES, GENRE_PAGES, CITY_SCENES } from "@/content/scenes";

interface Props { slug: string; }

export default function GlobalScenePage({ slug }: Props) {
  const scene = GLOBAL_SCENES.find(s => s.slug === slug);

  if (!scene) {
    return (
      <main className="bg-cream min-h-screen"><Nav />
        <div className="container pt-32 text-center">
          <h1 className="font-display text-4xl text-ink">Scene not found.</h1>
          <Link href="/discover" className="mt-4 inline-block font-display text-magenta">← Discover</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const relatedGenres = GENRE_PAGES.filter(g => scene.relatedGenres.some(rg => rg.toLowerCase().includes(g.slug.replace("-", " "))));
  const relatedCities = CITY_SCENES.filter(c =>
    c.activeGenres.some(ag => scene.relatedGenres.some(rg => rg.toLowerCase().includes(ag.toLowerCase())))
  );

  return (
    <main className="bg-cream text-ink">
      <SEO
        title={`${scene.name} — Scene Origin | Cats Can Dance`}
        description={`${scene.tagline} The origin story of ${scene.name} from ${scene.city} and how it connects to India's underground music scene.`}
        path={`/scenes/${scene.slug}`}
        keywords={`${scene.name.toLowerCase()}, ${scene.city.toLowerCase()} electronic music, ${scene.relatedGenres.join(", ").toLowerCase()} india`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Place",
            name: `${scene.name} — ${scene.city}`,
            description: scene.origin,
            url: `https://catscandance.com/scenes/${scene.slug}`,
            address: { "@type": "PostalAddress", addressLocality: scene.city },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://catscandance.com/" },
              { "@type": "ListItem", position: 2, name: "Discover", item: "https://catscandance.com/discover" },
              { "@type": "ListItem", position: 3, name: scene.name, item: `https://catscandance.com/scenes/${scene.slug}` },
            ],
          },
        ]}
      />
      <Nav />

      {/* ── Hero ── */}
      <section className={`${scene.accentColor} border-b-4 border-ink pt-28 pb-16 md:pt-36 md:pb-24`}>
        <div className="container">
          <Link href="/discover" className={`inline-flex items-center gap-1 font-display text-xs uppercase mb-6 ${scene.textColor} opacity-70 hover:opacity-100 transition-opacity`}>
            <ArrowLeft className="w-3 h-3" /> All Scenes
          </Link>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${scene.textColor} opacity-70`}>
              <MapPin className="inline w-3 h-3 mr-1" />{scene.city}
            </span>
            <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${scene.textColor} opacity-70`}>
              {scene.decade}
            </span>
            <span className={`font-display text-xs border-2 border-current px-3 py-1 uppercase tracking-widest ${scene.textColor} opacity-70`}>
              {scene.bpm} BPM
            </span>
          </div>
          <h1 className={`font-display text-[10vw] md:text-[7vw] leading-[0.85] uppercase ${scene.textColor}`}>
            {scene.name}
          </h1>
          <p className={`text-xl md:text-2xl mt-4 ${scene.textColor} opacity-80 max-w-2xl`}>{scene.tagline}</p>
        </div>
      </section>

      {/* ── Origin Story ── */}
      <section className="container py-14 border-b-4 border-ink">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl uppercase mb-4">The Origin Story</h2>
            <p className="text-ink/70 leading-relaxed text-lg">{scene.origin}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl uppercase mb-4">The India Connection</h2>
            <p className="text-ink/70 leading-relaxed text-lg">{scene.indiaConnection}</p>
          </div>
        </div>
      </section>

      {/* ── Key Artists ── */}
      <section className="bg-acid-yellow border-b-4 border-ink py-12">
        <div className="container">
          <h2 className="font-display text-2xl uppercase text-ink mb-4">Who Built This Scene</h2>
          <div className="flex flex-wrap gap-3">
            {scene.keyArtists.map(a => (
              <span key={a} className="font-display text-sm uppercase px-4 py-2 border-4 border-ink bg-ink text-cream chunk-shadow">{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Starter Tracks ── */}
      {scene.starterTracks.length > 0 && (
        <section className="bg-ink border-b-4 border-ink py-14">
          <div className="container">
            <h2 className="font-display text-3xl text-cream uppercase mb-8">
              Start Here: <span className="text-acid-yellow">Essential Tracks</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scene.starterTracks.map((track, i) => (
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
      )}

      {/* ── Related genres ── */}
      {relatedGenres.length > 0 && (
        <section className="container py-14 border-b-4 border-ink">
          <h2 className="font-display text-2xl uppercase mb-6">Related Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {relatedGenres.map(g => (
              <Link key={g.slug} href={`/genres/${g.slug}`}
                className={`border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 ${g.accentColor}`}>
                <p className={`font-display text-xs uppercase tracking-widest ${g.textColor} opacity-60 mb-1`}>{g.bpm} BPM</p>
                <h3 className={`font-display text-xl uppercase ${g.textColor}`}>{g.name}</h3>
                <p className={`text-xs mt-2 ${g.textColor} opacity-70`}>{g.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Indian cities where this is heard ── */}
      {relatedCities.length > 0 && (
        <section className="bg-electric-blue border-b-4 border-ink py-12">
          <div className="container">
            <h2 className="font-display text-2xl uppercase text-cream mb-6">Where to Hear It in India</h2>
            <div className="flex flex-wrap gap-3">
              {relatedCities.map(c => (
                <Link key={c.slug} href={`/scene/${c.slug}`}
                  className="font-display text-xs uppercase px-4 py-2 border-4 border-cream bg-cream text-ink chunk-shadow hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  {c.name} →
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── More scenes ── */}
      <section className="container py-14">
        <h2 className="font-display text-2xl uppercase mb-6">More Global Scenes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {GLOBAL_SCENES.filter(s => s.slug !== slug).slice(0, 4).map(s => (
            <Link key={s.slug} href={`/scenes/${s.slug}`}
              className={`border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-4 ${s.accentColor}`}>
              <p className={`font-display text-[10px] uppercase ${s.textColor} opacity-60`}>{s.city}</p>
              <h3 className={`font-display text-base uppercase ${s.textColor} mt-1`}>{s.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

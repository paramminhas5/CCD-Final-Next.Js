import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CITY_SCENES, GLOBAL_SCENES, GENRE_PAGES } from "@/content/scenes";
import { MapPin, Globe, Music2, Compass, ArrowRight, Play } from "lucide-react";

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  eyebrow, title, subtitle, accent = "bg-acid-yellow",
}: {
  eyebrow: string; title: string; subtitle?: string; accent?: string;
}) {
  return (
    <div className="border-b-4 border-ink pb-6 mb-8">
      <span className={`inline-block font-display text-xs uppercase px-3 py-1 border-2 border-ink mb-3 ${accent} text-ink`}>
        {eyebrow}
      </span>
      <h2 className="font-display text-4xl md:text-5xl text-ink uppercase leading-tight">{title}</h2>
      {subtitle && <p className="text-ink/60 mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

// ─── City tile ───────────────────────────────────────────────────────────────
function CityTile({ city }: { city: (typeof CITY_SCENES)[0] }) {
  return (
    <Link
      href={`/scene/${city.slug}`}
      className={`group relative border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-6 flex flex-col justify-between min-h-[220px] ${city.accentColor}`}
    >
      <div>
        <p className={`font-display text-xs uppercase tracking-widest mb-1 ${city.textColor} opacity-70`}>
          India
        </p>
        <h3 className={`font-display text-3xl md:text-4xl uppercase leading-tight ${city.textColor}`}>
          {city.name}
        </h3>
      </div>
      <div>
        <p className={`text-sm mb-3 ${city.textColor} opacity-80`}>{city.tagline}</p>
        <div className="flex flex-wrap gap-1">
          {city.activeGenres.slice(0, 3).map(g => (
            <span key={g} className="text-[10px] font-display uppercase px-2 py-0.5 bg-cream/20 text-cream border border-cream/40">
              {g}
            </span>
          ))}
        </div>
      </div>
      <ArrowRight className={`absolute top-4 right-4 w-5 h-5 ${city.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Link>
  );
}

// ─── Global scene tile ────────────────────────────────────────────────────────
function GlobalSceneTile({ scene }: { scene: (typeof GLOBAL_SCENES)[0] }) {
  return (
    <Link
      href={`/scenes/${scene.slug}`}
      className={`group border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 flex flex-col gap-3 ${scene.accentColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-display text-[10px] uppercase tracking-widest ${scene.textColor} opacity-60`}>
            {scene.city} · {scene.decade}
          </p>
          <h3 className={`font-display text-xl uppercase leading-tight mt-1 ${scene.textColor}`}>
            {scene.name}
          </h3>
        </div>
        <span className={`font-display text-xs px-2 py-0.5 border border-current ${scene.textColor} opacity-50`}>
          {scene.bpm} BPM
        </span>
      </div>
      <p className={`text-sm line-clamp-2 ${scene.textColor} opacity-70`}>{scene.tagline}</p>
      <p className={`text-xs font-display uppercase ${scene.textColor} opacity-50 group-hover:opacity-100 transition-opacity`}>
        Explore →
      </p>
    </Link>
  );
}

// ─── Genre tile ───────────────────────────────────────────────────────────────
function GenreTile({ genre }: { genre: (typeof GENRE_PAGES)[0] }) {
  return (
    <Link
      href={`/genres/${genre.slug}`}
      className={`group border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 ${genre.accentColor}`}
    >
      <p className={`font-display text-[10px] uppercase tracking-widest mb-1 ${genre.textColor} opacity-60`}>
        {genre.bpm} BPM · {genre.origin}
      </p>
      <h3 className={`font-display text-2xl uppercase ${genre.textColor}`}>{genre.name}</h3>
      <p className={`text-xs mt-2 line-clamp-2 ${genre.textColor} opacity-70`}>{genre.tagline}</p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  return (
    <main className="bg-cream text-ink">
      <SEO
        title="Discover — Cats Can Dance | Indian & Global Electronic Music Scenes"
        description="Explore India's underground electronic music cities, global scene origins — Detroit Techno, Chicago House, London Jungle — and every genre you need to know."
        path="/discover"
        keywords="india electronic music scenes, discover underground music, techno house jungle drum and bass india, bengaluru mumbai delhi goa music"
      />
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-ink pt-32 pb-20 md:pt-40 md:pb-28 border-b-4 border-ink relative overflow-hidden">
        {/* Background grid decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)" }}
        />
        <div className="container relative z-10">
          <p className="font-display text-acid-yellow text-sm uppercase tracking-widest mb-4">
            <Compass className="inline w-4 h-4 mr-2" />
            Scene Discovery
          </p>
          <h1 className="font-display text-cream text-[14vw] md:text-[8vw] leading-[0.85] uppercase mb-8">
            WHERE<br/>
            <span className="text-acid-yellow">DOES THE</span><br/>
            MUSIC<br/>
            COME FROM?
          </h1>
          <p className="text-cream/70 max-w-xl text-lg leading-relaxed">
            Every sound has an origin. Every city has a scene. Every genre has a story.
            This is your map — from Detroit Techno to Bengaluru Jungle, from Chicago House to Goa Trance.
          </p>
        </div>
      </section>

      {/* ── Indian Cities ── */}
      <section className="container py-16 md:py-24">
        <SectionHeader
          eyebrow="Indian Scenes"
          title="The Cities"
          subtitle="Six cities. Six distinct sounds. One underground."
          accent="bg-acid-yellow"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITY_SCENES.map(city => (
            <CityTile key={city.slug} city={city} />
          ))}
        </div>
      </section>

      {/* ── Genre Wheel ── */}
      <section className="bg-ink border-y-4 border-ink py-16 md:py-24">
        <div className="container">
          <div className="border-b-4 border-cream/20 pb-6 mb-8">
            <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow mb-3">
              Genres
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-cream uppercase leading-tight">
              Pick Your Sound
            </h2>
            <p className="text-cream/50 mt-2 max-w-2xl">
              Every genre explained — origin, BPM, Indian scene, starter tracks.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {GENRE_PAGES.map(genre => (
              <GenreTile key={genre.slug} genre={genre} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Scenes ── */}
      <section className="container py-16 md:py-24">
        <SectionHeader
          eyebrow="Global Origins"
          title="Where It Started"
          subtitle="The cities and scenes that created the music you hear in India's clubs."
          accent="bg-electric-blue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GLOBAL_SCENES.map(scene => (
            <GlobalSceneTile key={scene.slug} scene={scene} />
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="bg-magenta border-y-4 border-ink py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl text-cream uppercase">Ready to dance?</h3>
            <p className="text-cream/80 mt-1">Find events near you across India.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/events" className="bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              See All Events →
            </Link>
            <Link href="/artists" className="bg-cream text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
              Browse Artists
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

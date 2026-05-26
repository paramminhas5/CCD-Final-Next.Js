/**
 * GenreWheel — homepage genre navigation grid.
 * Six genre tiles, each in its own accent colour, linking to /genres/:slug
 */
import Link from "next/link";
import { GENRE_PAGES } from "@/content/scenes";

export default function GenreWheel() {
  return (
    <section className="bg-ink border-b-4 border-ink py-14 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="border-b-4 border-cream/20 pb-6 mb-8">
          <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow mb-3">
            Genres
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-cream uppercase leading-tight">
            Pick Your Sound
          </h2>
          <p className="text-cream/50 mt-2 max-w-xl text-sm">
            Six genres. Every one explained — origin, BPM, key tracks, Indian scene.
          </p>
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {GENRE_PAGES.map(genre => (
            <Link
              key={genre.slug}
              href={`/genres/${genre.slug}`}
              className={`group border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-4 flex flex-col justify-between min-h-[140px] ${genre.accentColor}`}
            >
              <div>
                <p className={`font-display text-[10px] uppercase tracking-widest mb-1 ${genre.textColor} opacity-60`}>
                  {genre.bpm} BPM
                </p>
                <h3 className={`font-display text-lg uppercase leading-tight ${genre.textColor}`}>
                  {genre.name}
                </h3>
              </div>
              <p className={`font-display text-[10px] uppercase ${genre.textColor} opacity-0 group-hover:opacity-60 transition-opacity`}>
                Explore →
              </p>
            </Link>
          ))}
        </div>

        {/* Global origins teaser */}
        <div className="mt-8 border-4 border-cream/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display text-acid-yellow text-sm uppercase tracking-widest">Global Origins</p>
            <p className="text-cream/60 text-sm mt-1">Detroit Techno · Chicago House · London Jungle · Berlin Techno · Goa Trance</p>
          </div>
          <Link
            href="/discover#global-scenes"
            className="shrink-0 font-display text-xs uppercase px-4 py-2 border-4 border-cream bg-cream text-ink chunk-shadow hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Trace the roots →
          </Link>
        </div>
      </div>
    </section>
  );
}

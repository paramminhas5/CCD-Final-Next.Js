"use client";
/**
 * ArtistSpotlight — homepage featured artists carousel.
 * Fetches up to 5 featured artists and displays them in an
 * auto-advancing Embla carousel with dot indicators + arrow nav.
 * Manual 5-second autoplay (no extra npm dep needed).
 */
import { useEffect, useState, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { MapPin, Music, ChevronLeft, ChevronRight } from "lucide-react";

interface Artist {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  genres: string[];
  photo_url?: string;
  based_city?: string;
  soundcloud?: string;
  instagram?: string;
  featured: boolean;
}

// ─── Single slide ─────────────────────────────────────────────────────────────
function ArtistSlide({ artist }: { artist: Artist }) {
  return (
    <div className="embla__slide min-w-0 flex-[0_0_100%]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-cream overflow-hidden">
        {/* Photo */}
        <div className="relative aspect-square md:aspect-auto md:min-h-[420px] border-b-4 md:border-b-0 md:border-r-4 border-cream overflow-hidden">
          {artist.photo_url ? (
            <img
              src={artist.photo_url}
              alt={artist.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-ink flex items-center justify-center">
              <Music className="w-20 h-20 text-cream/20" />
            </div>
          )}
          {/* Genre tags overlay */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {artist.genres.slice(0, 3).map(g => (
              <span
                key={g}
                className="text-[11px] font-display uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-cream p-8 md:p-10 flex flex-col justify-between">
          <div>
            {artist.based_city && (
              <p className="flex items-center gap-1 text-ink/60 text-sm mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {artist.based_city}
              </p>
            )}
            <h3 className="font-display text-4xl md:text-5xl text-ink uppercase leading-[0.85] mb-5">
              {artist.name}
            </h3>
            {artist.bio && (
              <p className="text-ink/70 leading-relaxed line-clamp-4 text-base md:text-lg mb-6">
                {artist.bio}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/artists/${artist.slug}`}
              className="font-display text-sm uppercase px-5 py-3 border-4 border-ink bg-ink text-cream chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Full Profile →
            </Link>
            {artist.instagram && (
              <a
                href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="font-display text-sm uppercase px-5 py-3 border-4 border-ink bg-cream text-ink chunk-shadow hover:bg-acid-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Instagram ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dot indicator ────────────────────────────────────────────────────────────
function DotButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Current slide" : "Go to slide"}
      className={`w-3 h-3 border-2 border-cream transition-colors ${
        active ? "bg-cream" : "bg-transparent hover:bg-cream/50"
      }`}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ArtistSpotlight() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Sync dot index with carousel
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Manual autoplay — 5s interval, stops on user interaction
  useEffect(() => {
    if (!emblaApi || artists.length <= 1) return;
    if (userInteracted) return;

    autoplayRef.current = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [emblaApi, artists.length, userInteracted]);

  const scrollPrev = () => {
    setUserInteracted(true);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    emblaApi?.scrollPrev();
  };
  const scrollNext = () => {
    setUserInteracted(true);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    emblaApi?.scrollNext();
  };
  const scrollTo = (i: number) => {
    setUserInteracted(true);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    emblaApi?.scrollTo(i);
  };

  // Fetch featured artists
  useEffect(() => {
    fetch("/api/artists?featured=true&limit=5")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setArtists(list.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-magenta border-b-4 border-ink py-14 md:py-20">
        <div className="container">
          <div className="h-[420px] border-4 border-cream/30 animate-pulse" />
        </div>
      </section>
    );
  }

  if (artists.length === 0) return null;

  return (
    <section className="bg-magenta border-b-4 border-ink py-14 md:py-20 overflow-hidden">
      <div className="container">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8 border-b-4 border-cream/30 pb-6">
          <div>
            <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-cream text-cream mb-3">
              Artist Spotlight
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-cream uppercase leading-tight">
              Featured Artists
            </h2>
          </div>
          <Link
            href="/artists"
            className="hidden sm:inline-block font-display text-xs uppercase text-cream/70 hover:text-cream border-2 border-cream/40 hover:border-cream px-3 py-1.5 transition-colors"
          >
            All Artists →
          </Link>
        </div>

        {/* Embla viewport */}
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {artists.map(artist => (
              <ArtistSlide key={artist.id} artist={artist} />
            ))}
          </div>
        </div>

        {/* Controls: arrows + dots */}
        {artists.length > 1 && (
          <div className="flex items-center justify-between mt-6">
            {/* Prev */}
            <button
              onClick={scrollPrev}
              aria-label="Previous artist"
              className="w-11 h-11 border-4 border-cream flex items-center justify-center text-cream hover:bg-cream hover:text-magenta transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {artists.map((_, i) => (
                <DotButton
                  key={i}
                  active={i === selectedIndex}
                  onClick={() => scrollTo(i)}
                />
              ))}
            </div>

            {/* Next */}
            <button
              onClick={scrollNext}
              aria-label="Next artist"
              className="w-11 h-11 border-4 border-cream flex items-center justify-center text-cream hover:bg-cream hover:text-magenta transition-colors chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Slide counter */}
        <p className="text-center font-display text-xs text-cream/40 uppercase tracking-widest mt-4">
          {selectedIndex + 1} / {artists.length}
        </p>
      </div>
    </section>
  );
}

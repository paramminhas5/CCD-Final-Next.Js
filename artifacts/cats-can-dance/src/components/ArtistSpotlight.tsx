/**
 * ArtistSpotlight — homepage featured artist section.
 * Fetches the featured artist from /api/artists?featured=true&limit=1
 * and renders a full-width editorial treatment.
 */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Music, ExternalLink } from "lucide-react";

interface Artist {
  id: string; slug: string; name: string;
  bio?: string; genres: string[]; photo_url?: string;
  based_city?: string; soundcloud?: string; instagram?: string;
  featured: boolean;
}

export default function ArtistSpotlight() {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artists?featured=true&limit=1")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setArtist(list[0] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-magenta border-b-4 border-ink py-14 md:py-20">
        <div className="container">
          <div className="h-64 border-4 border-ink bg-magenta/50 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!artist) return null;

  return (
    <section className="bg-magenta border-b-4 border-ink py-14 md:py-20 overflow-hidden">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 border-b-4 border-cream/30 pb-6">
          <div>
            <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-cream text-cream mb-3">
              Artist Spotlight
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-cream uppercase leading-tight">
              This Week's Pick
            </h2>
          </div>
          <Link href="/artists" className="hidden sm:inline-block font-display text-xs uppercase text-cream/70 hover:text-cream border-2 border-cream/40 hover:border-cream px-3 py-1.5 transition-colors">
            All Artists →
          </Link>
        </div>

        {/* Spotlight card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-cream chunk-shadow-lg overflow-hidden">
          {/* Photo */}
          <div className="relative aspect-square md:aspect-auto md:min-h-[400px] border-b-4 md:border-b-0 md:border-r-4 border-cream overflow-hidden">
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
            {/* Overlay genre tags */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {artist.genres.slice(0, 3).map(g => (
                <span key={g} className="text-[11px] font-display uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
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
                  <MapPin className="w-3.5 h-3.5" /> {artist.based_city}
                </p>
              )}
              <h3 className="font-display text-4xl md:text-6xl text-ink uppercase leading-[0.85] mb-6">
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
                  href={`https://instagram.com/${artist.instagram.replace("@","")}`}
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
    </section>
  );
}

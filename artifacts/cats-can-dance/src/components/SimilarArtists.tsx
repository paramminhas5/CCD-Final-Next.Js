"use client";
/**
 * SimilarArtists — shows connected / genre-matched artists below the
 * ArtistDetail tab section.
 *
 * Priority:
 * 1. Artists from the connections table (shared-events / B2B partners)
 * 2. Fallback: artists sharing at least one genre (client-side filtered)
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Music, MapPin, Users } from "lucide-react";

interface Artist {
  id: string;
  slug: string;
  name: string;
  genres: string[];
  photo_url?: string;
  based_city?: string;
  from_city?: string;
}

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  connection_type: string;
  strength: number;
}

interface Props {
  slug: string;          // current artist slug
  genres: string[];      // current artist genres
  connections: Connection[];
}

const CARD_ACCENTS = [
  "bg-acid-yellow text-ink",
  "bg-electric-blue text-cream",
  "bg-magenta text-cream",
  "bg-orange text-ink",
  "bg-lime text-ink",
];

function ArtistMiniCard({ artist, index, connectionType }: {
  artist: Artist;
  index: number;
  connectionType?: string;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const city = artist.based_city || artist.from_city;

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group relative border-4 border-ink overflow-hidden chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform aspect-square"
    >
      {artist.photo_url ? (
        <>
          <img
            src={artist.photo_url}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
        </>
      ) : (
        <div className={`absolute inset-0 ${accent} flex items-center justify-center`}>
          <Music className="w-10 h-10 opacity-20" />
        </div>
      )}

      {/* Connection type badge */}
      {connectionType && (
        <span className="absolute top-2 left-2 font-display text-[9px] uppercase px-1.5 py-0.5 bg-acid-yellow text-ink border border-ink">
          {connectionType}
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className={`font-display text-xs uppercase leading-tight truncate ${artist.photo_url ? "text-cream" : accent.includes("text-ink") ? "text-ink" : "text-cream"}`}>
          {artist.name}
        </p>
        {city && (
          <p className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${artist.photo_url ? "text-cream/60" : accent.includes("text-ink") ? "text-ink/60" : "text-cream/60"}`}>
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {city}
          </p>
        )}
        {artist.genres.length > 0 && (
          <span className="inline-block mt-1 text-[9px] font-display uppercase px-1.5 py-0.5 bg-acid-yellow text-ink border border-ink">
            {artist.genres[0]}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function SimilarArtists({ slug, genres, connections }: Props) {
  const [similar, setSimilar] = useState<{ artist: Artist; connectionType?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // Extract partner slugs from connections (already loaded in ArtistDetail)
    const connectedSlugs = connections
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 8)
      .map(c => ({
        partnerSlug: c.artist_a_slug === slug ? c.artist_b_slug : c.artist_a_slug,
        connectionType: c.connection_type,
      }));

    if (connectedSlugs.length > 0) {
      // Fetch connected artists by slug
      Promise.all(
        connectedSlugs.slice(0, 6).map(({ partnerSlug, connectionType }) =>
          fetch(`/api/artists/${partnerSlug}`)
            .then(r => r.ok ? r.json() : null)
            .then(artist => artist ? { artist, connectionType } : null)
            .catch(() => null)
        )
      ).then(results => {
        const valid = results.filter(Boolean) as { artist: Artist; connectionType: string }[];
        setSimilar(valid);
        setLoading(false);
      });
      return;
    }

    // Fallback: fetch artists by first genre
    if (genres.length > 0) {
      fetch(`/api/artists?limit=12`)
        .then(r => r.json())
        .then((all: Artist[]) => {
          if (!Array.isArray(all)) return;
          const filtered = all
            .filter(a =>
              a.slug !== slug &&
              a.genres.some(g => genres.includes(g))
            )
            .slice(0, 6)
            .map(artist => ({ artist }));
          setSimilar(filtered);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, [slug, genres, connections]);

  if (loading) {
    return (
      <section className="bg-cream border-t-4 border-ink py-12">
        <div className="container">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="aspect-square border-4 border-ink bg-ink/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (similar.length === 0) return null;

  const heading = connections.length > 0
    ? "Artists They've Played With"
    : `More ${genres[0] ?? ""} Artists`;

  return (
    <section className="bg-cream border-t-4 border-ink py-12">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 border-b-4 border-ink pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ink/60" />
            <h2 className="font-display text-2xl md:text-3xl text-ink uppercase">
              {heading}
            </h2>
          </div>
          <Link
            href="/artists"
            className="font-display text-xs uppercase text-magenta hover:underline"
          >
            All Artists →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {similar.map(({ artist, connectionType }, i) => (
            <ArtistMiniCard
              key={artist.id}
              artist={artist}
              index={i}
              connectionType={connectionType}
            />
          ))}
        </div>

        {connections.length > 0 && (
          <p className="mt-4 font-display text-xs text-ink/40 uppercase tracking-widest">
            Based on shared gigs and B2B sets
          </p>
        )}
      </div>
    </section>
  );
}

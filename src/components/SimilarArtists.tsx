"use client";
/**
 * SimilarArtists — shows connected / genre-matched artists below the
 * ArtistDetail tab section.
 *
 * Priority:
 * 1. Artists from the connections table (shared-events / B2B partners)
 * 2. Fallback: artists sharing at least one genre (client-side filtered)
 *
 * Phase 4A: each card now shows WHY the artist is similar:
 *   - connection type badge (b2b / collab / label / venue)
 *   - shared event count when available
 * Phase 4B: credential badges (festival circuit, Boiler Room, verified)
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Music, MapPin, Users, Zap } from "lucide-react";

interface Artist {
  id: string;
  slug: string;
  name: string;
  genres: string[];
  photo_url?: string;
  based_city?: string;
  from_city?: string;
  claimed_by?: string;
  festivals?: string[];
}

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  connection_type: string;
  strength: number;
  shared_events?: string[];
  shared_venues?: string[];
  notes?: string;
}

interface Props {
  slug: string;
  genres: string[];
  connections: Connection[];
}

const CARD_ACCENTS = [
  "bg-acid-yellow text-ink",
  "bg-electric-blue text-cream",
  "bg-magenta text-cream",
  "bg-orange text-ink",
  "bg-lime text-ink",
];

const CONN_COLOURS: Record<string, string> = {
  b2b:    "bg-acid-yellow text-ink",
  collab: "bg-electric-blue text-cream",
  label:  "bg-magenta text-cream",
  venue:  "bg-orange text-ink",
  crew:   "bg-lime text-ink",
};

function whyLabel(connectionType: string, sharedEvents?: string[], sharedVenues?: string[]): string {
  const evCount = sharedEvents?.length ?? 0;
  const venCount = sharedVenues?.length ?? 0;
  if (connectionType === "b2b") return evCount > 0 ? `B2B · ${evCount} shared gig${evCount !== 1 ? "s" : ""}` : "B2B partner";
  if (connectionType === "collab") return "Collab";
  if (connectionType === "label") return "Same label";
  if (connectionType === "venue") return venCount > 0 ? `${venCount} shared venue${venCount !== 1 ? "s" : ""}` : "Shared venue";
  if (connectionType === "crew") return "Same crew";
  return evCount > 0 ? `${evCount} shared gig${evCount !== 1 ? "s" : ""}` : "Connected";
}

function ArtistMiniCard({ artist, index, connectionType, sharedEvents, sharedVenues, similarReason }: {
  artist: Artist;
  index: number;
  connectionType?: string;
  sharedEvents?: string[];
  sharedVenues?: string[];
  similarReason?: string; // for genre-fallback
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const city = artist.based_city || artist.from_city;
  const isVerified = !!artist.claimed_by;
  const hasFestivals = (artist.festivals ?? []).length > 0;

  const reasonLabel = connectionType
    ? whyLabel(connectionType, sharedEvents, sharedVenues)
    : similarReason;

  const reasonStyle = connectionType
    ? (CONN_COLOURS[connectionType] ?? "bg-ink text-cream")
    : "bg-cream text-ink";

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

      {/* Credential badges — top row */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {isVerified && (
          <span className="font-display text-[8px] uppercase px-1.5 py-0.5 bg-lime text-ink border border-ink leading-none">
            ✓ Verified
          </span>
        )}
        {hasFestivals && (
          <span className="font-display text-[8px] uppercase px-1.5 py-0.5 bg-acid-yellow text-ink border border-ink leading-none flex items-center gap-0.5">
            <Zap className="w-2 h-2" /> Festival
          </span>
        )}
      </div>

      {/* Why similar label — top right */}
      {reasonLabel && (
        <span className={`absolute top-2 right-2 font-display text-[8px] uppercase px-1.5 py-0.5 border border-ink leading-none ${reasonStyle}`}>
          {reasonLabel}
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
  const [similar, setSimilar] = useState<{
    artist: Artist;
    connectionType?: string;
    sharedEvents?: string[];
    sharedVenues?: string[];
    similarReason?: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const connectedSlugs = connections
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 8)
      .map(c => ({
        partnerSlug: c.artist_a_slug === slug ? c.artist_b_slug : c.artist_a_slug,
        connectionType: c.connection_type,
        sharedEvents: c.shared_events ?? [],
        sharedVenues: c.shared_venues ?? [],
      }));

    if (connectedSlugs.length > 0) {
      Promise.all(
        connectedSlugs.slice(0, 6).map(({ partnerSlug, connectionType, sharedEvents, sharedVenues }) =>
          fetch(`/api/artists/${partnerSlug}`)
            .then(r => r.ok ? r.json() : null)
            .then(artist => artist ? { artist, connectionType, sharedEvents, sharedVenues } : null)
            .catch(() => null)
        )
      ).then(results => {
        setSimilar(results.filter(Boolean) as any[]);
        setLoading(false);
      });
      return;
    }

    // Genre fallback
    if (genres.length > 0) {
      fetch(`/api/artists?limit=30`)
        .then(r => r.json())
        .then((all: Artist[]) => {
          if (!Array.isArray(all)) return;
          const filtered = all
            .filter(a => a.slug !== slug && a.genres.some(g => genres.includes(g)))
            .slice(0, 6)
            .map(artist => {
              const shared = artist.genres.filter(g => genres.includes(g));
              return { artist, similarReason: `${shared[0]}` };
            });
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

  const isConnected = connections.length > 0;
  const heading = isConnected ? "Artists They've Played With" : `More ${genres[0] ?? ""} Artists`;
  const subheading = isConnected
    ? "Based on shared gigs, B2B sets, and label connections"
    : `Artists sharing the ${genres[0]} sound`;

  return (
    <section className="bg-cream border-t-4 border-ink py-12">
      <div className="container">
        <div className="flex items-end justify-between mb-6 border-b-4 border-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-ink/60" />
              <h2 className="font-display text-2xl md:text-3xl text-ink uppercase">{heading}</h2>
            </div>
            <p className="text-ink/50 text-xs font-display uppercase mt-1">{subheading}</p>
          </div>
          <Link href="/artists" className="font-display text-xs uppercase text-magenta hover:underline">
            All Artists →
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {similar.map(({ artist, connectionType, sharedEvents, sharedVenues, similarReason }, i) => (
            <ArtistMiniCard
              key={artist.id}
              artist={artist}
              index={i}
              connectionType={connectionType}
              sharedEvents={sharedEvents}
              sharedVenues={sharedVenues}
              similarReason={similarReason}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One artist tile on the event detail page lineup section.
 *
 *  - Falls back to a clean "name + role" card if no rich detail is supplied.
 *  - "TBA" gets its own treatment (dotted border, lower contrast) so the
 *    page reads honest about what's confirmed.
 *  - Embeds an audio preview (SoundCloud / Spotify) if URLs are provided.
 *  - Links to /artists/[slug] when a slug is set.
 */

import { Link } from "@/lib/compat-router";
import ArtistAudioEmbed from "@/components/ArtistAudioEmbed";
import type { LineupArtist } from "@/types/events";

type Props = {
  artist: LineupArtist;
  /**
   * Position in the lineup (0-indexed). Used to cycle palettes so cards
   * stack with rhythm rather than being one colour repeated.
   */
  index: number;
};

const PALETTES = [
  { bg: "bg-magenta",        text: "text-cream", chip: "bg-acid-yellow text-ink", role: "text-acid-yellow" },
  { bg: "bg-electric-blue",  text: "text-cream", chip: "bg-acid-yellow text-ink", role: "text-acid-yellow" },
  { bg: "bg-acid-yellow",    text: "text-ink",   chip: "bg-magenta text-cream",   role: "text-magenta" },
];

const EventLineupCard = ({ artist, index }: Props) => {
  const palette = PALETTES[index % PALETTES.length];

  const inner = (
    <div
      className={`relative border-4 border-ink chunk-shadow p-5 md:p-6 h-full flex flex-col ${
        artist.tba ? "bg-cream text-ink/70 border-dashed" : `${palette.bg} ${palette.text}`
      } ${!artist.tba && artist.slug ? "hover:-translate-y-1 hover:translate-x-1 transition-transform" : ""}`}
    >
      {artist.role && (
        <span className={`inline-block self-start text-[10px] font-bold px-2 py-0.5 border-2 border-ink uppercase tracking-widest mb-3 ${
          artist.tba ? "bg-ink text-cream" : palette.chip
        }`}>
          {artist.role}
        </span>
      )}

      <h3 className={`font-display text-3xl md:text-4xl leading-none mb-2 ${
        artist.tba ? "tracking-widest" : ""
      }`}>
        {artist.name.toUpperCase()}
      </h3>

      {artist.set_time && (
        <p className={`font-display text-sm tracking-widest mb-3 ${palette.role}`}>
          / {artist.set_time}
        </p>
      )}

      {artist.blurb && (
        <p className={`text-sm font-medium leading-snug mb-3 ${artist.tba ? "" : "opacity-90"}`}>
          {artist.blurb}
        </p>
      )}

      {!artist.tba && (artist.soundcloud || artist.spotify) && (
        <div className="mt-auto pt-2">
          <ArtistAudioEmbed
            soundcloud={artist.soundcloud}
            spotify={artist.spotify}
            artistName={artist.name}
          />
        </div>
      )}

      {!artist.tba && artist.slug && (
        <p className={`mt-auto pt-3 font-display text-xs tracking-widest ${palette.role}`}>
          / TAP TO READ MORE →
        </p>
      )}
    </div>
  );

  if (artist.tba || !artist.slug) {
    return <article aria-label={artist.name}>{inner}</article>;
  }

  return (
    <Link to={`/artists/${artist.slug}`} className="block focus:outline-none focus:ring-4 focus:ring-magenta">
      {inner}
    </Link>
  );
};

export default EventLineupCard;

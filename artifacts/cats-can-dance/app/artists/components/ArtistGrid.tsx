/**
 * ArtistGrid — pure server component.
 *
 * Receives the full artist list (already fetched server-side by page.tsx)
 * and renders the grid. No fetching, no state, no hooks.
 *
 * The interactive filter bar (ArtistFilters) wraps this in a client boundary
 * and passes filtered results down as a prop.
 */
import Link from "next/link";
import { Music, MapPin } from "lucide-react";
import type { Artist } from "@/lib/db/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function cityOf(a: Pick<Artist, "based_city" | "from_city">): string {
  return a.based_city ?? a.from_city ?? "";
}

export function coverImg(a: Pick<Artist, "photo_url" | "gallery">): string | null {
  if (a.photo_url) return a.photo_url;
  const gallery = a.gallery as any[] | null | undefined;
  if (gallery && gallery.length > 0) {
    const first = gallery[0];
    if (typeof first === "string") return first;
    if (first?.url)  return first.url;
    if (first?.src)  return first.src;
  }
  return null;
}

// Rotating neobrutalist accent colours for cards without a photo
const CARD_ACCENTS = [
  "bg-acid-yellow text-ink",
  "bg-electric-blue text-cream",
  "bg-magenta text-cream",
  "bg-orange text-ink",
  "bg-lime text-ink",
];

const KIND_EMOJI: Record<string, string> = {
  photographer: "📸",
  videographer: "🎥",
  lighting:     "💡",
  mix_engineer: "🎚️",
  production:   "🏗️",
  mc:           "🎤",
};

// ── ArtistCard — individual card, pure server ─────────────────────────────────

export function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const img    = coverImg(artist);
  const city   = cityOf(artist);
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const isLarge = index % 9 === 0;
  const isTextOnDark = accent.includes("text-cream");

  return (
    <Link
      href={`/artists/${artist.slug}`}
      prefetch={false}
      className={[
        "group relative border-4 border-ink overflow-hidden",
        "chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform",
        isLarge ? "col-span-2 row-span-2" : "aspect-square",
      ].join(" ")}
    >
      {/* Photo or colour fallback */}
      {img ? (
        <>
          {/* Use <img> not next/image — avoids domain config friction; photos are on Supabase CDN */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
        </>
      ) : (
        <div className={`absolute inset-0 ${accent} flex items-center justify-center`}>
          <Music className="w-12 h-12 opacity-10" />
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {/* Name */}
        <p className={`font-display text-sm leading-tight truncate ${img ? "text-cream" : isTextOnDark ? "text-cream" : "text-ink"}`}>
          {artist.name.toUpperCase()}
        </p>

        {/* City */}
        {city && (
          <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${img ? "text-cream/60" : isTextOnDark ? "text-cream/60" : "text-ink/60"}`}>
            <MapPin className="w-3 h-3 shrink-0" />
            {city.split(",")[0]}
          </p>
        )}

        {/* Genre pills + kind badge */}
        {((artist.genres ?? []).length > 0 || (artist.kind && artist.kind !== "musician")) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(artist.genres ?? []).slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 font-display border border-ink bg-acid-yellow text-ink"
              >
                {g.toUpperCase()}
              </span>
            ))}
            {artist.kind && artist.kind !== "musician" && (
              <span className="text-[10px] px-1.5 py-0.5 bg-electric-blue text-cream font-display border border-ink">
                {KIND_EMOJI[artist.kind] ?? artist.kind}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── ArtistGrid — the actual grid ──────────────────────────────────────────────

interface Props {
  artists: Artist[];
}

export default function ArtistGrid({ artists }: Props) {
  if (artists.length === 0) {
    return (
      <div className="border-4 border-ink bg-acid-yellow chunk-shadow p-8 inline-block">
        <Music className="w-10 h-10 text-ink mb-3" />
        <p className="font-display text-2xl text-ink mb-2">NO ARTISTS MATCH</p>
        <p className="text-ink/70 text-sm">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <p className="font-display text-sm text-ink/50 mb-4">
        {artists.length} ARTIST{artists.length !== 1 ? "S" : ""}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {artists.map((a, i) => (
          <ArtistCard key={a.id} artist={a} index={i} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 border-4 border-ink bg-orange chunk-shadow p-6 inline-block">
        <p className="font-display text-2xl text-ink mb-2">ARE YOU AN ARTIST?</p>
        <p className="text-ink/70 text-sm mb-4">Get listed in the CCD artist directory.</p>
        <Link
          href="/for-artists"
          className="inline-block bg-ink text-cream font-display px-5 py-2 border-4 border-ink hover:bg-ink/80 transition-colors"
        >
          JOIN THE ROSTER →
        </Link>
      </div>
    </>
  );
}

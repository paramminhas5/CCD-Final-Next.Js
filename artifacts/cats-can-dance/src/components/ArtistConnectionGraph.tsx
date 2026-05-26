/**
 * ArtistConnectionGraph — visual force-directed-style connection display.
 * Uses a CSS-based radial layout (no D3 dependency) showing connected artists
 * with strength-based visual weight. Clicking a node navigates to that artist.
 * For full D3 graph, this is the foundation to upgrade.
 */
import Link from "next/link";
import { Users } from "lucide-react";

interface Connection {
  artist_a_slug: string;
  artist_b_slug: string;
  connection_type: string;
  strength: number;
  shared_events?: string[];
  shared_venues?: string[];
}

interface Props {
  slug: string;
  connections: Connection[];
}

const TYPE_COLOURS: Record<string, string> = {
  b2b:   "bg-acid-yellow text-ink",
  collab: "bg-electric-blue text-cream",
  label:  "bg-magenta text-cream",
  venue:  "bg-orange text-ink",
};

function friendlyName(slug: string) {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function ArtistConnectionGraph({ slug, connections }: Props) {
  if (!connections || connections.length === 0) {
    return (
      <div className="border-4 border-ink bg-acid-yellow/20 p-8 text-center">
        <Users className="w-10 h-10 text-ink/30 mx-auto mb-3" />
        <p className="font-display text-lg text-ink">No connections recorded yet.</p>
        <p className="text-ink/60 text-sm mt-1">Connections are built from shared event appearances and B2B sets.</p>
      </div>
    );
  }

  // Sort by strength desc
  const sorted = [...connections].sort((a, b) => b.strength - a.strength);

  return (
    <div className="space-y-4">
      {/* Centre node */}
      <div className="flex items-center justify-center py-4">
        <div className="w-20 h-20 border-4 border-ink bg-ink text-cream font-display text-xs uppercase flex items-center justify-center text-center leading-tight chunk-shadow">
          {friendlyName(slug)}
        </div>
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((conn, i) => {
          const partner = conn.artist_a_slug === slug ? conn.artist_b_slug : conn.artist_a_slug;
          const typeStyle = TYPE_COLOURS[conn.connection_type] ?? "bg-ink text-cream";
          const barWidth = Math.round((conn.strength / 10) * 100);

          return (
            <Link
              key={i}
              href={`/artists/${partner}`}
              className="group border-4 border-ink bg-cream chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-display text-base uppercase text-ink leading-tight group-hover:text-magenta transition-colors">
                  {friendlyName(partner)}
                </span>
                <span className={`shrink-0 text-[10px] font-display uppercase px-2 py-0.5 border border-ink ${typeStyle}`}>
                  {conn.connection_type}
                </span>
              </div>

              {/* Strength bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-[10px] uppercase text-ink/50">Strength</span>
                <div className="flex-1 h-2 bg-ink/10 border border-ink overflow-hidden">
                  <div
                    className="h-full bg-acid-yellow transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="font-display text-[10px] text-ink/50">{conn.strength}/10</span>
              </div>

              {/* Shared events */}
              {conn.shared_events && conn.shared_events.length > 0 && (
                <p className="text-[10px] text-ink/50 truncate">
                  {conn.shared_events.slice(0, 2).join(" · ")}
                  {conn.shared_events.length > 2 && ` +${conn.shared_events.length - 2}`}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <p className="text-center font-display text-xs text-ink/40 uppercase">
        {connections.length} connection{connections.length !== 1 ? "s" : ""} · built from shared gigs and B2B sets
      </p>
    </div>
  );
}

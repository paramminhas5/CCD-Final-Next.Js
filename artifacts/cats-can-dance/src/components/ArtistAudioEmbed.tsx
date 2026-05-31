/**
 * ArtistAudioEmbed — SoundCloud + Spotify + Bandcamp embeds for artist pages.
 */

interface Props {
  soundcloud?: string | null;
  spotify?: string | null;
  bandcamp?: string | null;
  artistName: string;
}

function getSoundCloudEmbedUrl(url: string): string {
  const encoded = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encoded}&color=%23f5e642&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function getSpotifyEmbedUrl(url: string): string | null {
  const match = url.match(/spotify\.com\/(artist|track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}

function getBandcampEmbedUrl(url: string): string | null {
  // Bandcamp album/track pages: https://artist.bandcamp.com/album/name
  // or https://bandcamp.com/EmbeddedPlayer/... (already an embed URL)
  if (url.includes("bandcamp.com/EmbeddedPlayer")) return url;
  // Try to extract album or track from a standard Bandcamp URL
  const albumMatch = url.match(/bandcamp\.com\/album\/([^/?#]+)/);
  const trackMatch = url.match(/bandcamp\.com\/track\/([^/?#]+)/);
  // We can't reliably build an embed URL from a profile URL alone without the numeric ID.
  // Instead link out to Bandcamp with a styled CTA — the embed requires the numeric album ID.
  if (albumMatch || trackMatch) return null; // handled as link below
  return null;
}

export default function ArtistAudioEmbed({ soundcloud, spotify, bandcamp, artistName }: Props) {
  if (!soundcloud && !spotify && !bandcamp) return null;

  const bcIsEmbedUrl = bandcamp?.includes("bandcamp.com/EmbeddedPlayer");

  return (
    <div className="space-y-3 my-4">
      {/* SoundCloud */}
      {soundcloud && (
        <div className="border-4 border-ink bg-cream chunk-shadow overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex items-center gap-2">
            <span className="font-display text-[10px] uppercase text-ink/50 tracking-widest">SoundCloud</span>
          </div>
          <iframe
            width="100%"
            height="120"
            scrolling="no"
            allow="autoplay"
            src={getSoundCloudEmbedUrl(soundcloud)}
            title={`${artistName} on SoundCloud`}
            className="border-none"
          />
        </div>
      )}

      {/* Spotify */}
      {spotify && getSpotifyEmbedUrl(spotify) && (
        <div className="border-4 border-ink bg-cream chunk-shadow overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex items-center gap-2">
            <span className="font-display text-[10px] uppercase text-ink/50 tracking-widest">Spotify</span>
          </div>
          <iframe
            src={getSpotifyEmbedUrl(spotify)!}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`${artistName} on Spotify`}
            className="border-none"
          />
        </div>
      )}

      {/* Bandcamp — full embed if EmbeddedPlayer URL, otherwise styled link */}
      {bandcamp && (
        <div className="border-4 border-ink bg-cream chunk-shadow overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex items-center gap-2">
            <span className="font-display text-[10px] uppercase text-ink/50 tracking-widest">Bandcamp</span>
          </div>
          {bcIsEmbedUrl ? (
            <iframe
              src={bandcamp}
              width="100%"
              height="120"
              seamless
              allow="autoplay"
              title={`${artistName} on Bandcamp`}
              className="border-none"
            />
          ) : (
            <a
              href={bandcamp}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-3 hover:bg-acid-yellow/30 transition-colors group"
            >
              <span className="font-display text-sm text-ink uppercase">
                Listen on Bandcamp
              </span>
              <span className="font-display text-xs text-ink/50 group-hover:text-ink transition-colors">↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

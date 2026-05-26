/**
 * ArtistAudioEmbed — inline SoundCloud + Spotify embeds for artist pages.
 * SoundCloud oEmbed works without API key. Spotify embed works with just the URL.
 */

interface Props {
  soundcloud?: string | null;
  spotify?: string | null;
  artistName: string;
}

function getSoundCloudEmbedUrl(url: string): string {
  const encoded = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encoded}&color=%23f5e642&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function getSpotifyEmbedUrl(url: string): string | null {
  // Handle: https://open.spotify.com/artist/xxx  OR  spotify:artist:xxx
  const match = url.match(/spotify\.com\/(artist|track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}

export default function ArtistAudioEmbed({ soundcloud, spotify, artistName }: Props) {
  if (!soundcloud && !spotify) return null;

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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import vinyl from "@/assets/vinyl-music.png";
import { supabase } from "@/integrations/supabase/client";

type Platform = "spotify" | "youtube" | "soundcloud";
type PlaylistItem = {
  id: string;
  title: string;
  platform: Platform;
  embed_id: string;
  url: string;
  // legacy
  spotify_id?: string;
};

const FALLBACK: PlaylistItem = {
  id: "main",
  title: "Now Spinning",
  platform: "spotify",
  embed_id: "1cEE860l9GiBvIYVM2BbSS",
  url: "https://open.spotify.com/playlist/1cEE860l9GiBvIYVM2BbSS",
};

const normalize = (p: any): PlaylistItem => ({
  id: p.id,
  title: p.title,
  platform: (p.platform as Platform) ?? "spotify",
  embed_id: p.embed_id ?? p.spotify_id ?? "",
  url:
    p.url ??
    (p.spotify_id ? `https://open.spotify.com/playlist/${p.spotify_id}` : ""),
});

const platformGlyph = (p: Platform) =>
  p === "spotify" ? "♫" : p === "youtube" ? "▶" : "☁";

const platformLabel = (p: Platform) =>
  p === "spotify" ? "Spotify" : p === "youtube" ? "YouTube" : "SoundCloud";

const isValidYouTubePlaylistId = (id: string) =>
  /^(PL|UU|LL|FL|RD|OL)[a-zA-Z0-9_-]{10,}$/.test(id);

const buildEmbedSrc = (p: PlaylistItem) => {
  if (p.platform === "spotify") {
    return `https://open.spotify.com/embed/playlist/${p.embed_id}?utm_source=generator&theme=0`;
  }
  if (p.platform === "youtube") {
    return `https://www.youtube.com/embed/videoseries?list=${p.embed_id}`;
  }
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    p.url
  )}&color=%23ff5500&auto_play=false&hide_related=true&visual=true`;
};

const Playlist = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 540]);

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([FALLBACK]);
  const [activeId, setActiveId] = useState<string>(FALLBACK.id);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("playlists, featured_playlist_id")
        .eq("id", "main")
        .maybeSingle();
      const raw = ((data?.playlists as unknown) as any[]) ?? [];
      const list = raw.map(normalize).filter((p) => p.embed_id || p.url);
      if (list.length) {
        setPlaylists(list);
        const featured = data?.featured_playlist_id;
        setActiveId(featured && list.find((p) => p.id === featured) ? featured : list[0].id);
      }
    })();
  }, []);

  const active = playlists.find((p) => p.id === activeId) ?? playlists[0];

  return (
    <section
      ref={ref}
      id="playlist"
      className="relative bg-magenta py-12 md:py-20 border-t-4 border-b-4 border-ink overflow-hidden"
    >
      <motion.img
        src={vinyl}
        alt=""
        loading="lazy"
        style={{ rotate, willChange: "transform" }}
        className="absolute -top-20 -right-20 w-56 md:w-[28rem] max-w-[40vw] opacity-90 pointer-events-none transform-gpu z-0"
      />
      <div className="container relative z-10">
        <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ THE PLAYLIST</p>
        <a href="/playlists" className="inline-block hover:opacity-90 transition-opacity">
          <h2 className="font-display text-cream text-4xl md:text-6xl mb-8 drop-shadow-[6px_6px_0_hsl(var(--ink))] leading-[0.9]">
            NOW<br/>SPINNING
          </h2>
        </a>

        {playlists.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`font-display text-sm md:text-base px-4 py-2 border-4 border-ink transition-colors flex items-center gap-2 ${
                  p.id === activeId ? "bg-acid-yellow text-ink" : "bg-cream text-ink hover:bg-acid-yellow"
                }`}
              >
                <span aria-hidden>{platformGlyph(p.platform)}</span>
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div
          className="max-w-3xl border-4 border-ink chunk-shadow-lg bg-ink overflow-hidden relative z-20 isolate"
          style={{ isolation: "isolate" }}
        >
          {active?.platform === "youtube" && !isValidYouTubePlaylistId(active.embed_id) ? (
            <div className="p-8 text-center bg-ink text-cream">
              <p className="font-display text-2xl mb-2">PLAYLIST UNAVAILABLE</p>
              <p className="text-cream/70 mb-4 text-sm">
                This YouTube link doesn't look like a playlist (ID should start with PL).
              </p>
              {active.url && (
                <a href={active.url} target="_blank" rel="noopener noreferrer"
                   className="inline-block bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-cream">
                  Open on YouTube →
                </a>
              )}
            </div>
          ) : (
            <iframe
              key={`${active?.platform}-${active?.embed_id || active?.url}`}
              title={`Cats Can Dance — ${active?.title ?? "Playlist"}`}
              src={buildEmbedSrc(active)}
              width="100%"
              height={480}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              className="block w-full h-[380px] md:h-[480px] border-0 bg-ink relative z-30"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 items-center">
          {active?.url && (
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer-when-downgrade"
              className="inline-block font-display text-cream text-lg underline decoration-4 decoration-acid-yellow underline-offset-4 hover:text-acid-yellow transition"
            >
              Open in {platformLabel(active.platform)} →
            </a>
          )}
          <a
            href="/playlists"
            className="inline-block font-display text-cream text-lg underline decoration-4 decoration-cream underline-offset-4 hover:text-acid-yellow transition"
          >
            See all playlists →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Playlist;

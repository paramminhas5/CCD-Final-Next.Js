import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

type Platform = "spotify" | "youtube" | "soundcloud";
type PlaylistItem = {
  id: string; title: string; platform: Platform; embed_id: string; url: string;
  spotify_id?: string;
};

const FALLBACK: PlaylistItem = {
  id: "main", title: "Now Spinning", platform: "spotify",
  embed_id: "1cEE860l9GiBvIYVM2BbSS",
  url: "https://open.spotify.com/playlist/1cEE860l9GiBvIYVM2BbSS",
};

const normalize = (p: any): PlaylistItem => ({
  id: p.id, title: p.title,
  platform: (p.platform as Platform) ?? "spotify",
  embed_id: p.embed_id ?? p.spotify_id ?? "",
  url: p.url ?? (p.spotify_id ? `https://open.spotify.com/playlist/${p.spotify_id}` : ""),
});

const platformGlyph = (p: Platform) => p === "spotify" ? "♫" : p === "youtube" ? "▶" : "☁";
const platformLabel = (p: Platform) => p === "spotify" ? "Spotify" : p === "youtube" ? "YouTube" : "SoundCloud";
const platformBg = (p: Platform) => p === "spotify" ? "bg-lime" : p === "youtube" ? "bg-magenta" : "bg-orange";

const isValidYouTubePlaylistId = (id: string) => /^(PL|UU|LL|FL|RD|OL)[a-zA-Z0-9_-]{10,}$/.test(id);

const buildEmbedSrc = (p: PlaylistItem) => {
  if (p.platform === "spotify") return `https://open.spotify.com/embed/playlist/${p.embed_id}?utm_source=generator&theme=0`;
  if (p.platform === "youtube") return `https://www.youtube.com/embed/videoseries?list=${p.embed_id}`;
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(p.url)}&color=%23ff5500&auto_play=false&hide_related=true&visual=true`;
};

const Playlists = () => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([FALLBACK]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("playlists")
        .eq("id", "main")
        .maybeSingle();
      const raw = ((data?.playlists as unknown) as any[]) ?? [];
      const list = raw.map(normalize).filter((p) => p.embed_id || p.url);
      if (list.length) setPlaylists(list);
    })();
  }, []);

  return (
    <main className="bg-background text-foreground">
      <SEO
        title="Playlists — Cats Can Dance | What we play, on rotation"
        description="Every Cats Can Dance playlist across Spotify, YouTube and SoundCloud — dance music, late-night sets and warehouse cuts."
        path="/playlists"
      />
      <Nav />
      <PageHero
        eyebrow="PLAYLISTS · ALL ROTATION"
        title={<>NOW<br/>SPINNING.</>}
        bg="bg-magenta"
        textColor="text-cream"
        eyebrowColor="text-acid-yellow"
      />
      <div className="bg-cream border-b-4 border-ink pt-6">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Playlists" }]} />
        </div>
      </div>

      <section className="bg-cream border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <p className="font-display text-ink text-xl md:text-2xl mb-8">
            {playlists.length} PLAYLIST{playlists.length === 1 ? "" : "S"} ON ROTATION
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {playlists.map((p) => {
              const open = openId === p.id;
              const invalid = p.platform === "youtube" && !isValidYouTubePlaylistId(p.embed_id);
              return (
                <div key={p.id} className="bg-cream border-4 border-ink chunk-shadow overflow-hidden">
                  <div className="flex items-center justify-between gap-3 p-4 border-b-4 border-ink">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`grid place-items-center w-10 h-10 ${platformBg(p.platform)} border-4 border-ink font-display text-xl shrink-0`}>
                        {platformGlyph(p.platform)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-ink text-xl truncate">{p.title}</h3>
                        <p className="text-ink/60 text-xs uppercase tracking-wide">{platformLabel(p.platform)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenId(open ? null : p.id)}
                      className="bg-acid-yellow text-ink font-display text-sm px-3 py-2 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform shrink-0"
                    >
                      {open ? "CLOSE" : "PLAY ▶"}
                    </button>
                  </div>

                  {open && (
                    <div className="bg-ink">
                      {invalid ? (
                        <div className="p-6 text-center text-cream">
                          <p className="font-display text-xl mb-3">PLAYLIST UNAVAILABLE</p>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                               className="inline-block bg-acid-yellow text-ink font-display px-4 py-2 border-4 border-cream">
                              Open on {platformLabel(p.platform)} →
                            </a>
                          )}
                        </div>
                      ) : (
                        <iframe
                          title={`Cats Can Dance — ${p.title}`}
                          src={buildEmbedSrc(p)}
                          className="block w-full h-[380px] border-0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}

                  {p.url && (
                    <div className="p-4 bg-cream/60">
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                         className="font-display text-ink text-sm underline decoration-4 decoration-magenta underline-offset-4 hover:text-magenta">
                        Open in {platformLabel(p.platform)} →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Playlists;

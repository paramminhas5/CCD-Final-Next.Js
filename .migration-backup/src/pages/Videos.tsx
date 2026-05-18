import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const CHANNEL_URL = "https://www.youtube.com/@thesecatscandance";
const PAGE_SIZE = 12;

type Video = { id: string; title: string; thumbnail: string; publishedAt: string };

const VideosPage = () => {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("youtube-videos", {
          body: null,
          // edge function reads ?max= from URL; fall back to default if not supported
        });
        // Re-call with max via direct fetch for the "all videos" page
        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${projectUrl}/functions/v1/youtube-videos?max=50`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const j = await res.json();
        if (cancelled) return;
        if (!j?.videos?.length) {
          // fall back to first invoke result
          if (data?.videos?.length) setVideos(data.videos as Video[]);
          else setError(true);
          return;
        }
        setVideos(j.videos as Video[]);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalPages = videos ? Math.max(1, Math.ceil(videos.length / PAGE_SIZE)) : 1;
  const slice = videos ? videos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  const videoLd = (videos ?? []).slice(0, 25).map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: `${v.title} — Cats Can Dance, Bangalore underground.`,
    thumbnailUrl: [v.thumbnail],
    uploadDate: v.publishedAt,
    contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    publisher: {
      "@type": "Organization",
      name: "Cats Can Dance",
      logo: { "@type": "ImageObject", url: "https://catscandance.com/ccd-logo.png" },
    },
  }));
  const itemListLd = videos && videos.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cats Can Dance — videos",
        itemListElement: videos.slice(0, 25).map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          name: v.title,
        })),
      }
    : null;

  return (
    <main className="bg-background text-foreground">
      <SEO
        title="Videos — Cats Can Dance | Sets, recaps & behind the scenes"
        description="Watch the tapes — every live set, recap and behind the scenes drop from the Cats Can Dance YouTube channel."
        path="/videos"
        jsonLd={itemListLd ? [...videoLd, itemListLd] : videoLd}
      />
      <Nav />
      <PageHero
        eyebrow="VIDEOS · ALL TAPES"
        title={<>WATCH<br/>THE TAPES.</>}
        bg="bg-lime"
        textColor="text-ink"
        eyebrowColor="text-magenta"
        shadow={false}
      />
      <div className="bg-cream border-b-4 border-ink pt-6">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Videos" }]} />
        </div>
      </div>

      <section className="bg-cream border-b-4 border-ink py-10 md:py-14">
        <div className="container">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <p className="font-display text-ink text-xl md:text-2xl">
              {videos ? `${videos.length} TAPES` : "LOADING…"}
            </p>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-magenta text-cream font-display text-lg px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              SUBSCRIBE →
            </a>
          </div>

          {videos === null && !error && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video bg-acid-yellow border-4 border-ink animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="aspect-video border-4 border-ink chunk-shadow bg-ink overflow-hidden">
              <iframe
                title="Cats Can Dance — Channel Uploads"
                src="https://www.youtube.com/embed/videoseries?list=UUmtg0d8E2PXfs3vlQIcGwdQ"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {videos && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slice.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActive(v)}
                    className="text-left bg-cream border-4 border-ink chunk-shadow hover:-translate-y-1 transition-transform group"
                  >
                    <div className="relative aspect-video overflow-hidden border-b-4 border-ink">
                      <img src={v.thumbnail} alt={v.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="w-16 h-16 grid place-items-center bg-magenta text-cream border-4 border-ink rounded-full font-display text-2xl">▶</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg text-ink leading-tight line-clamp-2">{v.title}</h3>
                      <p className="text-ink/60 text-sm mt-1">
                        {new Date(v.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-cream text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow disabled:opacity-40"
                  >← PREV</button>
                  <span className="font-display text-ink">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="bg-acid-yellow text-ink font-display px-4 py-2 border-4 border-ink chunk-shadow disabled:opacity-40"
                  >NEXT →</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl p-0 border-4 border-ink bg-ink overflow-hidden">
          {active && (
            <div className="aspect-video">
              <iframe
                title={active.title}
                src={`https://www.youtube.com/embed/${active.id}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
};

export default VideosPage;

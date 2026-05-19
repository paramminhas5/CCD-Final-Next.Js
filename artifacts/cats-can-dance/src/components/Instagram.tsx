import { useEffect, useState } from "react";

const HANDLE = "catscan.dance";
const BEHOLD_URL = "https://feeds.behold.so/6bt7nDISwk0mUzAQMd9s";

type IgPost = {
  id: string;
  mediaUrl: string; // stable behold.pictures CDN URL
  permalink: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

function mapBeholdPost(p: any): IgPost {
  // Use stable behold.pictures CDN URL (medium = 700×700)
  // Falls back to large, then full, then raw mediaUrl
  const stable =
    p.sizes?.medium?.mediaUrl ??
    p.sizes?.large?.mediaUrl ??
    p.sizes?.full?.mediaUrl ??
    p.mediaUrl;
  return {
    id: String(p.id),
    mediaUrl: stable,
    permalink: p.permalink,
    caption: p.prunedCaption ?? p.caption,
    mediaType: p.mediaType ?? "IMAGE",
  };
}

const Instagram = () => {
  const [posts, setPosts] = useState<IgPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch via our own API proxy — avoids CSP/ad-blocker issues with external domains
        const r = await fetch("/api/instagram-feed");
        if (!r.ok) throw new Error("fetch failed");
        const data = await r.json();
        if (cancelled) return;
        const raw: IgPost[] = data?.posts ?? [];
        if (!raw.length) { setError(true); return; }
        setPosts(raw);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="instagram" className="relative bg-magenta border-b-4 border-ink py-12 md:py-20 overflow-hidden">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div className="min-w-0 max-w-full">
            <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ INSTAGRAM</p>
            <h2 className="font-display text-cream text-3xl sm:text-5xl md:text-6xl leading-[0.9] drop-shadow-[5px_5px_0_hsl(var(--ink))] break-all">
              @{HANDLE}
            </h2>
          </div>
          <a
            href={`https://instagram.com/${HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-acid-yellow text-ink font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            FOLLOW US →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {posts === null && !error &&
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-cream/30 border-4 border-ink animate-pulse" />
            ))}

          {error &&
            Array.from({ length: 9 }).map((_, i) => (
              <a
                key={i}
                href={`https://instagram.com/${HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square bg-cream border-4 border-ink chunk-shadow grid place-items-center font-display text-2xl md:text-4xl text-magenta hover:bg-acid-yellow transition-colors"
              >
                🐾
              </a>
            ))}

          {posts && posts.map((p) => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square bg-cream border-4 border-ink chunk-shadow overflow-hidden group relative"
            >
              <img
                src={p.mediaUrl}
                alt={p.caption?.slice(0, 80) || "Cats Can Dance Instagram post"}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Badge for videos and carousels */}
              {p.mediaType === "VIDEO" && (
                <span className="absolute top-2 right-2 bg-ink/80 text-cream text-xs font-display px-1.5 py-0.5 leading-none">
                  ▶
                </span>
              )}
              {p.mediaType === "CAROUSEL_ALBUM" && (
                <span className="absolute top-2 right-2 bg-ink/80 text-cream text-xs font-display px-1.5 py-0.5 leading-none">
                  ⧉
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Instagram;

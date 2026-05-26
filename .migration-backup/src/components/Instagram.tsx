import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HANDLE = "catscan.dance";

type IgPost = {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption?: string;
};

const Instagram = () => {
  const [posts, setPosts] = useState<IgPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("instagram-feed");
        if (cancelled) return;
        if (error || !data?.posts) {
          setError(true);
          return;
        }
        setPosts((data.posts as IgPost[]).slice(0, 9));
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
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Instagram;

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RsvpDialog from "@/components/RsvpDialog";
import { supabase } from "@/integrations/supabase/client";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  blurb: string;
  lineup: string[];
  status: "upcoming" | "past";
  poster_url: string | null;
  sort_order: number;
};

const resolvePosterUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
  // Treat as Supabase Storage object in the `event-posters` bucket
  try {
    const { data } = supabase.storage.from("event-posters").getPublicUrl(v);
    return data?.publicUrl ?? `/${v}`;
  } catch {
    return `/${v}`;
  }
};

const Events = () => {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
      if (data) setEvents(data as unknown as EventRow[]);
    })();
  }, []);

  const featured = events.find((e) => e.status === "upcoming") ?? events[0];
  const past = events.filter((e) => e.status === "past");

  return (
    <section id="events" className="relative bg-lime py-12 md:py-20 border-b-4 border-ink overflow-hidden">
      <div className="container relative z-10">
        <p className="font-display text-magenta text-lg md:text-xl mb-3">/ EVENTS</p>
        <h2 className="font-display text-ink text-4xl md:text-6xl mb-8 leading-[0.85]">
          CATCH<br/>US LIVE
        </h2>

        {featured && (() => {
          const featuredPoster = resolvePosterUrl(featured.poster_url);
          return (
          <motion.article
            initial={{ opacity: 0, y: 60, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="bg-magenta text-cream border-4 border-ink chunk-shadow-lg p-6 md:p-10 mb-12"
          >
            <div className={`flex flex-col ${featuredPoster ? "md:flex-row" : ""} gap-6 md:gap-10`}>
              {featuredPoster && (
                <div className="md:w-[40%] shrink-0">
                  <div className="aspect-[3/4] bg-ink border-4 border-ink overflow-hidden chunk-shadow">
                    <img
                      src={featuredPoster}
                      alt={`${featured.title} poster`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(ev) => {
                        const img = ev.currentTarget as HTMLImageElement;
                        img.style.display = "none";
                        const parent = img.parentElement;
                        if (parent && !parent.querySelector("[data-poster-fallback]")) {
                          const div = document.createElement("div");
                          div.setAttribute("data-poster-fallback", "");
                          div.className = "w-full h-full grid place-items-center bg-lime text-ink font-display text-3xl text-center px-4";
                          div.innerHTML = `★ ${featured.title}`;
                          parent.appendChild(div);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-acid-yellow text-ink text-xs font-bold px-3 py-1 border-2 border-ink uppercase">
                    {featured.title} · {featured.status.toUpperCase()}
                  </span>
                  {featured.status === "upcoming" && (
                    <span className="bg-cream text-ink text-xs font-bold px-3 py-1 border-2 border-ink uppercase">RSVP</span>
                  )}
                </div>
                <h3 className="font-display text-4xl md:text-6xl mb-4 leading-[0.9] drop-shadow-[6px_6px_0_hsl(var(--ink))]">
                  CATS CAN DANCE<br/>{featured.title}
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 my-6">
                  <div>
                    <p className="font-display text-acid-yellow text-sm mb-1">/ DATE</p>
                    <p className="font-display text-xl md:text-2xl">{featured.date}</p>
                  </div>
                  <div>
                    <p className="font-display text-acid-yellow text-sm mb-1">/ CITY</p>
                    <p className="font-display text-xl md:text-2xl">{featured.city}</p>
                  </div>
                  <div>
                    <p className="font-display text-acid-yellow text-sm mb-1">/ VENUE</p>
                    <p className="font-display text-xl md:text-2xl">{featured.venue}</p>
                  </div>
                </div>
                <p className="text-cream/90 text-base md:text-lg max-w-2xl mb-6 font-medium">{featured.blurb}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {featured.status === "upcoming" && (
                    <button
                      onClick={() => setRsvpOpen(true)}
                      className="bg-acid-yellow text-ink font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                    >
                      RSVP NOW →
                    </button>
                  )}
                  <Link
                    to={`/events/${featured.slug}`}
                    className="bg-cream text-ink font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform text-center"
                  >
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            </div>
          </motion.article>
          );
        })()}

        {past.length > 0 && (
          <div>
            <p className="font-display text-ink text-xl mb-4">/ PAST EPISODES</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((e) => {
                const src = resolvePosterUrl(e.poster_url);
                const isGif = !!src && src.toLowerCase().includes(".gif");
                return (
                <Link
                  key={e.slug}
                  to={`/events/${e.slug}`}
                  className="bg-cream border-4 border-ink chunk-shadow overflow-hidden hover:-translate-y-1 hover:translate-x-1 transition-transform block"
                >
                  <div className="relative aspect-video bg-ink border-b-4 border-ink overflow-hidden">
                    {src ? (
                      <img
                        src={src}
                        alt={`${e.title} poster`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(ev) => {
                          const img = ev.currentTarget as HTMLImageElement;
                          if (import.meta.env.DEV) console.warn("[poster] failed", img.src);
                          // First fallback: if the GIF failed, try the static PNG variant
                          if (img.src.toLowerCase().endsWith(".gif") && !img.dataset.fellback) {
                            img.dataset.fellback = "1";
                            img.src = img.src.replace(/\.gif$/i, ".png");
                            return;
                          }
                          img.style.display = "none";
                          const parent = img.parentElement;
                          if (parent && !parent.querySelector("[data-poster-fallback]")) {
                            const div = document.createElement("div");
                            div.setAttribute("data-poster-fallback", "");
                            div.className = "w-full h-full grid place-items-center bg-lime text-ink font-display text-2xl text-center px-4";
                            div.innerHTML = `★ ${e.title}`;
                            parent.appendChild(div);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center bg-lime text-ink font-display text-3xl">★ {e.title}</div>
                    )}
                    {isGif && (
                      <span className="absolute top-2 right-2 bg-acid-yellow text-ink text-[10px] font-bold px-2 py-0.5 border-2 border-ink uppercase">GIF</span>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="bg-ink text-cream text-xs font-bold px-2 py-1 inline-block mb-2">{e.title}</span>
                    <p className="font-display text-2xl text-magenta">{e.city}</p>
                    <p className="text-ink/70 font-medium text-sm">{e.venue} · {e.date}</p>
                  </div>
                </Link>
                );
              })}
            </div>
            <Link
              to="/events"
              className="inline-block mt-6 font-display text-ink text-lg underline decoration-4 decoration-magenta underline-offset-4 hover:text-magenta transition"
            >
              See all events →
            </Link>
          </div>
        )}
      </div>

      {featured && (
        <RsvpDialog
          open={rsvpOpen}
          onOpenChange={setRsvpOpen}
          eventSlug={featured.slug}
          eventTitle={`Cats Can Dance ${featured.title}`}
        />
      )}
    </section>
  );
};

export default Events;

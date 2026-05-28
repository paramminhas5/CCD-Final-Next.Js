import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@/lib/compat-router";
import RsvpDialog from "@/components/RsvpDialog";
import { supabase } from "@/lib/supabase-shim";
import type { EventRow } from "@/types/events";

const resolvePosterUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
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

  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");
  // Featured = next upcoming (prefer first series show)
  const nextUp = upcoming[0] ?? events[0];
  // Series events
  const seriesEvents = upcoming.filter((e) => e.series === "ccdxsocial");

  return (
    <section id="events" className="relative bg-lime py-12 md:py-20 border-b-4 border-ink overflow-hidden">
      <div className="container relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-display text-magenta text-lg md:text-xl mb-2">/ EVENTS</p>
            <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.85]">
              CATCH<br />US LIVE
            </h2>
          </div>
          <Link
            to="/events"
            className="font-display text-ink text-base underline decoration-4 decoration-magenta underline-offset-4 hover:text-magenta transition"
          >
            All events →
          </Link>
        </div>

        {/* ── CCD × SOCIAL series strip ── */}
        {seriesEvents.length > 0 && (
          <div className="mb-10">
            <div className="bg-ink border-4 border-ink p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ SERIES · JUN–OCT 2026</p>
                <h3 className="font-display text-cream text-3xl md:text-4xl leading-none">CCD × SOCIAL</h3>
                <p className="text-cream/60 font-medium text-sm mt-1">India's first pet-friendly dance series. Outdoor pet zone + underground music.</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  to="/events/ccdxsocial-01"
                  className="bg-acid-yellow text-ink font-display text-sm px-5 py-2 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                >
                  RSVP NOW →
                </Link>
                <Link
                  to="/ccdxsocial"
                  className="bg-transparent text-cream font-display text-sm px-5 py-2 border-4 border-cream/40 hover:border-cream transition-colors"
                >
                  ABOUT THE SERIES
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...seriesEvents.slice(0, 3), upcoming.find(e => e.series === "ccdxsocial" && !!e.is_finale)].filter(Boolean).map((e, i) => {
                const ev = e as EventRow;
                const palettes = [
                  "bg-electric-blue text-cream",
                  "bg-magenta text-cream",
                  "bg-ink text-cream",
                  "bg-acid-yellow text-ink",
                ];
                return (
                  <Link
                    key={ev.slug}
                    to={`/events/${ev.slug}`}
                    className={`block border-4 border-ink chunk-shadow p-4 hover:-translate-y-1 hover:translate-x-1 transition-transform ${palettes[i % palettes.length]}`}
                  >
                    {ev.is_finale && (
                      <span className="inline-block text-[9px] font-display uppercase px-2 py-0.5 bg-magenta text-cream border border-ink mb-2">★ MEGA</span>
                    )}
                    {i === 0 && !ev.is_finale && (
                      <span className="inline-block text-[9px] font-display uppercase px-2 py-0.5 bg-acid-yellow text-ink border border-ink mb-2">▶ NEXT UP</span>
                    )}
                    <p className="font-display text-xl md:text-2xl leading-none mb-1">{ev.title.toUpperCase()}</p>
                    <p className="font-display text-xs opacity-70">{ev.date}</p>
                    {ev.series_tagline && (
                      <p className="font-display text-[9px] uppercase tracking-wider opacity-50 mt-2">{ev.series_tagline}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Featured next upcoming (if not covered above) ── */}
        {nextUp && !seriesEvents.length && (() => {
          const featuredPoster = resolvePosterUrl(nextUp.poster_url);
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
                        alt={`${nextUp.title} poster`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(ev) => {
                          const img = ev.currentTarget as HTMLImageElement;
                          img.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="bg-acid-yellow text-ink text-xs font-bold px-3 py-1 border-2 border-ink uppercase inline-block mb-4">
                    NEXT UP
                  </span>
                  <h3 className="font-display text-4xl md:text-6xl mb-4 leading-[0.9]">
                    {nextUp.title.toUpperCase()}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4 my-4">
                    <div><p className="font-display text-acid-yellow text-sm mb-1">/ DATE</p><p className="font-display text-xl">{nextUp.date}</p></div>
                    <div><p className="font-display text-acid-yellow text-sm mb-1">/ CITY</p><p className="font-display text-xl">{nextUp.city}</p></div>
                    <div><p className="font-display text-acid-yellow text-sm mb-1">/ VENUE</p><p className="font-display text-xl">{nextUp.venue}</p></div>
                  </div>
                  <p className="text-cream/90 text-base md:text-lg max-w-2xl mb-6 font-medium">{nextUp.blurb}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setRsvpOpen(true)}
                      className="bg-acid-yellow text-ink font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                    >
                      RSVP NOW →
                    </button>
                    <Link
                      to={`/events/${nextUp.slug}`}
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

        {/* ── Past episodes ── */}
        {past.length > 0 && (
          <div className="mt-6">
            <p className="font-display text-ink text-xl mb-4">/ PAST EPISODES</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((e) => {
                const src = resolvePosterUrl(e.poster_url);
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
                            img.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-lime text-ink font-display text-3xl">★ {e.title}</div>
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
          </div>
        )}
      </div>

      {nextUp && (
        <RsvpDialog
          open={rsvpOpen}
          onOpenChange={setRsvpOpen}
          eventSlug={nextUp.slug}
          eventTitle={`Cats Can Dance — ${nextUp.title}`}
        />
      )}
    </section>
  );
};

export default Events;

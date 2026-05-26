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

// ── Series Banner ─────────────────────────────────────────────────────────────
// Shown when 2+ upcoming events share the same series slug.
// Replaces the single-featured layout with a full series hero.

const SeriesBanner = ({ events, seriesLabel }: { events: EventRow[]; seriesLabel: string }) => {
  const [rsvpEvent, setRsvpEvent] = useState<EventRow | null>(null);

  const palette = [
    { bg: "bg-electric-blue", text: "text-cream", chip: "bg-acid-yellow text-ink", btn: "bg-acid-yellow text-ink" },
    { bg: "bg-magenta",       text: "text-cream", chip: "bg-cream text-ink",        btn: "bg-cream text-ink"        },
    { bg: "bg-ink",           text: "text-cream", chip: "bg-acid-yellow text-ink", btn: "bg-acid-yellow text-ink" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="mb-12"
    >
      {/* Series header */}
      <div className="bg-acid-yellow border-4 border-ink chunk-shadow-lg px-6 py-5 md:px-10 md:py-7 mb-0 border-b-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="inline-block bg-ink text-acid-yellow font-display text-xs px-3 py-1 mb-3 border-2 border-ink uppercase tracking-wider">
              🐾 SERIES · {events.length} SHOWS · END OF JUNE 2026
            </span>
            <h3 className="font-display text-ink text-4xl md:text-6xl leading-[0.85]">
              {seriesLabel}
            </h3>
            <p className="font-display text-ink/70 text-base md:text-xl mt-2">
              Animal lovers + electronic music + outdoor pet activities — 4PM to close
            </p>
          </div>
          <Link
            to="/events"
            className="shrink-0 bg-ink text-cream font-display text-base px-5 py-3 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors"
          >
            ALL SHOWS →
          </Link>
        </div>
      </div>

      {/* Event cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-4 border-ink border-t-0 chunk-shadow-lg overflow-hidden">
        {events.map((e, i) => {
          const p = palette[i % palette.length];
          const poster = resolvePosterUrl(e.poster_url);
          return (
            <div key={e.slug} className={`${p.bg} ${p.text} border-r-4 border-ink last:border-r-0 flex flex-col`}>
              {poster && (
                <div className="aspect-video border-b-4 border-ink overflow-hidden">
                  <img
                    src={poster}
                    alt={e.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5 md:p-6">
                <div className={`inline-block ${p.chip} font-display text-xs px-2 py-1 border-2 border-ink mb-3 w-fit`}>
                  SHOW 0{i + 1}
                </div>
                <h4 className="font-display text-2xl md:text-3xl leading-none mb-2">{e.title.toUpperCase()}</h4>
                {e.series_tagline && (
                  <p className="font-display text-xs opacity-70 uppercase tracking-wider mb-3">{e.series_tagline}</p>
                )}
                <div className="grid grid-cols-2 gap-2 my-3 text-sm font-medium opacity-90">
                  <div>
                    <p className="font-display text-xs opacity-60 mb-0.5">DATE</p>
                    <p className="font-display text-sm">{e.date}</p>
                  </div>
                  <div>
                    <p className="font-display text-xs opacity-60 mb-0.5">VENUE</p>
                    <p className="font-display text-sm">{e.venue}</p>
                  </div>
                </div>
                {e.lineup && e.lineup.length > 0 && (
                  <p className="text-xs opacity-75 font-medium mb-4">
                    🎧 {e.lineup.filter(l => !l.includes("TBA")).join(" · ")}
                    {e.lineup.some(l => l.includes("TBA")) ? " + more TBA" : ""}
                  </p>
                )}
                {e.pet_friendly && (
                  <p className="text-xs font-display opacity-80 mb-4">🐾 OUTDOOR PET ZONE · 4PM–8PM</p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => setRsvpEvent(e)}
                    className={`flex-1 ${p.btn} font-display text-sm px-4 py-2.5 border-4 border-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-transform chunk-shadow`}
                  >
                    RSVP →
                  </button>
                  <Link
                    to={`/events/${e.slug}`}
                    className="flex-1 bg-transparent border-4 border-current font-display text-sm px-4 py-2.5 hover:opacity-80 transition-opacity text-center"
                  >
                    DETAILS
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Grand Finale teaser card */}
        <div className="bg-cream text-ink border-t-4 sm:border-t-0 sm:border-l-0 lg:border-l-4 border-ink flex flex-col sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col flex-1 p-5 md:p-6 justify-between">
            <div>
              <div className="inline-block bg-magenta text-cream font-display text-xs px-2 py-1 border-2 border-ink mb-3">
                COMING SOON
              </div>
              <h4 className="font-display text-2xl md:text-3xl leading-none mb-2 text-ink">
                GRAND FORMAT SHOW
              </h4>
              <p className="font-display text-xs text-ink/60 uppercase tracking-wider mb-3">
                SEASON FINALE · DATE TBA
              </p>
              <p className="text-ink/70 font-medium text-sm mb-4">
                The biggest one. 2,000+ people. Full outdoor stage. Pet runway. The best DJs. 
                Everything the series has been building to.
              </p>
              <ul className="space-y-1 mb-4">
                {["Full outdoor stage + production", "2,000+ capacity", "Pet runway + agility finals", "Startdawg · Merman + full lineup TBA"].map(item => (
                  <li key={item} className="font-display text-xs text-ink/70 flex items-center gap-2">
                    <span className="text-magenta">★</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/ccdxsocial/sponsor"
              className="bg-magenta text-cream font-display text-sm px-4 py-3 border-4 border-ink chunk-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-transform text-center block"
            >
              SPONSOR THE FINALE →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Events Component ─────────────────────────────────────────────────────

const Events = () => {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState<EventRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("sort_order", { ascending: true });
      if (data) setEvents(data as unknown as EventRow[]);
    })();
  }, []);

  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");

  // Detect active series: 2+ upcoming events sharing the same non-null series slug
  const seriesCounts = upcoming.reduce<Record<string, EventRow[]>>((acc, e) => {
    if (e.series) {
      acc[e.series] = acc[e.series] ?? [];
      acc[e.series].push(e);
    }
    return acc;
  }, {});
  const activeSeries = Object.entries(seriesCounts).find(([, evs]) => evs.length >= 2);
  const seriesEvents = activeSeries ? activeSeries[1] : [];
  const seriesSlug   = activeSeries ? activeSeries[0] : null;
  const seriesLabel  = seriesEvents[0]?.series_label ?? seriesSlug ?? "SERIES";

  // Featured = first upcoming event NOT in the active series (fallback: first upcoming overall)
  const standaloneFeatured = upcoming.find((e) => !seriesSlug || e.series !== seriesSlug)
    ?? (seriesEvents.length === 0 ? upcoming[0] : null);

  // Which event to use for the single RSVP dialog (standalone featured)
  const rsvpTarget = rsvpEvent ?? standaloneFeatured;

  return (
    <section id="events" className="relative bg-lime py-12 md:py-20 border-b-4 border-ink overflow-hidden">
      <div className="container relative z-10">
        <p className="font-display text-magenta text-lg md:text-xl mb-3">/ EVENTS</p>
        <h2 className="font-display text-ink text-4xl md:text-6xl mb-8 leading-[0.85]">
          CATCH<br />US LIVE
        </h2>

        {/* ── Active Series Banner ── */}
        {seriesEvents.length >= 2 && (
          <SeriesBanner events={seriesEvents} seriesLabel={seriesLabel} />
        )}

        {/* ── Standalone featured event (non-series upcoming) ── */}
        {standaloneFeatured && (() => {
          const featuredPoster = resolvePosterUrl(standaloneFeatured.poster_url);
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
                        alt={`${standaloneFeatured.title} poster`}
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
                            div.innerHTML = `★ ${standaloneFeatured.title}`;
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
                      {standaloneFeatured.title} · UPCOMING
                    </span>
                    <span className="bg-cream text-ink text-xs font-bold px-3 py-1 border-2 border-ink uppercase">RSVP</span>
                  </div>
                  <h3 className="font-display text-4xl md:text-6xl mb-4 leading-[0.9] drop-shadow-[6px_6px_0_hsl(var(--ink))]">
                    CATS CAN DANCE<br />{standaloneFeatured.title}
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4 my-6">
                    <div>
                      <p className="font-display text-acid-yellow text-sm mb-1">/ DATE</p>
                      <p className="font-display text-xl md:text-2xl">{standaloneFeatured.date}</p>
                    </div>
                    <div>
                      <p className="font-display text-acid-yellow text-sm mb-1">/ CITY</p>
                      <p className="font-display text-xl md:text-2xl">{standaloneFeatured.city}</p>
                    </div>
                    <div>
                      <p className="font-display text-acid-yellow text-sm mb-1">/ VENUE</p>
                      <p className="font-display text-xl md:text-2xl">{standaloneFeatured.venue}</p>
                    </div>
                  </div>
                  <p className="text-cream/90 text-base md:text-lg max-w-2xl mb-6 font-medium">{standaloneFeatured.blurb}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setRsvpOpen(true)}
                      className="bg-acid-yellow text-ink font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                    >
                      RSVP NOW →
                    </button>
                    <Link
                      to={`/events/${standaloneFeatured.slug}`}
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

      {/* RSVP dialog — for standalone featured or series card clicks */}
      {rsvpTarget && (
        <RsvpDialog
          open={rsvpOpen || !!rsvpEvent}
          onOpenChange={(v) => {
            setRsvpOpen(v);
            if (!v) setRsvpEvent(null);
          }}
          eventSlug={rsvpTarget.slug}
          eventTitle={`Cats Can Dance ${rsvpTarget.title}`}
        />
      )}
    </section>
  );
};

export default Events;

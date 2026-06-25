/**
 * /events — Events listing page (rebuilt).
 *
 * Sections top → bottom:
 *  1. Hero           — bold page title
 *  2. Marquee        — series slogans
 *  3. Series Showcase — CCD × SOCIAL season overview (4 shows)
 *  4. Next Event Hero — CCDXSOCIAL 01 at Indiranagar Social, with RSVP
 *  5. Past Episodes  — recap grid
 *  6. Curated Events — hand-picked third-party events from Bangalore
 *  7. Host CTA       — for venues
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/lib/compat-router";
import { parseEventDate } from "@/lib/parse-date";
import { supabase } from "@/lib/supabase-shim";
import { getEventContent, EVENT_ROWS } from "@/content/events";
import type { EventRow } from "@/types/events";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import Marquee from "@/components/Marquee";
import RsvpDialog from "@/components/RsvpDialog";
import EventPosterPlaceholder from "@/components/EventPosterPlaceholder";
import SeriesStrip from "@/components/SeriesStrip";
import SafeCuratedEvents from "@/components/SafeCuratedEvents";

// ── static fallback — always present, no DB needed ──────────────────────────
const STATIC_ROWS: EventRow[] = Object.values(EVENT_ROWS).sort(
  (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
);

// ── helpers ─────────────────────────────────────────────────────────────────
const Pad = (n: number) => String(n).padStart(2, "0");


function resolvePoster(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http") || v.startsWith("/")) return v;
  try {
    const { data } = supabase.storage.from("event-posters").getPublicUrl(v);
    return data?.publicUrl ?? `/${v}`;
  } catch {
    return `/${v}`;
  }
}

// ── countdown hook (SSR-safe, no hydration mismatch) ────────────────────────
function useCountdown(target: Date | null) {
  const [t, setT] = useState({ days: 0, hours: 0, mins: 0, over: true });
  useEffect(() => {
    const calc = (now: number) => {
      if (!target) return { days: 0, hours: 0, mins: 0, over: true };
      const diff = target.getTime() - now;
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, over: true };
      const secs = Math.floor(diff / 1000);
      return {
        days:  Math.floor(secs / 86400),
        hours: Math.floor((secs % 86400) / 3600),
        mins:  Math.floor((secs % 3600) / 60),
        over:  false,
      };
    };
    setT(calc(Date.now()));
    const id = setInterval(() => setT(calc(Date.now())), 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime()]);
  return t;
}


// ── main component ───────────────────────────────────────────────────────────
const Events = () => {
  const [all, setAll] = useState<EventRow[]>(STATIC_ROWS);
  const [rsvpOpen, setRsvpOpen] = useState(false);

  // Attempt DB hydration — fall back silently to static data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("*")
          .order("sort_order", { ascending: true });
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setAll(data as unknown as EventRow[]);
        }
      } catch {
        // stay on static fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const safeAll  = Array.isArray(all) ? all : STATIC_ROWS;
  const upcoming = useMemo(() => safeAll.filter((e) => e.status === "upcoming"), [safeAll]);
  const past     = useMemo(() => safeAll.filter((e) => e.status === "past"),     [safeAll]);

  // Next upcoming = first in sort order
  const nextEvent = upcoming[0] ?? null;

  // Series group for the showcase strip
  const seriesEvents = useMemo(
    () => safeAll.filter((e) => e.series === "ccdxsocial")
         .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [safeAll],
  );

  // Countdown target from next event date
  const countdownTarget = useMemo(() => {
    if (!nextEvent) return null;
    return parseEventDate(nextEvent.date);
  }, [nextEvent]);

  const cd = useCountdown(countdownTarget);

  // JSON-LD
  const jsonLd = upcoming.map((e) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${e.title}`,
    startDate: e.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue,
      address: { "@type": "PostalAddress", addressLocality: e.city || "Bangalore", addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: "Cats Can Dance", url: "https://catscandance.com" },
    url: `https://catscandance.com/events/${e.slug}`,
  }));


  return (
    <>
      <SEO
        title="Events — Cats Can Dance | Underground Dance Music in Bangalore"
        description="CCD × SOCIAL series, our next upcoming event at Indiranagar Social, and the best curated dance music events happening across Bangalore."
        path="/events"
        jsonLd={jsonLd}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />

        {/* ── 1. HERO ── */}
        <PageHero
          eyebrow="EVENTS"
          title="NIGHTS THAT MOVE."
          bg="bg-magenta"
          textColor="text-cream"
          eyebrowColor="text-acid-yellow"
          shadowColor="hsl(var(--ink))"
        >
          <p className="text-cream/90 font-display text-2xl md:text-3xl mb-2">
            UNDERGROUND. LOUD. OURS.
          </p>
          <p className="text-cream/80 font-medium text-lg max-w-xl">
            The cult underground series — house, disco, garage, jungle &amp; D&amp;B.
            Every drop, every floor, every city.
          </p>
        </PageHero>

        {/* ── 2. MARQUEE ── */}
        <Marquee
          bg="bg-acid-yellow"
          items={[
            "CCDXSOCIAL 01 · 29 JUN",
            "CCDXSOCIAL 02 · 27 JUL",
            "CCDXSOCIAL 03 · 30 AUG",
            "MEGA · OCT 2026",
            "PETS WELCOME",
            "FREE RSVP",
            "9 PM SHARP",
          ]}
        />

        <section className="container py-6 md:py-8">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Events" }]} />
        </section>


        {/* ── 3. SERIES SHOWCASE — CCD × SOCIAL ── */}
        <section className="bg-electric-blue border-y-4 border-ink py-12 md:py-16">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="font-display text-acid-yellow text-base md:text-lg mb-2">/ THE SERIES</p>
                <h2 className="font-display text-cream text-4xl md:text-6xl leading-none">
                  CCD × SOCIAL
                </h2>
                <p className="text-cream/80 font-medium text-base md:text-lg mt-3 max-w-xl">
                  India's first curated pet lifestyle series meets underground dance music.
                  Four shows. One season. The pack in one place.
                </p>
              </div>
              <Link
                to="/ccdxsocial"
                className="shrink-0 bg-acid-yellow text-ink font-display text-sm px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap"
              >
                ABOUT THE SERIES →
              </Link>
            </div>

            {/* Series show cards — 4 up */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {seriesEvents.map((e, i) => {
                const isFinale = !!e.is_finale;
                const isPast   = e.status === "past";
                const palettes = [
                  "bg-acid-yellow text-ink",
                  "bg-magenta text-cream",
                  "bg-cream text-ink",
                  "bg-magenta text-cream",
                ];
                const pal = isFinale ? "bg-magenta text-cream" : palettes[i % palettes.length];
                return (
                  <motion.div
                    key={e.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 180, damping: 20 }}
                  >
                    <Link
                      to={`/events/${e.slug}`}
                      className={`relative block border-4 border-ink chunk-shadow p-5 md:p-6 h-full hover:-translate-y-1 hover:translate-x-1 transition-transform ${pal}`}
                    >
                      {isFinale && (
                        <span className="absolute -top-3 -right-3 rotate-6 bg-acid-yellow text-ink font-display text-[10px] tracking-widest px-2 py-1 border-4 border-ink">
                          ★ FINALE
                        </span>
                      )}
                      <p className={`font-display text-[10px] tracking-widest mb-2 ${isFinale ? "text-acid-yellow" : isPast ? "text-ink/50" : "text-magenta"}`}>
                        {isPast ? "/ PAST" : "/ UPCOMING"}
                      </p>
                      <h3 className="font-display text-2xl md:text-3xl leading-none mb-2 break-words">
                        {e.title.toUpperCase()}
                      </h3>
                      <p className="font-medium text-sm opacity-90 leading-tight mb-3">{e.date}</p>
                      <p className="font-medium text-sm opacity-70 leading-tight">{e.venue}</p>
                      {e.series_tagline && (
                        <p className={`mt-4 text-[10px] font-display tracking-widest ${isFinale ? "text-acid-yellow/80" : "opacity-50"}`}>
                          {e.series_tagline}
                        </p>
                      )}
                      {e.pet_friendly && (
                        <span className="mt-3 inline-block text-sm" aria-label="pet-friendly">🐾</span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── 4. NEXT UPCOMING EVENT HERO ── */}
        {nextEvent && (() => {
          const poster  = resolvePoster(nextEvent.poster_url);
          const content = getEventContent(nextEvent);
          return (
            <section className="container py-12 md:py-16">
              <p className="font-display text-magenta text-base md:text-lg mb-3">/ NEXT UP</p>
              <h2 className="font-display text-ink text-3xl md:text-5xl leading-tight mb-8">
                THIS IS THE ONE.
              </h2>

              {/* Countdown strip */}
              {!cd.over && (
                <div className="bg-ink text-cream border-4 border-ink mb-6 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-acid-yellow text-xs tracking-widest mb-1">/ DOORS OPEN IN</p>
                    <p className="font-display text-2xl md:text-4xl leading-none">
                      <span>{Pad(cd.days)}</span><span className="opacity-40 text-lg">D</span>
                      <span className="mx-2 opacity-30">·</span>
                      <span>{Pad(cd.hours)}</span><span className="opacity-40 text-lg">H</span>
                      <span className="mx-2 opacity-30">·</span>
                      <span>{Pad(cd.mins)}</span><span className="opacity-40 text-lg">M</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-acid-yellow text-xs tracking-widest mb-1">/ FREE RSVP</p>
                    <p className="font-display text-lg">{nextEvent.date}</p>
                  </div>
                </div>
              )}

              {/* Hero card */}
              <motion.article
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="bg-magenta text-cream border-4 border-ink chunk-shadow-lg"
              >
                <div className={`grid ${poster ? "md:grid-cols-[0.85fr_1.15fr]" : ""}`}>
                  {/* Poster */}
                  {poster ? (
                    <div className="relative bg-ink border-b-4 md:border-b-0 md:border-r-4 border-ink overflow-hidden min-h-[280px]">
                      <img
                        src={poster}
                        alt={`${nextEvent.title} poster`}
                        loading="eager"
                        className="w-full h-full object-cover aspect-[3/4] md:aspect-auto"
                        onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <div className="border-b-4 md:border-b-0 md:border-r-4 border-ink">
                      <EventPosterPlaceholder
                        title={nextEvent.title}
                        date={nextEvent.date}
                        city={nextEvent.city || "Bangalore"}
                        eyebrow={nextEvent.series_label ?? undefined}
                        lineup={(nextEvent.lineup ?? []).join(" · ")}
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-7 md:p-10 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {nextEvent.series_label && (
                        <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream uppercase tracking-widest bg-cream text-ink">
                          {nextEvent.series_label}
                        </span>
                      )}
                      {nextEvent.pet_friendly && (
                        <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream uppercase tracking-widest bg-electric-blue text-cream">
                          🐾 PET-FRIENDLY
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-1 border-2 border-acid-yellow uppercase tracking-widest bg-acid-yellow text-ink">
                        ▶ RSVP OPEN
                      </span>
                    </div>

                    <h3 className="font-display text-5xl md:text-7xl leading-[0.85] mb-5 break-words drop-shadow-[4px_4px_0_hsl(var(--ink))]">
                      {nextEvent.title.toUpperCase()}
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-5">
                      {[
                        { label: "DATE",  value: nextEvent.date },
                        { label: "VENUE", value: nextEvent.venue },
                        { label: "CITY",  value: nextEvent.city },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="font-display text-acid-yellow text-xs tracking-widest mb-1">/ {label}</p>
                          <p className="font-display text-lg md:text-xl leading-tight break-words">{value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-cream/85 font-medium text-base md:text-lg leading-relaxed mb-6 max-w-xl">
                      {nextEvent.blurb}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setRsvpOpen(true)}
                        className="bg-acid-yellow text-ink font-display text-lg md:text-xl px-7 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                      >
                        {content.cta_label ?? "RSVP NOW →"}
                      </button>
                      <Link
                        to={`/events/${nextEvent.slug}`}
                        className="bg-cream text-ink font-display text-lg md:text-xl px-7 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform text-center"
                      >
                        VIEW DETAILS
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            </section>
          );
        })()}


        {/* ── 5. PAST EPISODES ── */}
        {past.length > 0 && (
          <section className="bg-cream border-y-4 border-ink py-12 md:py-16">
            <div className="container">
              <p className="font-display text-magenta text-base md:text-lg mb-3">/ RECAP</p>
              <h2 className="font-display text-ink text-3xl md:text-5xl leading-tight mb-8">
                PAST EPISODES.
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => {
                  const src = resolvePoster(e.poster_url);
                  return (
                    <Link
                      key={e.slug}
                      to={`/events/${e.slug}`}
                      className="group block bg-background border-4 border-ink chunk-shadow overflow-hidden hover:-translate-y-1 hover:translate-x-1 transition-transform"
                    >
                      <div className="relative bg-ink border-b-4 border-ink aspect-video overflow-hidden">
                        {src ? (
                          <img
                            src={src}
                            alt={`${e.title} poster`}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center bg-ink text-cream font-display text-3xl">
                            ★ {e.title}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="inline-block bg-ink text-cream text-[10px] font-bold px-2 py-0.5 border-2 border-ink uppercase tracking-widest mb-3">
                          PAST EPISODE
                        </span>
                        <h3 className="font-display text-2xl md:text-3xl text-ink leading-tight mb-1 break-words">
                          {e.title.toUpperCase()}
                        </h3>
                        <p className="text-ink/60 font-medium text-sm">
                          {e.date} · {e.city} · {e.venue}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. CURATED EVENTS from Bangalore ── */}
        <SafeCuratedEvents />

        {/* ── 7. HOST CTA ── */}
        <section className="bg-ink border-t-4 border-ink py-10 md:py-14">
          <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-display text-acid-yellow text-lg mb-2">/ HOST WITH US</p>
              <h3 className="font-display text-cream text-3xl md:text-5xl leading-[0.95]">
                WANT TO HOST ONE?
              </h3>
            </div>
            <Link
              to="/for-venues"
              className="bg-acid-yellow text-ink font-display text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap"
            >
              FOR VENUES →
            </Link>
          </div>
        </section>

        <Footer />
      </main>

      {/* RSVP dialog — scoped to next upcoming event */}
      {nextEvent && (
        <RsvpDialog
          open={rsvpOpen}
          onOpenChange={setRsvpOpen}
          eventSlug={nextEvent.slug}
          eventTitle={`Cats Can Dance — ${nextEvent.title}`}
          eventDate={nextEvent.date}
          eventVenue={nextEvent.venue}
        />
      )}
    </>
  );
};

export default Events;

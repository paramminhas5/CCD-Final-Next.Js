/**
 * Events listing.
 *
 * IA, top → bottom:
 *
 *   1. PageHero       — eyebrow + title + tagline
 *   2. Marquee        — vibe slogans
 *   3. Featured next  — the next upcoming event as a hero card with poster
 *   4. Series banner  — if any active series, a strip linking the series shows
 *   5. Upcoming list  — remaining upcoming events (cards)
 *   6. Past episodes  — recap row, visually distinct
 *   7. CuratedEvents  — external feed of other Bangalore events
 *   8. Host CTA       — for venues
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/compat-router";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import Marquee from "@/components/Marquee";
import CuratedEventsTeaser from "@/components/CuratedEventsTeaser";
import EventPosterPlaceholder from "@/components/EventPosterPlaceholder";
import SeriesStrip from "@/components/SeriesStrip";

// ── Countdown hook ──────────────────────────────────────────────────────────
const NEXT_SHOW_DATE = new Date("2026-06-29T14:30:00Z"); // 8 PM IST

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, over: true };
    const secs = Math.floor(diff / 1000);
    return {
      days: Math.floor(secs / 86400),
      hours: Math.floor((secs % 86400) / 3600),
      mins: Math.floor((secs % 3600) / 60),
      over: false,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 60000);
    return () => clearInterval(id);
  }, []);
  return t;
}

import { supabase } from "@/lib/supabase-shim";
import { getEventContent } from "@/content/events";
import type { EventRow } from "@/types/events";

const Pad = (n: number) => String(n).padStart(2, "0");

// ──────────────────── helpers ────────────────────

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

// ──────────────────── component ────────────────────

const Events = () => {
  const [all, setAll] = useState<EventRow[]>([]);
  const cd = useCountdown(NEXT_SHOW_DATE);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("sort_order", { ascending: true });
      if (data) setAll(data as unknown as EventRow[]);
    })();
  }, []);

  const upcoming = useMemo(() => all.filter((e) => e.status === "upcoming"), [all]);
  const past     = useMemo(() => all.filter((e) => e.status === "past"),     [all]);
  const featured = upcoming[0] ?? all[0];
  const restUpcoming = upcoming.slice(1);

  // Group upcoming events by series (if any).
  const seriesGroup = useMemo(() => {
    const upcomingSeries = upcoming.find((e) => !!e.series);
    if (!upcomingSeries?.series) return null;
    const events = all.filter((e) => e.series === upcomingSeries.series);
    return {
      key: upcomingSeries.series,
      label: upcomingSeries.series_label || upcomingSeries.series.toUpperCase(),
      events,
    };
  }, [all, upcoming]);

  // ─── JSON-LD ───
  const eventLd = all.map((e) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${e.title}`,
    startDate: e.date,
    eventStatus:
      e.status === "upcoming"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventMovedOnline",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: e.venue,
        addressLocality: e.city || "Bangalore",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    organizer: { "@type": "Organization", name: "Cats Can Dance", url: "https://catscandance.com" },
    offers: {
      "@type": "Offer",
      url: `https://catscandance.com/events/${e.slug}`,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    url: `https://catscandance.com/events/${e.slug}`,
  }));

  const itemListLd = upcoming.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Upcoming Cats Can Dance events in Bangalore",
        itemListElement: upcoming.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://catscandance.com/events/${e.slug}`,
          name: `${e.title} — ${e.city}`,
        })),
      }
    : null;

  const eventsFaqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What underground dance music events does Cats Can Dance host in Bangalore?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cats Can Dance hosts RSVP-only underground dance music episodes in Bengaluru featuring House, Disco, Jungle, Garage, and Drum & Bass. Events are held at venues across the city, including the CCD × SOCIAL pet-friendly series.",
        },
      },
      {
        "@type": "Question",
        name: "How do I RSVP to a Cats Can Dance event in Bangalore?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RSVP links for upcoming Cats Can Dance events are at catscandance.com/events. Capacity is limited — RSVP early. Most episodes are free entry with name on the door.",
        },
      },
      {
        "@type": "Question",
        name: "Are Cats Can Dance events free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most CCD episodes are free entry with RSVP. Capacity is controlled to keep the room right.",
        },
      },
      {
        "@type": "Question",
        name: "What is CCD × SOCIAL?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CCD × SOCIAL is India's first curated pet lifestyle series — outdoor pet zone in the afternoon, then underground dance music in the evening. Vaccinated dogs welcome.",
        },
      },
    ],
  };

  const jsonLd = itemListLd ? [...eventLd, itemListLd, eventsFaqLd] : [...eventLd, eventsFaqLd];

  return (
    <>
      <SEO
        title="Parties & Curated Dance Events in Bangalore | Cats Can Dance"
        description="Cats Can Dance episodes plus a hand-picked feed of the best dance music events in Bangalore this week. RSVP-only, capacity-controlled, curated."
        path="/events"
        jsonLd={jsonLd}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />

        <PageHero
          eyebrow="EVENTS"
          title="NIGHTS THAT MOVE."
          bg="bg-magenta"
          textColor="text-cream"
          eyebrowColor="text-acid-yellow"
          shadowColor="hsl(var(--ink))"
        >
          <p className="text-cream/90 font-display text-2xl md:text-3xl mb-2">UNDERGROUND. LOUD. OURS.</p>
          <p className="text-cream/80 font-medium text-lg max-w-2xl">
            The cult underground series. Every drop, every floor, every city.
          </p>
        </PageHero>

        <Marquee
          bg="bg-acid-yellow"
          items={["CCDXSOCIAL 01 · 29 JUN", "CCDXSOCIAL 02 · 27 JUL", "CCDXSOCIAL 03 · 30 AUG", "MEGA · OCT 2026", "PETS WELCOME", "FREE RSVP", "9 PM SHARP"]}
        />

        {/* ── Jun 29 urgency banner ── */}
        {!cd.over && (
          <div className="bg-ink border-b-4 border-ink">
            <div className="container py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-acid-yellow text-ink font-display text-xs uppercase tracking-widest px-3 py-1 border-2 border-acid-yellow">
                  ▶ NEXT SHOW
                </span>
                <div>
                  <p className="font-display text-cream text-lg md:text-2xl leading-none">
                    CCDXSOCIAL 01 — SUN 29 JUN
                  </p>
                  <p className="font-display text-cream/50 text-xs uppercase tracking-widest mt-0.5">
                    Indiranagar Social, Bengaluru · 🐾 Pets Welcome · Free RSVP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Mini countdown */}
                <div className="flex items-center gap-1 font-display text-xs">
                  <span className="bg-acid-yellow text-ink px-2 py-1 min-w-[2.5rem] text-center text-base">
                    {Pad(cd.days)}
                  </span>
                  <span className="text-cream/40">D</span>
                  <span className="bg-cream/10 text-cream px-2 py-1 min-w-[2.5rem] text-center text-base">
                    {Pad(cd.hours)}
                  </span>
                  <span className="text-cream/40">H</span>
                  <span className="bg-cream/10 text-cream px-2 py-1 min-w-[2.5rem] text-center text-base">
                    {Pad(cd.mins)}
                  </span>
                  <span className="text-cream/40">M</span>
                </div>
                <Link
                  to="/events/ccdxsocial-01"
                  className="bg-acid-yellow text-ink font-display text-sm px-5 py-2.5 border-4 border-acid-yellow chunk-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-transform whitespace-nowrap"
                >
                  RSVP NOW →
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="container py-10 md:py-12">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Events" }]} />

          {featured && <FeaturedEventCard event={featured} />}
        </section>

        {seriesGroup && (
          <SeriesStrip
            events={seriesGroup.events}
            currentSlug={undefined}
            seriesLabel={seriesGroup.label}
            variant="banner"
          />
        )}

        {restUpcoming.length > 0 && (
          <section className="container py-10 md:py-14">
            <p className="font-display text-magenta text-base md:text-lg mb-3">/ MORE UPCOMING</p>
            <h2 className="font-display text-ink text-3xl md:text-5xl leading-tight mb-6">
              ON THE CALENDAR.
            </h2>
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              {restUpcoming.map((e, i) => (
                <EventLineCard key={e.slug} event={e} index={i} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="bg-cream border-y-4 border-ink py-12 md:py-16">
            <div className="container">
              <p className="font-display text-magenta text-base md:text-lg mb-3">/ RECAP</p>
              <h2 className="font-display text-ink text-3xl md:text-5xl leading-tight mb-6">
                PAST EPISODES.
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <Link
                    key={e.slug}
                    to={`/events/${e.slug}`}
                    className="block bg-background border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform"
                  >
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 border-2 border-ink uppercase tracking-widest bg-ink text-cream mb-3">
                      PAST
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl text-ink leading-tight mb-1 break-words">
                      {e.title.toUpperCase()}
                    </h3>
                    <p className="text-ink/70 font-medium text-sm">
                      {e.date} · {e.city} · {e.venue}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <CuratedEventsTeaser />

        {/* ── Cross-link: Events ↔ Discover ── */}
        <section className="bg-acid-yellow border-y-4 border-ink py-8">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-ink text-xs uppercase tracking-widest mb-1">/ LOOKING FOR MORE?</p>
              <p className="font-display text-ink text-xl md:text-2xl leading-tight">
                Find events from across India — not just ours.
              </p>
              <p className="text-ink/60 text-sm font-medium mt-0.5">
                Skillbox, District, Insider, HighApe — updated daily.
              </p>
            </div>
            <Link
              to="/discover"
              className="shrink-0 bg-ink text-cream font-display text-sm px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform whitespace-nowrap"
            >
              What's On This Weekend →
            </Link>
          </div>
        </section>

        <section className="bg-ink border-y-4 border-ink py-10 md:py-14">
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
    </>
  );
};

// ──────────────────── sub-components ────────────────────

const FeaturedEventCard = ({ event }: { event: EventRow }) => {
  const isUpcoming = event.status === "upcoming";
  const poster = resolvePosterUrl(event.poster_url);
  const content = getEventContent(event);

  return (
    <Link
      to={`/events/${event.slug}`}
      className="block bg-magenta text-cream border-4 border-ink chunk-shadow-lg overflow-hidden hover:-translate-y-1 hover:translate-x-1 transition-transform"
    >
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-ink relative">
          {poster ? (
            <img
              src={poster}
              alt={`${event.title} poster`}
              loading="eager"
              className="w-full h-full object-cover aspect-[3/4] md:aspect-auto"
            />
          ) : (
            <EventPosterPlaceholder
              title={event.title}
              date={event.date}
              city={event.city || "Bangalore"}
              eyebrow={event.series_label ?? undefined}
              lineup={(event.lineup ?? []).join(" · ")}
            />
          )}
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <p className="font-display text-acid-yellow text-xs md:text-sm tracking-[0.3em] mb-3">
            / {isUpcoming ? "NEXT UP" : "FEATURED"}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {event.series_label && (
              <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream uppercase tracking-widest bg-cream text-ink">
                {event.series_label}
              </span>
            )}
            {event.pet_friendly && (
              <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream uppercase tracking-widest bg-electric-blue text-cream">
                🐾 PET-FRIENDLY
              </span>
            )}
            {event.is_finale && (
              <span className="text-[10px] font-bold px-2 py-1 border-2 border-cream uppercase tracking-widest bg-acid-yellow text-ink">
                ★ FINALE
              </span>
            )}
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.85] mb-4 break-words">
            {event.title.toUpperCase()}
          </h2>
          <p className="font-display text-base md:text-lg tracking-widest text-acid-yellow mb-2">
            {event.date}
          </p>
          <p className="font-medium text-cream/90 mb-5">
            {event.venue} · {event.city}
          </p>
          {event.blurb && (
            <p className="text-cream/80 font-medium leading-snug mb-6 line-clamp-3 max-w-xl">
              {event.blurb}
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-center mt-auto">
            <span className="bg-acid-yellow text-ink font-display text-base md:text-lg px-5 py-3 border-4 border-ink chunk-shadow">
              {isUpcoming ? content.cta_label ?? "RSVP →" : "READ THE RECAP →"}
            </span>
            {content.peak_time && (
              <span className="font-display text-xs tracking-widest text-acid-yellow">
                / FLOOR PEAKS {content.peak_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const EventLineCard = ({ event, index }: { event: EventRow; index: number }) => {
  const palettes = [
    { bg: "bg-electric-blue", text: "text-cream", chip: "bg-acid-yellow text-ink" },
    { bg: "bg-acid-yellow",   text: "text-ink",   chip: "bg-magenta text-cream"    },
    { bg: "bg-cream",         text: "text-ink",   chip: "bg-ink text-cream"        },
  ];
  const palette = palettes[index % palettes.length];
  return (
    <Link
      to={`/events/${event.slug}`}
      className={`relative block border-4 border-ink chunk-shadow p-6 md:p-7 hover:-translate-y-1 hover:translate-x-1 transition-transform ${palette.bg} ${palette.text}`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 border-2 border-ink uppercase tracking-widest ${palette.chip}`}>
            UPCOMING · RSVP
          </span>
          {event.series_label && (
            <span className="text-[10px] font-bold px-2 py-1 border-2 border-ink uppercase tracking-widest bg-ink text-cream">
              {event.series_label}
            </span>
          )}
          {event.pet_friendly && <span className="text-base" aria-label="pet-friendly">🐾</span>}
        </div>
        <span className="font-display text-base md:text-lg whitespace-nowrap">{event.date}</span>
      </div>
      <h3 className="font-display text-3xl md:text-5xl leading-none mb-2 break-words">
        {event.title.toUpperCase()}
      </h3>
      <p className="font-medium opacity-90">
        {event.city} · {event.venue}
      </p>
    </Link>
  );
};

export default Events;

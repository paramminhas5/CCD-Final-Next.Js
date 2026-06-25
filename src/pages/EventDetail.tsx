/**
 * EventDetail — the showcase page.
 *
 * IA, top → bottom:
 *
 *   1. Hero          — eyebrow, title, status pill, date/venue chips, share, primary RSVP, poster
 *   2. Countdown     — live "doors open in" strip (upcoming only)
 *   3. Marquee       — vibe slogans
 *   4. The Night     — vibe pillars + narrative
 *   5. Lineup        — artist cards with set times and audio previews
 *   6. Pet zone      — schedule + house rules (ccdxsocial / pet_friendly only)
 *   7. Look & feel   — past episode media gallery
 *   8. Venue         — address + map embed + capacity / dress code
 *   9. Partners      — series partner block + sponsor CTA
 *  10. Series        — sibling shows ("Also in this series")
 *  11. Journal       — curated long-form posts
 *  12. Sticky CTA    — mobile-only RSVP bar
 *
 * SSR: pages/events/[slug].tsx provides `initialEvent` via getStaticProps + ISR.
 * The component hydrates immediately with that data, then enriches from the DB.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "@/lib/compat-router";
import { toast } from "sonner";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import Marquee from "@/components/Marquee";
import RsvpDialog from "@/components/RsvpDialog";
import TicketTierPicker from "@/components/TicketTierPicker";
import CheckoutDialog from "@/components/CheckoutDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getEventTicketingConfig } from "@/lib/ticketing-api";

import EventCountdown from "@/components/EventCountdown";
import EventVenueCard from "@/components/EventVenueCard";
import EventLineupCard from "@/components/EventLineupCard";
import EventPosterPlaceholder from "@/components/EventPosterPlaceholder";
import SeriesStrip from "@/components/SeriesStrip";
import StickyRsvpBar from "@/components/StickyRsvpBar";

import { supabase } from "@/lib/supabase-shim";
import { imgUrl } from "@/lib/img";
import { getAllPosts } from "@/content/posts";
import {
  getEventContent,
  getStaticEventRow,
  getStaticEventsBySeries,
} from "@/content/events";
import episode1Poster from "@/assets/episode-1-poster.png";
import { useEventRsvpCount } from "@/hooks/useSocialProof";

import type { EventRow, MediaItem } from "@/types/events";

// ──────────────────── helpers ────────────────────

const resolveStorageUrl = (raw: string): string => {
  const v = raw.trim();
  if (!v) return v;
  if (v.startsWith("http") || v.startsWith("/")) return v;
  try {
    const { data } = supabase.storage.from("event-posters").getPublicUrl(v);
    return data?.publicUrl ?? `/${v}`;
  } catch {
    return `/${v}`;
  }
};

const Field = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: boolean;
}) => (
  <div className="min-w-0">
    <p className={`font-display text-xs md:text-sm tracking-widest mb-1 ${accent ? "text-acid-yellow" : "text-magenta"}`}>
      / {label}
    </p>
    <p className="font-display text-lg md:text-2xl break-words leading-tight">{value}</p>
  </div>
);

// ──────────────────── component ────────────────────

interface EventDetailProps {
  /** Pre-fetched event row from getStaticProps (SSR/ISR). Falls back to null → client-side fetch. */
  initialEvent?: EventRow | null;
  /** Slug from getStaticProps (avoids reading router.query on first render). */
  slug?: string;
}

const EventDetail = ({ initialEvent, slug: slugProp }: EventDetailProps = {}) => {
  const params = useParams();
  const slug = slugProp || params.slug || "";
  const [open, setOpen] = useState(false);
  // Seed state with SSR data so content is visible on first paint
  const [event, setEvent] = useState<EventRow | null>(initialEvent ?? null);
  const [series, setSeries] = useState<EventRow[]>([]);
  // If we already have initialEvent, consider the initial load done
  const [loaded, setLoaded] = useState(!!initialEvent);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  // Ticketing
  const [ticketConfig, setTicketConfig] = useState<any>(null);
  const [ticketTiers, setTicketTiers] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"direct_sale" | "rsvp_invite" | "free_rsvp">("rsvp_invite");
  const [checkoutSelections, setCheckoutSelections] = useState<any[]>([]);

  // Fetch this event + its series siblings (single round-trip each).
  // Fall back to the static catalogue in src/content/events.ts when Supabase
  // is empty / unreachable so the page always renders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let row: EventRow | null = null;
      try {
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        row = (data as unknown as EventRow) ?? null;
      } catch {
        row = null;
      }
      // Static fallback if DB is empty
      if (!row) row = getStaticEventRow(slug);
      if (cancelled) return;
      setEvent(row);
      setLoaded(true);

      // Load ticketing config (non-blocking)
      getEventTicketingConfig(slug).then(data => {
        if (cancelled) return;
        setTicketConfig(data.config ?? null);
        setTicketTiers(data.tiers ?? []);
        if (data.config) setCheckoutMode(data.config.ticketing_mode as any ?? "rsvp_invite");
      }).catch(() => { /* no ticketing = normal RSVP flow */ });

      // If this event is part of a series, fetch the sibling rows in one query.
      const seriesKey = row?.series;
      if (seriesKey) {
        let sib: EventRow[] = [];
        try {
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("series", seriesKey)
            .order("sort_order", { ascending: true });
          if (Array.isArray(data) && data.length > 0) sib = data as unknown as EventRow[];
        } catch { /* fall through to static */ }
        if (sib.length === 0) sib = getStaticEventsBySeries(seriesKey);
        if (!cancelled) setSeries(sib);
      } else {
        setSeries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Resolve rich content from src/content/events.ts (defaults applied internally).
  const content = useMemo(() => (event ? getEventContent(event) : null), [event]);

  // Build the lineup as LineupArtist[] (rich) with TBA fallbacks for unknown names.
  const lineup = useMemo(() => {
    if (!event) return [];
    return (event.lineup ?? []).map((name) => {
      const detail = content?.artist_details?.[name];
      if (detail) return detail;
      const isTba = name.trim().toUpperCase() === "TBA";
      return {
        name,
        role: isTba ? "Special Guest" : "DJ",
        tba: isTba,
        blurb: isTba ? "Announcement coming soon." : undefined,
      };
    });
  }, [event, content]);

  // Social proof — RSVP count for this event (fetched client-side, best-effort).
  // Must be called here (top level) — before any early returns — to obey the
  // Rules of Hooks (hooks must be called in the same order on every render).
  const rsvpCount = useEventRsvpCount(slug);

  // ─── empty / loading states ───
  if (loaded && !event) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="container pt-32 pb-16">
          <h1 className="font-display text-5xl text-ink mb-4">Event not found</h1>
          <Link to="/events" className="font-display text-magenta underline">
            ← All events
          </Link>
        </section>
        <Footer />
      </main>
    );
  }
  if (!event || !content) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="container pt-32 pb-16" aria-busy />
      </main>
    );
  }

  const isUpcoming = event.status === "upcoming";
  const isPet = !!event.pet_friendly;
  const headingShadow = isUpcoming
    ? "drop-shadow-[6px_6px_0_hsl(var(--ink))]"
    : "drop-shadow-[6px_6px_0_hsl(var(--magenta))]";
  const media = (event.media ?? []).filter((m) => m && m.url);
  const seriesEyebrow = (() => {
    if (!event.series_label) return null;
    const idx = series.findIndex((e) => e.slug === event.slug);
    if (idx < 0 || series.length === 0) return event.series_label;
    return `${event.series_label} · SHOW ${String(idx + 1).padStart(2, "0")}`;
  })();
  const ctaLabel = content.cta_label ?? "RSVP NOW →";
  const stickyMeta = `${event.date} · ${content.price_text ?? "Free RSVP"}`;

  // ─── JSON-LD ───
  const eventLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${event.title}`,
    description: event.blurb,
    startDate: event.date,
    eventStatus: isUpcoming
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventMovedOnline",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: content.venue_address ?? event.venue,
        addressLocality: event.city || "Bangalore",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
      ...(content.venue_geo
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: content.venue_geo.lat,
              longitude: content.venue_geo.lng,
            },
          }
        : {}),
    },
    image: event.poster_url ? [event.poster_url] : undefined,
    performer: (event.lineup ?? [])
      .filter((p) => p && p.toUpperCase() !== "TBA")
      .map((p) => ({ "@type": "PerformingGroup", name: p })),
    organizer: {
      "@type": "Organization",
      name: "Cats Can Dance",
      url: "https://catscandance.com",
    },
    offers: {
      "@type": "Offer",
      url: `https://catscandance.com/events/${slug}`,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-01T00:00:00Z",
    },
    url: `https://catscandance.com/events/${slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: "https://catscandance.com/" },
      { "@type": "ListItem", position: 2, name: "Events", item: "https://catscandance.com/events" },
      { "@type": "ListItem", position: 3, name: event.title },
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `When is ${event.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${event.title} runs on ${event.date} at ${event.venue}, ${event.city || "Bengaluru"}. ${content.peak_time ? `The floor peaks around ${content.peak_time}.` : ""}`.trim(),
        },
      },
      {
        "@type": "Question",
        name: "How do I RSVP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `RSVP at catscandance.com/events/${slug}. Capacity is controlled — the room is part of the experience.`,
        },
      },
      ...(isPet
        ? [
            {
              "@type": "Question",
              name: "Are pets really welcome?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Yes — this is a CCD × SOCIAL show. Vaccinated dogs only, short leads, water bowls provided, and an outdoor pet zone runs all afternoon before the floor opens.",
              },
            },
          ]
        : []),
    ],
  };

  // ──────────────────── render ────────────────────

  return (
    <>
      <SEO
        title={`${event.title} — Cats Can Dance${event.series_label ? ` · ${event.series_label}` : ""}`}
        description={event.blurb}
        path={`/events/${slug}`}
        image={event.poster_url ?? undefined}
        type="event"
        jsonLd={[eventLd, breadcrumbLd, faqLd]}
      />

      <main className="bg-background text-foreground min-h-screen pb-20 md:pb-0">
        <Nav />

        {/* 1. HERO */}
        <section
          className={`pt-28 md:pt-36 pb-12 md:pb-16 border-b-4 border-ink ${
            isUpcoming ? "bg-magenta text-cream" : "bg-cream text-ink"
          }`}
        >
          <div className="container">
            <Breadcrumbs
              light={isUpcoming}
              items={[
                { label: "Home", to: "/" },
                { label: "Events", to: "/events" },
                { label: event.title },
              ]}
            />

            <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-end">
              {/* Title block */}
              <div>
                {seriesEyebrow && (
                  <p className={`font-display text-sm md:text-base tracking-[0.3em] mb-3 ${
                    isUpcoming ? "text-acid-yellow" : "text-magenta"
                  }`}>
                    / {seriesEyebrow}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 border-2 border-ink uppercase tracking-widest ${
                      isUpcoming ? "bg-acid-yellow text-ink" : "bg-ink text-cream"
                    }`}
                  >
                    {isUpcoming ? "UPCOMING · RSVP OPEN" : "PAST EPISODE"}
                  </span>
                  {isPet && (
                    <span className="inline-block text-xs font-bold px-3 py-1 border-2 border-ink uppercase tracking-widest bg-electric-blue text-cream">
                      🐾 PET-FRIENDLY
                    </span>
                  )}
                  {event.is_finale && (
                    <span className="inline-block text-xs font-bold px-3 py-1 border-2 border-ink uppercase tracking-widest bg-acid-yellow text-ink">
                      ★ FINALE
                    </span>
                  )}
                </div>

                <h1
                  className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] mb-6 break-words ${headingShadow}`}
                >
                  {event.title.toUpperCase()}
                </h1>

                <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-xl mb-6">
                  <Field label="DATE"  value={event.date}  accent={isUpcoming} />
                  <Field label="VENUE" value={event.venue} accent={isUpcoming} />
                  <Field label="CITY"  value={event.city}  accent={isUpcoming} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isUpcoming && (
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="bg-acid-yellow text-ink font-display text-lg md:text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                    >
                      {ctaLabel}
                    </button>
                  )}
                  {/* Social proof — RSVP count shown when ≥5 people have signed up */}
                  {isUpcoming && rsvpCount !== null && rsvpCount >= 5 && (
                    <span className={`font-display text-sm uppercase tracking-widest ${isUpcoming ? "text-acid-yellow" : "text-magenta"}`}>
                      ✦ {rsvpCount.toLocaleString("en-IN")} going
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const url = `${window.location.origin}/events/${slug}`;
                      const shareData = {
                        title: `Cats Can Dance — ${event.title}`,
                        text: event.blurb || "Bangalore underground",
                        url,
                      };
                      if (typeof navigator.share === "function") {
                        try {
                          await navigator.share(shareData);
                          return;
                        } catch {
                          /* user cancel */
                        }
                      }
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Link copied to clipboard");
                      } catch {
                        toast.error("Couldn't copy link");
                      }
                    }}
                    className={`inline-flex items-center gap-2 font-display px-4 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform ${
                      isUpcoming ? "bg-cream text-ink" : "bg-ink text-cream"
                    }`}
                    aria-label="Share event"
                  >
                    ↗ SHARE
                  </button>
                  {content.price_text && (
                    <span className={`font-display text-sm tracking-widest ${
                      isUpcoming ? "text-acid-yellow" : "text-magenta"
                    }`}>
                      / {content.price_text}
                    </span>
                  )}
                </div>
              </div>

              {/* Poster */}
              <div className="lg:max-w-md w-full justify-self-end">
                {event.poster_url ? (
                  (() => {
                    const src = resolveStorageUrl(event.poster_url!);
                    return (
                      <img
                        src={src}
                        alt={`${event.title} — Cats Can Dance dance music event in ${event.city || "Bangalore"}`}
                        loading="eager"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full aspect-[3/4] object-cover border-4 border-ink chunk-shadow-lg"
                        data-fallback-step="0"
                        onError={(ev) => {
                          const img = ev.currentTarget as HTMLImageElement;
                          const step = Number(img.dataset.fallbackStep ?? "0");
                          if (step === 0 && slug === "episode-1" && img.src !== imgUrl(episode1Poster)) {
                            img.dataset.fallbackStep = "1";
                            img.src = imgUrl(episode1Poster);
                            return;
                          }
                          img.style.display = "none";
                        }}
                      />
                    );
                  })()
                ) : (
                  <EventPosterPlaceholder
                    title={event.title}
                    date={event.date}
                    city={event.city || "Bangalore"}
                    eyebrow={seriesEyebrow ?? undefined}
                    lineup={(event.lineup ?? []).join(" · ")}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. COUNTDOWN */}
        {isUpcoming && (
          <EventCountdown date={event.date} doorsTime={content.doors_time} />
        )}

        {/* 3. MARQUEE */}
        <Marquee
          bg="bg-acid-yellow"
          items={
            content.marquee_items ?? [
              "DOORS OPEN LATE",
              "BRING YOUR PACK",
              "NO DRESS CODE — MOVE",
              "RSVP IS A LOVE LANGUAGE",
            ]
          }
        />

        {/* 4. THE NIGHT */}
        <section className="container py-12 md:py-20">
          <p className="font-display text-magenta text-base md:text-lg mb-3">/ THE NIGHT</p>
          <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-8 max-w-4xl">
            WHAT TO LOOK FORWARD TO.
          </h2>

          {content.vibe_pillars && content.vibe_pillars.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10">
              {content.vibe_pillars.slice(0, 3).map((p, i) => {
                const palettes = [
                  "bg-magenta text-cream",
                  "bg-electric-blue text-cream",
                  "bg-acid-yellow text-ink",
                ];
                return (
                  <div
                    key={p.label}
                    className={`border-4 border-ink chunk-shadow p-5 md:p-6 ${palettes[i % palettes.length]}`}
                  >
                    <p className="text-3xl md:text-4xl mb-3" aria-hidden>{p.icon}</p>
                    <h3 className="font-display text-2xl md:text-3xl leading-none mb-2">{p.label}</h3>
                    <p className="font-medium leading-snug">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 md:gap-10">
            <div>
              <p className="text-ink/85 font-medium text-lg md:text-xl leading-relaxed">
                {content.narrative ?? event.blurb}
              </p>
            </div>
            {content.schedule && content.schedule.length > 0 && (
              <div className="bg-ink text-cream border-4 border-ink chunk-shadow p-5 md:p-6">
                <p className="font-display text-acid-yellow text-xs md:text-sm tracking-widest mb-4">
                  / RUN OF SHOW
                </p>
                <ul className="space-y-2">
                  {content.schedule.map((item) => (
                    <li
                      key={item.time + item.what}
                      className={`flex items-baseline gap-3 border-l-4 pl-3 ${
                        item.highlight
                          ? "border-acid-yellow text-acid-yellow"
                          : "border-cream/20 text-cream/90"
                      }`}
                    >
                      <span className={`font-display text-sm md:text-base tabular-nums shrink-0 ${
                        item.highlight ? "" : "text-acid-yellow/80"
                      }`}>
                        {item.time}
                      </span>
                      <span className="font-medium leading-snug">{item.what}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* 5. LINEUP */}
        {lineup.length > 0 && (
          <section className="bg-cream border-y-4 border-ink py-12 md:py-20">
            <div className="container">
              <p className="font-display text-magenta text-base md:text-lg mb-3">/ LINEUP</p>
              <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-8 max-w-4xl">
                WHO'S ON.
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {lineup.map((a, i) => (
                  <EventLineupCard key={`${a.name}-${i}`} artist={a} index={i} />
                ))}
              </div>
              {isUpcoming && (
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="bg-magenta text-cream font-display text-lg md:text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    {ctaLabel}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. PET ZONE */}
        {isPet && content.schedule && (
          <section className="bg-electric-blue text-cream border-b-4 border-ink py-12 md:py-16">
            <div className="container grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-10 items-start">
              <div>
                <p className="font-display text-acid-yellow text-base md:text-lg mb-3">/ THE PET ZONE</p>
                <h2 className="font-display text-cream text-4xl md:text-5xl leading-[0.9] mb-4">
                  IT'S NOT A GIMMICK.
                </h2>
                <p className="font-medium text-cream/90 text-lg leading-relaxed mb-4">
                  CCD × SOCIAL is the first dance series in India built pet-first.
                  The afternoon belongs to the dogs — agility, market, portraits.
                  Then the parents take the floor.
                </p>
                {content.house_rules && (
                  <div className="bg-ink border-4 border-ink p-4">
                    <p className="font-display text-acid-yellow text-xs tracking-widest mb-2">/ HOUSE RULES</p>
                    <p className="font-medium text-cream/90 text-sm leading-snug">{content.house_rules}</p>
                  </div>
                )}
              </div>
              <div className="bg-cream text-ink border-4 border-ink chunk-shadow p-5 md:p-6">
                <p className="font-display text-magenta text-xs tracking-widest mb-4">/ PET-ZONE TIMELINE</p>
                <ul className="space-y-3">
                  {content.schedule
                    .filter((s) => /\d\s*PM/i.test(s.time) ? parseInt(s.time, 10) < 8 : false)
                    .map((s) => (
                      <li
                        key={s.time + s.what}
                        className="flex items-baseline gap-3 border-b-2 border-ink/10 pb-3 last:border-b-0"
                      >
                        <span className="font-display text-base md:text-lg tabular-nums text-magenta shrink-0 w-20">
                          {s.time}
                        </span>
                        <span className="font-medium text-ink/85 leading-snug">{s.what}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 7. LOOK & FEEL */}
        {media.length > 0 && (
          <section className="bg-background py-12 md:py-16">
            <div className="container">
              <p className="font-display text-magenta text-base md:text-lg mb-3">/ LOOK & FEEL</p>
              <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-2">
                WHAT THE NIGHT LOOKS LIKE.
              </h2>
              <p className="text-ink/70 font-medium text-base md:text-lg mb-8 max-w-2xl">
                Photos and clips from past CCD episodes. Tap any photo to view large.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((item, i) => {
                  const url = resolveStorageUrl(item.url);
                  return (
                    <figure
                      key={`${item.url}-${i}`}
                      className="bg-ink border-4 border-ink chunk-shadow"
                    >
                      {item.type === "video" ? (
                        <video
                          src={url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full aspect-video object-cover bg-ink"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLightbox({ ...item, url })}
                          className="block w-full"
                          aria-label={item.caption || `Open photo ${i + 1}`}
                        >
                          <img
                            src={url}
                            alt={item.caption || `${event.title} photo ${i + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-video object-cover hover:opacity-90 transition-opacity"
                            onError={(ev) => {
                              (ev.currentTarget as HTMLImageElement).style.opacity = "0.4";
                            }}
                          />
                        </button>
                      )}
                      {item.caption && (
                        <figcaption className="bg-cream text-ink px-3 py-2 text-sm font-medium border-t-4 border-ink">
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TICKETING — shown when event has ticketing enabled */}
        {isUpcoming && ticketConfig && ticketTiers.length > 0 && (
          <section className="container py-12 md:py-16">
            <p className="font-display text-magenta text-base md:text-lg mb-3">/ GET TICKETS</p>
            <h2 className="font-display text-ink text-4xl md:text-5xl leading-[0.9] mb-8">
              SECURE YOUR SPOT.
            </h2>
            <div className="max-w-md">
              <TicketTierPicker
                tiers={ticketTiers}
                config={ticketConfig}
                onBuyNow={sels => { setCheckoutSelections(sels); setCheckoutMode("direct_sale"); setCheckoutOpen(true); }}
                onRsvp={sels => { setCheckoutSelections(sels); setCheckoutMode("rsvp_invite"); setCheckoutOpen(true); }}
              />
            </div>
          </section>
        )}

        {/* 8. VENUE */}
        <EventVenueCard
          venue={event.venue}
          city={event.city || "Bangalore"}
          address={content.venue_address}
          mapUrl={content.venue_map_url}
          embedUrl={content.venue_embed_url}
          capacity={content.capacity}
          dressCode={content.dress_code}
          houseRules={content.house_rules}
        />

        {/* 9. PARTNERS */}
        {content.partners && content.partners.length > 0 && (
          <section className="bg-ink text-cream border-y-4 border-ink py-12 md:py-16">
            <div className="container grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="font-display text-acid-yellow text-base md:text-lg mb-3">/ BROUGHT TO YOU BY</p>
                <h2 className="font-display text-cream text-3xl md:text-5xl leading-[0.9] mb-3">
                  PARTNERS, NOT SPONSORS.
                </h2>
                <p className="text-cream/80 font-medium leading-snug max-w-md mb-4">
                  CCD × SOCIAL is a partnership-led series. Each show is built with brands
                  that share the room.
                </p>
                {event.series === "ccdxsocial" && (
                  <Link
                    to="/ccdxsocial"
                    className="inline-block bg-acid-yellow text-ink font-display text-base px-5 py-2 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
                  >
                    SPONSORSHIP ↗
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {content.partners.map((p) => {
                  const inner = (
                    <div className="bg-cream text-ink border-4 border-ink p-4 h-full flex flex-col items-center justify-center text-center min-h-[120px]">
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.name} className="max-h-12 mb-2" loading="lazy" />
                      ) : (
                        <p className="font-display text-2xl text-ink leading-none">{p.name.toUpperCase()}</p>
                      )}
                      {p.role && (
                        <p className="font-display text-[10px] tracking-widest text-magenta mt-1">/ {p.role}</p>
                      )}
                    </div>
                  );
                  return p.href ? (
                    <Link key={p.name} to={p.href} className="block">{inner}</Link>
                  ) : (
                    <div key={p.name}>{inner}</div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 10. ALSO IN THIS SERIES */}
        {event.series && series.length > 1 && (
          <SeriesStrip
            events={series}
            currentSlug={event.slug}
            seriesLabel={event.series_label || (event.series ?? "").toUpperCase()}
          />
        )}

        {/* 11. JOURNAL */}
        {(() => {
          const journal = getAllPosts()
            .filter(
              (p) =>
                p.category === "GUIDES" ||
                p.category === "CULTURE" ||
                p.category === "JOURNAL"
            )
            .slice(0, 2);
          if (journal.length === 0) return null;
          return (
            <section className="bg-cream border-t-4 border-ink py-12 md:py-16">
              <div className="container max-w-5xl">
                <p className="font-display text-magenta text-base md:text-lg mb-4">/ READ MORE FROM THE JOURNAL</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {journal.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/blog/${p.slug}`}
                      className="block bg-acid-yellow border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform"
                    >
                      <span className="inline-block bg-ink text-cream text-[10px] font-bold px-2 py-0.5 mb-2">
                        {p.category || p.tag}
                      </span>
                      <p className="font-display text-ink text-xl md:text-2xl leading-tight mb-1">{p.title}</p>
                      <p className="text-ink/70 text-sm font-medium line-clamp-2">{p.excerpt}</p>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/blog"
                  className="inline-block mt-6 font-display text-ink text-lg underline decoration-4 decoration-magenta underline-offset-4 hover:text-magenta transition"
                >
                  All journal posts →
                </Link>
              </div>
            </section>
          );
        })()}

        <Footer />
      </main>

      {/* 12. STICKY MOBILE CTA */}
      {isUpcoming && (
        <StickyRsvpBar
          label={ctaLabel}
          onClick={() => setOpen(true)}
          meta={stickyMeta}
        />
      )}

      <RsvpDialog
        open={open}
        onOpenChange={setOpen}
        eventSlug={slug}
        eventTitle={`Cats Can Dance ${event.title}`}
        eventDate={event.date}
        eventVenue={event.venue}
      />

      {/* Ticketing checkout — only when ticketing config is active */}
      {ticketConfig && checkoutSelections.length > 0 && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          eventSlug={slug}
          eventTitle={`Cats Can Dance ${event.title}`}
          eventDate={event.date}
          mode={checkoutMode}
          isFree={ticketConfig.is_free || checkoutSelections.every((s: any) => s.tier.is_free || s.tier.price_inr === 0)}
          selections={checkoutSelections}
          razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_DUMMY_KEY_ID"}
        />
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl bg-ink border-4 border-ink p-2">
          {lightbox && (
            <figure>
              <img
                src={lightbox.url}
                alt={lightbox.caption || "Photo"}
                className="w-full max-h-[80vh] object-contain bg-ink"
              />
              {lightbox.caption && (
                <figcaption className="text-cream text-center font-medium py-2">{lightbox.caption}</figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetail;

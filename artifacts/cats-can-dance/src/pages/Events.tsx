import { useEffect, useState } from "react";
import { Link } from "@/lib/compat-router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import CuratedEvents from "@/components/CuratedEvents";
import Marquee from "@/components/Marquee";
import RsvpDialog from "@/components/RsvpDialog";
import { supabase } from "@/lib/supabase-shim";
import type { EventRow } from "@/types/events";

const resolvePosterUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) return v;
  try {
    const { data } = supabase.storage.from("event-posters").getPublicUrl(v);
    return data?.publicUrl ?? `/${v}`;
  } catch { return `/${v}`; }
};

// ── Series Section ────────────────────────────────────────────────────────────

const SeriesSection = ({ events }: { events: EventRow[] }) => {
  const [rsvpEvent, setRsvpEvent] = useState<EventRow | null>(null);
  const label = events[0]?.series_label ?? "SERIES";

  const palette = [
    { bg: "bg-electric-blue", text: "text-cream", num: "text-acid-yellow", btn: "bg-acid-yellow text-ink" },
    { bg: "bg-magenta",       text: "text-cream", num: "text-acid-yellow", btn: "bg-cream text-ink"       },
    { bg: "bg-ink",           text: "text-cream", num: "text-acid-yellow", btn: "bg-acid-yellow text-ink" },
  ];

  return (
    <div className="mb-16">
      {/* Series masthead */}
      <div className="bg-acid-yellow border-4 border-ink chunk-shadow-lg px-6 py-6 md:px-10 md:py-8 border-b-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 bg-ink text-acid-yellow font-display text-xs px-3 py-1.5 mb-4 border-2 border-ink">
              🐾 SERIES · {events.length} SHOWS · END OF JUNE 2026
            </span>
            <h2 className="font-display text-ink text-5xl md:text-7xl leading-[0.85] mb-3">
              {label}
            </h2>
            <p className="text-ink/80 font-medium text-lg md:text-xl max-w-2xl">
              India's most fun Saturday yet — animal lovers and electronic music fans together. 
              Outdoor pet zone 4PM–8PM, Startdawg, Merman + more. Dance music till close.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              to="/ccdxsocial/sponsor"
              className="bg-ink text-cream font-display text-sm px-6 py-3 border-4 border-ink hover:bg-magenta transition-colors text-center whitespace-nowrap"
            >
              SPONSOR A SHOW →
            </Link>
            <a
              href="/ccdxsocial"
              className="bg-transparent text-ink font-display text-sm px-6 py-3 border-4 border-ink hover:bg-ink hover:text-cream transition-colors text-center whitespace-nowrap"
            >
              PARTNERSHIP INFO →
            </a>
          </div>
        </div>
      </div>

      {/* What to expect strip */}
      <div className="bg-lime border-4 border-t-0 border-b-0 border-ink px-6 py-4 flex flex-wrap gap-3 md:gap-6">
        {[
          "🎧 Startdawg",
          "🎧 Merman",
          "🎧 + 3 More TBA",
          "🐾 Outdoor Pet Zone",
          "🏃 Agility Courses",
          "🎨 Pet Portrait Booth",
          "🛍️ Vendor Market",
          "🏆 Golden Paw Awards",
        ].map((item) => (
          <span key={item} className="font-display text-ink text-xs md:text-sm border-2 border-ink px-3 py-1.5 bg-cream">
            {item}
          </span>
        ))}
      </div>

      {/* 3 show cards */}
      <div className="grid md:grid-cols-3 border-4 border-t-0 border-ink chunk-shadow-lg overflow-hidden">
        {events.map((e, i) => {
          const p = palette[i % palette.length];
          const poster = resolvePosterUrl(e.poster_url);
          return (
            <article key={e.slug} className={`${p.bg} ${p.text} border-r-4 border-ink last:border-r-0 flex flex-col`}>
              {poster ? (
                <div className="aspect-video border-b-4 border-ink overflow-hidden">
                  <img src={poster} alt={e.title} loading="lazy" className="w-full h-full object-cover"
                    onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : (
                <div className={`aspect-video border-b-4 border-ink grid place-items-center bg-grain`}>
                  <span className="font-display text-5xl opacity-20">★</span>
                </div>
              )}
              <div className="flex flex-col flex-1 p-6">
                <span className={`${p.num} font-display text-sm mb-1`}>SHOW 0{i + 1}</span>
                <h3 className="font-display text-3xl md:text-4xl leading-none mb-2">{e.title.toUpperCase()}</h3>
                {e.series_tagline && (
                  <p className="font-display text-xs opacity-60 uppercase tracking-widest mb-3">{e.series_tagline}</p>
                )}
                <div className="grid grid-cols-2 gap-3 my-3 text-sm">
                  <div>
                    <p className="font-display text-xs opacity-50 mb-0.5">DATE</p>
                    <p className="font-display text-base">{e.date}</p>
                  </div>
                  <div>
                    <p className="font-display text-xs opacity-50 mb-0.5">DOORS</p>
                    <p className="font-display text-base">4:00 PM</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-display text-xs opacity-50 mb-0.5">VENUE</p>
                    <p className="font-display text-base">{e.venue} · {e.city}</p>
                  </div>
                </div>
                {e.lineup && e.lineup.length > 0 && (
                  <div className="mb-4">
                    <p className="font-display text-xs opacity-50 uppercase mb-1.5">Lineup</p>
                    <div className="flex flex-wrap gap-1">
                      {e.lineup.map((l) => (
                        <span key={l} className="bg-white/10 border border-white/20 font-display text-xs px-2 py-1">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {e.pet_friendly && (
                  <p className="font-display text-xs opacity-75 mb-4">🐾 OUTDOOR PET ZONE · 4PM–8PM</p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => setRsvpEvent(e)}
                    className={`flex-1 ${p.btn} font-display text-sm px-4 py-3 border-4 border-ink chunk-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-transform`}
                  >
                    RSVP →
                  </button>
                  <Link
                    to={`/events/${e.slug}`}
                    className="flex-1 border-4 border-current font-display text-sm px-4 py-3 hover:opacity-80 transition-opacity text-center"
                  >
                    DETAILS
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Grand Finale teaser */}
      <div className="bg-ink text-cream border-4 border-t-0 border-ink px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-magenta text-cream font-display text-xs px-3 py-1 border-2 border-magenta mb-3">
            COMING SOON · DATE TBA
          </span>
          <h3 className="font-display text-cream text-3xl md:text-5xl leading-[0.9] mb-2">
            GRAND FORMAT SHOW
          </h3>
          <p className="text-cream/70 font-medium max-w-xl">
            The season finale. 2,000+ people. Full outdoor stage + production. Pet runway. 
            Agility finals. Complete lineup TBA. The biggest thing we've ever done.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {["2,000+ Capacity", "Full Outdoor Stage", "Pet Runway", "Complete Lineup TBA"].map(f => (
              <span key={f} className="bg-cream/10 border border-cream/20 font-display text-xs px-3 py-1.5 text-cream">{f}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            to="/ccdxsocial/sponsor"
            className="bg-acid-yellow text-ink font-display text-base px-8 py-4 border-4 border-acid-yellow chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform text-center whitespace-nowrap"
          >
            SPONSOR THE FINALE →
          </Link>
          <a
            href="mailto:hello@catscandance.com?subject=Grand%20Finale%20Notify%20Me"
            className="bg-transparent text-cream font-display text-sm px-8 py-3 border-4 border-cream/40 hover:border-cream transition-colors text-center"
          >
            NOTIFY ME WHEN LIVE →
          </a>
        </div>
      </div>

      {rsvpEvent && (
        <RsvpDialog
          open={!!rsvpEvent}
          onOpenChange={(v) => { if (!v) setRsvpEvent(null); }}
          eventSlug={rsvpEvent.slug}
          eventTitle={`Cats Can Dance ${rsvpEvent.title}`}
        />
      )}
    </div>
  );
};

// ── Main Events Page ──────────────────────────────────────────────────────────

const Events = () => {
  const [all, setAll] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("slug,title,city,venue,date,status,sort_order,series,series_label,event_type,pet_friendly,series_tagline,lineup,blurb,poster_url").order("sort_order", { ascending: true });
      if (data) setAll(data as EventRow[]);
    })();
  }, []);

  const upcoming = all.filter((e) => e.status === "upcoming");
  const past     = all.filter((e) => e.status === "past");

  // Detect active series
  const seriesCounts = upcoming.reduce<Record<string, EventRow[]>>((acc, e) => {
    if (e.series) { acc[e.series] = acc[e.series] ?? []; acc[e.series].push(e); }
    return acc;
  }, {});
  const activeSeries = Object.entries(seriesCounts).find(([, evs]) => evs.length >= 2);
  const seriesEvents = activeSeries ? activeSeries[1] : [];
  const seriesSlug   = activeSeries ? activeSeries[0] : null;

  // Non-series upcoming events
  const standaloneUpcoming = upcoming.filter((e) => !seriesSlug || e.series !== seriesSlug);

  // Schema.org JSON-LD
  const eventLd = all.map((e) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${e.title}`,
    startDate: e.date,
    eventStatus: e.status === "upcoming" ? "https://schema.org/EventScheduled" : "https://schema.org/EventMovedOnline",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue,
      address: { "@type": "PostalAddress", streetAddress: e.venue, addressLocality: e.city || "Bangalore", addressRegion: "Karnataka", addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: "Cats Can Dance", url: "https://catscandance.com" },
    offers: { "@type": "Offer", url: `https://catscandance.com/events/${e.slug}`, price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock", validFrom: new Date().toISOString() },
    url: `https://catscandance.com/events/${e.slug}`,
  }));

  const itemListLd = upcoming.length ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming Cats Can Dance events in Bangalore",
    itemListElement: upcoming.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `https://catscandance.com/events/${e.slug}`, name: `${e.title} — ${e.city}` })),
  } : null;

  const eventsFaqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What underground dance music events does Cats Can Dance host in Bangalore?", acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance hosts RSVP-only underground dance music episodes in Bengaluru featuring House, Disco, Jungle, Garage, and Drum & Bass. The CCDxSocial series runs June 2026 with outdoor pet activities. All upcoming events are listed at catscandance.com/events." } },
      { "@type": "Question", name: "What is the CCDxSocial series?", acceptedAnswer: { "@type": "Answer", text: "CCDxSocial is a 3-show series at the end of June 2026 combining outdoor pet activities with the best dance and bass music DJs. Animal lovers and electronic music fans together. An outdoor pet zone runs 4PM–8PM with Startdawg, Merman and more TBA." } },
      { "@type": "Question", name: "Are Cats Can Dance events pet friendly?", acceptedAnswer: { "@type": "Answer", text: "The CCDxSocial series is fully pet friendly — outdoor pet zone with agility courses, portrait booths, grooming demos and more from 4PM to 8PM." } },
      { "@type": "Question", name: "How do I RSVP to a Cats Can Dance event?", acceptedAnswer: { "@type": "Answer", text: "RSVP links for upcoming Cats Can Dance events are at catscandance.com/events. Capacity is limited — RSVP early. Most episodes are free entry with name on the door." } },
    ],
  };

  const jsonLd = itemListLd ? [...eventLd, itemListLd, eventsFaqLd] : [...eventLd, eventsFaqLd];

  return (
    <>
      <SEO
        title="Parties & Curated Dance Events in Bangalore | Cats Can Dance"
        description="Cats Can Dance events: underground dance music + outdoor pet activities. CCDxSocial series — 3 shows, end of June 2026. Startdawg, Merman + more. RSVP now."
        path="/events"
        jsonLd={jsonLd}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <PageHero
          eyebrow="EVENTS"
          title={<>NIGHTS THAT<br />MOVE.</>}
          bg="bg-magenta"
          textColor="text-cream"
          eyebrowColor="text-acid-yellow"
          shadowColor="hsl(var(--ink))"
        >
          <p className="text-cream/90 font-display text-2xl md:text-3xl mb-2">UNDERGROUND. LOUD. OURS.</p>
          <p className="text-cream/80 font-medium text-lg max-w-2xl">
            The cult underground series — now with outdoor pet zones, the best DJs in dance and bass music, and something for everyone who loves a good time.
          </p>
        </PageHero>

        <Marquee
          bg="bg-acid-yellow"
          items={["DOORS OPEN 4PM", "OUTDOOR PET ZONE", "STARTDAWG", "MERMAN", "BRING YOUR PETS", "DANCE TILL CLOSE", "SOLD-OUT IS A LOVE LANGUAGE"]}
        />

        <section className="container py-12 md:py-16">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Events" }]} />

          {/* ── Series Section — front and center ── */}
          {seriesEvents.length >= 2 && (
            <div className="mt-8">
              <SeriesSection events={seriesEvents} />
            </div>
          )}

          {/* ── Standalone upcoming events ── */}
          {standaloneUpcoming.length > 0 && (
            <div className={seriesEvents.length >= 2 ? "mt-0" : "mt-8"}>
              {seriesEvents.length >= 2 && (
                <p className="font-display text-ink text-xl mb-4">/ OTHER UPCOMING SHOWS</p>
              )}
              <div className="grid gap-6 max-w-4xl">
                {standaloneUpcoming.map((e, i) => {
                  const upcomingPalette = [
                    { bg: "bg-magenta",       text: "text-cream", chip: "bg-acid-yellow text-ink" },
                    { bg: "bg-electric-blue", text: "text-cream", chip: "bg-acid-yellow text-ink" },
                    { bg: "bg-acid-yellow",   text: "text-ink",   chip: "bg-magenta text-cream"   },
                  ];
                  const palette = upcomingPalette[i % upcomingPalette.length];
                  return (
                    <Link
                      key={e.slug}
                      to={`/events/${e.slug}`}
                      className={`relative block border-4 border-ink chunk-shadow p-6 md:p-8 hover:-translate-y-1 hover:translate-x-1 transition-transform ${palette.bg} ${palette.text}`}
                    >
                      <span className="absolute -top-3 -right-3 rotate-6 bg-ink text-acid-yellow font-display text-xs md:text-sm px-3 py-1 border-4 border-ink">
                        LATE NIGHT ✦
                      </span>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold px-3 py-1 border-2 border-ink uppercase ${palette.chip}`}>
                          UPCOMING · RSVP
                        </span>
                        <span className="font-display text-lg">{e.date}</span>
                      </div>
                      <h2 className="font-display text-4xl md:text-6xl mb-2">{e.title.toUpperCase()}</h2>
                      <p className="font-medium opacity-90">{e.city} · {e.venue}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Past events ── */}
          {past.length > 0 && (
            <div className="mt-16">
              <p className="font-display text-ink text-xl mb-4">/ PAST EPISODES</p>
              <div className="grid gap-6 max-w-4xl">
                {past.map((e) => (
                  <Link
                    key={e.slug}
                    to={`/events/${e.slug}`}
                    className="relative block border-4 border-ink chunk-shadow p-6 md:p-8 hover:-translate-y-1 hover:translate-x-1 transition-transform bg-cream text-ink"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-3 py-1 border-2 border-ink uppercase bg-ink text-cream">PAST</span>
                      <span className="font-display text-lg">{e.date}</span>
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl mb-2">{e.title.toUpperCase()}</h2>
                    <p className="font-medium opacity-70">{e.city} · {e.venue}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <CuratedEvents />

        {/* Host strip */}
        <section className="bg-ink border-y-4 border-ink py-10 md:py-14">
          <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-display text-acid-yellow text-lg mb-2">/ HOST WITH US</p>
              <h3 className="font-display text-cream text-3xl md:text-5xl leading-[0.95]">
                WANT TO HOST ONE?
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/for-venues"
                className="bg-acid-yellow text-ink font-display text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap"
              >
                FOR VENUES →
              </Link>
              <Link
                to="/ccdxsocial/sponsor"
                className="bg-magenta text-cream font-display text-lg px-6 py-3 border-4 border-magenta chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform whitespace-nowrap"
              >
                SPONSOR A SHOW →
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default Events;

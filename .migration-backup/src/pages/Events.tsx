import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import CuratedEvents from "@/components/CuratedEvents";
import Marquee from "@/components/Marquee";
import { supabase } from "@/integrations/supabase/client";

type EventRow = {
  slug: string; title: string; city: string; venue: string; date: string; status: string;
};

const Events = () => {
  const [all, setAll] = useState<EventRow[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("slug,title,city,venue,date,status").order("sort_order", { ascending: true });
      if (data) setAll(data as EventRow[]);
    })();
  }, []);

  const upcoming = all.filter((e) => e.status === "upcoming");

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
    organizer: {
      "@type": "Organization",
      name: "Cats Can Dance",
      url: "https://catscandance.com",
    },
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
        acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance hosts RSVP-only underground dance music episodes in Bengaluru featuring House, Disco, Jungle, Garage, and Drum & Bass. Events are held at venues including Bar Wild in Indiranagar. All upcoming events are listed at catscandance.com/events." },
      },
      {
        "@type": "Question",
        name: "How do I RSVP to a Cats Can Dance event in Bangalore?",
        acceptedAnswer: { "@type": "Answer", text: "RSVP links for upcoming Cats Can Dance events are at catscandance.com/events. Capacity is limited — RSVP early. Most episodes are free entry with name on the door." },
      },
      {
        "@type": "Question",
        name: "Are Cats Can Dance events free?",
        acceptedAnswer: { "@type": "Answer", text: "Most Cats Can Dance episodes are free entry with RSVP. Capacity is controlled to keep the room right. Check individual event pages for details." },
      },
      {
        "@type": "Question",
        name: "What venues does Cats Can Dance use in Bengaluru?",
        acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance regularly hosts events at Bar Wild in Indiranagar, Bengaluru, and other underground venues across the city. Venues vary by episode." },
      },
    ],
  };
  const jsonLd = itemListLd ? [...eventLd, itemListLd, eventsFaqLd] : [...eventLd, eventsFaqLd];

  return (
    <>
      <SEO
        title="Parties & Curated Dance Events in Bangalore | Cats Can Dance"
        description="Our nights plus a hand-picked feed of the best dance music events in Bangalore this week."
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
          items={["DOORS OPEN LATE", "BRING YOUR PACK", "NO DRESS CODE — MOVE", "SOLD-OUT IS A LOVE LANGUAGE"]}
        />
        <section className="container py-12 md:py-16">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Events" }]} />

          <div className="grid gap-6 max-w-4xl mt-8">
            {all.map((e, i) => {
              const upcomingPalette = [
                { bg: "bg-magenta", text: "text-cream", chip: "bg-acid-yellow text-ink" },
                { bg: "bg-electric-blue", text: "text-cream", chip: "bg-acid-yellow text-ink" },
                { bg: "bg-acid-yellow", text: "text-ink", chip: "bg-magenta text-cream" },
              ];
              const isUpcoming = e.status === "upcoming";
              const upIdx = all.filter((x, j) => j < i && x.status === "upcoming").length;
              const palette = isUpcoming
                ? upcomingPalette[upIdx % upcomingPalette.length]
                : { bg: "bg-cream", text: "text-ink", chip: "bg-ink text-cream" };
              return (
                <Link
                  key={e.slug}
                  to={`/events/${e.slug}`}
                  className={`relative block border-4 border-ink chunk-shadow p-6 md:p-8 hover:-translate-y-1 hover:translate-x-1 transition-transform ${palette.bg} ${palette.text}`}
                >
                  {isUpcoming && (
                    <span className="absolute -top-3 -right-3 rotate-6 bg-ink text-acid-yellow font-display text-xs md:text-sm px-3 py-1 border-4 border-ink">
                      LATE NIGHT ✦
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-3 py-1 border-2 border-ink uppercase ${palette.chip}`}>
                      {isUpcoming ? "UPCOMING · RSVP" : "PAST"}
                    </span>
                    <span className="font-display text-lg">{e.date}</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl mb-2">{e.title.toUpperCase()}</h2>
                  <p className="font-medium opacity-90">{e.city} · {e.venue}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <CuratedEvents />

        {/* Host strip — moved to bottom per request */}
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

export default Events;

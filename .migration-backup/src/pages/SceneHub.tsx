import { Link, Navigate, useParams } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const SITE = "https://catscandance.com";

type Hub = {
  slug: string;
  genre: string;
  title: string;
  hero: React.ReactNode;
  description: string;
  intro: string[];
  venues: { name: string; area: string; note: string }[];
  promoters: string[];
  faq: { q: string; a: string }[];
};

const HUBS: Record<string, Hub> = {
  "bengaluru-techno-events": {
    slug: "bengaluru-techno-events",
    genre: "Techno",
    title: "TECHNO IN BENGALURU.",
    hero: <>TECHNO IN<br/>BENGALURU.</>,
    description:
      "A working guide to techno events in Bengaluru — venues, promoters, and how to actually find the parties that don't show up on aggregator apps.",
    intro: [
      "Bengaluru's techno scene runs on a few rooms, a few crews, and a calendar that moves by Instagram. The good nights are 200-400 cap, the systems are honest, and the door is RSVP-driven.",
      "This page is the working map — the venues that book real techno, the promoters worth following, and the questions people ask us most often.",
    ],
    venues: [
      { name: "Bar Wild", area: "Indiranagar", note: "Listening-bar feel, sharp bookings, the regular Cats Can Dance home." },
      { name: "Warehouse pop-ups (Whitefield / east Bengaluru)", area: "Whitefield", note: "Where the heavier, longer-night techno sets land." },
      { name: "CBD basements", area: "Central Bengaluru", note: "Rotating spaces, tight rooms, often unannounced until 48 hours before." },
    ],
    promoters: [
      "Cats Can Dance (@catscan.dance) — RSVP Episodes, curated lineups",
      "Independent crews from Mumbai and Goa running guest editions in Bengaluru",
    ],
    faq: [
      { q: "Where can I find techno events in Bengaluru?", a: "Most credible Bengaluru techno nights are RSVP-only and shared on Instagram 5-10 days out. Cats Can Dance lists upcoming Episodes at catscandance.com/events; broader listings live at /bengaluru-underground-dance-music." },
      { q: "Are there regular techno nights in Bangalore?", a: "Yes — there's a recurring rhythm of techno nights in Indiranagar, CBD, and east Bengaluru, anchored by independent crews. Most are 200-400 capacity and free with RSVP." },
      { q: "What time do techno parties in Bengaluru run?", a: "Doors usually 9pm, peak between 12am and 2am. Bengaluru's licensing means most nights wrap by 1-2am unless it's a private warehouse event." },
    ],
  },
  "bengaluru-house-parties": {
    slug: "bengaluru-house-parties",
    genre: "House",
    title: "HOUSE IN BENGALURU.",
    hero: <>HOUSE IN<br/>BENGALURU.</>,
    description:
      "House music parties in Bengaluru — where to find them, who's playing, and the venues that actually book deep, soulful, and disco-leaning house.",
    intro: [
      "House in Bengaluru splits two ways: the listening-bar, disco-leaning evenings in Indiranagar and CBD, and the longer, deeper Saturday nights at warehouse pop-ups out east.",
      "If you want soulful, deep, or disco house instead of stadium tech-house, this is the working guide.",
    ],
    venues: [
      { name: "Bar Wild", area: "Indiranagar", note: "Disco, house, and edits in a small room with a real system." },
      { name: "Listening rooms in CBD", area: "Central Bengaluru", note: "Rotating disco/house residencies on Friday evenings." },
      { name: "East Bengaluru warehouse spaces", area: "Whitefield", note: "Longer-format Saturday nights when the lineup hits." },
    ],
    promoters: [
      "Cats Can Dance — house & disco-leaning Episodes, RSVP at /events",
      "Selectors crossing over from the Mumbai disco scene for guest sets",
    ],
    faq: [
      { q: "Where can I dance to house music in Bangalore?", a: "Independent venues in Indiranagar and CBD host the best house nights in Bangalore — RSVP-driven, 200-400 cap, no bottle service. See catscandance.com/events for the curated calendar." },
      { q: "Is there a disco scene in Bengaluru?", a: "Yes — there's a small but real disco and edits scene in Bengaluru, mostly running Friday and Saturday nights at listening bars and pop-ups in Indiranagar and CBD." },
      { q: "Do Cats Can Dance Episodes play house?", a: "Frequently. Many Episodes lean house and disco-edits, with detours into garage, breaks, and dub. Lineups are at catscandance.com/events." },
    ],
  },
};

const SceneHub = () => {
  const { slug = "" } = useParams();
  const hub = HUBS[slug];
  if (!hub) return <Navigate to="/bengaluru-underground-dance-music" replace />;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: hub.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const placeLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${hub.genre} events in Bengaluru`,
    url: `${SITE}/${hub.slug}`,
    description: hub.description,
    about: { "@type": "Place", name: "Bengaluru", address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" } },
  };

  return (
    <>
      <SEO
        title={`${hub.genre} Events in Bengaluru — Venues, Promoters & Guide | Cats Can Dance`}
        description={hub.description}
        path={`/${hub.slug}`}
        jsonLd={[placeLd, faqLd]}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <PageHero
          eyebrow={`${hub.genre.toUpperCase()} · BENGALURU`}
          title={hub.hero}
          bg="bg-electric-blue"
          textColor="text-cream"
          eyebrowColor="text-acid-yellow"
        >
          <p className="text-cream/90 font-medium text-base sm:text-lg max-w-2xl">{hub.description}</p>
        </PageHero>

        <section className="container py-12 md:py-20 max-w-3xl">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bengaluru scene", to: "/bengaluru-underground-dance-music" }, { label: hub.genre }]} />

          <div className="space-y-5 mb-10">
            {hub.intro.map((p, i) => (
              <p key={i} className="text-ink/85 font-medium text-base sm:text-lg leading-relaxed">{p}</p>
            ))}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4">/ VENUES TO KNOW</h2>
          <ul className="grid gap-3 sm:grid-cols-2 mb-10">
            {hub.venues.map((v) => (
              <li key={v.name} className="bg-cream border-4 border-ink chunk-shadow p-4">
                <p className="font-display text-ink text-lg leading-tight">{v.name}</p>
                <p className="font-display text-magenta text-xs mb-2">{v.area}</p>
                <p className="text-ink/80 font-medium text-sm">{v.note}</p>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4">/ PROMOTERS WORTH FOLLOWING</h2>
          <ul className="space-y-2 mb-10">
            {hub.promoters.map((p) => (
              <li key={p} className="bg-acid-yellow border-4 border-ink p-3 font-medium text-ink text-base">{p}</li>
            ))}
          </ul>

          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4">/ FAQ</h2>
          <ul className="space-y-4 mb-10">
            {hub.faq.map((f) => (
              <li key={f.q} className="bg-cream border-4 border-ink chunk-shadow p-5">
                <p className="font-display text-ink text-lg mb-2">{f.q}</p>
                <p className="text-ink/80 font-medium text-sm sm:text-base">{f.a}</p>
              </li>
            ))}
          </ul>

          <aside className="bg-magenta text-cream border-4 border-ink chunk-shadow p-5 sm:p-6">
            <p className="font-display text-acid-yellow text-base sm:text-lg mb-2">/ NEXT</p>
            <p className="font-medium text-cream/95 text-base sm:text-lg mb-4">
              See what's actually on this week and RSVP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/events" className="bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-ink hover:bg-cream">
                UPCOMING EPISODES →
              </Link>
              <Link to="/bengaluru-underground-dance-music" className="bg-cream text-ink font-display px-5 py-2 border-4 border-ink hover:bg-acid-yellow">
                THE FULL SCENE GUIDE
              </Link>
            </div>
          </aside>
        </section>
        <Footer />
      </main>
    </>
  );
};

export default SceneHub;

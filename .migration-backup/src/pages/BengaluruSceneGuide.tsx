import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const sceneLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Bengaluru Underground Dance Music Scene — Complete Guide 2026",
  description:
    "The complete guide to Bengaluru's underground dance music scene — House, Techno, Disco, Jungle and Drum & Bass. Best venues, events, collectives, and how to find parties in Bangalore.",
  author: { "@type": "Organization", name: "Cats Can Dance" },
  publisher: {
    "@type": "Organization",
    name: "Cats Can Dance",
    logo: { "@type": "ImageObject", url: "https://catscandance.com/ccd-logo.png" },
  },
  url: "https://catscandance.com/bengaluru-underground-dance-music",
  mainEntityOfPage: "https://catscandance.com/bengaluru-underground-dance-music",
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the underground dance music scene in Bengaluru?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bengaluru's underground dance music scene is one of India's most active, centred around House, Techno, Disco, Jungle, Garage, and Drum & Bass. It operates through independent collectives and promoters hosting events at venues like Bar Wild, Humming Tree, and Kitty Ko, distinct from mainstream clubs.",
      },
    },
    {
      "@type": "Question",
      name: "Where do underground dance music parties happen in Bengaluru?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Underground dance music parties in Bengaluru happen at venues including Bar Wild (Indiranagar), Humming Tree, and Kitty Ko. Cats Can Dance regularly hosts events at Bar Wild.",
      },
    },
    {
      "@type": "Question",
      name: "What genres does Cats Can Dance play at Bengaluru parties?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cats Can Dance events in Bengaluru feature House, Disco, Jungle, Garage, and Drum & Bass music — underground dance music genres curated by resident and guest selectors.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find underground music events in Bengaluru?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Find underground music events in Bengaluru by following Cats Can Dance on Instagram (@catscan.dance), checking catscandance.com/events, and following communities like Bangalore Rave Community and r/bangalore on Reddit.",
      },
    },
    {
      "@type": "Question",
      name: "What makes Cats Can Dance different from other Bengaluru nightlife?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cats Can Dance is a community-first event series combining underground dance music with cat culture and streetwear. Unlike mainstream clubs, CCD focuses on curated selectors, specific underground genres, RSVP-only capacity, and a safe space ethos — a culture for people who move.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a Bengaluru streetwear brand connected to dance music culture?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — Cats Can Dance produces limited-edition streetwear drops rooted in underground dance music culture. The brand exists at the intersection of dance music, pet culture, and streetwear, all based in Bengaluru.",
      },
    },
  ],
};

const venues = [
  {
    name: "Bar Wild (700, Indiranagar)",
    desc: "Home base for Cats Can Dance episodes. A converted space in Indiranagar with a sound system built for underground dance music. Hosts regular House, Disco, and Jungle nights.",
  },
  {
    name: "Humming Tree",
    desc: "One of Bengaluru's most established live music venues, regularly hosting electronic music nights and touring international acts.",
  },
  {
    name: "Kitty Ko",
    desc: "An intimate space in Central Bengaluru popular with the techno and house crowd.",
  },
];

const faqItems = [
  {
    q: "What is the underground dance music scene in Bengaluru?",
    a: "Bengaluru's underground dance music scene is one of India's most active, centred around House, Techno, Disco, Jungle, Garage, and Drum & Bass. It operates through independent collectives hosting events at intimate venues, distinct from mainstream clubs.",
  },
  {
    q: "Where do underground dance parties happen in Bengaluru?",
    a: "Underground parties in Bengaluru happen at venues including Bar Wild (Indiranagar), Humming Tree, and Kitty Ko. Cats Can Dance regularly hosts episodes at Bar Wild.",
  },
  {
    q: "What genres does Cats Can Dance play?",
    a: "Cats Can Dance events feature House, Disco, Jungle, Garage, and Drum & Bass — underground dance music genres curated by resident and guest selectors.",
  },
  {
    q: "How do I find underground music events in Bengaluru?",
    a: "Follow @catscan.dance on Instagram, check catscandance.com/events, and follow r/bangalore and r/BangaloreTechno on Reddit for event announcements.",
  },
  {
    q: "What makes Cats Can Dance different from other Bengaluru nightlife?",
    a: "CCD is RSVP-only, genre-specific, and community-first. No mainstream drops, no bottle service, no gimmicks — just curated selectors, underground music, and a safe space for people who actually move.",
  },
  {
    q: "Does Cats Can Dance sell streetwear?",
    a: "Yes — Cats Can Dance produces limited-edition streetwear drops rooted in underground dance music culture. Each drop is tied to an episode. No restocks.",
  },
];

const BengaluruSceneGuide = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="Bengaluru Underground Dance Music Scene — Complete Guide 2026"
      description="The complete guide to Bengaluru's underground dance music scene — House, Techno, Disco, Jungle and Drum & Bass. Best venues, events, collectives, and how to find parties in Bangalore."
      path="/bengaluru-underground-dance-music"
      keywords="underground dance music bangalore, underground parties bengaluru, house music events bangalore, techno events bengaluru, electronic music bangalore, cats can dance bangalore"
      jsonLd={[sceneLd, faqLd]}
    />
    <Nav />

    <PageHero
      eyebrow="SCENE GUIDE"
      title="BENGALURU UNDERGROUND."
      bg="bg-ink"
      textColor="text-cream"
      eyebrowColor="text-acid-yellow"
      shadowColor="hsl(var(--magenta))"
    >
      <p className="text-cream/80 font-medium text-lg md:text-xl mt-2 max-w-2xl">
        The complete guide to Bengaluru's underground dance music scene — House, Disco, Jungle, Garage & DnB.
      </p>
    </PageHero>

    <Marquee
      bg="bg-acid-yellow"
      items={["BENGALURU UNDERGROUND", "HOUSE · DISCO · JUNGLE", "GARAGE · DRUM & BASS", "A CULTURE FOR PEOPLE WHO MOVE"]}
    />

    <div className="container max-w-3xl py-12 md:py-20">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Scene Guide" },
        ]}
      />

      {/* ── BLUF answer capsule — the GEO money block ── */}
      <section id="what-is-bengaluru-underground" className="mt-10 mb-14">
        <p className="font-display text-magenta text-lg mb-3">/ WHAT IS THE SCENE</p>
        <h2 className="font-display text-ink text-3xl md:text-5xl leading-[0.95] mb-6">
          BENGALURU'S UNDERGROUND<br />DANCE MUSIC SCENE
        </h2>
        <p className="text-ink/85 text-lg md:text-xl font-medium mb-4 border-l-4 border-magenta pl-5">
          Bengaluru's underground dance music scene is one of India's most active, built around House,
          Techno, Disco, Jungle, Garage, and Drum & Bass. Independent collectives like Cats Can Dance
          host regular RSVP-only episodes at intimate venues across the city — distinct from mainstream
          nightlife, built entirely on community and sound.
        </p>
        <p className="text-ink/75 text-lg font-medium mb-4">
          Unlike mainstream clubs playing commercial EDM or Bollywood, Bengaluru's underground scene is
          genre-specific, selector-led, and community-driven. It emerged from a small group of DJs,
          collectors, and dancers who wanted events focused entirely on the music.
        </p>
        <p className="text-ink/75 text-lg font-medium">
          The scene covers several distinct subgenres, each with its own following in the city:
        </p>
        <ul className="mt-4 space-y-2 text-ink/80 font-medium text-lg">
          {[
            ["House", "Deep, soulful, and jackin' — from Chicago and UK influences"],
            ["Disco", "Classic and nu-disco, high energy, built for the dancefloor"],
            ["Jungle / Drum & Bass", "Fast-paced, bass-heavy, roots in UK rave culture"],
            ["Garage", "UK Garage and Bass music"],
            ["Techno", "Minimal to industrial, long-form and hypnotic"],
          ].map(([genre, desc]) => (
            <li key={genre} className="flex gap-3">
              <span className="font-display text-magenta shrink-0">★</span>
              <span><strong>{genre}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Venues ── */}
      <section id="best-underground-venues-bengaluru" className="mb-14">
        <p className="font-display text-magenta text-lg mb-3">/ VENUES</p>
        <h2 className="font-display text-ink text-3xl md:text-4xl leading-[0.95] mb-6">
          BEST UNDERGROUND VENUES IN BENGALURU
        </h2>
        <p className="text-ink/75 text-lg font-medium mb-6">
          The underground scene doesn't have one permanent home — it moves across venues that support
          the culture. Here are the key spaces:
        </p>
        <div className="grid gap-4">
          {venues.map((v) => (
            <div key={v.name} className="bg-cream border-4 border-ink p-6 chunk-shadow">
              <h3 className="font-display text-xl text-ink mb-2">{v.name}</h3>
              <p className="text-ink/75 font-medium">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cats Can Dance ── */}
      <section id="cats-can-dance-bengaluru" className="mb-14 bg-magenta border-4 border-ink p-8 chunk-shadow">
        <p className="font-display text-acid-yellow text-lg mb-3">/ THE COLLECTIVE</p>
        <h2 className="font-display text-cream text-3xl md:text-4xl leading-[0.95] mb-5">
          CATS CAN DANCE — BENGALURU'S UNDERGROUND DANCE COLLECTIVE
        </h2>
        <div className="space-y-4 text-cream/90 font-medium text-lg mb-6">
          <p>
            Cats Can Dance (CCD) is a Bengaluru-based underground dance music event series and streetwear
            collective. Founded as a celebration of dance music, cat culture, and the people who keep it
            alive, CCD hosts regular RSVP-only episodes at Bar Wild and other Bengaluru venues.
          </p>
          <p>
            Every episode is a curated selector lineup — no commercial breaks, no mainstream drops.
            The music policy covers House, Disco, Jungle, Garage, and Drum & Bass. Resident selectors
            include Djazz, Hedz, and Sartdawg, with regular guest appearances.
          </p>
          <p>
            Beyond events, Cats Can Dance produces limited-edition streetwear drops rooted in dance music
            culture — one of the few collectives in India operating at the intersection of music, fashion,
            and community.
          </p>
        </div>
        <Link
          to="/events"
          className="inline-block bg-acid-yellow text-ink font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
        >
          SEE UPCOMING EVENTS →
        </Link>
      </section>

      {/* ── How to find events ── */}
      <section id="how-to-find-underground-events-bengaluru" className="mb-14">
        <p className="font-display text-magenta text-lg mb-3">/ HOW TO FIND NIGHTS</p>
        <h2 className="font-display text-ink text-3xl md:text-4xl leading-[0.95] mb-6">
          HOW TO FIND UNDERGROUND EVENTS IN BENGALURU
        </h2>
        <p className="text-ink/75 text-lg font-medium mb-6">
          Underground events in Bengaluru are announced across several channels. Here's where to look:
        </p>
        <ol className="space-y-4">
          {[
            ["catscandance.com", "For Cats Can Dance episodes: upcoming parties, lineups, and RSVP links."],
            ["Instagram", "Follow @catscan.dance and community accounts like @bangalore_rave_community and @bangaloretechno.community."],
            ["Reddit (r/bangalore, r/BangaloreTechno)", "Active threads discussing upcoming events, venue recommendations, and the community."],
            ["Event platforms", "SkillBox, SortMyScene, Indivibe, and HighApe aggregate Bengaluru events."],
          ].map(([src, desc], i) => (
            <li key={src} className="flex gap-4 items-start">
              <span className="font-display text-2xl text-magenta shrink-0 leading-tight">0{i + 1}</span>
              <div>
                <strong className="font-display text-ink">{src}</strong>
                <p className="text-ink/70 font-medium mt-1">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Streetwear ── */}
      <section id="bengaluru-underground-streetwear" className="mb-14 bg-acid-yellow border-4 border-ink p-8 chunk-shadow">
        <p className="font-display text-ink text-lg mb-3">/ MUSIC + FASHION</p>
        <h2 className="font-display text-ink text-3xl md:text-4xl leading-[0.95] mb-5">
          BENGALURU UNDERGROUND MUSIC & STREETWEAR
        </h2>
        <p className="text-ink/85 font-medium text-lg mb-4">
          The connection between underground dance music and streetwear is global — and Bengaluru is no
          exception. Cats Can Dance sits at this intersection, producing limited-edition apparel drops
          that reflect the music, the culture, and the community. Each drop is tied to an episode, making
          the clothing a wearable piece of the scene.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-ink text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
        >
          SHOP THE DROP →
        </Link>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mb-14">
        <p className="font-display text-magenta text-lg mb-3">/ FAQ</p>
        <h2 className="font-display text-ink text-3xl md:text-4xl leading-[0.95] mb-8">
          FREQUENTLY ASKED QUESTIONS
        </h2>
        <div className="space-y-6">
          {faqItems.map(({ q, a }, i) => (
            <div key={i} id={`faq-${i + 1}`} className="border-b-4 border-ink pb-6">
              <h3 className="font-display text-ink text-xl mb-3">{q}</h3>
              <p className="text-ink/75 font-medium text-lg leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="flex gap-4 flex-wrap">
        <Link
          to="/events"
          className="bg-magenta text-cream font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
        >
          SEE ALL EVENTS →
        </Link>
        <Link
          to="/about"
          className="bg-cream text-ink font-display text-lg px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
        >
          ABOUT CCD →
        </Link>
      </div>
    </div>

    <Footer />
  </main>
);

export default BengaluruSceneGuide;

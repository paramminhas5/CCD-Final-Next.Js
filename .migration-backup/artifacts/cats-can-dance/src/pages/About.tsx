import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Team from "@/components/Team";
import SectionReveal from "@/components/SectionReveal";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";

const pillars = [
  { label: "NIGHTS", desc: "Underground dance music parties built around sound, design and the room.", bg: "bg-magenta", text: "text-cream" },
  { label: "DROPS", desc: "Limited apparel and goods for humans and pets — wearable culture.", bg: "bg-acid-yellow", text: "text-ink" },
  { label: "COMMUNITY", desc: "A pack of dancers, designers, DJs, photographers and pet people.", bg: "bg-lime", text: "text-ink" },
];

const aboutLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Cats Can Dance",
  url: "https://catscandance.com/about",
  description: "Cats Can Dance is a Bangalore underground crew. Dance music nights, limited drops, and a community built around sound and culture.",
};

const aboutFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Cats Can Dance?",
      acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance (CCD) is a Bengaluru-based underground dance music event series and streetwear collective. We host House, Disco, Jungle, Garage, and Drum & Bass parties across Bengaluru, and produce limited-edition streetwear drops rooted in dance music culture. A culture for people who move." },
    },
    {
      "@type": "Question",
      name: "Where is Cats Can Dance based?",
      acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance is based in Bengaluru, Karnataka, India. Our events are held at venues across the city, most regularly at Bar Wild in Indiranagar." },
    },
    {
      "@type": "Question",
      name: "How do I attend a Cats Can Dance event?",
      acceptedAnswer: { "@type": "Answer", text: "Check catscandance.com/events for upcoming parties and RSVP. Follow @catscan.dance on Instagram for announcements. Most events are RSVP-only with controlled capacity — free entry." },
    },
    {
      "@type": "Question",
      name: "What is the Cats Can Dance Episode format?",
      acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance Episodes are RSVP-only underground dance music parties with curated lineups, small rooms, no flyer marketing. A safe space with good music and immaculate vibes." },
    },
    {
      "@type": "Question",
      name: "Who are the DJs at Cats Can Dance events?",
      acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance resident selectors include Djazz, Hedz, and Sartdawg, alongside rotating guest DJs playing House, Disco, Jungle, Garage, and Drum & Bass in Bengaluru." },
    },
  ],
};

const About = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="About Cats Can Dance | Bangalore's Underground Crew"
      description="The mission, the people and the pack behind Cats Can Dance — Bangalore's underground dance music and culture crew."
      path="/about"
      jsonLd={[aboutLd, aboutFaqLd]}
    />
    <Nav />
    <PageHero
      eyebrow="ABOUT"
      title="MUSIC. FASHION. PETS."
      bg="bg-magenta"
      textColor="text-cream"
      eyebrowColor="text-acid-yellow"
      shadowColor="hsl(var(--ink))"
    >
      <p className="text-cream/90 font-display text-2xl md:text-3xl mt-2">A CULTURE BRAND FROM BANGALORE.</p>
    </PageHero>

    {/* Mission */}
    <section className="bg-cream border-b-4 border-ink py-12 md:py-20 bg-grain">
      <div className="container max-w-4xl">
        <p className="font-display text-magenta text-lg md:text-xl mb-3">/ MISSION</p>
        <h2 className="font-display text-ink text-3xl md:text-5xl leading-[0.95] mb-6">
          A HOME FOR PEOPLE<br/>WHO MOVE.
        </h2>
        <div className="space-y-4 text-ink/85 text-lg md:text-xl font-medium">
          <p>
            Cats Can Dance started in Bangalore as a small crew obsessed with dance music, design and the
            feeling of a great room. We're building a culture brand for the people who actually show up —
            dancers, DJs, designers, pet people and the kind of crowd that travels for a night.
          </p>
          <p>
            We make nights worth remembering, drops worth keeping and a community worth being part of.
            That's it. That's the brief.
          </p>
        </div>
      </div>
    </section>

    {/* What we do — short strip */}
    <section className="bg-ink border-b-4 border-ink py-12 md:py-20">
      <div className="container">
        <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ WHAT WE DO</p>
        <h2 className="font-display text-cream text-3xl md:text-5xl leading-[0.95] mb-8 drop-shadow-[5px_5px_0_hsl(var(--magenta))]">
          THREE THINGS.<br/>DONE PROPERLY.
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div key={p.label} className={`${p.bg} ${p.text} border-4 border-ink chunk-shadow p-6`}>
              <p className="font-display text-3xl md:text-4xl mb-2">{p.label}</p>
              <p className="font-medium leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <Marquee bg="bg-acid-yellow" items={["MEET THE PACK", "JOIN THE PACK", "WE'RE HIRING", "RUN BY HUMANS WHO MOVE"]} />
    <SectionReveal><Team /></SectionReveal>
    <Footer />
  </main>
);

export default About;

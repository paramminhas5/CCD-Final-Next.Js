import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";
import PartnerContactDialog from "@/components/PartnerContactDialog";

const bullets = [
  "Dedicated, higher-value crowd",
  "Better spend per head",
  "Longer late-night retention",
  "Stronger repeat footfall",
  "Premium content for venue marketing",
  "Distinct identity in a crowded market",
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What kind of venues does Cats Can Dance partner with in Bangalore?", acceptedAnswer: { "@type": "Answer", text: "We partner with intimate 150–500 capacity venues in Bangalore that care about sound and room feel — listening bars, warehouse spaces, and independent rooftops in Indiranagar, CBD, Koramangala and Whitefield." } },
    { "@type": "Question", name: "How are Cats Can Dance Episodes different from a regular night?", acceptedAnswer: { "@type": "Answer", text: "Episodes are RSVP-only, capped, curated lineups. The crowd is here for the music, which means longer dwell time, better F&B spend, and content the venue can use for months after." } },
    { "@type": "Question", name: "Does the venue handle bar and entry, or does CCD?", acceptedAnswer: { "@type": "Answer", text: "Venues run their own bar and entry. CCD brings the crowd, the lineup, the production direction, and the post-event content. Revenue split and minimums are agreed per Episode." } },
    { "@type": "Question", name: "How do I propose my venue?", acceptedAnswer: { "@type": "Answer", text: "Use the Partner With Us form on this page or email hello@catscandance.com with venue capacity, sound system details, and a few photos." } },
  ],
};

const ForVenues = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="Venue Partners — Cats Can Dance | Bangalore, India"
      description="Become a Venue Partner with Cats Can Dance in Bangalore. We bring the right crowd, stronger spend and recurring moments people come back for."
      path="/for-venues"
      jsonLd={[faqLd]}
    />
    <Nav />
    <PageHero
      eyebrow="VENUE PARTNERS"
      title={<>LET'S BUILD<br/>MEMORIES<br/>TOGETHER.</>}
      bg="bg-lime"
      textColor="text-ink"
      eyebrowColor="text-magenta"
      shadow={false}
    >
      <p className="font-display text-ink/80 text-xl sm:text-2xl md:text-3xl max-w-2xl">
        Creating moments people come back for, again and again…
      </p>
    </PageHero>
    <Marquee bg="bg-acid-yellow" />
    <section className="bg-cream border-b-4 border-ink py-16 md:py-24 lg:py-32 bg-grain">
      <div className="container grid md:grid-cols-2 gap-10 md:gap-12">
        <div>
          <h2 className="font-display text-ink leading-[0.95] mb-6 text-3xl sm:text-4xl md:text-6xl break-words">
            VENUE PARTNERSHIPS THAT GROW OVER TIME.
          </h2>
          <p className="text-ink/80 text-base sm:text-lg md:text-xl font-medium mb-6">
            We partner with venues to bring the right crowd, stronger spend and recurring moments that grow over time.
          </p>
          <PartnerContactDialog
            kind="venues"
            trigger={
              <button
                type="button"
                className="inline-block bg-magenta text-cream font-display text-lg sm:text-xl px-5 sm:px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                PARTNER WITH US →
              </button>
            }
          />
        </div>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={b} className="bg-lime border-4 border-ink chunk-shadow p-3 sm:p-4 font-display text-base sm:text-lg md:text-xl text-ink flex gap-3">
              <span className="text-magenta">0{i + 1}</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
    <Footer />
  </main>
);

export default ForVenues;

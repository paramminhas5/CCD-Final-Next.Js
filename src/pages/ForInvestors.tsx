import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import SectionReveal from "@/components/SectionReveal";
import What from "@/components/What";
import Why from "@/components/Why";
import WhyNow from "@/components/WhyNow";
import SEO from "@/components/SEO";
import PartnerContactDialog from "@/components/PartnerContactDialog";

const bullets = [
  "Low initial capex vs traditional consumer brands",
  "Audience compounds monthly",
  "Strong cross-sell between revenue streams",
  "Community-led distribution lowers CAC",
  "Scales city-by-city, category-by-category",
];

const ForInvestors = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="For Investors — Cats Can Dance | Bangalore, India"
      description="Cats Can Dance is a Bangalore-based culture company — events, drops, playlists, community. A multi-revenue ecosystem scaling across India."
      path="/for-investors"
    />
    <Nav />
    <PageHero
      eyebrow="FOR INVESTORS"
      title={<>AN ECOSYSTEM,<br/>NOT AN EVENT<br/>BUSINESS.</>}
      bg="bg-electric-blue"
      textColor="text-cream"
      eyebrowColor="text-acid-yellow"
    />
    <Marquee bg="bg-acid-yellow" items={["WHY THIS", "WHY NOW", "THREE WORLDS", "ONE ECOSYSTEM"]} />
    <SectionReveal><What /></SectionReveal>
    <Marquee bg="bg-lime" items={["FOUR ENGINES", "ONE FLYWHEEL", "BUILT TO COMPOUND"]} />
    <SectionReveal><Why /></SectionReveal>
    <Marquee bg="bg-acid-yellow" reverse items={["THE PERFECT MOMENT", "CULTURE IS COMMERCE", "INDIA IS READY"]} />
    <WhyNow />
    <Marquee bg="bg-lime" items={["REQUEST THE DECK", "LET'S TALK", "INVEST@CATSCANDANCE.COM"]} />
    <section className="bg-ink text-cream border-b-4 border-ink py-24 md:py-32">
      <div className="container grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-4xl md:text-6xl text-cream leading-[0.95] mb-6">
            FOUR REVENUE<br/>STREAMS.<br/>ONE FLYWHEEL.
          </h2>
          <p className="text-cream/80 text-lg md:text-xl font-medium mb-6">
            Tickets, drops, membership and brand partnerships — each engine feeds the next. Built for category-defining returns.
          </p>
          <PartnerContactDialog
            kind="investors"
            trigger={
              <button
                type="button"
                className="inline-block bg-acid-yellow text-ink font-display text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                REQUEST DECK →
              </button>
            }
          />
        </div>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={b} className="bg-cream border-4 border-cream p-4 font-display text-lg md:text-xl text-ink flex gap-3">
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

export default ForInvestors;

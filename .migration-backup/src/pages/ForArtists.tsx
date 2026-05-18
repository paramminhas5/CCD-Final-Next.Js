import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";
import PartnerContactDialog from "@/components/PartnerContactDialog";

const bullets = [
  "Curated crowd that cares about music",
  "Content assets: full sets, clips, photos",
  "Stronger personal brand association",
  "Collabs, merch, community building",
  "Repeat bookings and ecosystem value",
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How do DJs get booked at Cats Can Dance?", acceptedAnswer: { "@type": "Answer", text: "Send a 30-60 minute mix link, your Instagram, and one line on what you'd play in our room to hello@catscandance.com. We listen to everything; we book per Episode based on lineup balance." } },
    { "@type": "Question", name: "What genres does CCD book in Bangalore?", acceptedAnswer: { "@type": "Answer", text: "House, disco, UK garage, breaks, drum & bass, jungle, and dub techno. We don't book commercial EDM or top-40 sets." } },
    { "@type": "Question", name: "Do you book artists from outside Bangalore?", acceptedAnswer: { "@type": "Answer", text: "Yes. We book Indian and international artists for special editions. Travel and accommodation are negotiated per booking." } },
    { "@type": "Question", name: "What do you provide besides the gig?", acceptedAnswer: { "@type": "Answer", text: "Full set recording, photo and video assets you can use, soundcheck time, and a curated room of 200-400 people who listen. Plus a feature on /playlists and our newsletter." } },
  ],
};

const ForArtists = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="For Artists — Cats Can Dance | Bangalore, India"
      description="Play Cats Can Dance in Bangalore. A platform, not just a set time — curated crowd, premium content, real audience growth for electronic artists in India."
      path="/for-artists"
      jsonLd={[faqLd]}
    />
    <Nav />
    <PageHero
      eyebrow="FOR ARTISTS"
      title={<>A PLATFORM,<br/>NOT JUST<br/>A SET TIME.</>}
      bg="bg-orange"
      textColor="text-ink"
      eyebrowColor="text-cream"
      shadow={false}
    />
    <Marquee bg="bg-magenta" />
    <section className="bg-cream border-b-4 border-ink py-24 md:py-32 bg-grain">
      <div className="container grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-4xl md:text-6xl text-ink leading-[0.95] mb-6">
            BUILD AN<br/>AUDIENCE,<br/>NOT JUST A NIGHT.
          </h2>
          <p className="text-ink/80 text-lg md:text-xl font-medium mb-6">
            Most gigs are transactional. CCD turns each set into a content drop, a community moment and people want to experience again.
          </p>
          <PartnerContactDialog
            kind="artists"
            trigger={
              <button
                type="button"
                className="inline-block bg-magenta text-cream font-display text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                PLAY WITH US →
              </button>
            }
          />
        </div>
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={b} className="bg-orange border-4 border-ink chunk-shadow p-4 font-display text-lg md:text-xl text-ink flex gap-3">
              <span className="text-cream">0{i + 1}</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
    <Footer />
  </main>
);

export default ForArtists;

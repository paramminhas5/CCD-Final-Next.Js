import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import PartnerContactDialog from "@/components/PartnerContactDialog";
import ccdLogo from "@/assets/ccd-logo.png";

const SHORT_BIO_50 =
  "Cats Can Dance — Bangalore party brand & streetwear label.";

const SHORT_BIO_150 =
  "Cats Can Dance is a Bangalore, India brand running underground dance music Episodes and dropping limited streetwear & music collectibles tied to each night.";

const LONG_BIO_500 =
  "Cats Can Dance (CCD) is a Bangalore, India independent brand operating across two arms: an event organiser producing the best underground dance music parties and electronic events in Bangalore and across India under an RSVP-only Episode format, and a streetwear label dropping limited apparel and music collectibles tied to each Episode. Founded in 2025, the brand has built a cult following through small-room curation, no-flyer marketing, and limited heavyweight cotton drops screen-printed in Bangalore. Press contact: hello@catscandance.com.";

const Press = () => {
  const pressLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Cats Can Dance — Press Kit",
    url: "https://catscandance.com/press",
    description:
      "Press kit for Cats Can Dance — Bangalore underground party organiser and streetwear label. Brand bios, logos, photos, contact.",
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text);

  return (
    <>
      <SEO
        title="Press Kit — Cats Can Dance | Bangalore Party & Streetwear Brand"
        description="Cats Can Dance press kit — bios, logos, photos and contact. For media, editors and journalists covering Bangalore's underground scene and India's streetwear drops."
        path="/press"
        jsonLd={pressLd}
      />
      <main className="bg-cream text-ink min-h-screen">
        <Nav />
        <PageHero eyebrow="PRESS" title="PRESS KIT." bg="bg-ink" eyebrowColor="text-acid-yellow">
          <p className="font-display text-cream text-2xl mt-4">
            For journalists, editors, podcasters and curators covering Cats Can Dance.
          </p>
        </PageHero>

        <section className="container py-16 max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Press" }]} />

          <h2 className="font-display text-3xl mb-4 mt-10">/ BRAND BIOS</h2>
          <p className="text-ink/70 mb-6">Three lengths — copy whichever you need.</p>

          <div className="space-y-4">
            {[
              { label: "50-character version", text: SHORT_BIO_50 },
              { label: "150-character version", text: SHORT_BIO_150 },
              { label: "500-character version", text: LONG_BIO_500 },
            ].map((b) => (
              <div key={b.label} className="bg-cream border-4 border-ink chunk-shadow p-5">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <p className="font-display text-magenta text-sm">/ {b.label}</p>
                  <button
                    onClick={() => copy(b.text)}
                    className="bg-ink text-cream font-display text-xs px-3 py-1 hover:bg-magenta transition-colors"
                  >
                    COPY
                  </button>
                </div>
                <p className="text-ink/85 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl mb-4 mt-12">/ LOGOS</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-cream border-4 border-ink chunk-shadow p-8 text-center">
              <img src={ccdLogo} alt="Cats Can Dance logo on cream background" className="w-32 mx-auto mb-4" />
              <a
                href={ccdLogo}
                download="cats-can-dance-logo.png"
                className="inline-block bg-ink text-cream font-display px-4 py-2 hover:bg-magenta transition-colors"
              >
                DOWNLOAD PNG
              </a>
            </div>
            <div className="bg-ink border-4 border-ink chunk-shadow p-8 text-center">
              <img
                src={ccdLogo}
                alt="Cats Can Dance logo on dark background"
                style={{ filter: "invert(1) brightness(1.2)" }}
                className="w-32 mx-auto mb-4"
              />
              <a
                href={ccdLogo}
                download="cats-can-dance-logo-dark.png"
                className="inline-block bg-acid-yellow text-ink font-display px-4 py-2 hover:bg-magenta hover:text-cream transition-colors"
              >
                DOWNLOAD PNG
              </a>
            </div>
          </div>

          <h2 className="font-display text-3xl mb-4 mt-12">/ KEY FACTS</h2>
          <div className="bg-cream border-4 border-ink chunk-shadow p-6 grid sm:grid-cols-2 gap-4 text-ink/85">
            <div><span className="font-display text-magenta">Name:</span> Cats Can Dance (CCD)</div>
            <div><span className="font-display text-magenta">Founded:</span> 2025</div>
            <div><span className="font-display text-magenta">HQ:</span> Bangalore, Karnataka, India</div>
            <div><span className="font-display text-magenta">Format:</span> RSVP-only Episodes</div>
            <div><span className="font-display text-magenta">Drops:</span> Limited streetwear & collectibles</div>
            <div><span className="font-display text-magenta">Web:</span> catscandance.com</div>
          </div>

          <h2 className="font-display text-3xl mb-4 mt-12">/ PRESS CONTACT</h2>
          <PartnerContactDialog
            kind="press"
            trigger={
              <button
                type="button"
                className="inline-block bg-magenta text-cream font-display text-xl px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                START A PRESS ENQUIRY →
              </button>
            }
          />
          <p className="text-ink/60 text-sm mt-3">
            Or email us directly:{" "}
            <a href="mailto:hello@catscandance.com?subject=Press%20enquiry" className="text-magenta underline decoration-2 underline-offset-2 hover:text-ink">
              hello@catscandance.com
            </a>
          </p>
        </section>
        <Footer />
      </main>
    </>
  );
};

export default Press;

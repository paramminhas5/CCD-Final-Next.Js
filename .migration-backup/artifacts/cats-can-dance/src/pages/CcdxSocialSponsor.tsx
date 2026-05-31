import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";
import PartnerContactDialog from "@/components/PartnerContactDialog";
import { Link } from "@/lib/compat-router";

// ── Sponsor tier data ─────────────────────────────────────────────────────────
const TIERS = [
  {
    slug: "series-partner",
    name: "SERIES PARTNER",
    icon: "🐾",
    scope: "All 3 shows + Grand Finale",
    color: "bg-electric-blue text-cream",
    chipColor: "bg-acid-yellow text-ink",
    price: "Full series",
    headline: "Be the name everyone remembers",
    deliverables: [
      "Headline logo on all event materials — posters, socials, stage",
      "Dedicated activation booth at all 3 shows + finale",
      "Stage naming rights at grand format show",
      "Co-branded content package (photo + video) from every show",
      "3 dedicated social posts + stories across CCD channels",
      "Brand mention in every RSVP confirmation email",
      "Logo on CCD website for the full season",
      "Option to co-brand the pet zone",
      "2 VIP + early access passes per show",
    ],
    cta: "Best fit for: pet brands, lifestyle brands, beverages, outdoor brands wanting max reach",
  },
  {
    slug: "show-sponsor",
    name: "SHOW SPONSOR",
    icon: "✦",
    scope: "One show of your choice",
    color: "bg-magenta text-cream",
    chipColor: "bg-cream text-ink",
    price: "Per show",
    headline: "Own a single night end to end",
    deliverables: [
      "Headline logo at your chosen show",
      "Dedicated activation booth",
      "Co-branded content package from that show",
      "1 dedicated social post + stories",
      "Brand mention in that show's RSVP emails",
      "Logo on event page for the duration",
      "2 passes to the show",
    ],
    cta: "Best fit for: local brands, product launches, grooming & nutrition brands",
  },
  {
    slug: "community-supporter",
    name: "COMMUNITY SUPPORTER",
    icon: "🌿",
    scope: "All shows, light touch",
    color: "bg-lime text-ink",
    chipColor: "bg-ink text-lime",
    price: "Entry level",
    headline: "Show up everywhere, simply",
    deliverables: [
      "Logo across all event materials (below fold)",
      "Social tag in one round-up post per show",
      "Mention in event comms and on the website",
      "2 passes split across the season",
    ],
    cta: "Best fit for: indie pet brands, local businesses, NGOs, community partners",
  },
];

// ── Who should sponsor ────────────────────────────────────────────────────────
const WHO = [
  { icon: "🐾", label: "Pet food & nutrition brands" },
  { icon: "✂️", label: "Grooming & wellness brands" },
  { icon: "👗", label: "Pet accessories & fashion" },
  { icon: "🎧", label: "Audio & lifestyle brands" },
  { icon: "🍺", label: "Beverages & F&B brands" },
  { icon: "📸", label: "Photo & creative services" },
  { icon: "🏕️", label: "Outdoor & adventure brands" },
  { icon: "💊", label: "Pet health & supplements" },
];

// ── Series shows data ─────────────────────────────────────────────────────────
const SHOWS = [
  { num: "01", name: "CCDXSOCIAL 01", date: "Sun, 29 Jun 2026", tagline: "BROAD · WELCOMING · FIRST IMPRESSION", bg: "bg-electric-blue", text: "text-cream", slug: "ccdxsocial-01" },
  { num: "02", name: "CCDXSOCIAL 02", date: "Sun, 27 Jul 2026", tagline: "STYLE · FASHION · MIDSUMMER ENERGY",   bg: "bg-magenta",       text: "text-cream", slug: "ccdxsocial-02" },
  { num: "03", name: "CCDXSOCIAL 03", date: "Sun, 30 Aug 2026", tagline: "AGILITY · FINALE PREVIEW · ONE MORE",  bg: "bg-ink",           text: "text-cream", slug: "ccdxsocial-03" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
const CcdxSocialSponsor = () => (
  <main className="bg-background text-foreground">
    <SEO
      title="Sponsor a Show — CCDxSocial | Cats Can Dance"
      description="Sponsor the CCDxSocial series — 3 shows end of June 2026 + grand format finale. Animal lovers + electronic music fans. Tiers from single-show to full series."
      path="/ccdxsocial/sponsor"
    />
    <Nav />

    <PageHero
      eyebrow="SPONSOR THE SERIES"
      title={<>BE PART OF<br />SOMETHING<br />DIFFERENT.</>}
      bg="bg-electric-blue"
      textColor="text-cream"
      eyebrowColor="text-acid-yellow"
    >
      <p className="text-cream/80 font-medium text-xl max-w-2xl mt-4">
        3 shows + 1 grand format show. End of June 2026. Animal lovers and electronic music fans —
        together. Own a show, own the series, or show up everywhere.
      </p>
      <div className="flex flex-wrap gap-3 mt-6">
        {["200 pax per show", "2,000+ at finale", "Outdoor pet zone", "Startdawg · Merman + more", "Jun–Oct 2026"].map((f) => (
          <span key={f} className="bg-white/10 border border-white/20 text-cream font-display text-xs px-3 py-1.5">{f}</span>
        ))}
      </div>
    </PageHero>

    <Marquee bg="bg-acid-yellow" items={["CCDXSOCIAL 01", "CCDXSOCIAL 02", "CCDXSOCIAL 03", "MEGA", "JUN–OCT 2026", "SPONSOR A SHOW", "SPONSOR THE SERIES", "ANIMAL LOVERS + DANCE MUSIC"]} />


    {/* ── The opportunity ── */}
    <section className="bg-cream border-b-4 border-ink py-16 md:py-24 bg-grain">
      <div className="container grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <p className="font-display text-magenta text-xl mb-4">/ THE OPPORTUNITY</p>
          <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-6">
            A CROWD THAT<br />ACTUALLY CARES.
          </h2>
          <p className="text-ink/80 font-medium text-lg mb-4">
            The CCDxSocial series brings together two of the most passionate communities in Bangalore:
            animal lovers and electronic music fans. These aren't passive attendees — they're here for
            something specific, and they spend money on the things they love.
          </p>
          <p className="text-ink/70 font-medium">
            Outdoor pet zone from 4PM with activities, vendor market, and a full DJ lineup. 
            Approximately 200 people per show, 2,000+ at the grand finale. 
            Your brand is not a banner — it's part of the experience.
          </p>        </div>
        <div className="space-y-4">
          {[
            { label: "Per show capacity",  value: "~200 pax",       bg: "bg-acid-yellow" },
            { label: "Grand finale",       value: "2,000+ pax",     bg: "bg-magenta text-cream" },
            { label: "Series total reach", value: "3,000+ across 4 events", bg: "bg-electric-blue text-cream" },
            { label: "Audience profile",   value: "Urban 24–45, pet parents + electronic music fans", bg: "bg-lime" },
            { label: "Content output",     value: "Photo + video from every show, shared with sponsors", bg: "bg-cream border-4 border-ink" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border-4 border-ink chunk-shadow p-4 flex items-center justify-between gap-4`}>
              <span className="font-display text-sm uppercase opacity-70">{s.label}</span>
              <span className="font-display text-base md:text-xl text-right">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── The shows ── */}
    <section className="bg-ink border-b-4 border-ink py-16 md:py-24">
      <div className="container">
        <p className="font-display text-acid-yellow text-xl mb-4">/ THE SERIES</p>
        <h2 className="font-display text-cream text-4xl md:text-6xl leading-[0.9] mb-10">
          THREE SHOWS.<br />ONE GRAND FINALE.
        </h2>        <div className="grid md:grid-cols-3 gap-0 border-4 border-ink overflow-hidden mb-4">
          {SHOWS.map((s) => (
            <div key={s.num} className={`${s.bg} ${s.text} border-r-4 border-ink last:border-r-0 p-6`}>
              <p className="font-display text-xs opacity-60 mb-2">SHOW {s.num}</p>
              <h3 className="font-display text-3xl md:text-4xl mb-2 leading-none">{s.name}</h3>
              <p className="font-display text-xs opacity-60 tracking-widest mb-3">{s.tagline}</p>
              <p className="font-display text-sm opacity-80">{s.date}</p>
              <p className="font-display text-xs opacity-50 mt-1">~200 pax · 4PM–close</p>
            </div>
          ))}
        </div>
        <div className="bg-acid-yellow border-4 border-ink chunk-shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-block bg-magenta text-cream font-display text-xs px-3 py-1 border-2 border-ink mb-3">SEASON FINALE · DATE TBA</span>
          <h3 className="font-display text-ink text-4xl md:text-5xl leading-[0.9] mb-2">MEGA — GRAND FORMAT SHOW</h3>
            <p className="text-ink/70 font-medium max-w-lg">Full outdoor stage. 2,000+ people. Pet runway. Agility finals. Complete DJ lineup TBA. The biggest thing we've ever done — and the best chance for a sponsor to make a mark.</p>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-display text-ink text-4xl mb-1">2,000+</p>
            <p className="font-display text-ink/60 text-xs uppercase">Expected attendance</p>
          </div>
        </div>
      </div>
    </section>


    {/* ── Sponsor tiers ── */}
    <section className="bg-cream border-b-4 border-ink py-16 md:py-24">
      <div className="container">
        <p className="font-display text-magenta text-xl mb-4">/ SPONSOR TIERS</p>
        <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-4">
          SUPPORT A SHOW.<br />OR THE WHOLE THING.
        </h2>
        <p className="text-ink/70 font-medium text-lg max-w-2xl mb-10">
          Pick a single show or back the whole series. Every tier includes real presence — 
          not a logo in a corner. We build the activation with you.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.slug} className={`${tier.color} border-4 border-ink chunk-shadow-lg flex flex-col`}>
              <div className="p-6 md:p-7 border-b-4 border-ink">
                <div className="text-3xl mb-3">{tier.icon}</div>
                <span className={`inline-block ${tier.chipColor} font-display text-xs px-2 py-1 border-2 border-ink mb-3`}>{tier.scope}</span>
                <h3 className="font-display text-3xl md:text-4xl leading-none mb-2">{tier.name}</h3>
                <p className="font-medium opacity-80 text-sm">{tier.headline}</p>
              </div>
              <div className="p-6 md:p-7 flex-1 flex flex-col">
                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm font-medium opacity-90">
                      <span className="mt-1 shrink-0 opacity-60">★</span>
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="text-xs opacity-60 font-medium mb-4">{tier.cta}</p>
                <PartnerContactDialog
                  kind="sponsors"
                  defaultReason={`${tier.name} — ${tier.scope}`}
                  defaultMessage={`Hi, I'm interested in the ${tier.name} sponsorship for the CCDxSocial series. Please send me more details.`}
                  trigger={
                    <button type="button" className="w-full bg-ink text-cream font-display text-base px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors">
                      ENQUIRE NOW →
                    </button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Who should sponsor ── */}
    <section className="bg-acid-yellow border-b-4 border-ink py-16 md:py-20">
      <div className="container">
        <p className="font-display text-ink/60 text-xl mb-4">/ WHO SHOULD SPONSOR</p>
        <h2 className="font-display text-ink text-4xl md:text-5xl leading-[0.9] mb-10">
          YOUR BRAND BELONGS HERE<br />IF YOU CARE ABOUT THIS.
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {WHO.map((w) => (
            <div key={w.label} className="bg-cream border-4 border-ink chunk-shadow p-4 flex flex-col items-center text-center gap-2">
              <span className="text-3xl">{w.icon}</span>
              <span className="font-display text-ink text-sm leading-tight">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── What you get ── */}
    <Marquee bg="bg-lime" items={["STAGE PRESENCE", "CO-BRANDED CONTENT", "EMAIL REACH", "SOCIAL POSTS", "ON-SITE ACTIVATION", "BRANDED EXPERIENCE"]} />

    <section className="bg-cream border-b-4 border-ink py-16 md:py-24 bg-grain">
      <div className="container grid md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <p className="font-display text-magenta text-xl mb-4">/ WHAT YOU GET</p>
          <h2 className="font-display text-ink text-4xl md:text-5xl leading-[0.9] mb-6">
            MORE THAN A LOGO.
          </h2>
          <p className="text-ink/80 font-medium text-lg">
            Every sponsor at CCDxSocial is integrated into the experience — not pasted on top of it. 
            We build the activation with you so it actually makes sense in the room.
          </p>
        </div>
        <ul className="space-y-3">
          {[
            ["🎪", "On-site activation space", "Your own area in the outdoor pet zone or event floor"],
            ["📸", "Content assets", "Professional photo + video from every show you sponsor, yours to use"],
            ["📣", "Social reach", "CCD Instagram, email newsletter, event pages — targeted pet + music fans"],
            ["🤝", "Co-branding", "Your brand alongside CCD on all materials for your shows"],
            ["🎟️", "Guest access", "Passes for your team to attend and experience the events"],
            ["📊", "Post-event report", "Attendance, content delivery, social stats — sent within a week of each show"],
          ].map(([icon, title, desc]) => (
            <li key={title} className="bg-cream border-4 border-ink chunk-shadow p-4 flex gap-3">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-display text-ink text-base">{title}</p>
                <p className="text-ink/60 text-sm font-medium">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="bg-magenta border-b-4 border-ink py-16 md:py-24">
      <div className="container text-center">
        <p className="font-display text-acid-yellow text-xl mb-4">/ LET'S TALK</p>
        <h2 className="font-display text-cream text-5xl md:text-7xl leading-[0.85] mb-6 drop-shadow-[6px_6px_0_hsl(var(--ink))]">
          READY TO<br />SPONSOR?
        </h2>
        <p className="text-cream/80 font-medium text-lg max-w-xl mx-auto mb-10">
          Fill in the form and we'll get back to you within 24 hours with the full sponsorship pack.
          All tiers are negotiable — we'd rather build something that works for both sides.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <PartnerContactDialog
            kind="sponsors"
            defaultReason="Sponsorship enquiry — CCDxSocial"
            trigger={
              <button type="button" className="bg-acid-yellow text-ink font-display text-2xl px-10 py-5 border-4 border-ink chunk-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                GET THE SPONSOR PACK →
              </button>
            }
          />
          <a href="mailto:hello@catscandance.com?subject=CCDxSocial%20Sponsorship" className="bg-transparent text-cream font-display text-lg px-8 py-4 border-4 border-cream hover:bg-ink transition-colors">
            EMAIL US DIRECTLY
          </a>
        </div>
        <p className="mt-8 text-cream/60 font-display text-sm">
          hello@catscandance.com · @catscan.dance
        </p>
      </div>
    </section>

    {/* ── Link back ── */}
    <section className="bg-cream border-b-4 border-ink py-10">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display text-ink text-lg">Want to see the full partnership proposal?</p>
        <div className="flex gap-3">
          <a href="/ccdxsocial" className="bg-ink text-cream font-display text-sm px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-transform">VIEW PROPOSAL →</a>
          <Link to="/events" className="bg-cream text-ink font-display text-sm px-5 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors">SEE ALL EVENTS →</Link>
        </div>
      </div>
    </section>

    <Footer />
  </main>
);

export default CcdxSocialSponsor;

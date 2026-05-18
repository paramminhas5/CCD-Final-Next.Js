import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import catStreet from "@/assets/cat-streetwear.png";

type Audience = {
  key: string;
  label: string;
  headline: string;
  pitch: string;
  bullets: string[];
  bg: string;
  accent: string;
};

const audiences: Audience[] = [
  {
    key: "brands",
    label: "BRAND PARTNERS",
    headline: "Reach the audience ads can't.",
    pitch: "CCD creates earned attention and authentic brand relevance — culture and repetition, not interruption.",
    bullets: [
      "High-intent, affluent, trend-setting audience",
      "Real-world experiences + digital amplification",
      "Product placement, sampling, themed activations",
      "Native-feeling social content",
      "Association with a fresh lifestyle brand",
    ],
    bg: "bg-acid-yellow",
    accent: "text-magenta",
  },
  {
    key: "venues",
    label: "VENUES",
    headline: "Turn your space into a destination.",
    pitch: "CCD transforms venues from places people visit into places people plan around.",
    bullets: [
      "Dedicated, higher-value crowd",
      "Better spend per head",
      "Longer late-night retention",
      "Stronger repeat footfall",
      "Premium content for venue marketing",
      "Distinct identity in a crowded market",
    ],
    bg: "bg-lime",
    accent: "text-magenta",
  },
  {
    key: "artists",
    label: "ARTISTS",
    headline: "A platform, not just a set time.",
    pitch: "Most gigs are transactional. CCD helps artists compound — audience, identity, visibility.",
    bullets: [
      "Curated crowd that cares about music",
      "Content assets: full sets, clips, photos",
      "Stronger personal brand association",
      "Collabs, merch, community building",
      "Repeat bookings and ecosystem value",
    ],
    bg: "bg-orange",
    accent: "text-ink",
  },
  {
    key: "investors",
    label: "INVESTORS",
    headline: "An ecosystem, not an event business.",
    pitch: "A multi-revenue culture company with expanding moats — monetized across many engagement points.",
    bullets: [
      "Low initial capex vs traditional consumer brands",
      "Audience compounds monthly",
      "Strong cross-sell between revenue streams",
      "Community-led distribution lowers CAC",
      "Scales city-by-city, category-by-category",
    ],
    bg: "bg-electric-blue",
    accent: "text-acid-yellow",
  },
];

const Audiences = () => {
  const [active, setActive] = useState(audiences[0].key);
  const a = audiences.find((x) => x.key === active)!;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const blobX = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const blobY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={ref} id="audiences" className="relative bg-lime border-b-4 border-ink py-24 md:py-32 overflow-hidden">
      <motion.div
        style={{ x: blobX, y: blobY }}
        className="absolute -left-32 top-1/3 w-96 h-96 rounded-full bg-magenta/30 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div className="container">
        <p className="font-display text-magenta text-2xl md:text-3xl mb-4">/ WHO IT'S FOR</p>
        <h2 className="font-display text-5xl md:text-8xl text-ink leading-[0.9] max-w-5xl">
          WHAT'S IN IT<br/>FOR YOU?
        </h2>

        <div className="flex flex-wrap gap-3 mt-12">
          {audiences.map((x) => (
            <button
              key={x.key}
              onClick={() => setActive(x.key)}
              className={`relative font-display text-base md:text-xl px-5 py-3 border-4 border-ink rounded-full transition-all ${
                active === x.key ? "bg-ink text-acid-yellow" : "bg-cream text-ink hover:-translate-y-1 chunk-shadow"
              }`}
            >
              {x.label}
              {active === x.key && (
                <motion.span
                  layoutId="audience-underline"
                  className="absolute -bottom-2 left-3 right-3 h-1 bg-magenta rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={a.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`${a.bg} border-4 border-ink rounded-3xl chunk-shadow-lg mt-10 p-8 md:p-12 grid md:grid-cols-5 gap-8 relative overflow-hidden`}
          >
            <div className="md:col-span-3">
              <p className={`font-display text-xl md:text-2xl ${a.accent} mb-3`}>{a.label}</p>
              <h3 className="font-display text-3xl md:text-5xl text-ink leading-tight mb-5">{a.headline}</h3>
              <p className="text-ink text-lg font-medium max-w-xl">{a.pitch}</p>
            </div>
            <ul className="md:col-span-2 space-y-2">
              {a.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-ink font-medium">
                  <span className="font-display text-magenta">→</span>
                  {b}
                </li>
              ))}
            </ul>
            <img src={catStreet} alt="" className="absolute -bottom-8 -right-8 w-32 md:w-44 opacity-90 pointer-events-none" />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Audiences;

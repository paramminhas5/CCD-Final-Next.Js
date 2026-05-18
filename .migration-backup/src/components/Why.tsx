import { motion } from "framer-motion";

const worlds = [
  { label: "DANCE MUSIC", glyph: "♫", bg: "bg-magenta", text: "text-cream", line: "Nights people remember." },
  { label: "PET CULTURE", glyph: "🐾", bg: "bg-acid-yellow", text: "text-ink", line: "The internet's favorite obsession." },
  { label: "STREETWEAR", glyph: "★", bg: "bg-cream", text: "text-ink", line: "Pieces you actually wear." },
];

const bullets = [
  "High-value audience. Strong spending power.",
  "Earned attention. Not ads.",
  "Bridge between brands & next-gen consumers.",
  "Events, merch, partnerships, IP.",
];

const Why = () => {
  return (
    <section id="why" className="relative bg-electric-blue border-b-4 border-ink overflow-hidden py-12 md:py-20">
      <div className="container relative z-10">
        <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ WHY</p>
        <h2 className="font-display text-4xl md:text-6xl text-cream leading-[0.9] max-w-4xl drop-shadow-[5px_5px_0_hsl(var(--ink))]">
          THREE WORLDS.<br />ONE ECOSYSTEM.
        </h2>

        {/* Three world tiles */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {worlds.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 140, damping: 16 }}
              className={`${w.bg} ${w.text} border-4 border-ink chunk-shadow p-5 md:p-6`}
            >
              <div className="font-display text-4xl md:text-5xl mb-2 leading-none">{w.glyph}</div>
              <div className="font-display text-xl md:text-2xl mb-1">{w.label}</div>
              <p className="font-medium opacity-90">{w.line}</p>
            </motion.div>
          ))}
        </div>

        {/* Ecosystem fusion strip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="mt-6 bg-ink text-cream border-4 border-ink chunk-shadow-lg p-5 md:p-6 flex items-center gap-4 md:gap-6 flex-wrap"
        >
          <div className="flex items-center -space-x-3">
            <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-magenta border-4 border-cream" />
            <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-acid-yellow border-4 border-cream" />
            <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cream border-4 border-cream" />
          </div>
          <span className="font-display text-2xl md:text-3xl text-acid-yellow">→</span>
          <span className="font-display text-2xl md:text-4xl text-magenta">★</span>
          <p className="font-display text-base md:text-xl flex-1 min-w-[200px]">
            ONE AUDIENCE · URBAN · GEN Z &amp; MILLENNIAL
          </p>
        </motion.div>

        {/* Compact 2x2 chip grid */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.06 }}
              className="bg-cream border-4 border-ink rounded-xl px-4 py-3 chunk-shadow font-display text-base md:text-lg text-ink flex gap-2 items-start"
            >
              <span className="text-magenta">✦</span>
              {b}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Why;

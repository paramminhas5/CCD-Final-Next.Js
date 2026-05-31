import { motion, useMotionValue, useTransform, useScroll } from "framer-motion";
import { useRef } from "react";

const PhoneIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="hsl(var(--ink))" stroke="hsl(var(--ink))" strokeWidth="3" strokeLinejoin="round">
    <rect x="12" y="4" width="24" height="40" rx="4" fill="hsl(var(--cream))"/>
    <circle cx="24" cy="38" r="2" fill="hsl(var(--ink))"/>
    <rect x="20" y="8" width="8" height="2" fill="hsl(var(--ink))"/>
  </svg>
);
const HeadphonesIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="hsl(var(--ink))" stroke="hsl(var(--ink))" strokeWidth="3" strokeLinejoin="round">
    <path d="M8 28v-4a16 16 0 0132 0v4" fill="none"/>
    <rect x="6" y="26" width="10" height="14" rx="3" fill="hsl(var(--cream))"/>
    <rect x="32" y="26" width="10" height="14" rx="3" fill="hsl(var(--cream))"/>
  </svg>
);
const ShirtIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="hsl(var(--cream))" stroke="hsl(var(--ink))" strokeWidth="3" strokeLinejoin="round">
    <path d="M16 6l-10 6 4 8 6-2v22h16V18l6 2 4-8-10-6-4 4h-8z"/>
  </svg>
);
const GalaxyIcon = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="hsl(var(--cream))" stroke="hsl(var(--ink))" strokeWidth="3" strokeLinejoin="round">
    <circle cx="24" cy="24" r="18"/>
    <circle cx="24" cy="24" r="3" fill="hsl(var(--ink))"/>
    <circle cx="14" cy="18" r="2" fill="hsl(var(--ink))"/>
    <circle cx="34" cy="30" r="2" fill="hsl(var(--ink))"/>
    <circle cx="32" cy="14" r="1.5" fill="hsl(var(--ink))"/>
  </svg>
);

const engines = [
  { label: "CONTENT", desc: "Highly shareable media that travels across social and builds daily relevance.", color: "bg-acid-yellow", Icon: PhoneIcon },
  { label: "EVENTS", desc: "Monthly experiences people talk about, attend, and return to.", color: "bg-lime", Icon: HeadphonesIcon },
  { label: "MERCH", desc: "Collectible human + pet streetwear, mystery boxes and limited drops tied to moments.", color: "bg-orange", Icon: ShirtIcon },
  { label: "UNIVERSE", desc: "An aspirational world where artists, brands, creatives and fans want to belong.", color: "bg-magenta text-cream", Icon: GalaxyIcon },
];

const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rX = useTransform(y, [-0.5, 0.5], [6, -6]);
  const rY = useTransform(x, [-0.5, 0.5], [-6, 6]);
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const revenue = ["Ticket sales", "Product drops", "Membership", "Brand partnerships"];

const What = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleX = useTransform(scrollYProgress, [0, 1], [0, 120]);
  return (
    <section ref={ref} id="what" className="relative bg-cream border-b-4 border-ink py-12 md:py-20 bg-grain overflow-hidden">
      <div className="container">
        <p className="font-display text-magenta text-lg md:text-xl mb-3">/ WHAT</p>
        <motion.h2 style={{ x: titleX }} className="font-display text-4xl md:text-6xl text-ink leading-[0.9] max-w-5xl">
          A CULTURE BRAND<br/>WITH FOUR ENGINES.
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {engines.map((e, i) => (
            <motion.div
              key={e.label}
              initial={{ opacity: 0, y: 60, rotateY: -30 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 160, damping: 16, delay: i * 0.1 }}
            >
              <TiltCard className={`${e.color} border-4 border-ink rounded-3xl p-6 chunk-shadow-lg`}>
                <div className="mb-4"><e.Icon /></div>
                <h3 className="font-display text-3xl md:text-4xl mb-3">{e.label}</h3>
                <p className="font-medium leading-snug">{e.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-ink text-cream border-4 border-ink rounded-3xl p-6 md:p-10 chunk-shadow-lg">
          <p className="font-display text-acid-yellow text-lg md:text-xl mb-2">/ REVENUE MODEL</p>
          <h3 className="font-display text-3xl md:text-5xl mb-6">FOUR STREAMS. ONE FLYWHEEL.</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {revenue.map((r, i) => (
              <div key={r} className="border-4 border-cream rounded-2xl p-5 text-center">
                <div className="font-display text-acid-yellow text-3xl mb-1">0{i + 1}</div>
                <div className="font-display text-xl md:text-2xl">{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default What;

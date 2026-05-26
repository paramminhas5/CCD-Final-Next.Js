import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import catRaver from "@/assets/cat-raver.png";
import cloud from "@/assets/cloud.png";

const shifts = [
  { t: "Culture has become commerce.", d: "People no longer buy products alone. They buy identity, belonging, experiences." },
  { t: "Youth spending power is rising.", d: "Urban Gen Z & Millennials have more disposable income than any prior generation — and spend it on lifestyle." },
  { t: "Traditional ads are losing power.", d: "Brands struggle to reach young audiences through paid media. Communities outperform campaigns." },
  { t: "Experiences are back.", d: "Post-pandemic demand for nightlife, pop-ups and real-world connection is accelerating." },
  { t: "Pets have become family.", d: "Pet ownership is exploding among young urban households — emotional and commercial opportunity." },
  { t: "India needs new global lifestyle brands.", d: "Few culturally relevant, exportable brands have emerged from India in this category." },
];

const WhyNow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const catY = useTransform(scrollYProgress, [0, 1], [200, -200]);
  const cloudX = useTransform(scrollYProgress, [0, 1], [-200, 200]);
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section ref={ref} id="whynow" className="relative bg-magenta border-b-4 border-ink py-12 md:py-20 overflow-hidden">
      <motion.img src={cloud} style={{ x: cloudX }} alt="" className="absolute top-20 right-0 w-72 opacity-80" />
      <motion.img src={catRaver} style={{ y: catY }} alt="" className="absolute right-4 md:right-16 top-1/2 w-40 md:w-64 hidden sm:block" />

      <div className="container relative z-10">
        <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ WHY NOW</p>
        <h2 className="font-display text-4xl md:text-6xl text-cream leading-[0.9] max-w-4xl drop-shadow-[5px_5px_0_hsl(var(--ink))]">
          THE PERFECT MOMENT.
        </h2>

        <div className="mt-16 space-y-4 max-w-4xl relative">
          <div className="absolute left-2 md:left-4 top-0 bottom-0 w-1 bg-cream/20 hidden sm:block" aria-hidden />
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-2 md:left-4 top-0 w-1 bg-acid-yellow hidden sm:block"
            aria-hidden
          />
          {shifts.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.06 }}
              className="bg-cream border-4 border-ink rounded-2xl p-5 md:p-6 chunk-shadow flex gap-4 sm:ml-10"
            >
              <span className="font-display text-3xl md:text-5xl text-magenta shrink-0">0{i + 1}</span>
              <div>
                <h3 className="font-display text-xl md:text-2xl text-ink mb-1">{s.t}</h3>
                <p className="text-ink/80 font-medium">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyNow;

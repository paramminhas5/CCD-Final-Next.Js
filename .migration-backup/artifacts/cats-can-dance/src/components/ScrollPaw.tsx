import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useState } from "react";

/**
 * Recognizable paw: 1 pad + 4 toes, all inside viewBox 0 0 100 100.
 */
const PAW_PATH =
  "M50 95c-16 0-28-9-28-22 0-13 12-22 28-22s28 9 28 22c0 13-12 22-28 22z " +
  "M22 42c-7 0-12-6-12-13s5-13 12-13 12 6 12 13-5 13-12 13z " +
  "M78 42c-7 0-12-6-12-13s5-13 12-13 12 6 12 13-5 13-12 13z " +
  "M38 22c-6 0-10-5-10-11S32 0 38 0s10 5 10 11-4 11-10 11z " +
  "M62 22c-6 0-10-5-10-11S56 0 62 0s10 5 10 11-4 11-10 11z";

const ScrollPaw = () => {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });
  const fillY = useTransform(smooth, [0, 1], [100, 0]);
  const ringOpacity = useTransform(smooth, [0, 0.9, 1], [0.3, 0.6, 1]);
  const pct = useTransform(smooth, (v) => `${Math.round(v * 100)}%`);
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fixed bottom-5 right-5 z-40 w-20 h-20 group"
      aria-label="Scroll progress — click to top"
    >
      {hover && (
        <span className="absolute -top-9 right-0 bg-ink text-cream font-display text-xs px-2 py-1 border-2 border-ink whitespace-nowrap">
          <motion.span>{pct}</motion.span> · top
        </span>
      )}
      <motion.span
        style={{ opacity: ringOpacity }}
        className="absolute inset-[-6px] rounded-full border-4 border-acid-yellow animate-pulse"
        aria-hidden
      />
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[4px_4px_0_hsl(var(--ink))]">
        <defs>
          <clipPath id="paw-clip-v2">
            <path d={PAW_PATH} />
          </clipPath>
        </defs>
        <g clipPath="url(#paw-clip-v2)">
          <rect x="0" y="0" width="100" height="100" fill="hsl(var(--cream))" />
          <motion.rect
            x="0"
            width="100"
            height="100"
            fill="hsl(var(--acid-yellow))"
            style={{ y: fillY }}
          />
        </g>
        <path
          d={PAW_PATH}
          fill="none"
          stroke="hsl(var(--ink))"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default ScrollPaw;
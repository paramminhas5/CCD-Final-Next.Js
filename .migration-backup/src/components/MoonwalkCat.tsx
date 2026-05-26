import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import catSprite from "@/assets/cat-headphones.png";

const MoonwalkCat = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], ["-10vw", "110vw"]);
  const rot = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x, willChange: "transform" }}
      className="fixed bottom-3 left-0 z-[60] pointer-events-none"
    >
      <motion.img
        src={catSprite}
        alt=""
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotate: rot, transform: "scaleX(-1)" }}
        className="w-12 md:w-20 drop-shadow-[4px_4px_0_hsl(var(--ink))]"
      />
    </motion.div>
  );
};

export default MoonwalkCat;

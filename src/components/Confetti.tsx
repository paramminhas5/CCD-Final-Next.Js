import { motion, AnimatePresence } from "framer-motion";

const shapes = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2;
  const dist = 120 + Math.random() * 120;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    rot: Math.random() * 720 - 360,
    color: ["hsl(var(--acid-yellow))", "hsl(var(--magenta))", "hsl(var(--lime))", "hsl(var(--electric-blue))", "hsl(var(--orange))"][i % 5],
    kind: i % 3,
  };
});

const Confetti = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
        {shapes.map((s, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.5 }}
            animate={{ x: s.x, y: s.y, opacity: 0, rotate: s.rot, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-3 h-3"
            style={{ background: s.kind === 0 ? s.color : "transparent" }}
          >
            {s.kind === 1 && (
              <svg viewBox="0 0 10 10" fill={s.color}><path d="M5 0l1.5 3.5L10 4l-2.5 2.5L8 10 5 8 2 10l.5-3.5L0 4l3.5-.5z"/></svg>
            )}
            {s.kind === 2 && (
              <svg viewBox="0 0 10 10" fill={s.color}><circle cx="5" cy="6" r="3"/><circle cx="2" cy="3.5" r="1.2"/><circle cx="8" cy="3.5" r="1.2"/></svg>
            )}
          </motion.div>
        ))}
      </div>
    )}
  </AnimatePresence>
);

export default Confetti;
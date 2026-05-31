import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const COUNT_KEY = "ccd:disco-hint-count";
const CLICKED_KEY = "ccd:disco-clicked";
const MAX_REAPPEARS = 3;

const DiscoHint = () => {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  const getCount = () => {
    try { return parseInt(sessionStorage.getItem(COUNT_KEY) || "0", 10); } catch { return MAX_REAPPEARS; }
  };
  const isClicked = () => {
    try { return sessionStorage.getItem(CLICKED_KEY) === "1"; } catch { return true; }
  };
  const bumpCount = useCallback(() => {
    try { sessionStorage.setItem(COUNT_KEY, String(getCount() + 1)); } catch {}
  }, []);

  // First-visit show + recurring loop
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isClicked()) return;

    let mounted = true;
    let timers: number[] = [];

    const popOnce = (durationMs: number) => {
      if (!mounted || isClicked()) return;
      if (getCount() >= MAX_REAPPEARS) return;
      setShow(true);
      bumpCount();
      const t = window.setTimeout(() => mounted && setShow(false), durationMs);
      timers.push(t);
    };

    // First appearance: ~2s after load, 5s on screen
    const first = window.setTimeout(() => popOnce(5000), 2000);
    timers.push(first);

    // Recurring: every 60-90s, 4s on screen, until cap or click
    const scheduleNext = () => {
      if (!mounted || isClicked()) return;
      if (getCount() >= MAX_REAPPEARS) return;
      const delay = 60000 + Math.random() * 30000;
      const t = window.setTimeout(() => {
        popOnce(4000);
        scheduleNext();
      }, delay);
      timers.push(t);
    };
    const startLoop = window.setTimeout(scheduleNext, 8000);
    timers.push(startLoop);

    const onClicked = () => {
      try { sessionStorage.setItem(CLICKED_KEY, "1"); } catch {}
      setShow(false);
      timers.forEach((id) => clearTimeout(id));
      timers = [];
    };
    window.addEventListener("disco:toggle", onClicked);

    return () => {
      mounted = false;
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("disco:toggle", onClicked);
    };
  }, [bumpCount]);

  const dismiss = () => {
    setShow(false);
    try { sessionStorage.setItem(CLICKED_KEY, "1"); } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          onClick={dismiss}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.7 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -4, 0], scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={reduce ? { duration: 0.2 } : { y: { repeat: Infinity, duration: 1.4 }, default: { type: "spring", stiffness: 220, damping: 14 } }}
          className="absolute top-full right-2 sm:right-6 mt-2 z-[60] bg-magenta text-cream font-display text-xs sm:text-sm px-3 py-2 border-4 border-ink chunk-shadow whitespace-nowrap flex items-center gap-1.5"
          aria-label="Dismiss disco hint"
        >
          <span className="absolute -top-2 right-6 w-3 h-3 bg-magenta border-l-4 border-t-4 border-ink rotate-45" />
          <span aria-hidden>🐾</span>
          PRESS ME ✨
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default DiscoHint;

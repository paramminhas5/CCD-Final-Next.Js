import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import note from "@/assets/music-note.png";
import Confetti from "@/components/Confetti";
import { supabase } from "@/integrations/supabase/client";

const EmailSchema = z.string().trim().toLowerCase().email().max(255);

const EarlyAccess = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const shadowSize = useTransform(scrollYProgress, [0, 1], [2, 14]);
  const titleShadow = useTransform(shadowSize, (v) => `${v}px ${v}px 0 hsl(var(--ink))`);
  const orbit1 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const orbit2 = useTransform(scrollYProgress, [0, 1], [0, -360]);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const lastSubmitRef = useRef(0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Hmm, that doesn't look like a valid email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("early-access-signup", {
        body: { email: parsed.data, source: "home", website },
      });
      if (error) throw error;
      if ((data as any)?.duplicate) {
        toast("You're already on the list. See you soon. 🐾");
      } else {
        toast.success("You're in! Welcome to the litter.");
      }
      setEmail("");
      setBurst(false);
      requestAnimationFrame(() => setBurst(true));
      setTimeout(() => setBurst(false), 1300);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section ref={ref} id="early-access" className="relative bg-electric-blue py-12 md:py-20 border-b-4 border-ink overflow-hidden">
      <Confetti active={burst} />
      <motion.div style={{ rotate: orbit1 }} className="absolute top-1/2 left-1/2 -mt-40 -ml-40 w-80 h-80 pointer-events-none" aria-hidden>
        <img src={note} alt="" className="absolute top-0 left-1/2 -translate-x-1/2 w-16" />
      </motion.div>
      <motion.div style={{ rotate: orbit2 }} className="absolute top-1/2 left-1/2 -mt-56 -ml-56 w-[28rem] h-[28rem] pointer-events-none" aria-hidden>
        <img src={note} alt="" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12" />
      </motion.div>
      <div className="container relative z-10 text-center max-w-3xl">
        <p className="font-display text-acid-yellow text-lg md:text-xl mb-3">/ EARLY ACCESS</p>
        <motion.h2 style={{ textShadow: titleShadow }} className="font-display text-cream text-4xl md:text-6xl mb-4">
          BE FIRST<br/>IN THE DOOR
        </motion.h2>
        <p className="text-cream/90 text-base md:text-lg mb-6 font-medium">
          Sign up for early access to drops, gigs, and the cult before everyone else catches on.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          {/* honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            name="website"
            aria-hidden
            className="hidden"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            maxLength={255}
            className="flex-1 bg-cream text-ink border-4 border-ink px-5 py-4 font-display text-lg placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-magenta text-cream font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
          >
            {busy ? "ADDING…" : "COUNT ME IN"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EarlyAccess;

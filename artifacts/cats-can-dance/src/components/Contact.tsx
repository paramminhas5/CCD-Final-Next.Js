import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import headphones from "@/assets/headphones.svg";
import { imgUrl } from "@/lib/img";
import { supabase } from "@/lib/supabase-shim";

const REASONS = [
  "Brand collab",
  "Venue partnership",
  "Press / interview",
  "RSVP help",
  "Other",
] as const;

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
  reason: z.enum(REASONS),
});

const Contact = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const hpY = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const hpRot = useTransform(scrollYProgress, [0, 1], [-10, 20]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    reason: REASONS[0] as (typeof REASONS)[number],
  });
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = ContactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fill all fields with valid info.");
      return;
    }
    setBusy(true);
    try {
      const composed = `[${parsed.data.reason}] ${parsed.data.message}`;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.data.name, email: parsed.data.email, message: composed, website }),
      });
      if (!res.ok) throw new Error("send failed");
      toast.success("Message sent! We'll be in touch.");
      setSent(true);
      setForm({ name: "", email: "", message: "", reason: REASONS[0] });
    } catch {
      toast.error("Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      ref={ref}
      id="contact"
      className="relative bg-acid-yellow py-16 md:py-20 border-b-4 border-ink overflow-hidden"
    >
      <motion.img
        src={imgUrl(headphones)}
        alt=""
        style={{ y: hpY, rotate: hpRot }}
        className="hidden md:block absolute -top-10 -right-10 w-56 md:w-80 pointer-events-none opacity-90"
      />
      <div className="container relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="mb-8"
        >
          <p className="font-display text-magenta text-xl sm:text-2xl mb-2">/ DROP US A LINE</p>
          <h2 className="font-display text-ink text-5xl sm:text-6xl md:text-7xl leading-none">
            CONTACT US.
          </h2>
          <p className="text-ink/80 text-base sm:text-lg mt-4 max-w-xl">
            Brand collabs, venue partnerships, press, or just to send us a cat photo. We read everything within 24h.
          </p>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.1 }}
          className="bg-cream border-4 border-ink chunk-shadow-lg p-5 sm:p-7 md:p-8 space-y-5"
        >
          {sent ? (
            <div className="py-10 text-center">
              <p className="font-display text-4xl text-ink mb-2">THANKS! 🐾</p>
              <p className="text-ink/70 font-medium mb-6">We got your message and will reply soon.</p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="bg-ink text-cream font-display px-6 py-3 hover:bg-magenta transition-colors"
              >
                SEND ANOTHER →
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="c-name" className="block font-display text-sm text-ink mb-1.5 uppercase tracking-wide">
                    Name *
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    maxLength={100}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="block font-display text-sm text-ink mb-1.5 uppercase tracking-wide">
                    Email *
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    maxLength={255}
                    className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="c-reason" className="block font-display text-sm text-ink mb-1.5 uppercase tracking-wide">
                  Reason
                </label>
                <select
                  id="c-reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value as (typeof REASONS)[number] })}
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="c-message" className="block font-display text-sm text-ink mb-1.5 uppercase tracking-wide">
                  Message *
                </label>
                <textarea
                  id="c-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What's up?"
                  maxLength={2000}
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-ink text-cream font-display text-xl py-4 hover:bg-magenta transition-colors disabled:opacity-60"
              >
                {busy ? "SENDING…" : "SEND IT →"}
              </button>

              <p className="text-ink/60 text-sm text-center pt-1">
                Or email us directly:{" "}
                <a
                  href="mailto:hello@catscandance.com"
                  className="text-magenta underline decoration-2 underline-offset-2 hover:text-ink transition-colors break-all"
                >
                  hello@catscandance.com
                </a>
              </p>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;

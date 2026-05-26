import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase-shim";

export type PartnerKind = "venues" | "artists" | "investors" | "press" | "team" | "submit-event" | "general";

type KindConfig = {
  title: string;
  eyebrow: string;
  reasons: readonly string[];
  fallbackEmail: string;
  fallbackSubject?: string;
  defaultMessage?: string;
};

const KIND_CONFIG: Record<PartnerKind, KindConfig> = {
  venues: {
    title: "PARTNER WITH US",
    eyebrow: "/ VENUE PARTNERSHIPS",
    reasons: ["Host an episode at our venue", "Long-term residency", "One-off collab", "Other"],
    fallbackEmail: "venues@catscandance.com",
  },
  artists: {
    title: "PLAY WITH US",
    eyebrow: "/ ARTIST BOOKINGS",
    reasons: ["I want to play a CCD episode", "Booking enquiry", "Demo / mix submission", "Other"],
    fallbackEmail: "artists@catscandance.com",
  },
  investors: {
    title: "REQUEST DECK",
    eyebrow: "/ INVESTORS",
    reasons: ["Request the deck", "Schedule a call", "Diligence questions", "Other"],
    fallbackEmail: "invest@catscandance.com",
  },
  press: {
    title: "PRESS ENQUIRY",
    eyebrow: "/ PRESS & MEDIA",
    reasons: ["Press / interview", "Photos / assets", "Podcast", "Editorial feature", "Other"],
    fallbackEmail: "hello@catscandance.com",
    fallbackSubject: "Press enquiry",
  },
  team: {
    title: "JOIN THE PACK",
    eyebrow: "/ JOIN THE PACK",
    reasons: ["Music & Curation", "Brand & Design", "Community & Ops", "Content & Video", "Other"],
    fallbackEmail: "hello@catscandance.com",
    fallbackSubject: "Join the Pack",
  },
  "submit-event": {
    title: "SUBMIT AN EVENT",
    eyebrow: "/ EVENT SUBMISSION",
    reasons: ["Verified promoter — submit event", "New promoter application", "General question", "Other"],
    fallbackEmail: "hello@catscandance.com",
  },
  general: {
    title: "GET IN TOUCH",
    eyebrow: "/ DROP US A LINE",
    reasons: ["General", "Brand collab", "Other"],
    fallbackEmail: "hello@catscandance.com",
  },
};

const Schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  reason: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
});

type Props = {
  kind: PartnerKind;
  trigger: React.ReactNode;
  defaultReason?: string;
  defaultMessage?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};

const PartnerContactDialog = ({ kind, trigger, defaultReason, defaultMessage, open, onOpenChange }: Props) => {
  const cfg = KIND_CONFIG[kind];
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: defaultReason ?? cfg.reasons[0],
    message: defaultMessage ?? "",
  });
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      setSent(false);
      setForm((f) => ({
        ...f,
        reason: defaultReason ?? cfg.reasons[0],
        message: defaultMessage ?? f.message,
      }));
    }
  }, [dialogOpen, defaultReason, defaultMessage, cfg.reasons]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fill all required fields with valid info.");
      return;
    }
    setBusy(true);
    try {
      const composed = [
        `[${kind}] [${parsed.data.reason}]`,
        parsed.data.phone ? `Phone: ${parsed.data.phone}` : null,
        "",
        parsed.data.message,
      ].filter(Boolean).join("\n");
      const { data, error } = await supabase.functions.invoke("contact-submit", {
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          message: composed,
          kind,
          reason: parsed.data.reason,
          phone: parsed.data.phone || undefined,
          website,
        },
      });
      if (error || (data as any)?.error) throw new Error("send failed");
      toast.success("Sent! We'll be in touch soon.");
      setSent(true);
      setForm({ name: "", email: "", phone: "", reason: cfg.reasons[0], message: "" });
    } catch {
      toast.error("Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const mailtoHref = `mailto:${cfg.fallbackEmail}${cfg.fallbackSubject ? `?subject=${encodeURIComponent(cfg.fallbackSubject)}` : ""}`;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-cream border-4 border-ink !rounded-none p-0 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 sm:p-7 pb-0">
          <p className="font-display text-magenta text-base sm:text-lg">{cfg.eyebrow}</p>
          <DialogTitle className="font-display text-ink text-3xl sm:text-4xl md:text-5xl leading-none">
            {cfg.title}.
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="p-7 pt-4 text-center">
            <p className="font-display text-4xl text-ink mb-2">THANKS! 🐾</p>
            <p className="text-ink/70 font-medium mb-6">We got it and will reply within 24h.</p>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="bg-ink text-cream font-display px-6 py-3 hover:bg-magenta transition-colors"
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5 sm:p-7 pt-4 space-y-4">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              aria-hidden
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcd-name" className="block font-display text-xs text-ink mb-1.5 uppercase tracking-wide">Name *</label>
                <input
                  id="pcd-name" type="text" required maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-cream text-ink border-4 border-ink px-3 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
              <div>
                <label htmlFor="pcd-email" className="block font-display text-xs text-ink mb-1.5 uppercase tracking-wide">Email *</label>
                <input
                  id="pcd-email" type="email" required maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-cream text-ink border-4 border-ink px-3 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcd-phone" className="block font-display text-xs text-ink mb-1.5 uppercase tracking-wide">
                  Phone <span className="text-ink/50 normal-case font-normal">(optional)</span>
                </label>
                <input
                  id="pcd-phone" type="tel" maxLength={40}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-cream text-ink border-4 border-ink px-3 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
              <div>
                <label htmlFor="pcd-reason" className="block font-display text-xs text-ink mb-1.5 uppercase tracking-wide">Reason</label>
                <select
                  id="pcd-reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full bg-cream text-ink border-4 border-ink px-3 py-2.5 font-medium focus:outline-none focus:bg-acid-yellow"
                >
                  {cfg.reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pcd-message" className="block font-display text-xs text-ink mb-1.5 uppercase tracking-wide">Message *</label>
              <textarea
                id="pcd-message" required rows={4} maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us a bit more…"
                className="w-full bg-cream text-ink border-4 border-ink px-3 py-2.5 font-medium placeholder:text-ink/60 focus:outline-none focus:bg-acid-yellow resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-ink text-cream font-display text-lg sm:text-xl py-3 sm:py-4 hover:bg-magenta transition-colors disabled:opacity-60"
            >
              {busy ? "SENDING…" : "SEND IT →"}
            </button>

            <p className="text-ink/60 text-xs sm:text-sm text-center pt-1">
              Or email us directly:{" "}
              <a
                href={mailtoHref}
                className="text-magenta underline decoration-2 underline-offset-2 hover:text-ink transition-colors break-all"
              >
                {cfg.fallbackEmail}
              </a>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartnerContactDialog;

import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase-shim";
import Confetti from "@/components/Confetti";

const Schema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(120),
  email: z.string().trim().toLowerCase().email("That email looks off").max(255),
  plus_ones: z.number().int().min(0).max(10),
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventSlug: string;
  eventTitle: string;
  /** ISO or human-readable date string — used to build the calendar link */
  eventDate?: string;
  /** Venue name — used in the calendar event description */
  eventVenue?: string;
};

/** Build a Google Calendar "Add to Calendar" URL */
function buildCalendarUrl(title: string, date: string, venue?: string): string {
  // Parse the event date — supports "Sun, Jun 29, 2026" and ISO formats
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  let startDate = "";
  try {
    // Try ISO first
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      startDate = date.replace(/-/g, "").slice(0, 8);
    } else {
      // "Sun, Jun 29, 2026" → extract month, day, year
      const m = date.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
      if (m) {
        const mo = monthMap[m[1].toLowerCase()];
        if (mo) {
          startDate = `${m[3]}${mo}${String(parseInt(m[2])).padStart(2, "0")}`;
        }
      }
    }
  } catch { /* skip */ }

  if (!startDate) return "https://calendar.google.com/";

  // All-day event
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDate}/${startDate}`,
    details: venue ? `At ${venue}. RSVP via catscandance.com` : "RSVP via catscandance.com",
    location: venue ?? "Bengaluru, India",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const RsvpDialog = ({ open, onOpenChange, eventSlug, eventTitle, eventDate, eventVenue }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [whatsapp, setWhatsapp] = useState(""); // optional WhatsApp
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const [done, setDone] = useState(false);
  const lastSubmit = useRef(0);

  const reset = () => {
    setName("");
    setEmail("");
    setPlusOnes(0);
    setWhatsapp("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const now = Date.now();
    if (now - lastSubmit.current < 2000) return;
    lastSubmit.current = now;

    const parsed = Schema.safeParse({ name, email, plus_ones: plusOnes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-rsvp", {
        body: { ...parsed.data, event_slug: eventSlug, website, whatsapp: whatsapp || undefined },
      });
      if (error) throw error;
      if ((data as any)?.duplicate) {
        toast("You're already on the list. See you on the floor. 🐾");
        setTimeout(() => onOpenChange(false), 800);
      } else {
        toast.success(`RSVP confirmed for ${eventTitle}! Check your inbox for confirmation.`);
        setBurst(true);
        setTimeout(() => setBurst(false), 1300);
        reset();
        setDone(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const calUrl = eventDate ? buildCalendarUrl(`Cats Can Dance — ${eventTitle}`, eventDate, eventVenue) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setDone(false); }}>
      <DialogContent className="bg-cream border-4 border-ink chunk-shadow-lg max-w-md">
        <Confetti active={burst} />
        {done ? (
          /* ── Success state ── */
          <div className="py-4 text-center space-y-4">
            <div className="font-display text-4xl text-acid-yellow drop-shadow-[4px_4px_0_hsl(var(--ink))]">✓</div>
            <DialogTitle className="font-display text-2xl text-ink">YOU'RE ON THE LIST</DialogTitle>
            <p className="text-ink/70 font-medium text-sm">
              Name on the door: <strong>{name}</strong>{plusOnes > 0 ? ` +${plusOnes}` : ""}.<br />
              Check your inbox for the confirmation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {calUrl && (
                <a
                  href={calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-ink text-cream font-display text-sm uppercase px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                >
                  📅 Add to Calendar
                </a>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center font-display text-sm uppercase px-5 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-ink">RSVP</DialogTitle>
              <DialogDescription className="text-ink/70 font-medium">
                {eventTitle} — save your spot.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Honeypot */}
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
              <div>
                <label htmlFor="rsvp-name" className="font-display text-sm text-ink mb-1 block">NAME *</label>
                <input
                  id="rsvp-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
              <div>
                <label htmlFor="rsvp-email" className="font-display text-sm text-ink mb-1 block">EMAIL *</label>
                <input
                  id="rsvp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  autoComplete="email"
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
              <div>
                <label htmlFor="rsvp-plus" className="font-display text-sm text-ink mb-1 block">PLUS ONES (0–10)</label>
                <input
                  id="rsvp-plus"
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
                />
              </div>
              {/* WhatsApp opt-in — optional, for day-of reminders */}
              <div>
                <label htmlFor="rsvp-wa" className="font-display text-sm text-ink mb-1 block">
                  WHATSAPP
                  <span className="font-sans font-normal text-ink/40 text-xs ml-2 normal-case">(optional — day-of reminder)</span>
                </label>
                <input
                  id="rsvp-wa"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  maxLength={20}
                  autoComplete="tel"
                  className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow placeholder:text-ink/40"
                />
              </div>
              <DialogFooter>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-magenta text-cream font-display text-xl py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
                >
                  {busy ? "SAVING…" : "LOCK IT IN →"}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RsvpDialog;

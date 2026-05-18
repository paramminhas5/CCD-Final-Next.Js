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
import { supabase } from "@/integrations/supabase/client";
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
};

const RsvpDialog = ({ open, onOpenChange, eventSlug, eventTitle }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const lastSubmit = useRef(0);

  const reset = () => {
    setName("");
    setEmail("");
    setPlusOnes(0);
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
        body: { ...parsed.data, event_slug: eventSlug, website },
      });
      if (error) throw error;
      if ((data as any)?.duplicate) {
        toast("You're already on the list. See you on the floor. 🐾");
      } else {
        toast.success(`RSVP confirmed for ${eventTitle}!`);
      }
      setBurst(true);
      setTimeout(() => setBurst(false), 1300);
      reset();
      setTimeout(() => onOpenChange(false), 800);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cream border-4 border-ink chunk-shadow-lg max-w-md">
        <Confetti active={burst} />
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-ink">RSVP</DialogTitle>
          <DialogDescription className="text-ink/70 font-medium">
            {eventTitle} — save your spot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="font-display text-sm text-ink mb-1 block">NAME</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>
          <div>
            <label className="font-display text-sm text-ink mb-1 block">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
            />
          </div>
          <div>
            <label className="font-display text-sm text-ink mb-1 block">PLUS ONES (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={plusOnes}
              onChange={(e) => setPlusOnes(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
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
      </DialogContent>
    </Dialog>
  );
};

export default RsvpDialog;

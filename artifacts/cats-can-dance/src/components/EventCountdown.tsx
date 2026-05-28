/**
 * Live countdown to an event start.
 *
 *  - Parses a wide variety of human-readable date strings (the events table
 *    stores things like "Sun, Jun 29, 2026"). Falls back to ISO parsing.
 *  - Hides itself if the date is in the past, unparseable, or < 1 minute
 *    away (the page transitions to "happening now" status visually).
 *  - Updates every 60 seconds — the seconds counter is intentional decoration
 *    (it keeps the page feeling alive) but ticks on its own interval so the
 *    bigger components don't re-render every second.
 */

import { useEffect, useState } from "react";
import { parseEventDate } from "@/lib/parse-date";

type Props = {
  /** The same string you'd put in events.date — e.g. "Sun, Jun 29, 2026". */
  date: string;
  /** Optional doors_time override for the "starts at" line. */
  doorsTime?: string;
  /** Tone the countdown for the surrounding hero. Default is dark on cream. */
  invert?: boolean;
};

const PAD = (n: number) => n.toString().padStart(2, "0");

const EventCountdown = ({ date, doorsTime, invert = false }: Props) => {
  const [now, setNow] = useState<number>(() => Date.now());
  const [secondsTick, setSecondsTick] = useState<number>(0);

  useEffect(() => {
    const minute = setInterval(() => setNow(Date.now()), 60_000);
    const second = setInterval(() => setSecondsTick((s) => s + 1), 1000);
    return () => {
      clearInterval(minute);
      clearInterval(second);
    };
  }, []);

  const target = parseEventDate(date);
  if (!target) return null;

  const diff = target.getTime() - now;
  if (diff < 60_000) return null; // < 1 minute — hide; status pill takes over

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins  = Math.floor((diff / (1000 * 60)) % 60);
  // tick the seconds locally so reading it always feels live
  const seconds = (60 - (Math.floor(now / 1000) % 60) - (secondsTick % 1)) % 60;

  const bg = invert ? "bg-acid-yellow text-ink" : "bg-ink text-cream";
  const accent = invert ? "text-magenta" : "text-acid-yellow";

  return (
    <div
      className={`${bg} border-y-4 border-ink py-5 md:py-7`}
      role="timer"
      aria-live="polite"
      aria-label={`Doors open in ${days} days, ${hours} hours, ${mins} minutes`}
    >
      <div className="container flex flex-wrap items-center justify-between gap-4 md:gap-6">
        <div>
          <p className={`font-display text-xs md:text-sm tracking-widest mb-1 ${accent}`}>
            / DOORS OPEN IN
          </p>
          <p className="font-display text-3xl md:text-5xl leading-none">
            {days > 0 && <><span>{days}</span><span className="opacity-50">D</span><span className="mx-2 opacity-30">·</span></>}
            <span>{PAD(hours)}</span><span className="opacity-50">H</span>
            <span className="mx-2 opacity-30">·</span>
            <span>{PAD(mins)}</span><span className="opacity-50">M</span>
            <span className="mx-2 opacity-30">·</span>
            <span className="tabular-nums">{PAD(Math.floor(seconds))}</span><span className="opacity-50">S</span>
          </p>
        </div>
        {doorsTime && (
          <div className="text-right">
            <p className={`font-display text-xs md:text-sm tracking-widest mb-1 ${accent}`}>
              / KICK-OFF
            </p>
            <p className="font-display text-xl md:text-2xl leading-none">{doorsTime}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCountdown;

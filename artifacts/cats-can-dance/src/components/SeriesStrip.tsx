/**
 * "Also in this series" strip — shown on the event detail page when the
 * event belongs to a series (e.g. CCD × SOCIAL).
 *
 *  - Shows up to 4 sibling events (the current event is omitted).
 *  - Highlights the finale with a `★ FINALE` chip and an inverted palette.
 *  - Series banner block at the top doubles as a SeriesStrip on /events.
 */

import { Link } from "@/lib/compat-router";
import type { EventRow } from "@/types/events";

type Props = {
  /** All events in this series (including the current one). */
  events: EventRow[];
  /** Slug of the current event — omitted from the rendered list. */
  currentSlug?: string;
  /** Series label, e.g. "CCD × SOCIAL". Shown as the section eyebrow. */
  seriesLabel: string;
  /** Render variant. */
  variant?: "detail" | "banner";
};

const SeriesStrip = ({ events, currentSlug, seriesLabel, variant = "detail" }: Props) => {
  const siblings = events
    .filter((e) => e.slug !== currentSlug)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 4);

  if (siblings.length === 0) return null;

  if (variant === "banner") {
    return (
      <section className="bg-electric-blue border-y-4 border-ink py-10 md:py-14">
        <div className="container">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <p className="font-display text-acid-yellow text-base md:text-lg mb-2">/ A SERIES</p>
              <h2 className="font-display text-cream text-4xl md:text-6xl leading-none">
                {seriesLabel}
              </h2>
            </div>
            <Link
              to={`/${(currentSlug ?? "").startsWith("ccdxsocial") || (events[0]?.series === "ccdxsocial") ? "ccdxsocial" : "events"}`}
              className="bg-acid-yellow text-ink font-display text-sm md:text-base px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              ABOUT THE SERIES →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...events]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .slice(0, 4)
              .map((e) => (
                <SeriesCard key={e.slug} event={e} />
              ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ink border-y-4 border-ink py-12 md:py-16">
      <div className="container">
        <p className="font-display text-acid-yellow text-base md:text-lg mb-2">/ ALSO IN {seriesLabel.toUpperCase()}</p>
        <h2 className="font-display text-cream text-3xl md:text-5xl leading-tight mb-6">
          THE REST OF THE SERIES
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {siblings.map((e) => <SeriesCard key={e.slug} event={e} />)}
        </div>
      </div>
    </section>
  );
};

const SeriesCard = ({ event }: { event: EventRow }) => {
  const isFinale = !!event.is_finale;
  const isPast = event.status === "past";
  return (
    <Link
      to={`/events/${event.slug}`}
      className={`relative block border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform ${
        isFinale ? "bg-magenta text-cream" : isPast ? "bg-cream text-ink" : "bg-acid-yellow text-ink"
      }`}
    >
      {isFinale && (
        <span className="absolute -top-3 -right-3 rotate-6 bg-acid-yellow text-ink font-display text-[10px] tracking-widest px-2 py-1 border-4 border-ink">
          ★ FINALE
        </span>
      )}
      <p className={`font-display text-[10px] tracking-widest mb-2 ${isFinale ? "text-acid-yellow" : "text-magenta"}`}>
        {isPast ? "/ PAST" : "/ UPCOMING"}
      </p>
      <h3 className="font-display text-2xl md:text-3xl leading-none mb-2 break-words">
        {event.title.toUpperCase()}
      </h3>
      <p className="text-sm font-medium opacity-90 leading-tight">{event.date}</p>
      {event.series_tagline && (
        <p className={`mt-3 text-[10px] font-display tracking-widest ${isFinale ? "text-acid-yellow/80" : "text-ink/60"}`}>
          {event.series_tagline}
        </p>
      )}
    </Link>
  );
};

export default SeriesStrip;

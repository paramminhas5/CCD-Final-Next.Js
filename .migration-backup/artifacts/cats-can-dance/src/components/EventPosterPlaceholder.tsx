/**
 * Branded poster placeholder.
 *
 * Used as the visual when no `poster_url` is set yet (or while the
 * uploaded poster fails to load). Renders an in-system, neobrutalist
 * "design poster" so the page looks intentional from day one.
 *
 * Replace by uploading a poster to Supabase Storage `event-posters`
 * bucket and setting `events.poster_url` to either the full URL or
 * the storage object path.
 */

type Props = {
  title: string;
  date: string;
  city: string;
  /** Series label like "CCD × SOCIAL · SHOW 03". Optional. */
  eyebrow?: string;
  /** Lineup line, e.g. "Startdawg · Merman · TBA". Optional. */
  lineup?: string;
  /** Render at fixed 3:4 portrait. Defaults to true (matches the upload spec). */
  portrait?: boolean;
};

const EventPosterPlaceholder = ({
  title,
  date,
  city,
  eyebrow,
  lineup,
  portrait = true,
}: Props) => {
  return (
    <div
      className={`relative bg-magenta text-cream border-4 border-ink chunk-shadow-lg overflow-hidden ${
        portrait ? "aspect-[3/4]" : "aspect-video"
      }`}
      role="img"
      aria-label={`${title} — placeholder poster`}
    >
      {/* concentric arcs */}
      <svg
        viewBox="0 0 300 400"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id="dots-poster" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="hsl(var(--acid-yellow))" />
          </pattern>
        </defs>
        <circle cx="150" cy="170" r="180" fill="hsl(var(--electric-blue))" />
        <circle cx="150" cy="170" r="120" fill="hsl(var(--magenta))" />
        <circle cx="150" cy="170" r="60"  fill="hsl(var(--acid-yellow))" />
        <rect x="0" y="290" width="300" height="110" fill="url(#dots-poster)" opacity="0.4" />
      </svg>

      <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
        {eyebrow && (
          <p className="font-display text-[10px] md:text-xs tracking-[0.25em] text-acid-yellow mb-2">
            / {eyebrow}
          </p>
        )}
        <h2 className="font-display text-4xl md:text-6xl leading-[0.85] mb-2 drop-shadow-[3px_3px_0_hsl(var(--ink))] break-words">
          {title.toUpperCase()}
        </h2>
        <p className="font-display text-sm md:text-base tracking-widest opacity-90">
          {date} · {city.toUpperCase()}
        </p>

        <div className="mt-auto">
          {lineup && (
            <div className="bg-ink text-acid-yellow border-4 border-ink p-3 mb-3">
              <p className="font-display text-[10px] md:text-xs tracking-widest mb-1 opacity-70">/ LINEUP</p>
              <p className="font-display text-sm md:text-base leading-tight">{lineup}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-[10px] md:text-xs font-display tracking-widest">
            <span className="bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">CCD</span>
            <span className="opacity-60">PLACEHOLDER · POSTER COMING</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPosterPlaceholder;

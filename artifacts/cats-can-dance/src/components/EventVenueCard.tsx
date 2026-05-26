/**
 * Venue card for the event detail page.
 *
 *  - Always renders the basics (name, city) from the EventRow.
 *  - If `address`, `mapUrl`, or `embedUrl` are provided (from EventContent),
 *    upgrades to a full split card with map embed + meta line.
 *  - Capacity, dress code, and house rules render as small chips when set.
 */

type Props = {
  venue: string;
  city: string;
  address?: string;
  mapUrl?: string;
  embedUrl?: string;
  capacity?: number;
  dressCode?: string;
  houseRules?: string;
};

const EventVenueCard = ({
  venue,
  city,
  address,
  mapUrl,
  embedUrl,
  capacity,
  dressCode,
  houseRules,
}: Props) => {
  const hasUpgrade = address || mapUrl || embedUrl;

  return (
    <section className="container py-12 md:py-16">
      <p className="font-display text-magenta text-base md:text-lg mb-3">/ THE VENUE</p>
      <h2 className="font-display text-ink text-3xl md:text-5xl leading-tight mb-8">
        {venue.toUpperCase()}, {city.toUpperCase()}
      </h2>

      <div className={`grid gap-6 ${embedUrl ? "lg:grid-cols-[1.25fr_1fr]" : ""}`}>
        {embedUrl && (
          <div className="border-4 border-ink chunk-shadow overflow-hidden bg-ink min-h-[300px] aspect-video lg:aspect-auto">
            <iframe
              src={embedUrl}
              title={`${venue} — map`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[300px] border-0"
              allowFullScreen
            />
          </div>
        )}

        <div className="border-4 border-ink chunk-shadow bg-cream p-5 md:p-7 flex flex-col gap-5">
          {address && (
            <div>
              <p className="font-display text-xs tracking-widest text-magenta mb-1">/ ADDRESS</p>
              <p className="text-ink font-medium leading-snug">{address}</p>
            </div>
          )}

          {(capacity || dressCode) && (
            <div className="grid grid-cols-2 gap-3">
              {capacity ? (
                <div className="bg-acid-yellow border-4 border-ink p-3">
                  <p className="font-display text-[10px] tracking-widest text-ink/70 mb-1">/ CAPACITY</p>
                  <p className="font-display text-2xl text-ink leading-none">~{capacity}</p>
                </div>
              ) : null}
              {dressCode ? (
                <div className="bg-electric-blue text-cream border-4 border-ink p-3">
                  <p className="font-display text-[10px] tracking-widest text-acid-yellow mb-1">/ DRESS</p>
                  <p className="font-medium leading-tight">{dressCode}</p>
                </div>
              ) : null}
            </div>
          )}

          {houseRules && (
            <div>
              <p className="font-display text-xs tracking-widest text-magenta mb-1">/ HOUSE RULES</p>
              <p className="text-ink/80 font-medium text-sm leading-snug">{houseRules}</p>
            </div>
          )}

          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 bg-magenta text-cream font-display text-base md:text-lg px-5 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              OPEN IN MAPS ↗
            </a>
          ) : !hasUpgrade ? (
            <p className="text-ink/60 italic text-sm">
              Address and map drop closer to the date. Check back, or RSVP and we'll email you the run-of-show.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default EventVenueCard;

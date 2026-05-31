"use client";
/**
 * SceneSnapshot — homepage section showing 6 Indian city scenes
 * as bold coloured tiles with genre tags, a "Discover" CTA,
 * and LIVE event count badges pulled from the curated-events API.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { CITY_SCENES } from "@/content/scenes";
import { ArrowRight, Calendar } from "lucide-react";

type EventCounts = Record<string, number>;

function useUpcomingEventCounts() {
  const [counts, setCounts] = useState<EventCounts>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/curated-events?limit=100")
      .then(r => r.json())
      .then((events: any[]) => {
        if (!Array.isArray(events)) return;
        const now = new Date();
        const upcoming = events.filter(e => {
          if (!e.event_date) return false;
          return new Date(e.event_date) >= now;
        });
        const acc: EventCounts = {};
        for (const e of upcoming) {
          if (e.city) {
            const key = e.city.toLowerCase();
            acc[key] = (acc[key] || 0) + 1;
          }
        }
        setCounts(acc);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { counts, loaded };
}

export default function SceneSnapshot() {
  const { counts, loaded } = useUpcomingEventCounts();

  return (
    <section className="bg-cream border-b-4 border-ink py-14 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 border-b-4 border-ink pb-6">
          <div>
            <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-ink bg-acid-yellow text-ink mb-3">
              Scene Map
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-ink uppercase leading-tight">
              India's Cities
            </h2>
          </div>
          <Link
            href="/discover"
            className="hidden sm:inline-flex items-center gap-2 font-display text-sm uppercase border-4 border-ink px-4 py-2 bg-ink text-cream chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Full Map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* City grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CITY_SCENES.map((city, i) => {
            const isLarge = i === 0; // Bengaluru = large feature tile
            // Match city name against API counts (case-insensitive)
            const cityKey = city.name.toLowerCase();
            const eventCount = counts[cityKey] ?? 0;
            const hasEvents = loaded && eventCount > 0;

            return (
              <Link
                key={city.slug}
                href={`/scene/${city.slug}`}
                className={`group relative border-4 border-ink chunk-shadow hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-transform p-5 flex flex-col justify-between ${city.accentColor} ${isLarge ? "md:col-span-2 min-h-[240px]" : "min-h-[180px]"}`}
              >
                {/* Live event count badge — top-right corner */}
                {hasEvents && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 bg-cream text-ink font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink z-10">
                    <Calendar className="w-3 h-3" />
                    {eventCount} {eventCount === 1 ? "event" : "events"}
                  </span>
                )}
                {/* Skeleton badge while loading */}
                {!loaded && (
                  <span className="absolute top-3 right-3 h-5 w-16 bg-cream/30 border border-cream/20 animate-pulse" />
                )}

                <div>
                  <h3
                    className={`font-display uppercase leading-tight ${city.textColor} ${isLarge ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"}`}
                  >
                    {city.name}
                  </h3>
                  <p className={`text-sm mt-1 ${city.textColor} opacity-70`}>{city.tagline}</p>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {city.activeGenres.slice(0, isLarge ? 4 : 2).map(g => (
                    <span
                      key={g}
                      className={`text-[10px] font-display uppercase px-2 py-0.5 border border-current ${city.textColor} opacity-60`}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <ArrowRight
                  className={`absolute bottom-4 right-4 w-5 h-5 ${city.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </Link>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link
            href="/discover"
            className="block text-center font-display text-sm uppercase border-4 border-ink px-4 py-3 bg-ink text-cream chunk-shadow"
          >
            Explore All Scenes →
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * CcdxSocialHomeStrip — compact homepage section for the CCD × SOCIAL series.
 *
 * Shows:
 *  - Series identity + "NEXT: CCDXSOCIAL 01 · 29 Jun · Indiranagar Social"
 *  - 4 show tiles (01, 02, 03, MEGA) with RSVP on the first
 *  - "See the full series →" CTA
 */

import { Link } from "@/lib/compat-router";

const SHOWS = [
  {
    num: "01",
    name: "CCDXSOCIAL 01",
    date: "29 Jun 2026",
    venue: "Indiranagar Social",
    slug: "ccdxsocial-01",
    bg: "bg-electric-blue",
    text: "text-cream",
    isNext: true,
    isMega: false,
  },
  {
    num: "02",
    name: "CCDXSOCIAL 02",
    date: "27 Jul 2026",
    venue: "Social BLR",
    slug: "ccdxsocial-02",
    bg: "bg-magenta",
    text: "text-cream",
    isNext: false,
    isMega: false,
  },
  {
    num: "03",
    name: "CCDXSOCIAL 03",
    date: "30 Aug 2026",
    venue: "Social BLR",
    slug: "ccdxsocial-03",
    bg: "bg-ink",
    text: "text-cream",
    isNext: false,
    isMega: false,
  },
  {
    num: "MEGA",
    name: "MEGA",
    date: "Oct 2026",
    venue: "Large Format TBA",
    slug: "ccdxsocial-mega",
    bg: "bg-acid-yellow",
    text: "text-ink",
    isNext: false,
    isMega: true,
  },
];

const CcdxSocialHomeStrip = () => (
  <section className="bg-ink border-b-4 border-ink py-14 md:py-20">
    <div className="container">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <p className="font-display text-acid-yellow text-sm uppercase tracking-widest mb-2">/ A SERIES</p>
          <h2 className="font-display text-cream text-4xl md:text-6xl leading-[0.85]">
            CCD × SOCIAL
          </h2>
          <p className="text-cream/60 font-medium text-base mt-2 max-w-md">
            India's first pet-friendly dance series. Outdoor pet zone from 4 PM. Underground music from 9.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/events/ccdxsocial-01"
            className="bg-acid-yellow text-ink font-display text-base md:text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            RSVP NOW →
          </Link>
          <Link
            to="/ccdxsocial"
            className="bg-transparent text-cream font-display text-base md:text-lg px-6 py-3 border-4 border-cream/40 hover:border-cream transition-colors"
          >
            FULL SERIES
          </Link>
        </div>
      </div>

      {/* Next show callout */}
      <div className="bg-acid-yellow border-4 border-cream p-4 md:p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block font-display text-ink text-[10px] uppercase tracking-widest border-2 border-ink px-2 py-0.5 mb-2">▶ NEXT SHOW</span>
          <p className="font-display text-ink text-2xl md:text-3xl leading-none">CCDXSOCIAL 01</p>
          <p className="font-display text-ink/70 text-sm mt-1">Sun, 29 Jun 2026 · Indiranagar Social, Bengaluru</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          <span className="font-display text-ink text-sm border-2 border-ink px-3 py-1">🐾 PETS WELCOME</span>
          <span className="font-display text-ink text-sm border-2 border-ink px-3 py-1">FREE RSVP</span>
          <span className="font-display text-ink text-sm border-2 border-ink px-3 py-1">9 PM FLOOR</span>
        </div>
      </div>

      {/* Show tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SHOWS.map((s) => (
          <Link
            key={s.slug}
            to={`/events/${s.slug}`}
            className={`block border-4 ${s.isNext ? "border-acid-yellow" : "border-cream/20"} ${s.bg} ${s.text} p-4 md:p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform relative`}
          >
            {s.isNext && (
              <span className="absolute -top-3 left-3 bg-acid-yellow text-ink font-display text-[9px] uppercase px-2 py-0.5 border-2 border-ink">▶ NEXT</span>
            )}
            {s.isMega && (
              <span className="absolute -top-3 left-3 bg-magenta text-cream font-display text-[9px] uppercase px-2 py-0.5 border-2 border-ink">★ FINALE</span>
            )}
            <p className={`font-display text-[9px] uppercase tracking-widest mb-2 mt-1 ${s.isMega ? "text-magenta" : s.isNext ? "text-acid-yellow" : "opacity-50"}`}>
              {s.isMega ? "GRAND FINALE" : `SHOW ${s.num}`}
            </p>
            <h3 className="font-display text-lg md:text-xl leading-none mb-2">{s.name}</h3>
            <p className="font-display text-xs opacity-70">{s.date}</p>
            <p className="font-display text-[10px] opacity-50 mt-0.5">{s.venue}</p>
          </Link>
        ))}
      </div>

      {/* Sponsor nudge */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-cream/10 pt-6">
        <p className="text-cream/50 font-medium text-sm">Brand looking to get involved?</p>
        <Link
          to="/ccdxsocial/sponsor"
          className="font-display text-acid-yellow text-sm border-2 border-acid-yellow/40 px-4 py-2 hover:border-acid-yellow transition-colors"
        >
          SPONSOR THE SERIES ✦
        </Link>
      </div>
    </div>
  </section>
);

export default CcdxSocialHomeStrip;

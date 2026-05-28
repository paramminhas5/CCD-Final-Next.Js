"use client";
/**
 * CcdxSocialHomeStrip — homepage section for the CCD × SOCIAL series.
 *
 * Shows a live countdown to the next show (Jun 29), the 4-show sequential
 * timeline with a clear "YOU ARE HERE" marker, and strong RSVP CTA.
 */

import { useEffect, useState } from "react";
import { Link } from "@/lib/compat-router";

// Jun 29 2026 20:00 IST = 14:30 UTC
const NEXT_SHOW_DATE = new Date("2026-06-29T14:30:00Z");

const SHOWS = [
  {
    num: "01",
    name: "CCDXSOCIAL 01",
    date: "Sun 29 Jun",
    venue: "Indiranagar Social",
    slug: "ccdxsocial-01",
    bg: "bg-electric-blue",
    text: "text-cream",
    accentBg: "bg-acid-yellow",
    accentText: "text-ink",
    isNext: true,
    isMega: false,
  },
  {
    num: "02",
    name: "CCDXSOCIAL 02",
    date: "Sun 27 Jul",
    venue: "Social BLR",
    slug: "ccdxsocial-02",
    bg: "bg-magenta",
    text: "text-cream",
    accentBg: "bg-acid-yellow",
    accentText: "text-ink",
    isNext: false,
    isMega: false,
  },
  {
    num: "03",
    name: "CCDXSOCIAL 03",
    date: "Sun 30 Aug",
    venue: "Social BLR",
    slug: "ccdxsocial-03",
    bg: "bg-ink",
    text: "text-cream",
    accentBg: "bg-acid-yellow",
    accentText: "text-ink",
    isNext: false,
    isMega: false,
  },
  {
    num: "★",
    name: "MEGA",
    date: "Oct 2026",
    venue: "Large Format · TBA",
    slug: "ccdxsocial-mega",
    bg: "bg-acid-yellow",
    text: "text-ink",
    accentBg: "bg-magenta",
    accentText: "text-cream",
    isNext: false,
    isMega: true,
  },
];

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, over: true };
    const secs = Math.floor(diff / 1000);
    return {
      days: Math.floor(secs / 86400),
      hours: Math.floor((secs % 86400) / 3600),
      mins: Math.floor((secs % 3600) / 60),
      secs: secs % 60,
      over: false,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const Pad = (n: number) => String(n).padStart(2, "0");

const CcdxSocialHomeStrip = () => {
  const cd = useCountdown(NEXT_SHOW_DATE);

  return (
    <section className="bg-ink border-b-4 border-ink py-14 md:py-20 overflow-hidden">
      <div className="container">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="font-display text-acid-yellow text-xs uppercase tracking-[0.3em] mb-3">
              / CCD × SOCIAL — SEASON 1
            </p>
            <h2 className="font-display text-cream text-5xl md:text-7xl leading-[0.82] mb-3">
              THREE<br />
              <span className="text-magenta">SHOWS.</span><br />
              ONE<br />
              <span className="text-acid-yellow">FINALE.</span>
            </h2>
            <p className="text-cream/55 font-medium text-base max-w-sm leading-snug">
              India's first pet-friendly dance series. Outdoor pet zone from 4 PM. Underground floor from 9.
            </p>
          </div>

          {/* ── Live countdown ── */}
          {!cd.over && (
            <div className="bg-acid-yellow border-4 border-cream p-5 md:p-6 min-w-[260px]">
              <p className="font-display text-ink text-[10px] uppercase tracking-[0.3em] mb-3">
                ▶ NEXT SHOW IN
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { val: cd.days, label: "DAYS" },
                  { val: cd.hours, label: "HRS" },
                  { val: cd.mins, label: "MIN" },
                  { val: cd.secs, label: "SEC" },
                ].map(({ val, label }) => (
                  <div key={label} className="bg-ink border-2 border-ink px-2 py-3">
                    <p className="font-display text-acid-yellow text-3xl md:text-4xl leading-none tabular-nums">
                      {Pad(val)}
                    </p>
                    <p className="font-display text-acid-yellow/60 text-[9px] uppercase tracking-widest mt-1">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="font-display text-ink text-xs mt-3 opacity-70">
                SUN 29 JUN · INDIRANAGAR SOCIAL
              </p>
              <Link
                to="/events/ccdxsocial-01"
                className="mt-3 w-full block text-center bg-ink text-acid-yellow font-display text-sm px-4 py-2.5 border-2 border-ink hover:bg-magenta hover:text-cream transition-colors"
              >
                RSVP — IT'S FREE →
              </Link>
            </div>
          )}
        </div>

        {/* ── Sequential show timeline ── */}
        <div className="relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-[2.2rem] left-[3.5rem] right-[3.5rem] h-[3px] bg-cream/15 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {SHOWS.map((s, i) => (
              <Link
                key={s.slug}
                to={`/events/${s.slug}`}
                className={`
                  group relative block border-4
                  ${s.isNext
                    ? "border-acid-yellow ring-2 ring-acid-yellow ring-offset-2 ring-offset-ink"
                    : "border-cream/15 hover:border-cream/40"}
                  ${s.bg} ${s.text}
                  p-5 md:p-6
                  transition-all duration-200
                  hover:-translate-y-1 hover:translate-x-0.5
                `}
              >
                {/* Step number badge */}
                <div className={`
                  w-9 h-9 rounded-none border-2 border-current flex items-center justify-center mb-4
                  font-display text-base leading-none
                  ${s.isNext ? "bg-acid-yellow text-ink border-acid-yellow" : "bg-transparent opacity-60"}
                `}>
                  {s.isMega ? "★" : i + 1}
                </div>

                {/* Status chip */}
                {s.isNext && (
                  <span className="absolute -top-[14px] left-4 bg-acid-yellow text-ink font-display text-[9px] uppercase tracking-widest px-2.5 py-1 border-2 border-ink">
                    ▶ NEXT UP · 29 JUN
                  </span>
                )}
                {s.isMega && (
                  <span className="absolute -top-[14px] left-4 bg-magenta text-cream font-display text-[9px] uppercase tracking-widest px-2.5 py-1 border-2 border-ink">
                    ★ GRAND FINALE
                  </span>
                )}

                <p className={`font-display text-[9px] uppercase tracking-[0.25em] mb-2 ${s.isMega ? "text-magenta" : s.isNext ? "text-acid-yellow" : "opacity-40"}`}>
                  {s.isMega ? "SEASON FINALE" : `SHOW ${s.num}`}
                </p>
                <h3 className="font-display text-xl md:text-2xl leading-none mb-3">
                  {s.name}
                </h3>
                <p className="font-display text-sm opacity-80">{s.date}</p>
                <p className="font-display text-[10px] opacity-50 mt-1">{s.venue}</p>

                <div className={`mt-4 pt-3 border-t border-current/15 font-display text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${s.isNext ? "opacity-100 !opacity-100" : ""}`}>
                  {s.isNext ? "RSVP FREE →" : s.isMega ? "SEE DETAILS →" : "MORE INFO →"}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t-2 border-cream/10">
          <div className="flex flex-wrap gap-3">
            <Link
              to="/ccdxsocial"
              className="font-display text-cream text-sm border-2 border-cream/30 px-4 py-2 hover:border-cream hover:bg-cream/10 transition-colors"
            >
              FULL SERIES →
            </Link>
            <Link
              to="/ccdxsocial/sponsor"
              className="font-display text-acid-yellow text-sm border-2 border-acid-yellow/30 px-4 py-2 hover:border-acid-yellow hover:bg-acid-yellow/10 transition-colors"
            >
              SPONSOR THE SERIES ✦
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-display text-cream/40 uppercase tracking-widest">
            <span className="border border-cream/20 px-2 py-1">🐾 PETS WELCOME</span>
            <span className="border border-cream/20 px-2 py-1">FREE RSVP</span>
            <span className="border border-cream/20 px-2 py-1">4 PM PET ZONE</span>
            <span className="border border-cream/20 px-2 py-1">9 PM FLOOR</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CcdxSocialHomeStrip;

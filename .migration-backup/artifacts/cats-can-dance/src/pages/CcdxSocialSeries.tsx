/**
 * CCD × SOCIAL — Public-facing series landing page.
 * Lives at /ccdxsocial
 *
 * Structure:
 *   1. Hero            — Series identity, countdown to next show, CTAs
 *   2. Marquee
 *   3. Concept         — Two communities, one room + stats
 *   4. Series timeline — Sequential 4-step journey with YOU ARE HERE
 *   5. What to expect  — Pet zone · DJ floor · Market
 *   6. Sponsor strip
 *   7. Proposal strip
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import SEO from "@/components/SEO";
import catDjHero from "@/assets/cat-dj-hero.png";
import { imgUrl } from "@/lib/img";

// ── Countdown ─────────────────────────────────────────────────────────────────
const NEXT_SHOW_DATE = new Date("2026-06-29T14:30:00Z"); // 8 PM IST

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, over: true };
    const s = Math.floor(diff / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      mins: Math.floor((s % 3600) / 60),
      secs: s % 60,
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

// ── Show data ─────────────────────────────────────────────────────────────────
const SHOWS = [
  {
    step: 1,
    num: "01",
    slug: "ccdxsocial-01",
    name: "CCDXSOCIAL 01",
    date: "Sun, 29 Jun 2026",
    venue: "Indiranagar Social, BLR",
    tagline: "Broad · Welcoming · First Impression",
    desc: "The first chapter. Portrait booth, lookalike contest, vendor market in the afternoon. Startdawg b2b Merman take the floor at 9. The pack meets for the first time.",
    activities: ["🎨 Pet Portrait Booth", "👯 Lookalike Contest", "🛍️ Vendor Market", "🎧 Startdawg b2b Merman"],
    bg: "bg-electric-blue",
    text: "text-cream",
    accent: "text-acid-yellow",
    isNext: true,
    isMega: false,
  },
  {
    step: 2,
    num: "02",
    slug: "ccdxsocial-02",
    name: "CCDXSOCIAL 02",
    date: "Sun, 27 Jul 2026",
    venue: "Social BLR (TBC)",
    tagline: "Style · Fashion · Midsummer Energy",
    desc: "The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo, best-dressed contest, dedicated photography corner.",
    activities: ["✂️ Live Grooming Demo", "👗 Best-Dressed Contest", "📸 Style Photo Corner", "🎧 Startdawg b2b Merman"],
    bg: "bg-magenta",
    text: "text-cream",
    accent: "text-acid-yellow",
    isNext: false,
    isMega: false,
  },
  {
    step: 3,
    num: "03",
    slug: "ccdxsocial-03",
    name: "CCDXSOCIAL 03",
    date: "Sun, 30 Aug 2026",
    venue: "Social BLR (TBC)",
    tagline: "Agility · Performance · Pre-Finale",
    desc: "The most physical show. Two agility courses, timed speed runs, performance contest. MEGA tickets drop exclusively at this event.",
    activities: ["🏃 Two Agility Courses", "⚡ Timed Speed Run", "🎟️ MEGA Ticket Drop", "🎧 Startdawg b2b Merman"],
    bg: "bg-ink",
    text: "text-cream",
    accent: "text-acid-yellow",
    isNext: false,
    isMega: false,
  },
  {
    step: 4,
    num: "★",
    slug: "ccdxsocial-mega",
    name: "MEGA",
    date: "October 2026",
    venue: "TBA — Large Format",
    tagline: "Grand Finale · Season Closer",
    desc: "Everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. The whole pack in one place.",
    activities: ["🎪 Full Outdoor Stage", "🐾 Pet Runway", "🏆 Agility Finals", "🎧 Full Lineup TBA"],
    bg: "bg-acid-yellow",
    text: "text-ink",
    accent: "text-magenta",
    isNext: false,
    isMega: true,
  },
];

const PILLARS = [
  {
    icon: "🐾",
    title: "THE PET ZONE",
    body: "Outdoor pet zone runs all afternoon from 4 PM — agility courses, portrait booths, vendor market, and activities that change every show.",
    bg: "bg-electric-blue",
    text: "text-cream",
  },
  {
    icon: "🎧",
    title: "THE FLOOR",
    body: "Doors open at 8 PM. Music kicks in at 9. Startdawg b2b Merman hold it down every show, with a special guest on the late slot.",
    bg: "bg-magenta",
    text: "text-cream",
  },
  {
    icon: "🛍️",
    title: "THE MARKET",
    body: "2–3 curated brands per show. Pet-first vendors: nutrition, accessories, grooming, photography. No randomness — every brand is chosen.",
    bg: "bg-acid-yellow",
    text: "text-ink",
  },
];

const STATS = [
  { val: "3", label: "Mini shows" },
  { val: "1", label: "Grand finale" },
  { val: "~200", label: "Pax per show" },
  { val: "2,000+", label: "At MEGA" },
  { val: "Free", label: "Entry — RSVP only" },
  { val: "🐾", label: "Pets welcome" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function CcdxSocialSeries() {
  const cd = useCountdown(NEXT_SHOW_DATE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventSeries",
    name: "CCD × SOCIAL",
    description:
      "India's first curated pet lifestyle festival series — underground dance music + outdoor pet zone. 3 shows + grand finale at Social BLR, Jun–Oct 2026.",
    url: "https://catscandance.com/ccdxsocial",
    organizer: {
      "@type": "Organization",
      name: "Cats Can Dance",
      url: "https://catscandance.com",
    },
    location: {
      "@type": "Place",
      name: "Social, Bengaluru",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
  };

  return (
    <>
      <SEO
        title="CCD × SOCIAL — India's First Pet-Friendly Dance Series | Cats Can Dance"
        description="3 shows + MEGA grand finale. Underground dance music meets outdoor pet lifestyle. Jun–Oct 2026 at Social BLR. Free RSVP."
        path="/ccdxsocial"
        keywords="CCD social bangalore, pet friendly dance event india, cats can dance social, underground music pets bangalore"
        jsonLd={jsonLd}
      />

      <main className="bg-cream text-ink">
        <Nav />

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="bg-ink pt-28 pb-0 md:pt-36 border-b-4 border-ink overflow-hidden">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-8 items-end">
              <div className="pb-16 md:pb-20">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-acid-yellow text-acid-yellow">
                    Series
                  </span>
                  <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-cream/30 text-cream/60">
                    Jun – Oct 2026
                  </span>
                  <span className="inline-block font-display text-xs uppercase px-3 py-1 border-2 border-cream/30 text-cream/60">
                    Bengaluru
                  </span>
                </div>

                <h1 className="font-display text-[13vw] lg:text-[7vw] text-cream uppercase leading-[0.85] mb-6 drop-shadow-[6px_6px_0_hsl(var(--magenta))]">
                  CATS<br />
                  <span className="text-magenta">CAN</span><br />
                  DANCE<br />
                  <span className="text-acid-yellow">× SOCIAL</span>
                </h1>

                <p className="text-cream/80 font-medium text-lg md:text-xl max-w-xl leading-relaxed mb-8">
                  India's first curated pet lifestyle festival. Outdoor pet zone in the afternoon.
                  Underground dance music after dark. Three shows. One grand finale.
                </p>

                {/* Live countdown block */}
                {!cd.over ? (
                  <div className="bg-acid-yellow border-4 border-cream p-4 mb-6 inline-block min-w-[280px]">
                    <p className="font-display text-ink text-[10px] uppercase tracking-[0.3em] mb-3">
                      ▶ CCDXSOCIAL 01 IN
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 text-center mb-3">
                      {[
                        { val: cd.days, label: "DAYS" },
                        { val: cd.hours, label: "HRS" },
                        { val: cd.mins, label: "MIN" },
                        { val: cd.secs, label: "SEC" },
                      ].map(({ val, label }) => (
                        <div key={label} className="bg-ink px-2 py-2">
                          <p className="font-display text-acid-yellow text-2xl leading-none tabular-nums">
                            {Pad(val)}
                          </p>
                          <p className="font-display text-acid-yellow/50 text-[9px] uppercase mt-0.5">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="font-display text-ink/70 text-xs">
                      SUN 29 JUN · INDIRANAGAR SOCIAL
                    </p>
                  </div>
                ) : (
                  <div className="bg-acid-yellow border-4 border-cream p-4 mb-6 inline-block">
                    <p className="font-display text-ink text-xs uppercase tracking-widest mb-1">/ NEXT SHOW</p>
                    <p className="font-display text-ink text-2xl leading-none">CCDXSOCIAL 01</p>
                    <p className="font-display text-ink/70 text-sm mt-1">Sun, 29 Jun 2026 · Indiranagar Social</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/events/ccdxsocial-01"
                    className="bg-acid-yellow text-ink font-display text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                  >
                    RSVP NOW →
                  </Link>
                  <Link
                    href="/ccdxsocial/sponsor"
                    className="bg-magenta text-cream font-display text-lg px-6 py-3 border-4 border-cream chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                  >
                    SPONSOR THE SERIES ✦
                  </Link>
                </div>
              </div>

              <div className="flex justify-end items-end self-end">
                <img
                  src={imgUrl(catDjHero)}
                  alt="CCD cat DJ — CCD × SOCIAL series"
                  className="w-full max-w-[460px] object-contain select-none pointer-events-none"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <Marquee
          bg="bg-magenta"
          items={["CCDXSOCIAL 01", "29 JUN · NEXT UP", "CCDXSOCIAL 02", "27 JUL", "CCDXSOCIAL 03", "30 AUG", "MEGA · OCT", "PETS WELCOME", "FREE RSVP", "9 PM SHARP"]}
        />

        {/* ── CONCEPT ── */}
        <section className="container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="font-display text-magenta text-sm uppercase tracking-widest mb-4">/ THE IDEA</p>
              <h2 className="font-display text-ink text-4xl md:text-6xl uppercase leading-[0.9] mb-6">
                TWO COMMUNITIES.<br />ONE ROOM.
              </h2>
              <p className="text-ink/80 font-medium text-lg leading-relaxed mb-4">
                CCD × SOCIAL brings together two of the most passionate crowds in Bangalore —
                pet parents and underground music fans — and gives them an afternoon and an evening
                worth leaving the house for.
              </p>
              <p className="text-ink/70 font-medium leading-relaxed">
                Pet zone opens at 4 PM. Floor opens at 8 PM.
                It's not a gimmick — it's a different kind of Sunday.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-cream border-4 border-ink chunk-shadow p-4 flex flex-col items-center justify-center text-center min-h-[100px]"
                >
                  <p className="font-display text-3xl md:text-4xl text-ink leading-none mb-1">{s.val}</p>
                  <p className="font-display text-[10px] uppercase tracking-widest text-ink/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERIES TIMELINE — Sequential journey ─────────────────────────── */}
        <section className="bg-ink border-y-4 border-ink py-16 md:py-24 overflow-hidden">
          <div className="container">
            <p className="font-display text-acid-yellow text-sm uppercase tracking-widest mb-2">/ THE SEASON</p>
            <h2 className="font-display text-cream text-4xl md:text-6xl uppercase leading-[0.9] mb-4">
              THE JOURNEY.
            </h2>
            <p className="text-cream/50 font-medium max-w-lg mb-14">
              Four events. One arc. Each show builds on the last — and MEGA closes it all out.
            </p>

            {/* ── Step progress bar (desktop) ── */}
            <div className="hidden md:flex items-center mb-8 px-6">
              {SHOWS.map((show, i) => (
                <div key={show.num} className="flex items-center flex-1 last:flex-none">
                  {/* Step circle */}
                  <div className={`
                    w-10 h-10 border-4 flex items-center justify-center font-display text-sm shrink-0 z-10
                    ${show.isNext
                      ? "bg-acid-yellow border-acid-yellow text-ink"
                      : show.isMega
                        ? "bg-magenta border-magenta text-cream"
                        : "bg-cream/10 border-cream/30 text-cream/50"}
                  `}>
                    {show.isMega ? "★" : show.step}
                  </div>
                  {/* Connector line */}
                  {i < SHOWS.length - 1 && (
                    <div className={`flex-1 h-[3px] mx-1 ${i === 0 ? "bg-acid-yellow/40" : "bg-cream/10"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Show cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {SHOWS.map((show) => (
                <div
                  key={show.num}
                  className={`
                    relative flex flex-col border-4
                    ${show.isNext
                      ? "border-acid-yellow ring-2 ring-acid-yellow/30 ring-offset-4 ring-offset-ink"
                      : show.isMega
                        ? "border-magenta"
                        : "border-cream/15"}
                    ${show.bg} ${show.text}
                    p-6
                  `}
                >
                  {/* YOU ARE HERE chip */}
                  {show.isNext && (
                    <span className="absolute -top-[15px] left-4 bg-acid-yellow text-ink font-display text-[9px] uppercase tracking-[0.2em] px-3 py-1 border-2 border-ink">
                      ▶ YOU ARE HERE · NEXT UP
                    </span>
                  )}
                  {show.isMega && (
                    <span className="absolute -top-[15px] left-4 bg-magenta text-cream font-display text-[9px] uppercase tracking-[0.2em] px-3 py-1 border-2 border-ink">
                      ★ GRAND FINALE
                    </span>
                  )}

                  {/* Step + capacity */}
                  <div className="flex items-start justify-between mt-2 mb-4">
                    <span className={`font-display text-[10px] uppercase tracking-widest ${show.accent}`}>
                      {show.isMega ? "SEASON FINALE" : `SHOW ${show.num}`}
                    </span>
                    <span className="font-display text-[10px] uppercase px-2 py-0.5 border border-current opacity-50">
                      {show.isMega ? "2,000+" : "~200"} pax
                    </span>
                  </div>

                  <h3 className="font-display text-3xl md:text-4xl leading-none mb-2">{show.name}</h3>
                  <p className={`font-display text-xs uppercase tracking-widest mb-4 ${show.accent}`}>
                    {show.tagline}
                  </p>
                  <p className="font-medium text-sm opacity-80 leading-snug mb-5 flex-1">{show.desc}</p>

                  {/* Activity list */}
                  <div className="space-y-1.5 mb-5">
                    {show.activities.map((a) => (
                      <p key={a} className="font-display text-xs opacity-60">{a}</p>
                    ))}
                  </div>

                  {/* Date + CTA */}
                  <div className="border-t border-current/20 pt-4 mt-auto flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-sm leading-none">{show.date}</p>
                      <p className="font-display text-[10px] opacity-50 mt-1">{show.venue}</p>
                    </div>
                    <Link
                      href={`/events/${show.slug}`}
                      className={`
                        shrink-0 font-display text-xs uppercase px-3 py-2 border-2 border-current
                        transition-all hover:opacity-80
                        ${show.isNext ? "bg-acid-yellow text-ink border-acid-yellow" : ""}
                      `}
                    >
                      {show.isNext ? "RSVP FREE →" : show.isMega ? "SEE DETAILS →" : "MORE INFO →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Season progress footer ── */}
            <div className="mt-10 border-t-2 border-cream/10 pt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-cream/40 text-xs uppercase tracking-widest mb-1">
                  Season 1 — Jun to Oct 2026
                </p>
                <p className="font-display text-cream text-lg">
                  Show 1 of 4 coming up.{" "}
                  <span className="text-acid-yellow">
                    {!cd.over ? `${cd.days} days away.` : "Happening now."}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/events/ccdxsocial-01"
                  className="bg-acid-yellow text-ink font-display text-sm px-5 py-2.5 border-4 border-acid-yellow chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                >
                  RSVP FOR SHOW 01 →
                </Link>
                <Link
                  href="/ccdxsocial/sponsor"
                  className="bg-transparent text-cream font-display text-sm px-5 py-2.5 border-4 border-cream/30 hover:border-cream transition-colors"
                >
                  SPONSOR THE SERIES ✦
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT ── */}
        <section className="container py-16 md:py-24">
          <p className="font-display text-magenta text-sm uppercase tracking-widest mb-4">/ WHAT YOU GET</p>
          <h2 className="font-display text-ink text-4xl md:text-6xl uppercase leading-[0.9] mb-12">
            EVERY SHOW.<br />SAME FORMULA.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className={`${p.bg} ${p.text} border-4 border-ink chunk-shadow p-6 md:p-8`}
              >
                <p className="text-4xl mb-4" aria-hidden>{p.icon}</p>
                <h3 className="font-display text-2xl md:text-3xl leading-none mb-3">{p.title}</h3>
                <p className="font-medium opacity-85 leading-snug">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SPONSOR CTA ── */}
        <section className="bg-magenta border-y-4 border-ink py-16 md:py-24">
          <div className="container grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-display text-acid-yellow text-sm uppercase tracking-widest mb-4">/ FOR BRANDS</p>
              <h2 className="font-display text-cream text-4xl md:text-6xl uppercase leading-[0.9] mb-4 drop-shadow-[4px_4px_0_hsl(var(--ink))]">
                SPONSOR<br />THE SERIES.
              </h2>
              <p className="text-cream/90 font-medium text-lg leading-relaxed max-w-lg mb-6">
                3 shows + MEGA. Urban 24–45 crowd, deeply passionate about their
                pets and their music. Your brand is not a banner — it's part of the room.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/ccdxsocial/sponsor"
                  className="bg-acid-yellow text-ink font-display text-xl px-8 py-4 border-4 border-ink chunk-shadow-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
                >
                  SEE SPONSOR TIERS →
                </Link>
                <a
                  href="mailto:hello@catscandance.com?subject=CCD×SOCIAL Sponsorship"
                  className="bg-transparent text-cream font-display text-xl px-8 py-4 border-4 border-cream hover:bg-ink transition-colors"
                >
                  EMAIL US
                </a>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Series Partner", desc: "All 3 shows + MEGA — headline presence everywhere" },
                { label: "Show Sponsor", desc: "Own a single night end to end" },
                { label: "Community Supporter", desc: "Light touch across all shows" },
              ].map((t) => (
                <Link
                  key={t.label}
                  href="/ccdxsocial/sponsor"
                  className="bg-cream border-4 border-ink chunk-shadow p-4 flex items-center justify-between gap-4 hover:bg-acid-yellow transition-colors block"
                >
                  <div>
                    <p className="font-display text-ink text-lg">{t.label}</p>
                    <p className="text-ink/60 text-sm font-medium">{t.desc}</p>
                  </div>
                  <span className="shrink-0 font-display text-ink text-sm">ENQUIRE →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── B2B STRIP ── */}
        <section className="bg-cream border-b-4 border-ink py-12">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display text-magenta text-sm uppercase tracking-widest mb-1">/ FOR VENUES & PARTNERS</p>
              <h3 className="font-display text-ink text-2xl md:text-3xl uppercase">
                Want to see the full proposal?
              </h3>
              <p className="text-ink/60 font-medium mt-1">
                Revenue structure, co-marketing plan, venue requirements, national expansion roadmap.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/ccdxsocial/proposal"
                className="bg-ink text-cream font-display text-sm px-6 py-3 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                VIEW PROPOSAL →
              </Link>
              <a
                href="mailto:hello@catscandance.com?subject=CCD×SOCIAL Partnership"
                className="bg-cream text-ink font-display text-sm px-6 py-3 border-4 border-ink hover:bg-acid-yellow transition-colors"
              >
                EMAIL US
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}

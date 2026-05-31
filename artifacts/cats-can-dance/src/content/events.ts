/**
 * Per-event editorial content + static fallback rows.
 *
 * Two halves:
 *
 * CCD × SOCIAL — Season 1 show structure:
 *   Show 01 · 29 Jun 2026 → CCDXSOCIAL 01   (broad, welcoming, first impression)
 *   Show 02 · 27 Jul 2026 → CCDXSOCIAL 02   (style, fashion, summer energy)
 *   Show 03 · 30 Aug 2026 → CCDXSOCIAL 03   (agility, performance, pre-finale)
 *   Grand Finale · Oct 2026 → MEGA          (large format, season closer)
 *
 * Past episodes:
 *   CCD AT BAR WILD · 2 Apr 2025 → Bar Wild, Indiranagar
 */

import type {
  EventContent,
  EventRow,
  EventViewModel,
  VibePillar,
} from "@/types/events";

// ──────────────────── Defaults by event_type ────────────────────

const DEFAULT_VIBE_PILLARS_STANDARD: VibePillar[] = [
  { icon: "🎧", label: "MUSIC",     desc: "Underground house, disco, garage, jungle, and D&B — curated, never random." },
  { icon: "🪩", label: "FLOOR",     desc: "Intimate room, real sound, no dress code beyond move." },
  { icon: "🐾", label: "COMMUNITY", desc: "RSVP-only. Capacity controlled. The pack moves together." },
];

const DEFAULT_VIBE_PILLARS_CCDXSOCIAL: VibePillar[] = [
  { icon: "🐾", label: "PETS",   desc: "Outdoor pet zone with activities, agility tasters, and a portrait booth — runs all afternoon." },
  { icon: "🎧", label: "FLOOR",  desc: "Doors open at 8. Music kicks in at 9 with Startdawg b2b Merman + a special guest." },
  { icon: "🛍️", label: "MARKET", desc: "Curated vendor market: pet-first brands, streetwear, food, and CCD drops." },
];

// ──────────────────── Static fallback rows ────────────────────
// Mirrors public/ccdxsocial-seed.sql — used by EventDetail when the DB row
// for a slug isn't available yet (env var missing, seed not run, etc.).

export const EVENT_ROWS: Record<string, EventRow> = {
  // ─── Past episodes ───────────────────────────────────────────────────────
  "episode-1": {
    slug: "episode-1",
    title: "CCD AT BAR WILD",
    date: "Wed, Apr 2, 2025",
    city: "Bangalore",
    venue: "Bar Wild",
    blurb:
      "The first Cats Can Dance episode. Bar Wild, Indiranagar. The room that started it — house, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.",
    lineup: ["Startdawg", "Merman"],
    status: "past",
    poster_url: null,
    sort_order: 0,
    series: null,
    series_label: null,
    event_type: "standard",
    pet_friendly: false,
    series_tagline: null,
    is_finale: false,
  },

  "ccdxsocial-01": {
    slug: "ccdxsocial-01",
    title: "CCDXSOCIAL 01",
    date: "Sun, Jun 29, 2026",
    city: "Bangalore",
    venue: "Indiranagar Social",
    blurb:
      "India's first curated pet lifestyle festival meets underground dance music. The first chapter — outdoor pet zone from 4 PM with activities, vendor market, portrait booth, and lookalike contest. Then Startdawg b2b Merman take the floor at 9. The pack meets for the first time.",
    lineup: ["Startdawg", "Merman", "TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 1,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "BROAD · WELCOMING · FIRST IMPRESSION",
    is_finale: false,
  },

  "ccdxsocial-02": {
    slug: "ccdxsocial-02",
    title: "CCDXSOCIAL 02",
    date: "Sun, Jul 27, 2026",
    city: "Bangalore",
    venue: "Social BLR (TBC)",
    blurb:
      "The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo on stage, best-dressed contest for pets and parents, dedicated photography corner. Startdawg b2b Merman bring the floor into the night.",
    lineup: ["Startdawg", "Merman", "TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 2,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "STYLE · FASHION · MIDSUMMER ENERGY",
    is_finale: false,
  },

  "ccdxsocial-03": {
    slug: "ccdxsocial-03",
    title: "CCDXSOCIAL 03",
    date: "Sun, Aug 30, 2026",
    city: "Bangalore",
    venue: "Social BLR (TBC)",
    blurb:
      "The most physical show. Two agility courses, timed speed runs, performance contest open to any breed. MEGA tickets drop exclusively at this event. One more show, then everything.",
    lineup: ["Startdawg", "Merman", "TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 3,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "AGILITY · PERFORMANCE · PRE-FINALE",
    is_finale: false,
  },

  "ccdxsocial-mega": {
    slug: "ccdxsocial-mega",
    title: "MEGA",
    date: "Oct 2026 — Date TBA",
    city: "Bangalore",
    venue: "Venue TBA — Large Format",
    blurb:
      "The season finale. Everything the series has been building to. 2,000+ people, full outdoor stage, pet runway, agility finals, complete DJ lineup TBA. The biggest thing we've ever done. Sponsorship enquiries open now.",
    lineup: ["Startdawg", "Merman", "Full lineup TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 4,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "SEASON FINALE · GRAND FORMAT",
    is_finale: true,
  },
};

/** Static fallback lookup — used by EventDetail when Supabase is empty. */
export function getStaticEventRow(slug: string): EventRow | null {
  return EVENT_ROWS[slug] ?? null;
}

/** All static rows that share a series — for the SeriesStrip fallback. */
export function getStaticEventsBySeries(series: string): EventRow[] {
  return Object.values(EVENT_ROWS)
    .filter((e) => e.series === series)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// ──────────────────── Per-slug rich content ────────────────────

export const EVENT_CONTENT: Record<string, EventContent> = {

  // ─── Past Episodes ───────────────────────────────────────────────

  "episode-1": {
    narrative:
      "The first Cats Can Dance episode. Bar Wild, Indiranagar. The room that started it — house, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.",
    vibe_pillars: DEFAULT_VIBE_PILLARS_STANDARD,
    venue_address: "Bar Wild, 1st Cross, Stage 2, Indiranagar, Bengaluru 560038",
    venue_map_url: "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    price_text: "FREE — RSVP only",
  },

  // ─── CCD × SOCIAL — Show 01: CCDXSOCIAL 01 ───────────────────────

  "ccdxsocial-01": {
    cta_label: "RSVP — IT'S FREE →",

    narrative:
      "CCDXSOCIAL 01 is the first chapter. Wide open — first impression, big tent, easy yes. The afternoon belongs to the animals: portrait booth, lookalike contest, vendor market. Then the room flips at 8 and Startdawg b2b Merman take the floor. The pack meets for the first time.",

    vibe_pillars: DEFAULT_VIBE_PILLARS_CCDXSOCIAL,

    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",

    schedule: [
      { time: "4:00 PM",  what: "Gates open · pet zone begins · vendor market opens" },
      { time: "4:30 PM",  what: "Pet portrait booth · lookalike contest begins" },
      { time: "6:00 PM",  what: "Lookalike contest results · crowd vote" },
      { time: "7:30 PM",  what: "Pet zone wraps · portrait booth final calls" },
      { time: "8:00 PM",  what: "Doors open for the night · room resets" },
      { time: "9:00 PM",  what: "Startdawg b2b Merman take the floor", highlight: true },
      { time: "11:00 PM", what: "Special guest set (TBA)" },
      { time: "1:00 AM",  what: "Last drinks · last dance" },
    ],

    artist_details: {
      "Startdawg": {
        name: "Startdawg",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "startdawg",
        blurb: "Bangalore staple. House selector with a soft spot for disco edits and the long build.",
      },
      "Merman": {
        name: "Merman",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "merman",
        blurb: "Garage, jungle, and the kind of low-end that fixes posture problems.",
      },
      "TBA": {
        name: "TBA",
        role: "Special Guest",
        set_time: "11 PM — late",
        tba: true,
        blurb: "Announcement next week.",
      },
    },

    venue_address:    "Indiranagar Social, 1st Cross, Stage 2, Indiranagar, Bengaluru 560038",
    venue_map_url:    "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    venue_geo:        { lat: 12.9707654, lng: 77.6476266 },
    venue_embed_url:  "https://www.google.com/maps?q=Indiranagar+Social+Bengaluru&output=embed",
    capacity:         250,
    dress_code:       "Wear what dances. Pets in their best.",
    house_rules:      "Vaccinated pets only · short leads · water bowls provided · no flash on the floor",
    price_text:       "FREE — RSVP only",

    partners: [
      { name: "Social", role: "Series Partner", href: "/ccdxsocial" },
    ],

    marquee_items: [
      "CCDXSOCIAL 01",
      "PETS WELCOME",
      "29 JUN · INDIRANAGAR SOCIAL",
      "9 PM SHARP",
      "B2B ALL NIGHT",
    ],
  },

  // ─── CCD × SOCIAL — Show 02: CCDXSOCIAL 02 ───────────────────────

  "ccdxsocial-02": {
    cta_label: "RSVP — IT'S FREE →",

    narrative:
      "CCDXSOCIAL 02 is the style chapter — midsummer, outdoors, everyone looking their best. Live grooming demo on stage, a best-dressed contest for pets and parents alike, and a dedicated photography corner. When the sun drops, Startdawg b2b Merman bring the floor into the night.",

    vibe_pillars: [
      { icon: "✂️", label: "STYLE",   desc: "Live grooming demo on stage. Best-dressed contest for pets and parents." },
      { icon: "📸", label: "LOOKS",   desc: "Dedicated style photography corner. The most content of any show this season." },
      { icon: "🎧", label: "FLOOR",   desc: "Doors at 8, music at 9. Same residents, sharper energy." },
    ],

    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",

    schedule: [
      { time: "4:00 PM",  what: "Gates open · vendor market · style photography corner opens" },
      { time: "4:30 PM",  what: "Live grooming demo on stage" },
      { time: "5:30 PM",  what: "Best-dressed contest — pet · parent · duo categories" },
      { time: "6:30 PM",  what: "Results · crowd vote · winners announced" },
      { time: "7:30 PM",  what: "Pet zone wraps" },
      { time: "8:00 PM",  what: "Doors open for the night" },
      { time: "9:00 PM",  what: "Startdawg b2b Merman take the floor", highlight: true },
      { time: "11:00 PM", what: "Special guest set (TBA)" },
      { time: "1:00 AM",  what: "Last drinks · last dance" },
    ],

    artist_details: {
      "Startdawg": {
        name: "Startdawg",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "startdawg",
        blurb: "House selector with a soft spot for disco edits and the long build.",
      },
      "Merman": {
        name: "Merman",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "merman",
        blurb: "Garage, jungle, and the kind of low-end that fixes posture problems.",
      },
    },

    venue_address:  "Social BLR (Venue TBC)",
    venue_map_url:  "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    capacity:       250,
    dress_code:     "Come dressed. Pets too.",
    house_rules:    "Vaccinated pets only · short leads · water bowls provided",
    price_text:     "FREE — RSVP only",

    partners: [
      { name: "Social", role: "Series Partner", href: "/ccdxsocial" },
    ],

    marquee_items: [
      "CCDXSOCIAL 02",
      "MIDSUMMER",
      "27 JUL · SOCIAL BLR",
      "BEST DRESSED",
      "9 PM SHARP",
    ],
  },

  // ─── CCD × SOCIAL — Show 03: CCDXSOCIAL 03 ──────────────────────

  "ccdxsocial-03": {
    cta_label: "RSVP — IT'S FREE →",

    narrative:
      "CCDXSOCIAL 03 is the last show before the finale — and the most physical. Two agility courses, a timed speed run, a performance contest open to any breed. The community is fully formed by now. Finale tickets drop exclusively at this event. One more show, then everything.",

    vibe_pillars: [
      { icon: "🏃", label: "AGILITY",  desc: "Two outdoor courses, timed speed runs, performance contest. Open to any breed, any age." },
      { icon: "🎟️", label: "FINALE",   desc: "MEGA tickets drop exclusively at this show. First access for attendees only." },
      { icon: "🎧", label: "FLOOR",    desc: "9 PM sharp. Startdawg b2b Merman one last time before the big one." },
    ],

    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",

    schedule: [
      { time: "4:00 PM",  what: "Gates open · pet zone begins · vendor market" },
      { time: "4:30 PM",  what: "Agility course warm-up · meet the trainers" },
      { time: "5:30 PM",  what: "Timed speed runs · leaderboard goes live" },
      { time: "6:30 PM",  what: "Performance contest · best paw · fastest breed" },
      { time: "7:00 PM",  what: "🎟️ MEGA tickets on sale — attendees only", highlight: true },
      { time: "7:30 PM",  what: "Pet zone wraps · portrait booth final calls" },
      { time: "8:00 PM",  what: "Doors open for the night" },
      { time: "9:00 PM",  what: "Startdawg b2b Merman take the floor", highlight: true },
      { time: "11:00 PM", what: "Special guest set (TBA)" },
      { time: "1:00 AM",  what: "Last drinks · see you at MEGA" },
    ],

    artist_details: {
      "Startdawg": {
        name: "Startdawg",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "startdawg",
        blurb: "House selector with a soft spot for disco edits and the long build.",
      },
      "Merman": {
        name: "Merman",
        role: "Resident",
        set_time: "9 PM — 11 PM (b2b)",
        slug: "merman",
        blurb: "Garage, jungle, and the kind of low-end that fixes posture problems.",
      },
    },

    venue_address:  "Social BLR (Venue TBC)",
    venue_map_url:  "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    capacity:       250,
    dress_code:     "Wear what moves. Pets in their game gear.",
    house_rules:    "Vaccinated pets only · short leads · water bowls provided",
    price_text:     "FREE — RSVP only",

    partners: [
      { name: "Social", role: "Series Partner", href: "/ccdxsocial" },
    ],

    marquee_items: [
      "CCDXSOCIAL 03",
      "AGILITY FINALS",
      "30 AUG · SOCIAL BLR",
      "MEGA TICKETS DROP HERE",
      "9 PM SHARP",
    ],
  },

  // ─── CCD × SOCIAL — Grand Finale: MEGA ──────────────────────────

  "ccdxsocial-mega": {
    cta_label: "GET TICKETS →",

    narrative:
      "MEGA is the season finale — everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. A complete DJ lineup yet to be announced. The biggest thing we've ever done, and the whole pack in one place.",

    vibe_pillars: [
      { icon: "🎪", label: "SCALE",    desc: "Full outdoor stage. 2,000+ capacity. Pet runway and agility finals." },
      { icon: "🎧", label: "LINEUP",   desc: "Headliner TBA. Full reveal closer to date. Resident support confirmed." },
      { icon: "🐾", label: "THE PACK", desc: "The whole community in one place. The pups know their parents by now." },
    ],

    doors_time:  "TBA",
    peak_time:   "TBA",
    price_text:  "Tickets from CCDXSOCIAL 03 · General on sale soon",
    capacity:    2000,

    partners: [
      { name: "Social", role: "Series Partner", href: "/ccdxsocial" },
    ],

    marquee_items: [
      "MEGA",
      "SEASON FINALE",
      "2000+ PEOPLE",
      "PET RUNWAY",
      "OCTOBER 2026",
    ],
  },
};

// ──────────────────── Resolution helpers ────────────────────

/**
 * Pick sensible default vibe pillars based on event_type / series.
 */
function defaultsFor(row: Pick<EventRow, "event_type" | "series">): EventContent {
  const type = row.event_type ?? row.series ?? "standard";
  return {
    vibe_pillars:
      type === "ccdxsocial"
        ? DEFAULT_VIBE_PILLARS_CCDXSOCIAL
        : DEFAULT_VIBE_PILLARS_STANDARD,
    price_text: "FREE — RSVP only",
  };
}

/** Merge per-slug content with sensible defaults. Always returns a value. */
export function getEventContent(row: EventRow): EventContent {
  const explicit = EVENT_CONTENT[row.slug] ?? {};
  const fallback = defaultsFor(row);
  return { ...fallback, ...explicit };
}

/** Convenience: build the merged ViewModel for a row. */
export function toViewModel(row: EventRow): EventViewModel {
  return { ...row, content: getEventContent(row) };
}

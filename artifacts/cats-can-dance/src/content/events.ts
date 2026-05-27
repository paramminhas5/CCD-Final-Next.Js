/**
 * Per-event editorial content + static fallback rows.
 *
 * Two halves:
 *
 *   1. EVENT_ROWS    — minimal `EventRow` shape per slug. Acts as the
 *                      static fallback when Supabase is empty / unreachable.
 *                      Source of truth = ccdxsocial-seed.sql; keep in sync.
 *
 *   2. EVENT_CONTENT — rich editorial copy (vibe pillars, schedule, venue
 *                      address, partners). Lives only in source so it can
 *                      be reviewed in PRs.
 *
 * To add a brand-new event:
 *   1. Add an entry to EVENT_ROWS (slug → core fields).
 *   2. Optionally add an EVENT_CONTENT entry for rich copy.
 *   3. Optionally insert a Supabase row (CMS-edits will then take over).
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
  "ccdxsocial-debut": {
    slug: "ccdxsocial-debut",
    title: "THE DEBUT",
    date: "Sat, Jun 21, 2026",
    city: "Bangalore",
    venue: "Social, Indiranagar",
    blurb:
      "India's first curated pet lifestyle festival meets underground dance music. The Debut is the first chapter — outdoor pet zone from 4PM with activities, vendor market, agility tasters and portrait booth. Then Startdawg and Merman take over for the night.",
    lineup: ["Startdawg", "Merman", "TBA", "TBA", "TBA"],
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

  "ccdxsocial-groom-room": {
    slug: "ccdxsocial-groom-room",
    title: "THE GROOM ROOM",
    date: "Sat, Jun 28, 2026",
    city: "Bangalore",
    venue: "Social, Church Street",
    blurb:
      "All about looking good — pets and parents alike. Fashion, grooming, accessories. Live grooming demo on stage, best dressed contest, dedicated style photography corner. Plus Startdawg and Merman keeping the floor moving.",
    lineup: ["Startdawg", "Merman", "TBA", "TBA", "TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 2,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "FASHION · GROOMING · STYLE",
    is_finale: false,
  },

  "ccdxsocial-zoomies": {
    slug: "ccdxsocial-zoomies",
    title: "ZOOMIES",
    date: "Sun, Jun 29, 2026",
    city: "Bangalore",
    venue: "Indiranagar Social",
    blurb:
      "The most physical chapter of the series. Outdoor pet zone all afternoon — two agility courses, a timed speed run, performance contest. Any breed, any age, any skill level. Then 8 PM doors flip and Startdawg b2b Merman take the floor through the night.",
    lineup: ["Startdawg", "Merman", "TBA"],
    status: "upcoming",
    poster_url: null,
    sort_order: 3,
    series: "ccdxsocial",
    series_label: "CCD × SOCIAL",
    event_type: "ccdxsocial",
    pet_friendly: true,
    series_tagline: "AGILITY · PERFORMANCE · SPEED",
    is_finale: false,
  },

  "ccdxsocial-grand-finale": {
    slug: "ccdxsocial-grand-finale",
    title: "GRAND FORMAT SHOW",
    date: "Date TBA · 2026",
    city: "Bangalore",
    venue: "Venue TBA",
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
  /**
   * THE SHOWCASE EVENT — Sunday, June 29, 2026.
   * Update copy here directly; CMS-style edits via /admin still work for
   * date / lineup / status / poster.
   */
  "ccdxsocial-zoomies": {
    cta_label: "RSVP — IT'S FREE →",

    narrative:
      "ZOOMIES is the most physical chapter of CCD × SOCIAL. The afternoon belongs to the dogs — two agility courses, a timed speed run, and a performance contest where any breed, any age, any skill level can show off. Then 8 PM hits, the parents take over the floor, and Startdawg b2b Merman drag the room into the night. One ticket, two parties. The pack moves together.",

    vibe_pillars: [
      { icon: "🏃", label: "AGILITY", desc: "Two outdoor courses, timed speed runs, performance contest. Open to any breed, any age, any skill level." },
      { icon: "🎧", label: "FLOOR",   desc: "DJs play through the afternoon, but the real party starts at 9 PM with Startdawg b2b Merman." },
      { icon: "🐾", label: "PACK",    desc: "Pet-first by design. Outdoor pet zone, water stations, and a quiet corner for the shy ones." },
    ],

    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",

    schedule: [
      { time: "4:00 PM",  what: "Gates open · pet zone begins · vendor market opens" },
      { time: "4:30 PM",  what: "Agility course warm-up · meet the trainers" },
      { time: "5:30 PM",  what: "Timed speed runs · leaderboard goes live" },
      { time: "6:30 PM",  what: "Performance contest · best-dressed pup · fastest paw" },
      { time: "7:30 PM",  what: "Pet zone wraps · portrait booth final calls" },
      { time: "8:00 PM",  what: "Doors open for the night · room reset" },
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
        blurb: "Announcement next week. The kind of guest you don't tell your friends about.",
      },
    },

    venue_address:    "Indiranagar Social, 1st Cross, Stage 2, Indiranagar, Bengaluru 560038",
    venue_map_url:    "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    venue_geo:        { lat: 12.9707654, lng: 77.6476266 },
    venue_embed_url:  "https://www.google.com/maps?q=Indiranagar+Social+Bengaluru&output=embed",
    capacity:         250,
    dress_code:       "Wear what dances. Pets in their best.",
    house_rules:      "Vaccinated dogs only · short leads · water bowls provided · no flash on the floor",
    price_text:       "FREE — RSVP only",

    partners: [
      {
        name: "Social",
        role: "Series Partner",
        href: "/ccdxsocial",
      },
    ],

    marquee_items: [
      "PUPS WELCOME",
      "DOORS LATE",
      "9 PM SHARP",
      "B2B ALL NIGHT",
      "PACK MOVES TOGETHER",
    ],
  },

  /**
   * Other CCD × SOCIAL shows — start with light content. Fill in as we
   * lock venues, lineups, and schedules.
   */
  "ccdxsocial-debut": {
    narrative:
      "Chapter one. THE DEBUT is broad on purpose — first impression, big tent, easy yes. Outdoor pet zone all afternoon, vendor market, and Startdawg + Merman taking the floor when the room flips at 9.",
    vibe_pillars: DEFAULT_VIBE_PILLARS_CCDXSOCIAL,
    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",
    venue_address: "Social, Indiranagar, Bengaluru",
    venue_map_url: "https://maps.app.goo.gl/kE9Nar1e54tEhCyd6",
    venue_embed_url: "https://www.google.com/maps?q=Social+Indiranagar+Bengaluru&output=embed",
    price_text:    "FREE — RSVP only",
    schedule: [
      { time: "4:00 PM", what: "Gates open · pet zone · market" },
      { time: "8:00 PM", what: "Doors flip for the night" },
      { time: "9:00 PM", what: "Startdawg + Merman", highlight: true },
      { time: "1:00 AM", what: "Last call" },
    ],
  },

  "ccdxsocial-groom-room": {
    narrative:
      "Chapter two. THE GROOM ROOM is the style chapter — fashion, grooming, accessories. Live grooming demo, best-dressed contest, dedicated style photography corner. Startdawg + Merman keep the floor moving.",
    vibe_pillars: [
      { icon: "💈", label: "GROOMING", desc: "Live grooming demos on stage. Style consultations all afternoon." },
      { icon: "👗", label: "FASHION",  desc: "Best-dressed contest. Dedicated style photography corner." },
      { icon: "🎧", label: "FLOOR",    desc: "Doors at 8, music at 9. Same residents, sharper energy." },
    ],
    doors_time: "4 PM (pet zone) · 8 PM (floor)",
    peak_time:  "9 PM — late",
    venue_address: "Social, Church Street, Bengaluru",
    venue_map_url: "https://maps.app.goo.gl/dUMLoUAuFjETQXBVA",
    venue_embed_url: "https://www.google.com/maps?q=Social+Church+Street+Bengaluru&output=embed",
    price_text: "FREE — RSVP only",
    schedule: [
      { time: "4:00 PM", what: "Pet zone opens · grooming demos begin" },
      { time: "5:30 PM", what: "Best dressed contest · style booth" },
      { time: "8:00 PM", what: "Doors flip" },
      { time: "9:00 PM", what: "Startdawg + Merman take over", highlight: true },
    ],
  },

  "ccdxsocial-grand-finale": {
    narrative:
      "The season finale. Everything the series has been building to. Full outdoor stage, pet runway, agility finals, complete DJ lineup TBA. The biggest thing we've ever done. Sponsorship enquiries open now.",
    vibe_pillars: [
      { icon: "🎪", label: "GRAND FORMAT", desc: "Full outdoor stage. 2,000+ capacity. Pet runway and agility finals." },
      { icon: "🎧", label: "LINEUP",       desc: "Headliner TBA. Local residents support. Full reveal closer to date." },
      { icon: "🐾", label: "PACK",         desc: "The whole community in one place. The pups know their parents by now." },
    ],
    price_text: "Sponsorship enquiries open at /ccdxsocial",
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

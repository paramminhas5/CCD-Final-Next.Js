/**
 * talent-config.ts
 *
 * Central config for the CCD Talent Platform.
 * Drives: directory filtering, kind badges, role-specific package templates,
 * onboarding copy, and search metadata.
 */

export type TalentKind =
  | "musician"
  | "photographer"
  | "lighting"
  | "mix_engineer"
  | "production"
  | "videographer"
  | "mc";

// ── Display metadata per kind ──────────────────────────────────────────────────
export const TALENT_KIND_META: Record<TalentKind, {
  label: string;         // Short display label
  plural: string;        // Plural for directory headings
  emoji: string;         // Icon shorthand
  colour: string;        // Tailwind bg class (CCD palette)
  textColour: string;    // Tailwind text class
  description: string;  // One-line description shown on /talent
  bookingVerb: string;   // "Book" | "Hire" | "Commission"
  searchKeywords: string; // SEO keywords
}> = {
  musician: {
    label: "Musician / DJ",
    plural: "Musicians & DJs",
    emoji: "🎛️",
    colour: "bg-acid-yellow",
    textColour: "text-ink",
    description: "DJs, live acts, and electronic music performers for clubs, festivals, and private events.",
    bookingVerb: "Book",
    searchKeywords: "book dj india, hire musician india, electronic music artist booking",
  },
  photographer: {
    label: "Photographer",
    plural: "Photographers",
    emoji: "📸",
    colour: "bg-magenta",
    textColour: "text-cream",
    description: "Event and documentary photographers specialising in nightlife, festivals, and underground culture.",
    bookingVerb: "Hire",
    searchKeywords: "event photographer india, nightlife photographer bengaluru mumbai",
  },
  lighting: {
    label: "Lighting",
    plural: "Lighting Designers",
    emoji: "💡",
    colour: "bg-electric-blue",
    textColour: "text-cream",
    description: "Lighting designers and technicians for stages, clubs, and immersive experiences.",
    bookingVerb: "Hire",
    searchKeywords: "event lighting designer india, rave lighting technician",
  },
  mix_engineer: {
    label: "Mix Engineer",
    plural: "Mix Engineers",
    emoji: "🎚️",
    colour: "bg-orange",
    textColour: "text-ink",
    description: "Studio and live sound engineers — mixing, mastering, and FOH for events.",
    bookingVerb: "Hire",
    searchKeywords: "mix engineer india, sound engineer booking, FOH engineer india",
  },
  production: {
    label: "Production",
    plural: "Production Crew",
    emoji: "🏗️",
    colour: "bg-lime",
    textColour: "text-ink",
    description: "Event production, stage management, and technical operations teams.",
    bookingVerb: "Hire",
    searchKeywords: "event production india, stage manager booking, technical director india",
  },
  videographer: {
    label: "Videographer",
    plural: "Videographers",
    emoji: "🎥",
    colour: "bg-cream",
    textColour: "text-ink",
    description: "Event videographers and film-makers capturing underground culture and live performances.",
    bookingVerb: "Commission",
    searchKeywords: "event videographer india, music video director, live event filming india",
  },
  mc: {
    label: "MC / Host",
    plural: "MCs & Hosts",
    emoji: "🎤",
    colour: "bg-ink",
    textColour: "text-cream",
    description: "MCs, hype artists, and event hosts who work the crowd and hold the room.",
    bookingVerb: "Book",
    searchKeywords: "MC hire india, event host booking, hype artist india",
  },
};

// ── Order for directory display ────────────────────────────────────────────────
export const TALENT_KIND_ORDER: TalentKind[] = [
  "musician", "photographer", "videographer", "lighting",
  "mix_engineer", "production", "mc",
];

// ── Role-specific package templates ───────────────────────────────────────────
// Auto-seeded into artist_packages when an artist of this kind
// visits their portal for the first time with no packages set.

export interface PackageTemplate {
  name: string;
  description: string;
  suitable_for: string[];
  price_inr: number;
  price_is_minimum: boolean;
  travel_included: boolean;
  set_duration_min: number | null;
  set_type: "solo" | "b2b" | "live" | "live_pa";
  tech_rider: string | null;
  sort_order: number;
}

export const DEFAULT_PACKAGES: Record<TalentKind, PackageTemplate[]> = {
  musician: [
    {
      name: "Club Night Set",
      description: "90-minute DJ set for club nights, rooftop parties, and bar events. Suitable for 50–500 capacity.",
      suitable_for: ["Club night", "Rooftop party", "Private party"],
      price_inr: 15000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 90,
      set_type: "solo",
      tech_rider: "2× CDJ-3000 or equivalent, DJM-900NXS2, monitor on stage",
      sort_order: 0,
    },
    {
      name: "Festival / Main Stage",
      description: "Headline or support slot at festivals and larger events. Price varies by event scale.",
      suitable_for: ["Festival", "Warehouse rave"],
      price_inr: 50000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 60,
      set_type: "solo",
      tech_rider: "Full backline provided by festival, monitor + IEM preferred",
      sort_order: 1,
    },
    {
      name: "B2B Set",
      description: "Back-to-back set with another artist. Shared billing, collaborative energy.",
      suitable_for: ["Club night", "Festival", "Warehouse rave"],
      price_inr: 20000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 120,
      set_type: "b2b",
      tech_rider: "2× CDJ-3000, DJM-900NXS2, discuss split with other artist",
      sort_order: 2,
    },
  ],

  photographer: [
    {
      name: "Event Coverage (4 hrs)",
      description: "Full event documentation — atmosphere, crowd, stage, details. 200+ edited images delivered within 1 week.",
      suitable_for: ["Club night", "Festival", "Rooftop party", "Corporate event"],
      price_inr: 12000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 240,
      set_type: "solo",
      tech_rider: null,
      sort_order: 0,
    },
    {
      name: "Full Night (8 hrs)",
      description: "Full event night coverage from doors to closing. 400+ edited images. Fast turnaround for social media.",
      suitable_for: ["Festival", "Warehouse rave", "Club night"],
      price_inr: 22000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 480,
      set_type: "solo",
      tech_rider: null,
      sort_order: 1,
    },
    {
      name: "Artist Portrait Session",
      description: "Studio or location shoot for artist press images, EPK photos, and social media content.",
      suitable_for: ["Other"],
      price_inr: 8000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 120,
      set_type: "solo",
      tech_rider: null,
      sort_order: 2,
    },
  ],

  videographer: [
    {
      name: "Event Film (short)",
      description: "2–3 minute event highlight film. Cinematic edit with licensed music. Delivered within 10 days.",
      suitable_for: ["Club night", "Festival", "Rooftop party"],
      price_inr: 18000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 300,
      set_type: "solo",
      tech_rider: null,
      sort_order: 0,
    },
    {
      name: "Full Event + Recap",
      description: "Full night coverage + social cuts (Reels / Stories format). Ideal for recurring events.",
      suitable_for: ["Festival", "Warehouse rave", "Club night"],
      price_inr: 35000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 480,
      set_type: "solo",
      tech_rider: null,
      sort_order: 1,
    },
    {
      name: "Artist / DJ Set Film",
      description: "Cinematic multi-camera capture of a live set. Perfect for artist promo and EPK video.",
      suitable_for: ["Club night", "Festival", "Other"],
      price_inr: 25000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: 180,
      set_type: "solo",
      tech_rider: null,
      sort_order: 2,
    },
  ],

  lighting: [
    {
      name: "Club Night Lighting",
      description: "Venue lighting design and operation for a single club night. Includes rig setup and teardown.",
      suitable_for: ["Club night", "Rooftop party", "Private party"],
      price_inr: 10000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: "Minimum rig: 4× moving heads, hazer/fogger, basic LED wash. Can bring own rig — discuss.",
      sort_order: 0,
    },
    {
      name: "Festival Stage Lighting",
      description: "Full festival stage lighting design and operation. Custom programming for each artist.",
      suitable_for: ["Festival", "Warehouse rave"],
      price_inr: 30000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: "Full festival rig required. Tech spec provided on booking.",
      sort_order: 1,
    },
  ],

  mix_engineer: [
    {
      name: "Live Sound (FOH)",
      description: "Front-of-house mixing for live events. Includes soundcheck + full show.",
      suitable_for: ["Club night", "Festival", "Corporate event"],
      price_inr: 8000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: "Digital console preferred (Avid S3L, Yamaha CL, Allen & Heath SQ). Rider on request.",
      sort_order: 0,
    },
    {
      name: "Studio Mix",
      description: "Full stereo mix of a track or EP. Includes 2 rounds of revisions.",
      suitable_for: ["Other"],
      price_inr: 5000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: null,
      sort_order: 1,
    },
    {
      name: "Mastering",
      description: "Mastering for streaming + vinyl. Formats: WAV, MP3, DDP.",
      suitable_for: ["Other"],
      price_inr: 3000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: null,
      sort_order: 2,
    },
  ],

  production: [
    {
      name: "Event Production (small)",
      description: "End-to-end technical production for club nights and private events up to 500 capacity.",
      suitable_for: ["Club night", "Private party", "Corporate event"],
      price_inr: 25000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: null,
      sort_order: 0,
    },
    {
      name: "Festival Production",
      description: "Stage management, technical coordination, and production crew for festivals and warehouse raves.",
      suitable_for: ["Festival", "Warehouse rave"],
      price_inr: 80000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: null,
      sort_order: 1,
    },
  ],

  mc: [
    {
      name: "Club Night MC",
      description: "Live MC performance and crowd interaction throughout the night. Work with the DJ on energy management.",
      suitable_for: ["Club night", "Warehouse rave", "Festival"],
      price_inr: 8000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: "Handheld mic or headset, monitor in fold-back mix",
      sort_order: 0,
    },
    {
      name: "Event Host / Presenter",
      description: "Stage presenter, artist intro, segment hosting, and audience engagement.",
      suitable_for: ["Festival", "Corporate event", "Other"],
      price_inr: 12000,
      price_is_minimum: true,
      travel_included: false,
      set_duration_min: null,
      set_type: "solo",
      tech_rider: null,
      sort_order: 1,
    },
  ],
};

/**
 * Shared types for Cats Can Dance events.
 *
 * Two layers of data:
 *
 *  1. EventRow      — the Supabase `events` row. Edited from /admin and
 *                     Supabase dashboard. The lightweight, dynamic stuff
 *                     (date, status, lineup, poster_url, series flags…).
 *
 *  2. EventContent  — rich content (vibe pillars, schedule, venue address,
 *                     dress code, partners…). Lives in src/content/events.ts
 *                     and is keyed by slug. Code-editable so copy gets
 *                     proper review; not exposed in the admin panel.
 *
 *  EventViewModel   — what pages actually consume: the EventRow merged
 *                     with its EventContent (or sensible defaults).
 *
 *  Series fields are already columns in Supabase (added by
 *  public/ccdxsocial-seed.sql). All series fields are optional and
 *  backward-compatible — events without them render the standard template.
 */

// ───────────────────────── DB row ─────────────────────────

export type EventStatus = "upcoming" | "past";

export type MediaItem = {
  type: "image" | "video";
  url: string;
  caption?: string;
};

export type EventRow = {
  id?: string;
  slug: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  blurb: string;
  lineup: string[];
  status: EventStatus;
  poster_url: string | null;
  sort_order: number;
  media?: MediaItem[];

  // Series fields (optional, backward-compatible)
  /** Stable series slug, e.g. "ccdxsocial". Groups events together. */
  series?: string | null;
  /** Human-readable series label, e.g. "CCD × SOCIAL" */
  series_label?: string | null;
  /** Event type key for conditional UI, e.g. "ccdxsocial" | "standard" */
  event_type?: string | null;
  /** Whether this event has a dedicated outdoor pet zone */
  pet_friendly?: boolean | null;
  /** Short tagline shown on series cards, e.g. "BROAD · WELCOMING · FIRST IMPRESSION" */
  series_tagline?: string | null;
  /** Whether this is the finale / capstone of a series */
  is_finale?: boolean | null;
};

// ──────────────────── Rich content ────────────────────

/** A 3-up "what to expect" tile on the detail page. */
export type VibePillar = {
  /** Single emoji used as the visual anchor, e.g. "🐾" */
  icon: string;
  /** ALL CAPS short word, e.g. "AGILITY" */
  label: string;
  /** One sentence describing the pillar. */
  desc: string;
};

/** A row in the "run of show" timeline. */
export type ScheduleItem = {
  time: string; // "9:00 PM"
  what: string; // "Doors open"
  /** If set, this row is the moment the night peaks (highlighted). */
  highlight?: boolean;
};

/** Per-artist details that override / supplement the bare lineup string. */
export type LineupArtist = {
  name: string;
  /** "Resident", "Guest", "B2B", "Live", "Special Guest". Default: "DJ". */
  role?: string;
  /** Slot label, e.g. "9:00 — 11:00". Optional. */
  set_time?: string;
  /** Image URL for the card. Optional. */
  image_url?: string;
  /** SoundCloud profile or track URL. Optional. */
  soundcloud?: string;
  /** Spotify artist/track/album URL. Optional. */
  spotify?: string;
  /** Internal artist page slug, e.g. "startdawg". Optional. */
  slug?: string;
  /** One-line bio for the card. Optional. */
  blurb?: string;
  /** Marks the artist as TBA (drawn differently). */
  tba?: boolean;
};

/** Sponsor / partner badge. */
export type Partner = {
  name: string;
  logo_url?: string;
  href?: string;
  role?: string; // "Series Partner", "Venue Partner"…
};

/** Geo coords for JSON-LD. */
export type Geo = { lat: number; lng: number };

/** All the editorial copy for an event. Lives in src/content/events.ts. */
export type EventContent = {
  /** Primary CTA copy override. Default: "RSVP NOW →". */
  cta_label?: string;
  /** Long-form narrative paragraph that expands on `EventRow.blurb`. */
  narrative?: string;
  /** 3-up tiles. Defaults provided per event_type if omitted. */
  vibe_pillars?: VibePillar[];
  /** Timeline of the night. */
  schedule?: ScheduleItem[];
  /** When doors open (display string). */
  doors_time?: string;
  /** Quoted set-time of the headline moment, e.g. "9 PM — late". */
  peak_time?: string;
  /** Detailed artist info keyed by lineup name. Missing names render basic. */
  artist_details?: Record<string, LineupArtist>;
  /** Plain-text postal address. */
  venue_address?: string;
  /** Public Google Maps URL (sharable share-link is fine). */
  venue_map_url?: string;
  /** Geo for JSON-LD; embeds use map_url. */
  venue_geo?: Geo;
  /** Embed src for the venue map iframe. If omitted we fall back to a styled link card. */
  venue_embed_url?: string;
  /** Approximate venue capacity, e.g. 250. */
  capacity?: number;
  /** Free-text dress code, e.g. "Wear what dances. Pets in their best." */
  dress_code?: string;
  /** Free-text "what to bring" / "house rules" line. */
  house_rules?: string;
  /** Partners block. */
  partners?: Partner[];
  /** Override price text. Default: "FREE — RSVP only". */
  price_text?: string;
  /** Override the marquee strip just under the hero. */
  marquee_items?: string[];
};

// ──────────────────── ViewModel ────────────────────

/** The merged shape consumed by pages. */
export type EventViewModel = EventRow & {
  content: EventContent;
};

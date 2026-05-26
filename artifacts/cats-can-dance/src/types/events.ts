/**
 * Shared EventRow type used across all event components and pages.
 * Optional series fields are backward-compatible — existing events work unchanged.
 *
 * Series fields enable:
 *  - Grouping multiple events under a named series (e.g. "ccdxsocial")
 *  - Series banners on /events and homepage Events component
 *  - "Also in this series" cross-links on EventDetail
 *  - Pet-friendly info sections for CCDxSocial-type events
 *
 * To use for a future event series: set `series` to a stable slug,
 * `series_label` to the display name, `event_type` to the series key,
 * and optionally `pet_friendly: true`.
 */

export type EventStatus = "upcoming" | "past";

export type MediaItem = { type: "image" | "video"; url: string; caption?: string };

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

  // ── Series fields (optional, backward-compatible) ─────────────────────────
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

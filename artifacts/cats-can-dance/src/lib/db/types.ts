/**
 * types.ts — canonical TypeScript types for every database table.
 *
 * These are derived from the canonical SQL schema in supabase/migrations/001_schema.sql.
 * Keep in sync when columns are added.
 *
 * Naming convention:
 *   - DB types (row shapes as stored):  Artist, Event, ArtistConnection, etc.
 *   - Insert types (fields required for new rows): ArtistInsert, etc.
 */

// ── artists ───────────────────────────────────────────────────────────────────

export type ArtistStatus = "approved" | "pending" | "rejected" | "suspended";
export type ArtistKind   = "musician" | "photographer" | "lighting" | "mix_engineer" | "production" | "videographer" | "mc";

export interface Artist {
  id:                 string;
  slug:               string;
  name:               string;
  kind:               ArtistKind;
  status:             ArtistStatus;
  featured:           boolean;
  bio?:               string | null;
  why?:               string | null;
  members?:           string | null;
  from_city?:         string | null;
  based_city?:        string | null;
  genres:             string[];
  festivals:          string[];
  labels?:            string | null;
  instagram?:         string | null;
  soundcloud?:        string | null;
  spotify?:           string | null;
  bandcamp?:          string | null;
  website?:           string | null;
  booking_email?:     string | null;
  manager_email?:     string | null;
  photo_url?:         string | null;
  videos?:            any[] | null;
  gallery?:           any[] | null;
  // booking
  open_to_bookings:   boolean;
  available_cities:   string[];
  fee_min_inr?:       number | null;
  fee_max_inr?:       number | null;
  fee_currency:       string;
  // auth
  claimed_by?:        string | null;
  // enrichment
  source:             string;
  enriched_at?:       string | null;
  spotify_id?:        string | null;
  youtube_channel_id?: string | null;
  ra_id?:             string | null;
  // timestamps
  created_at:         string;
  updated_at:         string;
}

// ── event_appearances ─────────────────────────────────────────────────────────

export interface EventAppearance {
  id:          string;
  artist_id?:  string | null;
  artist_slug: string;
  event_name:  string;
  venue?:      string | null;
  city?:       string | null;
  event_date?: string | null;
  year?:       number | null;
  role:        string; // "headliner" | "performer" | "support" | "b2b" | "resident"
  created_at:  string;
}

// ── artist_connections ────────────────────────────────────────────────────────

export interface ArtistConnection {
  id:              string;
  artist_a_slug:   string;
  artist_b_slug:   string;
  connection_type: string; // "b2b" | "label" | "collab" | "tour"
  strength:        number; // 1–10
  shared_events:   string[];
  shared_venues:   string[];
  notes?:          string | null;
  created_at:      string;
  updated_at:      string;
}

// ── artist_social_stats ───────────────────────────────────────────────────────

export interface ArtistSocialStats {
  id:                        string;
  artist_id?:                string | null;
  artist_slug:               string;
  instagram_followers?:      number | null;
  soundcloud_followers?:     number | null;
  spotify_followers?:        number | null;
  spotify_monthly_listeners?: number | null;
  youtube_subscribers?:      number | null;
  bandcamp_followers?:       number | null;
  source:                    string;
  captured_at:               string;
  created_at:                string;
}

// ── artist_milestones ─────────────────────────────────────────────────────────

export interface ArtistMilestone {
  id:                   string;
  artist_id?:           string | null;
  artist_slug:          string;
  type:                 string;
  title:                string;
  description?:         string | null;
  date:                 string;
  year?:                number | null;
  city?:                string | null;
  venue?:               string | null;
  is_featured:          boolean;
  importance:           number;
  related_artist_slug?: string | null;
  related_artist_name?: string | null;
  created_at:           string;
  updated_at:           string;
}

// ── artist_discography ────────────────────────────────────────────────────────

export type ReleaseType = "single" | "ep" | "album" | "compilation" | "remix" | "mix";

export interface ArtistRelease {
  id:             string;
  artist_id?:     string | null;
  artist_slug:    string;
  title:          string;
  release_type:   ReleaseType;
  release_date?:  string | null;
  year?:          number | null;
  label?:         string | null;
  artwork_url?:   string | null;
  spotify_url?:   string | null;
  soundcloud_url?: string | null;
  bandcamp_url?:  string | null;
  youtube_url?:   string | null;
  description?:   string | null;
  created_at:     string;
  updated_at:     string;
}

// ── artist_press ──────────────────────────────────────────────────────────────

export interface ArtistPress {
  id:              string;
  artist_id?:      string | null;
  artist_slug:     string;
  title:           string;
  publication:     string;
  author?:         string | null;
  excerpt?:        string | null;
  url?:            string | null;
  type:            string; // "review" | "interview" | "feature" | "mention"
  date_published?: string | null;
  is_featured:     boolean;
  quote_for_epk?:  string | null;
  created_at:      string;
  updated_at:      string;
}

// ── artist_packages ───────────────────────────────────────────────────────────

export interface ArtistPackage {
  id:               string;
  artist_id:        string;
  artist_slug:      string;
  name:             string;
  description?:     string | null;
  suitable_for:     string[];
  price_inr:        number;
  price_is_minimum: boolean;
  travel_included:  boolean;
  travel_note?:     string | null;
  set_duration_min?: number | null;
  set_type:         string; // "solo" | "b2b" | "live"
  tech_rider?:      string | null;
  is_active:        boolean;
  sort_order:       number;
  created_at:       string;
  updated_at:       string;
}

// ── artist_availability_blocks ────────────────────────────────────────────────

export type AvailBlockKind = "tour_leg" | "unavailable" | "available";

export interface ArtistAvailabilityBlock {
  id:               string;
  artist_id:        string;
  kind:             AvailBlockKind;
  label?:           string | null;
  city?:            string | null;
  cities:           string[];
  start_date:       string;
  end_date:         string;
  weekly_days?:     number[] | null;
  fee_override_inr?: number | null;
  notes?:           string | null;
  is_public:        boolean;
  booking_id?:      string | null;
  created_at:       string;
  updated_at:       string;
}

// ── artist_dates ──────────────────────────────────────────────────────────────

export type ArtistDateStatus = "confirmed" | "tentative" | "available";

export interface ArtistDate {
  id:                    string;
  artist_id:             string;
  city:                  string;
  venue?:                string | null;
  event_date:            string;
  status:                ArtistDateStatus;
  ticket_url?:           string | null;
  booking_id?:           string | null;
  package_id?:           string | null;
  availability_block_id?: string | null;
  fee_agreed_inr?:       number | null;
  promoter_name?:        string | null;
  promoter_email?:       string | null;
  set_duration_min?:     number | null;
  internal_notes?:       string | null;
  is_public:             boolean;
  created_at:            string;
}

// ── booking_requests ──────────────────────────────────────────────────────────

export type BookingStatus = "new" | "quoted" | "held" | "confirmed" | "completed" | "declined" | "cancelled";

export interface BookingRequest {
  id:                  string;
  artist_id?:          string | null;
  artist_id_resolved?: string | null;
  artist_name:         string;
  package_id?:         string | null;
  requester_name?:     string | null;
  requester_email:     string;
  requester_phone?:    string | null;
  purpose?:            string | null;
  event_type?:         string | null;
  event_date?:         string | null;
  event_date_end?:     string | null;
  venue_name?:         string | null;
  venue_city?:         string | null;
  budget_inr?:         number | null;
  notes?:              string | null;
  status:              BookingStatus;
  quoted_inr?:         number | null;
  hold_expires_at?:    string | null;
  confirmed_at?:       string | null;
  source:              string;
  forward_requested:   boolean;
  promoter_clerk_id?:  string | null;
  promoter_name?:      string | null;
  user_agent?:         string | null;
  ip_hash?:            string | null;
  created_at:          string;
  updated_at:          string;
}

// ── booking_messages ──────────────────────────────────────────────────────────

export type MessageSenderRole = "artist" | "promoter" | "system";

export interface BookingMessage {
  id:                string;
  booking_id:        string;
  sender_role:       MessageSenderRole;
  sender_clerk_id?:  string | null;
  sender_name?:      string | null;
  body:              string;
  is_system:         boolean;
  quote_inr?:        number | null;
  quote_valid_until?: string | null;
  read_by_artist:    boolean;
  read_by_promoter:  boolean;
  created_at:        string;
}

// ── promoter_profiles ─────────────────────────────────────────────────────────

export interface PromoterProfile {
  id:              string;
  clerk_user_id:   string;
  email:           string;
  company_name:    string;
  contact_name?:   string | null;
  bio?:            string | null;
  logo_url?:       string | null;
  website?:        string | null;
  instagram?:      string | null;
  primary_city?:   string | null;
  cities:          string[];
  genre_focus:     string[];
  is_verified:     boolean;
  verified_at?:    string | null;
  bookings_count:  number;
  total_spend_inr: number;
  created_at:      string;
  updated_at:      string;
}

// ── booking_shortlist ─────────────────────────────────────────────────────────

export interface BookingShortlistEntry {
  id:                 string;
  promoter_clerk_id:  string;
  artist_id:          string;
  brief_event_type?:  string | null;
  brief_date?:        string | null;
  brief_date_end?:    string | null;
  brief_cities:       string[];
  brief_budget_inr?:  number | null;
  brief_notes?:       string | null;
  contacted:          boolean;
  contacted_at?:      string | null;
  booking_request_id?: string | null;
  created_at:         string;
  updated_at:         string;
}

// ── events ────────────────────────────────────────────────────────────────────

export interface Event {
  id:          string;
  slug:        string;
  title:       string;
  series?:     string | null;
  status:      string;
  event_type?: string | null;
  date?:       string | null;
  time?:       string | null;
  venue?:      string | null;
  city?:       string | null;
  image_url?:  string | null;
  poster_url?: string | null;
  description?: string | null;
  lineup?:     any | null;
  ticket_url?: string | null;
  sort_order:  number;
  created_at:  string;
  updated_at:  string;
}

// ── curated_events ────────────────────────────────────────────────────────────

export type CuratedEventStatus = "published" | "pending" | "rejected";

export interface CuratedEvent {
  id:                string;
  title:             string;
  url:               string;
  source:            string;
  city:              string;
  venue?:            string | null;
  event_date:        string;
  event_time?:       string | null;
  blurb?:            string | null;
  genre:             string[];
  image_url?:        string | null;
  is_featured:       boolean;
  submission_status: CuratedEventStatus;
  submitted_by?:     string | null;
  promoter_slug?:    string | null;
  created_at:        string;
  updated_at:        string;
}

// ── user_taste_profiles ───────────────────────────────────────────────────────

export interface UserTasteProfile {
  id:                  string;
  user_id:             string;
  liked_artist_slugs:  string[];
  cities:              string[];
  genres:              string[];
  created_at:          string;
  updated_at:          string;
}

// ── fan_profiles ──────────────────────────────────────────────────────────────

export type FanTier = "lurker" | "regular" | "maker" | "legend" | "newcomer";

export interface FanProfile {
  id:                 string;
  user_id:            string;
  xp:                 number;
  ccd_points:         number;
  tier:               FanTier;
  total_interactions: number;
  events_rsvpd:       number;
  events_saved:       number;
  shares:             number;
  created_at:         string;
  updated_at:         string;
}

// ── user_roles ────────────────────────────────────────────────────────────────

export type UserRole = "fan" | "artist" | "promoter" | "admin";

export interface UserRoleRow {
  id:           string;
  user_id:      string;
  role:         UserRole;
  entity_id?:   string | null;
  entity_slug?: string | null;
  entity_name?: string | null;
  email?:       string | null;
  granted_by?:  string | null;
  granted_at?:  string | null;
  created_at:   string;
  updated_at:   string;
}

// ── event_artist_lineups ──────────────────────────────────────────────────────

export interface EventArtistLineup {
  id:             string;
  event_id:       string;
  artist_slug:    string;
  artist_name?:   string | null;
  role:           string; // "headliner" | "performer" | "support" | "b2b"
  sort_order:     number;
  created_at:     string;
}

// ── artist_submissions ────────────────────────────────────────────────────────

export interface ArtistSubmission {
  id:               string;
  name:             string;
  submitter_email?: string | null;
  submitter_role?:  string | null;
  bio?:             string | null;
  from_city?:       string | null;
  based_city?:      string | null;
  genres?:          string[] | null;
  festivals?:       string[] | null;
  instagram?:       string | null;
  soundcloud?:      string | null;
  bandcamp?:        string | null;
  spotify?:         string | null;
  website?:         string | null;
  booking_email?:   string | null;
  manager_email?:   string | null;
  labels?:          string | null;
  members?:         string | null;
  photo_url?:       string | null;
  notes?:           string | null;
  status:           "pending" | "approved" | "rejected";
  created_at:       string;
}

// ── Computed / composite types used across the app ────────────────────────────

/** Full artist profile returned by /api/artists/:slug/full */
export interface ArtistFullProfile {
  artist:         Artist;
  appearances:    EventAppearance[];
  connections:    ArtistConnection[];
  upcomingDates:  ArtistDate[];
  milestones:     ArtistMilestone[];
  socialStats:    ArtistSocialStats | null;
  socialHistory:  ArtistSocialStats[];
  discography:    ArtistRelease[];
  press:          ArtistPress[];
  stats:          ArtistStats;
  facts:          ArtistFact[];
}

export interface ArtistStats {
  total_gigs:       number;
  total_cities:     number;
  total_venues:     number;
  total_connections: number;
  years_active:     number;
  b2b_count:        number;
  festival_count:   number;
}

export interface ArtistFact {
  icon:   string;
  label:  string;
  value:  string;
  detail: string;
}

/** Calendar day status returned by /api/artist-calendar */
export type DayStatus = "busy" | "tentative" | "available" | "open";

export interface ArtistCalendar {
  artist_id:        string;
  artist_slug:      string;
  from:             string;
  to:               string;
  days:             Record<string, DayStatus>;
  blocks:           ArtistAvailabilityBlock[];
  gigs:             ArtistDate[];
  available_cities: string[];
  open_to_bookings: boolean;
}

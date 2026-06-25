/**
 * useSocialProof — lightweight hook that fetches aggregated social counts
 * from the API proxy. All counts are best-effort (fail silently).
 *
 * Used by:
 *  - EarlyAccess (email list size)
 *  - Index (platform stats strip)
 *  - EventDetail (RSVP count per event)
 *  - ArtistDetail (follower count)
 */
import { useEffect, useState } from "react";

// ── Platform-wide stats (homepage) ──────────────────────────────────────────

interface PlatformStats {
  total_rsvps: number;
  total_artists: number;
  total_signups: number;
  cities: number;
}

export function usePlatformStats(): PlatformStats | null {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  useEffect(() => {
    fetch("/api/social-proof/platform")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
  }, []);
  return stats;
}

// ── RSVP count for a single event ────────────────────────────────────────────

export function useEventRsvpCount(eventSlug: string): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!eventSlug) return;
    fetch(`/api/social-proof/event-rsvps?slug=${encodeURIComponent(eventSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.count != null) setCount(d.count); })
      .catch(() => {});
  }, [eventSlug]);
  return count;
}

// ── Email list size (EarlyAccess section) ────────────────────────────────────

export function useSignupCount(): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/social-proof/signup-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.count != null) setCount(d.count); })
      .catch(() => {});
  }, []);
  return count;
}

// ── Artist follower count (ArtistDetail) ─────────────────────────────────────

export function useArtistFollowerCount(artistSlug: string): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!artistSlug) return;
    fetch(`/api/social-proof/artist-followers?slug=${encodeURIComponent(artistSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.count != null) setCount(d.count); })
      .catch(() => {});
  }, [artistSlug]);
  return count;
}

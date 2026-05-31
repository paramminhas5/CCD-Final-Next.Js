/**
 * Cross-browser safe date parsing.
 *
 * Problem: EventRow.date values come in two formats:
 *   - ISO:            "2026-06-29"  or  "2026-06-29T14:30:00Z"  ← always safe
 *   - Human-readable: "Sun, Jun 29, 2026"  ← fails in Safari (Invalid Date)
 *
 * This helper normalises both to a JS Date, returning null for genuinely
 * unparseable strings (e.g. "Oct 2026 — Date TBA").
 */

// Month abbreviation → 0-indexed month number
const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4,  jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse a date string that may be ISO or human-readable (e.g. "Sun, Jun 29, 2026").
 * Returns a Date or null.
 */
export function parseEventDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  // Already ISO — fast path
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Human-readable: "Sun, Jun 29, 2026" or "Jun 29, 2026" or "29 Jun 2026"
  // Strip weekday prefix if present (e.g. "Sun, ")
  const stripped = s.replace(/^[A-Za-z]{2,4},?\s*/, "");

  // Try "MMM DD, YYYY" — "Jun 29, 2026"
  const mdy = stripped.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdy) {
    const month = MONTH_MAP[mdy[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(parseInt(mdy[3]), month, parseInt(mdy[2]));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Try "DD MMM YYYY" — "29 Jun 2026"
  const dmy = stripped.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (dmy) {
    const month = MONTH_MAP[dmy[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(parseInt(dmy[3]), month, parseInt(dmy[1]));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Last resort: native parse (works in Chrome/Node, may fail in Safari)
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Given a list of upcoming EventRows, return the Date of the nearest future event.
 * Falls back to null if none found.
 */
export function nextEventDate(events: Array<{ date: string; status: string }>): Date | null {
  const now = Date.now();
  const upcoming = events
    .filter(e => e.status === "upcoming")
    .map(e => parseEventDate(e.date))
    .filter((d): d is Date => d !== null && d.getTime() > now)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0] ?? null;
}

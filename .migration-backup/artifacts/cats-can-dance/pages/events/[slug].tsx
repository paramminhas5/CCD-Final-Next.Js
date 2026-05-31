/**
 * /events/[slug] — Static-generated event detail page.
 *
 * Strategy:
 *  - getStaticPaths: pre-render known slugs from the static fallback catalogue.
 *    Unknown slugs (DB-only events) fall through to ISR (fallback: "blocking").
 *  - getStaticProps: fetch the event row from Supabase via the API proxy.
 *    Falls back to the static catalogue when Supabase is empty / unreachable.
 *  - revalidate: 60s — fresh content within 1 minute of any change.
 *
 * This replaces `dynamic({ ssr: false })` so that:
 *  1. Google crawls content on first load (no JS required)
 *  2. OG/Twitter preview cards render correctly on all social platforms
 *  3. Event JSON-LD is in the raw HTML — no JS execution needed
 */
import type { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { getStaticEventRow } from "@/content/events";
import type { EventRow } from "@/types/events";

// Load EventDetail client-only (Framer Motion, Clerk hooks) but pass SSR props
const EventDetailPage = dynamic(() => import("@/pages/EventDetail"), { ssr: false });

interface Props {
  initialEvent: EventRow | null;
  slug: string;
}

export default function EventSlugPage({ initialEvent, slug }: Props) {
  return <EventDetailPage initialEvent={initialEvent} slug={slug} />;
}

// ── Static paths ──────────────────────────────────────────────────────────────
// Pre-render the static catalogue slugs at build time.
// All other slugs (DB-only) are handled via ISR (blocking fallback).
export const getStaticPaths: GetStaticPaths = async () => {
  // Import here (server-only context) to avoid client bundle bloat
  const { EVENT_ROWS } = await import("@/content/events");
  const paths = Object.keys(EVENT_ROWS).map((slug) => ({ params: { slug } }));
  return { paths, fallback: "blocking" };
};

// ── Static props ──────────────────────────────────────────────────────────────
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = (params?.slug as string) ?? "";

  let event: EventRow | null = null;

  // 1. Try the API proxy (uses SUPABASE_SERVICE_KEY server-side)
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    const res = await fetch(`${baseUrl}/api/events/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && data.slug) {
        event = data as EventRow;
      }
    }
  } catch {
    // Network error at build time — fall through to static fallback
  }

  // 2. Static fallback — ensures static-catalogue events always render
  if (!event) {
    event = getStaticEventRow(slug);
  }

  // 3. Unknown slug with no static fallback → 404
  if (!event) {
    return { notFound: true };
  }

  return {
    props: { initialEvent: event, slug },
    revalidate: 60, // ISR: regenerate at most once per minute
  };
};

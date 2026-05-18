import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import RsvpDialog from "@/components/RsvpDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getAllPosts } from "@/content/posts";
import episode1Poster from "@/assets/episode-1-poster.png";

type MediaItem = { type: "image" | "video"; url: string; caption?: string };

type EventRow = {
  slug: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  blurb: string;
  lineup: string[];
  status: "upcoming" | "past";
  poster_url: string | null;
  media?: MediaItem[];
};

const resolveStorageUrl = (raw: string): string => {
  const v = raw.trim();
  if (!v) return v;
  if (v.startsWith("http") || v.startsWith("/")) return v;
  try {
    const { data } = supabase.storage.from("event-posters").getPublicUrl(v);
    return data?.publicUrl ?? `/${v}`;
  } catch {
    return `/${v}`;
  }
};

const EventDetail = () => {
  const { slug = "" } = useParams();
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      setEvent((data as unknown as EventRow) ?? null);
      setLoaded(true);
    })();
  }, [slug]);

  if (loaded && !event) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="container pt-32 pb-16">
          <h1 className="font-display text-5xl text-ink mb-4">Event not found</h1>
          <Link to="/events" className="font-display text-magenta underline">← All events</Link>
        </section>
        <Footer />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="container pt-32 pb-16" />
      </main>
    );
  }

  const isUpcoming = event.status === "upcoming";
  const headingShadow = isUpcoming
    ? "drop-shadow-[6px_6px_0_hsl(var(--ink))]"
    : "drop-shadow-[6px_6px_0_hsl(var(--magenta))]";

  const media = (event.media ?? []).filter((m) => m && m.url);

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Cats Can Dance — ${event.title}`,
    description: event.blurb,
    startDate: event.date,
    eventStatus:
      event.status === "upcoming"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventMovedOnline",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue,
        addressLocality: event.city || "Bangalore",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    image: event.poster_url ? [event.poster_url] : undefined,
    performer: (event.lineup ?? []).map((p) => ({ "@type": "PerformingGroup", name: p })),
    organizer: {
      "@type": "Organization",
      name: "Cats Can Dance",
      url: "https://catscandance.com",
    },
    offers: {
      "@type": "Offer",
      url: `https://catscandance.com/events/${slug}`,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
    url: `https://catscandance.com/events/${slug}`,
  };

  const eventFaqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `When is the Cats Can Dance ${event.title} event?`,
        acceptedAnswer: { "@type": "Answer", text: `Cats Can Dance ${event.title} takes place on ${event.date} at ${event.venue}, Bengaluru.` },
      },
      {
        "@type": "Question",
        name: "What music does Cats Can Dance play?",
        acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance events feature House, Disco, Jungle, Garage, and Drum & Bass — underground dance music curated by resident and guest selectors in Bengaluru." },
      },
      {
        "@type": "Question",
        name: "How do I RSVP to a Cats Can Dance event?",
        acceptedAnswer: { "@type": "Answer", text: `RSVP for this event at catscandance.com/events/${slug}. Capacity is limited — RSVP early. Most episodes are free entry with name on the door.` },
      },
      {
        "@type": "Question",
        name: "Who organises Cats Can Dance events in Bangalore?",
        acceptedAnswer: { "@type": "Answer", text: "Cats Can Dance is a Bengaluru-based underground dance music collective and event organiser, running RSVP-only Episodes with curated lineups at intimate venues across the city." },
      },
    ],
  };

  return (
    <>
      <SEO
        title={`${event.title} — Cats Can Dance`}
        description={event.blurb}
        path={`/events/${slug}`}
        image={event.poster_url ?? undefined}
        type="event"
        jsonLd={[eventLd, eventFaqLd]}
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className={`pt-32 pb-16 border-b-4 border-ink ${isUpcoming ? "bg-magenta text-cream" : "bg-cream text-ink"}`}>
          <div className="container">
            <Breadcrumbs
              light={isUpcoming}
              items={[
                { label: "Home", to: "/" },
                { label: "Events", to: "/events" },
                { label: event.title },
              ]}
            />
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <span className={`inline-block text-xs font-bold px-3 py-1 border-2 border-ink uppercase mb-4 ${
                  isUpcoming ? "bg-acid-yellow text-ink" : "bg-ink text-cream"
                }`}>
                  {isUpcoming ? `${event.title.toUpperCase()} · UPCOMING` : "PAST EPISODE"}
                </span>
                <h1 className={`font-display text-6xl md:text-7xl mb-6 leading-[0.9] ${headingShadow}`}>
                  {event.title.toUpperCase()}
                </h1>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/events/${slug}`;
                  const shareData = { title: `Cats Can Dance — ${event.title}`, text: event.blurb || "Bangalore underground", url };
                  if (typeof navigator.share === "function") {
                    try { await navigator.share(shareData); return; } catch { /* user cancel */ }
                  }
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success("Link copied to clipboard");
                  } catch {
                    toast.error("Couldn't copy link");
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-2 font-display px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform ${
                  isUpcoming ? "bg-acid-yellow text-ink" : "bg-ink text-cream"
                }`}
                aria-label="Share event"
              >
                ↗ SHARE
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl">
              <Field label="DATE" value={event.date} accent={isUpcoming} />
              <Field label="CITY" value={event.city} accent={isUpcoming} />
              <Field label="VENUE" value={event.venue} accent={isUpcoming} />
            </div>
          </div>
        </section>

        {event.poster_url && (() => {
          const src = resolveStorageUrl(event.poster_url);
          return (
            <div className="container pt-12">
              <img
                src={src}
                alt={`${event.title} — Cats Can Dance dance music event in ${event.city || "Bangalore"}`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full max-h-[600px] object-cover border-4 border-ink chunk-shadow-lg"
                data-fallback-step="0"
                onError={(ev) => {
                  const img = ev.currentTarget as HTMLImageElement;
                  const step = Number(img.dataset.fallbackStep ?? "0");
                  // Step 0 → try the static episode-1 PNG (only relevant for episode-1)
                  if (step === 0 && slug === "episode-1" && img.src !== episode1Poster) {
                    img.dataset.fallbackStep = "1";
                    img.src = episode1Poster;
                    return;
                  }
                  // Final fallback: lime tile with title
                  if (import.meta.env.DEV) console.warn("[poster] failed", img.src);
                  img.style.display = "none";
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector("[data-poster-fallback]")) {
                    const div = document.createElement("div");
                    div.setAttribute("data-poster-fallback", "");
                    div.className = "w-full aspect-video grid place-items-center bg-lime text-ink font-display text-4xl border-4 border-ink chunk-shadow-lg text-center px-6";
                    div.textContent = `★ ${event.title}`;
                    parent.appendChild(div);
                  }
                }}
              />
            </div>
          );
        })()}

        {media.length > 0 && (
          <section className="container pt-12">
            <h2 className="font-display text-3xl md:text-4xl text-ink mb-6">/ THE NIGHT, IN MOTION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item, i) => {
                const url = resolveStorageUrl(item.url);
                return (
                  <figure key={`${item.url}-${i}`} className="bg-ink border-4 border-ink chunk-shadow">
                    {item.type === "video" ? (
                      <video
                        src={url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full aspect-video object-cover bg-ink"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightbox({ ...item, url })}
                        className="block w-full"
                        aria-label={item.caption || `Open photo ${i + 1}`}
                      >
                        <img
                          src={url}
                          alt={item.caption || `${event.title} photo ${i + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-video object-cover hover:opacity-90 transition-opacity"
                          onError={(ev) => {
                            (ev.currentTarget as HTMLImageElement).style.opacity = "0.4";
                          }}
                        />
                      </button>
                    )}
                    {item.caption && (
                      <figcaption className="bg-cream text-ink px-3 py-2 text-sm font-medium border-t-4 border-ink">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        <section className="container py-16 md:py-20 grid md:grid-cols-2 gap-10 max-w-5xl">
          <div>
            <h2 className="font-display text-3xl text-ink mb-4">/ THE NIGHT</h2>
            <p className="text-ink/80 font-medium text-lg">{event.blurb}</p>
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink mb-4">/ LINEUP</h2>
            <ul className="space-y-2">
              {(event.lineup ?? []).map((l) => (
                <li key={l} className="bg-cream border-4 border-ink px-4 py-3 font-medium">{l}</li>
              ))}
            </ul>
            {isUpcoming && (
              <button
                onClick={() => setOpen(true)}
                className="mt-6 w-full bg-magenta text-cream font-display text-xl px-6 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                RSVP NOW →
              </button>
            )}
          </div>
        </section>

        {(() => {
          const journal = getAllPosts()
            .filter((p) => p.category === "GUIDES" || p.category === "CULTURE" || p.category === "JOURNAL")
            .slice(0, 2);
          if (journal.length === 0) return null;
          return (
            <section className="bg-cream border-t-4 border-ink py-12 md:py-16">
              <div className="container max-w-5xl">
                <p className="font-display text-magenta text-base md:text-lg mb-4">/ READ MORE FROM THE JOURNAL</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {journal.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/blog/${p.slug}`}
                      className="block bg-acid-yellow border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 hover:translate-x-1 transition-transform"
                    >
                      <span className="inline-block bg-ink text-cream text-[10px] font-bold px-2 py-0.5 mb-2">{p.category || p.tag}</span>
                      <p className="font-display text-ink text-xl md:text-2xl leading-tight mb-1">{p.title}</p>
                      <p className="text-ink/70 text-sm font-medium line-clamp-2">{p.excerpt}</p>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/blog"
                  className="inline-block mt-6 font-display text-ink text-lg underline decoration-4 decoration-magenta underline-offset-4 hover:text-magenta transition"
                >
                  All journal posts →
                </Link>
              </div>
            </section>
          );
        })()}

        <Footer />
      </main>
      <RsvpDialog open={open} onOpenChange={setOpen} eventSlug={slug} eventTitle={`Cats Can Dance ${event.title}`} />

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl bg-ink border-4 border-ink p-2">
          {lightbox && (
            <figure>
              <img src={lightbox.url} alt={lightbox.caption || "Photo"} className="w-full max-h-[80vh] object-contain bg-ink" />
              {lightbox.caption && (
                <figcaption className="text-cream text-center font-medium py-2">{lightbox.caption}</figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Field = ({ label, value, accent }: { label: string; value: string; accent: boolean }) => (
  <div className="min-w-0">
    <p className={`font-display text-sm mb-1 ${accent ? "text-acid-yellow" : "text-magenta"}`}>/ {label}</p>
    <p className="font-display text-xl md:text-2xl break-words">{value}</p>
  </div>
);

export default EventDetail;

/**
 * app/artists/[slug]/not-found.tsx
 *
 * Shown when notFound() is called in page.tsx (artist slug doesn't exist in DB).
 * Full CCD brand treatment — not a generic white 404.
 */
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function ArtistNotFound() {
  return (
    <main className="bg-background text-foreground">
      <Nav />

      <section className="bg-electric-blue border-b-4 border-ink pt-32 pb-24 min-h-[60vh] flex items-center">
        <div className="container">
          <p className="font-display text-acid-yellow text-2xl mb-4">/ 404</p>
          <h1 className="font-display text-cream text-6xl md:text-8xl leading-[0.9] mb-6"
            style={{ filter: "drop-shadow(5px 5px 0 hsl(var(--ink)))" }}
          >
            ARTIST<br />NOT<br />FOUND.
          </h1>
          <p className="text-cream/70 text-lg mb-8 max-w-md">
            This artist doesn't exist in our database — or maybe they haven't been listed yet.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/artists"
              className="inline-block bg-acid-yellow text-ink font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
            >
              ← BROWSE ALL ARTISTS
            </Link>
            <Link
              href="/for-artists"
              className="inline-block bg-transparent text-cream font-display px-6 py-3 border-4 border-cream hover:bg-cream hover:text-ink transition-colors"
            >
              GET LISTED →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

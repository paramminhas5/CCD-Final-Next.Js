/**
 * app/artists/loading.tsx — Skeleton shown while the artists list streams.
 *
 * React Suspense automatically shows this while page.tsx is fetching.
 * Matches the exact grid layout so there's no layout shift on load.
 */
export default function ArtistsLoading() {
  return (
    <main className="bg-background text-foreground">
      {/* Nav placeholder */}
      <div className="h-[68px] bg-cream border-b-4 border-ink" />

      {/* Hero skeleton */}
      <div className="bg-electric-blue border-b-4 border-ink pt-32 pb-16">
        <div className="container">
          <div className="h-6 w-24 bg-acid-yellow/30 mb-4 animate-pulse" />
          <div className="h-20 w-96 bg-cream/20 animate-pulse" />
        </div>
      </div>

      {/* Marquee placeholder */}
      <div className="h-12 bg-ink border-y-4 border-ink animate-pulse" />

      {/* Filter bar skeleton */}
      <div className="sticky top-0 z-30 bg-cream border-b-4 border-ink py-3">
        <div className="container flex gap-3">
          <div className="h-10 flex-1 max-w-sm bg-ink/10 border-4 border-ink animate-pulse" />
          <div className="h-10 w-32 bg-ink/10 border-4 border-ink animate-pulse" />
          <div className="h-10 w-24 bg-ink/10 border-4 border-ink animate-pulse" />
        </div>
      </div>

      {/* Grid skeleton — 16 cards matching the real grid */}
      <section className="bg-cream py-10 min-h-[60vh]">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={[
                  "border-4 border-ink bg-ink/5 animate-pulse",
                  i % 9 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

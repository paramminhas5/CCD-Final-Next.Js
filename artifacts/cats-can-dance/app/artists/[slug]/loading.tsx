/**
 * app/artists/[slug]/loading.tsx — Skeleton shown while artist profile streams.
 *
 * Matches the cover hero + tab nav layout to minimise layout shift.
 */
export default function ArtistProfileLoading() {
  return (
    <main className="bg-background text-foreground">
      {/* Nav placeholder */}
      <div className="h-[68px] bg-cream border-b-4 border-ink" />

      {/* Cover hero skeleton */}
      <div className="relative h-[60vh] min-h-[420px] bg-ink/10 border-b-4 border-ink animate-pulse">
        <div className="absolute bottom-8 left-0 right-0">
          <div className="container">
            <div className="h-4 w-28 bg-cream/30 mb-3 animate-pulse" />
            <div className="h-14 w-72 bg-cream/40 animate-pulse" />
            <div className="flex gap-3 mt-4">
              <div className="h-8 w-24 bg-cream/20 border-2 border-cream/30 animate-pulse" />
              <div className="h-8 w-20 bg-cream/20 border-2 border-cream/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav skeleton */}
      <div className="bg-cream border-b-4 border-ink">
        <div className="container flex gap-0">
          {["HOME", "GIGS", "CONNECTIONS", "JOURNEY", "STATS", "EPK", "BOOK"].map((tab) => (
            <div
              key={tab}
              className="px-4 py-3 border-r-4 border-ink bg-ink/5 animate-pulse"
              style={{ width: `${tab.length * 10 + 24}px` }}
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-cream py-10">
        <div className="container grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-4 bg-ink/10 animate-pulse" />
            <div className="h-4 bg-ink/10 animate-pulse w-4/5" />
            <div className="h-4 bg-ink/10 animate-pulse w-3/5" />
            <div className="h-32 bg-ink/5 border-4 border-ink animate-pulse mt-6" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-ink/5 border-4 border-ink animate-pulse" />
            <div className="h-12 bg-acid-yellow/30 border-4 border-ink animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

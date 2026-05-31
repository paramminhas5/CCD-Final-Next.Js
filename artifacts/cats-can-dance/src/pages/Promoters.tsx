import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Input } from "@/components/ui/input";

type Promoter = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  cities: string[];
  blurb: string | null;
  genres: string[];
  instagram: string | null;
  website: string | null;
  booking_email: string | null;
  logo_url: string | null;
  trusted: boolean;
};

const ensureUrl = (s: string | null) => (s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : null);

const PromoterCard = ({ p }: { p: Promoter }) => (
  <article className="bg-cream border-4 border-ink chunk-shadow p-5 flex flex-col gap-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform">
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href={`/promoters/${p.slug}`}>
          <h3 className="font-display text-xl text-ink leading-tight uppercase truncate hover:text-magenta transition-colors">{p.name}</h3>
        </Link>
        <p className="text-xs text-ink/60 mt-1">{p.city ?? p.cities[0] ?? ""}</p>
      </div>
      {p.trusted && (
        <span className="shrink-0 text-[10px] font-display bg-magenta text-cream px-2 py-1 border-2 border-ink">
          TRUSTED
        </span>
      )}
    </header>
    {p.blurb && <p className="text-sm text-ink/80 line-clamp-3">{p.blurb}</p>}
    {p.genres.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {p.genres.slice(0, 4).map((g) => (
          <span key={g} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border-2 border-ink">
            {g}
          </span>
        ))}
      </div>
    )}
    <div className="flex flex-wrap gap-2 pt-1 mt-auto">
      {p.instagram && /^[a-z0-9._]+$/i.test(p.instagram) && (
        <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer"
           className="text-[11px] font-display bg-ink text-cream px-2 py-1 border-2 border-ink">@{p.instagram}</a>
      )}
      {ensureUrl(p.website) && (
        <a href={ensureUrl(p.website)!} target="_blank" rel="noreferrer"
           className="text-[11px] font-display bg-cream text-ink px-2 py-1 border-2 border-ink">Website ↗</a>
      )}
      {p.booking_email && (
        <a href={`mailto:${p.booking_email}`}
           className="text-[11px] font-display bg-acid-yellow text-ink px-2 py-1 border-2 border-ink">Book</a>
      )}
    </div>
  </article>
);

const PromotersPage = () => {
  const [rows, setRows] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [trustedOnly, setTrustedOnly] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/promoters");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRows((data ?? []) as Promoter[]);
      } catch (e) {
        console.error("promoters fetch", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cities = useMemo(() => {
    const s = new Set<string>();
    for (const p of rows) {
      if (p.city) s.add(p.city);
      for (const c of p.cities ?? []) s.add(c);
    }
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return rows.filter((p) => {
      if (trustedOnly && !p.trusted) return false;
      if (city !== "All") {
        const all = [p.city, ...(p.cities ?? [])].filter(Boolean).join(" ").toLowerCase();
        if (!all.includes(city.toLowerCase())) return false;
      }
      if (!ql) return true;
      return (
        p.name.toLowerCase().includes(ql) ||
        p.genres.join(" ").toLowerCase().includes(ql) ||
        (p.blurb ?? "").toLowerCase().includes(ql)
      );
    });
  }, [rows, q, city, trustedOnly]);

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Promoters — India's Trusted Electronic Music Organisers | Cats Can Dance"
        description="A directory of the promoters, labels and venues we trust to put on real underground electronic events across India."
        path="/promoters"
        keywords="India electronic music promoters, techno house promoters India, underground party organisers"
      />
      <Nav />
      <PageHero eyebrow="Promoters" title="The People Behind The Parties">
        <p className="text-cream/90 max-w-2xl">
          Every event we feature comes from one of these promoters, labels or venues — vetted, trusted, and consistently delivering real electronic music.
        </p>
      </PageHero>

      <section className="container py-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block font-display text-sm text-ink mb-1">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, genre, city…" className="border-4 border-ink" />
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 px-3 border-4 border-ink bg-cream font-display max-w-[200px]">
              <option value="All">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 font-display text-sm text-ink">
            <input type="checkbox" checked={trustedOnly} onChange={(e) => setTrustedOnly(e.target.checked)} className="w-4 h-4 accent-magenta" />
            Trusted only
          </label>
        </div>

        <p className="font-display text-sm text-ink/60 mb-4">
          {loading ? "Loading…" : `Showing ${filtered.length} of ${rows.length}`}
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="border-4 border-dashed border-ink/40 p-12 text-center">
            <p className="font-display text-2xl text-ink mb-2">No promoters match.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => <PromoterCard key={p.id} p={p} />)}
          </div>
        )}

        <div className="mt-12 bg-ink text-cream border-4 border-ink chunk-shadow p-6">
          <h2 className="font-display text-2xl uppercase mb-2">Run a credible night?</h2>
          <p className="text-cream/80 mb-4 text-sm">
            We're always adding promoters who programme real underground electronic music. Get in touch and we'll feature your events.
          </p>
          <Link
            href="/submit-event"
            className="inline-block bg-acid-yellow text-ink font-display px-5 py-2 border-4 border-cream chunk-shadow text-sm">
            Submit your night →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PromotersPage;

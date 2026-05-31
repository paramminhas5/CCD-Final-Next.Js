import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { NGOS, NGO_CITIES, NGO_CATEGORIES, type Ngo } from "@/content/ngos";

const ensureUrl = (s: string | null) => {
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};

const NgoCard = ({ n }: { n: Ngo }) => {
  const site = ensureUrl(n.website);
  const donateHref =
    site ||
    `https://www.google.com/search?q=${encodeURIComponent(`${n.name} donate India`)}`;
  return (
    <article className="bg-cream border-4 border-ink chunk-shadow p-5 flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink leading-tight">{n.name}</h3>
          <p className="text-xs text-ink/60 mt-1">
            {n.location} · est. {n.founded}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-display bg-ink text-cream px-2 py-1 border-2 border-ink">
          #{n.rank}
        </span>
      </header>
      <p className="text-sm text-ink/80 line-clamp-4">{n.impact}</p>
      <div className="flex flex-wrap gap-1.5">
        {n.categories.map((c) => (
          <span key={c} className="text-[10px] font-display uppercase bg-acid-yellow text-ink px-2 py-0.5 border-2 border-ink">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-2">
        <a
          href={donateHref}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-magenta text-cream font-display px-3 py-2 border-4 border-ink chunk-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform text-xs"
        >
          Donate →
        </a>
        {site && (
          <a href={site} target="_blank" rel="noreferrer" className="text-xs underline text-ink/70">
            Website
          </a>
        )}
      </div>
    </article>
  );
};

const CatsCanCare = () => {
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("All");
  const [cats, setCats] = useState<Set<string>>(new Set());

  const toggleCat = (c: string) => {
    const next = new Set(cats);
    next.has(c) ? next.delete(c) : next.add(c);
    setCats(next);
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return NGOS.filter((n) => {
      if (city !== "All" && n.city !== city) return false;
      if (cats.size > 0 && !n.categories.some((c) => cats.has(c))) return false;
      if (!ql) return true;
      return (
        n.name.toLowerCase().includes(ql) ||
        n.location.toLowerCase().includes(ql) ||
        n.impact.toLowerCase().includes(ql) ||
        n.focus.join(" ").toLowerCase().includes(ql)
      );
    });
  }, [q, city, cats]);

  const adoptionNgos = useMemo(
    () => NGOS.filter((n) => n.categories.includes("Adoption") || n.categories.includes("Sanctuary")),
    [],
  );

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "India Animal Welfare NGOs — Cats Can Care",
    itemListElement: NGOS.slice(0, 25).map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: n.name,
      url: ensureUrl(n.website) ?? undefined,
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Cats Can Care — Animal NGOs & Adoption in India | Cats Can Dance"
        description="A searchable directory of India's top 100 animal welfare NGOs. Find rescues, shelters, sanctuaries, and adoption centres — donate or adopt responsibly."
        path="/care"
        keywords="animal NGO India, donate animal welfare India, adopt pet India, animal shelter India"
        jsonLd={itemListLd}
      />
      <Nav />
      <PageHero eyebrow="Cats Can Care" title="Care, Donate, Adopt">
        <p className="text-cream/90 max-w-2xl">
          A directory of India's top 100 animal welfare organisations — searchable by city, focus,
          and what they need most.
        </p>
      </PageHero>

      <section className="container py-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block font-display text-sm text-ink mb-1">Search</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, city, focus, impact…"
              className="border-4 border-ink"
            />
          </div>
          <div>
            <label className="block font-display text-sm text-ink mb-1">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 px-3 border-4 border-ink bg-cream font-display"
            >
              <option value="All">All cities</option>
              {NGO_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {NGO_CATEGORIES.map((c) => {
            const active = cats.has(c);
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`text-xs font-display uppercase px-3 py-1.5 border-4 border-ink ${
                  active ? "bg-magenta text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                }`}
              >
                {c}
              </button>
            );
          })}
          {cats.size > 0 && (
            <button onClick={() => setCats(new Set())} className="text-xs font-display underline text-ink/70 px-2">
              Clear
            </button>
          )}
        </div>

        <p className="font-display text-sm text-ink/60 mb-4">
          Showing {filtered.length} of {NGOS.length}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((n) => (
            <NgoCard key={n.rank} n={n} />
          ))}
        </div>
      </section>

      <section id="adopt" className="bg-ink text-cream border-y-4 border-ink py-12">
        <div className="container">
          <h2 className="font-display text-4xl md:text-5xl mb-3">Adopt, don't shop.</h2>
          <p className="max-w-2xl text-cream/80 mb-8">
            India has thousands of healthy, vaccinated dogs, cats, and other animals waiting for homes. These shelters and
            sanctuaries run active adoption programs — visit, foster, or take one home for life.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {adoptionNgos.slice(0, 12).map((n) => (
              <a
                key={n.rank}
                href={ensureUrl(n.website) ?? `https://www.google.com/search?q=${encodeURIComponent(`${n.name} adopt`)}`}
                target="_blank"
                rel="noreferrer"
                className="block bg-cream text-ink border-4 border-cream chunk-shadow p-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
              >
                <h3 className="font-display text-lg leading-tight">{n.name}</h3>
                <p className="text-xs text-ink/60 mt-1">{n.location}</p>
                <p className="text-sm mt-2 line-clamp-3">{n.impact}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CatsCanCare;

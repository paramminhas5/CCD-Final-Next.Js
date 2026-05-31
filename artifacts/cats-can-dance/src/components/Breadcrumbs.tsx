import { Link } from "@/lib/compat-router";
import { useEffect } from "react";

export type Crumb = { label: string; to?: string };

const SITE = "https://catscandance.com";

const Breadcrumbs = ({ items, light = false }: { items: Crumb[]; light?: boolean }) => {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.to ? { item: `${SITE}${c.to}` } : {}),
    })),
  };

  const text = light ? "text-cream/80 hover:text-acid-yellow" : "text-ink/70 hover:text-magenta";
  const sep = light ? "text-cream/40" : "text-ink/40";

  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-breadcrumb-ld", "true");
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
    return () => { document.querySelectorAll('script[data-breadcrumb-ld]').forEach(e => e.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <>
      <nav aria-label="Breadcrumb" className="font-display text-sm tracking-wide mb-6">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.to ? (
                <Link to={c.to} className={`${text} underline decoration-2 underline-offset-2 transition-colors`}>
                  {c.label}
                </Link>
              ) : (
                <span className={light ? "text-cream" : "text-ink"} aria-current="page">
                  {c.label}
                </span>
              )}
              {i < items.length - 1 && <span className={sep}>›</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;

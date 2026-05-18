import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "playlist", label: "Playlist" },
  { id: "events", label: "Events" },
  { id: "drops", label: "Drops" },
  { id: "instagram", label: "Instagram" },
  { id: "videos", label: "Videos" },
  { id: "early-access", label: "Early Access" },
];

const SectionDots = () => {
  const [active, setActive] = useState<string>("home");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-3 group"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-label={`Scroll to ${s.label}`}
            onClick={() => {
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="relative flex items-center justify-end"
          >
            <span
              className={`pointer-events-none absolute right-6 whitespace-nowrap font-display text-xs px-2 py-1 border-2 border-ink bg-cream text-ink opacity-0 group-hover:opacity-100 transition-opacity ${
                isActive ? "opacity-100" : ""
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block w-3 h-3 border-2 border-ink transition-all ${
                isActive ? "bg-magenta scale-125" : "bg-cream/60 hover:bg-acid-yellow"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default SectionDots;

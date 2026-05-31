type Color =
  | "cream"
  | "acid-yellow"
  | "lime"
  | "magenta"
  | "electric-blue"
  | "orange";

const palette: Record<Color, { bg: string; text: string; chip: string }> = {
  cream: { bg: "bg-cream", text: "text-ink", chip: "bg-ink text-cream" },
  "acid-yellow": { bg: "bg-acid-yellow", text: "text-ink", chip: "bg-ink text-cream" },
  lime: { bg: "bg-lime", text: "text-ink", chip: "bg-ink text-cream" },
  magenta: { bg: "bg-magenta", text: "text-cream", chip: "bg-acid-yellow text-ink" },
  "electric-blue": { bg: "bg-electric-blue", text: "text-cream", chip: "bg-acid-yellow text-ink" },
  orange: { bg: "bg-orange", text: "text-ink", chip: "bg-ink text-cream" },
};

type Props = {
  /** Original headline — used as the cover heading (truncated) */
  title: string;
  /** Optional briefer 4-7 word version preferred for the cover */
  coverTitle?: string;
  /** Category chip — top-left */
  category?: string;
  /** Legacy tag (used as fallback for category) */
  tag?: string;
  /** Issue number — renders as "№ 01" top-right */
  issue?: number;
  color?: Color;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const truncateWords = (s: string, n: number) => {
  const words = s.trim().split(/\s+/);
  if (words.length <= n) return s.trim();
  return words.slice(0, n).join(" ") + "…";
};

const BlogCover = ({
  title,
  coverTitle,
  category,
  tag,
  issue,
  color = "cream",
  className = "",
  size = "md",
}: Props) => {
  const c = palette[color] ?? palette.cream;
  const issueLabel = typeof issue === "number" ? `№ ${String(issue).padStart(2, "0")}` : null;
  const cat = (category || tag || "JOURNAL").toUpperCase();
  const heading = (coverTitle || truncateWords(title, 7)).toUpperCase();

  const titleSize =
    size === "lg"
      ? "text-3xl sm:text-5xl md:text-6xl"
      : size === "sm"
      ? "text-lg md:text-xl"
      : "text-2xl md:text-4xl";

  const padSize = size === "lg" ? "p-6 md:p-9" : size === "sm" ? "p-4" : "p-5 md:p-7";

  return (
    <div
      role="img"
      aria-label={title}
      className={`relative w-full h-full ${c.bg} ${c.text} border-4 border-ink overflow-hidden flex flex-col justify-between ${padSize} ${className}`}
    >
      {/* Top — category chip + issue number */}
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-block ${c.chip} text-[10px] md:text-xs font-bold px-2 py-1 border-2 border-ink uppercase tracking-wide`}>
          {cat}
        </span>
        {issueLabel && (
          <span className="font-display text-xs md:text-sm opacity-80 tracking-widest">
            {issueLabel}
          </span>
        )}
      </div>

      {/* Middle — the actual (brief) headline */}
      <div className="flex-1 flex items-center">
        <h3
          className={`font-display ${titleSize} leading-[0.95] tracking-tight line-clamp-3 break-words`}
        >
          {heading}
        </h3>
      </div>

      {/* Bottom — wordmark + paw */}
      <div className="flex items-end justify-between gap-3">
        <span className="font-display text-[10px] md:text-xs tracking-widest opacity-80">
          CATS · CAN · DANCE
        </span>
        <span className="font-display text-base md:text-xl opacity-80" aria-hidden>
          🐾
        </span>
      </div>
    </div>
  );
};

export default BlogCover;

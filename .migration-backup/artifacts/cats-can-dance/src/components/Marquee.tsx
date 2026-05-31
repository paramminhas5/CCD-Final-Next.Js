const defaultItems = [
  "DANCE MUSIC 🎧",
  "PET CULTURE 🐾",
  "STREETWEAR 👕",
  "EXPERIENCES 🪩",
  "DROPS 💎",
  "COMMUNITY ✨",
];

type Size = "lg" | "sm";

const Marquee = ({
  bg = "bg-acid-yellow",
  reverse = false,
  size = "sm",
  items,
}: {
  bg?: string;
  reverse?: boolean;
  size?: Size;
  items?: string[];
}) => {
  const list = items && items.length ? items : defaultItems;
  const loop = [...list, ...list, ...list];
  const isLg = size === "lg";
  const padding = isLg ? "py-2 md:py-4" : "py-1.5 md:py-2.5";
  const text = isLg ? "text-2xl md:text-5xl" : "text-base md:text-2xl";
  const gap = isLg ? "gap-8 md:gap-12" : "gap-6 md:gap-10";
  return (
    <div className={`${bg} border-y-4 border-ink ${padding} overflow-hidden`}>
      <div className={`flex ${gap} whitespace-nowrap marquee marquee-speed ${reverse ? "[animation-direction:reverse]" : ""}`}>
        {loop.map((t, i) => (
          <span key={i} className={`font-display ${text} text-ink flex items-center ${gap}`}>
            {t}
            <span className="text-magenta">★</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;

/**
 * CityMarquee — rolling ticker of Indian cities + "Now Playing" vibe.
 * Positioned between Hero and the first homepage section.
 * Purely CSS animation, no dependencies.
 */

const ITEMS = [
  "NOW PLAYING IN BENGALURU",
  "◆",
  "UPCOMING IN MUMBAI",
  "◆",
  "UNDERGROUND DELHI",
  "◆",
  "GOA JUNGLE PARTIES",
  "◆",
  "HYDERABAD RISING",
  "◆",
  "PUNE ALL NIGHT",
  "◆",
  "DETROIT TECHNO",
  "◆",
  "CHICAGO HOUSE",
  "◆",
  "LONDON JUNGLE",
  "◆",
  "BERLIN DARK ROOMS",
  "◆",
  "GOA TRANCE ORIGIN",
  "◆",
];

export default function CityMarquee() {
  // Double the items for seamless loop
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-acid-yellow border-b-4 border-ink overflow-hidden py-3 select-none">
      <div
        className="flex whitespace-nowrap gap-8 animate-marquee"
        style={{
          animation: "marquee 30s linear infinite",
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="font-display text-sm uppercase text-ink tracking-widest shrink-0">
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

import catDj from "@/assets/cat-dj-hero.svg";
import catDancer from "@/assets/cat-dancer.svg";
import catLeft from "@/assets/cat-left.svg";
import catRight from "@/assets/cat-right.svg";
import catHeadphones from "@/assets/cat-headphones.png";
import PartnerContactDialog from "@/components/PartnerContactDialog";

const founders = [
  { name: "Param Minhas", role: "Co-founder", img: catDj, bg: "bg-magenta", text: "text-cream" },
  { name: "Satwik Harisenany", role: "Co-founder", img: catDancer, bg: "bg-acid-yellow", text: "text-ink" },
];

const roles = [
  { name: "Music & Curation", desc: "Help shape the sound — DJs, lineups, playlists.", bg: "bg-lime", text: "text-ink", img: catHeadphones },
  { name: "Brand & Design", desc: "Identity, posters, merch, art direction.", bg: "bg-orange", text: "text-ink", img: catLeft },
  { name: "Community & Ops", desc: "Run the door, the pack, the experience.", bg: "bg-electric-blue", text: "text-cream", img: catRight },
  { name: "Content & Video", desc: "Capture nights, edit recaps, grow channels.", bg: "bg-cream", text: "text-ink", img: catDancer },
];

const Team = () => (
  <section id="team" className="relative bg-cream border-b-4 border-ink py-12 md:py-20 bg-grain overflow-hidden">
    <div className="container">
      <p className="font-display text-magenta text-lg md:text-xl mb-3">/ THE PACK</p>
      <h2 className="font-display text-ink text-4xl md:text-6xl leading-[0.9] mb-8">
        RUN BY HUMANS<br/>WHO MOVE.
      </h2>

      {/* Co-founders */}
      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {founders.map((f) => (
          <div
            key={f.name}
            className={`${f.bg} ${f.text} border-4 border-ink chunk-shadow-lg hover:-translate-y-1 transition-transform`}
          >
            <div className="aspect-[4/3] bg-cream border-b-4 border-ink p-6 grid place-items-center">
              <img src={f.img} alt="" className="max-h-48 w-auto object-contain wiggle" loading="lazy" decoding="async" />
            </div>
            <div className="p-5">
              <p className="font-display text-2xl md:text-3xl leading-tight">{f.name.toUpperCase()}</p>
              <p className="font-medium opacity-90 mt-1">{f.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hiring grid */}
      <p className="font-display text-magenta text-lg md:text-xl mb-3">/ JOIN THE PACK</p>
      <h3 className="font-display text-ink text-3xl md:text-5xl leading-[0.9] mb-6">
        WE'RE HIRING.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <PartnerContactDialog
            key={r.name}
            kind="team"
            defaultReason={r.name}
            defaultMessage={`Hi! I'd love to apply for the ${r.name} role.\n\nA bit about me: `}
            trigger={
              <button
                type="button"
                className={`${r.bg} ${r.text} border-4 border-ink chunk-shadow p-5 hover:-translate-y-1 transition-transform block text-left w-full`}
              >
                <p className="font-display text-xl md:text-2xl leading-tight mb-2">{r.name.toUpperCase()}</p>
                <p className="font-medium text-sm md:text-base opacity-90 mb-3">{r.desc}</p>
                <span className="font-display text-sm underline decoration-2 underline-offset-4">APPLY →</span>
              </button>
            }
          />
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-ink/70 font-medium">
        Don't see your role?{" "}
        <PartnerContactDialog
          kind="team"
          defaultReason="Other"
          trigger={
            <button type="button" className="underline decoration-magenta decoration-4 underline-offset-4">
              say hi anyway
            </button>
          }
        />
        .
      </p>
    </div>
  </section>
);

export default Team;

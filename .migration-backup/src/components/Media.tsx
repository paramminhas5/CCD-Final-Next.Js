import { Link } from "react-router-dom";
import { posts } from "@/content/posts";
import BlogCover from "@/components/BlogCover";

const press = ["MIXMAG", "RESIDENT ADVISOR", "DAZED", "i-D", "HYPEBEAST", "BOILER ROOM"];

const Media = () => (
  <section id="media" className="relative bg-orange border-b-4 border-ink py-16 md:py-20 overflow-hidden">
    <div className="container">
      <p className="font-display text-ink text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4">/ MEDIA</p>
      <h2 className="font-display text-ink text-5xl sm:text-6xl md:text-7xl mb-10 md:mb-12 leading-[0.9]">
        SEEN<br/>EVERYWHERE.
      </h2>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-16 md:mb-20">
        {press.map((p) => (
          <li
            key={p}
            className="bg-cream border-4 border-ink chunk-shadow font-display text-ink text-base sm:text-xl md:text-2xl py-4 sm:py-6 text-center"
          >
            {p}
          </li>
        ))}
      </ul>

      <p className="font-display text-ink text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4">/ JOURNAL</p>
      <h2 className="font-display text-ink text-4xl sm:text-5xl md:text-6xl mb-10 md:mb-12 leading-[0.9]">
        WORDS<br/>FROM US.
      </h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
        {posts.slice(0, 3).map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="bg-cream border-4 border-ink chunk-shadow flex flex-col hover:-translate-y-1 hover:translate-x-1 transition-transform"
          >
            <div className="aspect-video border-b-4 border-ink overflow-hidden">
              <BlogCover title={p.title} coverTitle={p.coverTitle} category={p.category} tag={p.tag} issue={p.issue} color={p.coverColor} size="sm" className="border-0" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-ink text-cream text-xs font-bold px-2 py-1">{p.tag}</span>
                <span className="font-display text-ink/70 text-sm">{p.date}</span>
              </div>
              <h3 className="font-display text-2xl text-ink mb-2 leading-tight">{p.title}</h3>
              <p className="text-ink/80 font-medium text-sm flex-1">{p.excerpt}</p>
              <span className="mt-4 font-display text-magenta">READ →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default Media;

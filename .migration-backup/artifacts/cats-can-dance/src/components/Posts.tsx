const posts = [
  { tag: "JOURNAL", title: "Why Berlin Said Yes", excerpt: "The story behind our launch party at Kater Blau.", date: "MAY 12" },
  { tag: "PLAYLIST", title: "Late Night Litter Vol. 02", excerpt: "5 tracks for the after-after.", date: "MAY 04" },
  { tag: "DROPS", title: "Behind the 9 Lives Hoodie", excerpt: "Heavyweight cotton, six months in the making.", date: "APR 22" },
];

const Posts = () => (
  <section id="posts" className="relative bg-lime border-b-4 border-ink py-24 md:py-32 overflow-hidden">
    <div className="container">
      <p className="font-display text-magenta text-2xl md:text-3xl mb-4">/ POSTS · JOURNAL</p>
      <h2 className="font-display text-ink text-6xl md:text-8xl mb-12 leading-[0.9]">
        WORDS<br/>FROM US.
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article
            key={p.title}
            className="bg-cream border-4 border-ink chunk-shadow p-6 hover:-translate-y-1 transition-transform flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="bg-ink text-cream text-xs font-bold px-2 py-1">{p.tag}</span>
              <span className="font-display text-ink/70 text-sm">{p.date}</span>
            </div>
            <h3 className="font-display text-2xl text-ink mb-3 leading-tight">{p.title}</h3>
            <p className="text-ink/80 font-medium flex-1">{p.excerpt}</p>
            <a href="#" className="mt-4 font-display text-magenta">READ →</a>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Posts;

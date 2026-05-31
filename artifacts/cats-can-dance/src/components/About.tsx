import { useRef } from "react";
import { Link } from "@/lib/compat-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import catDancer from "@/assets/cat-dancer.svg";
import { imgUrl } from "@/lib/img";
import { useHomeContent } from "@/hooks/useHomeContent";

const ABOUT_FALLBACK = {
  kicker: "Bangalore underground crew",
  title: "WE MAKE\nNIGHTS\nHAPPEN.",
  body: "Cats Can Dance is a Bengaluru-based collective throwing underground dance music nights — House, Disco, Jungle, Garage, Drum & Bass — and dropping limited streetwear rooted in the culture.",
  ctaLabel: "Our Story →",
  ctaHref: "/about",
};

const About = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { about: aboutRaw } = useHomeContent();
  const about = {
    kicker:   aboutRaw?.kicker   || ABOUT_FALLBACK.kicker,
    title:    aboutRaw?.title    || ABOUT_FALLBACK.title,
    body:     aboutRaw?.body     || ABOUT_FALLBACK.body,
    ctaLabel: aboutRaw?.ctaLabel || ABOUT_FALLBACK.ctaLabel,
    ctaHref:  aboutRaw?.ctaHref  || ABOUT_FALLBACK.ctaHref,
  };
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Mobile uses a tighter range; we let CSS hide one of these motion images per breakpoint
  const xMobile = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-20%", "120%"]);
  const xDesktop = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "150%"]);
  const rot = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-6, 6]);
  // Step-y bob synced to scroll — looks like walking
  const bob = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    reduce ? [0, 0, 0, 0, 0] : [0, -8, 0, -8, 0]
  );

  return (
    <section
      ref={ref}
      id="about"
      className="relative bg-cream border-b-4 border-ink py-10 md:py-14 bg-grain overflow-x-clip"
    >
      <div className="container grid md:grid-cols-2 gap-6 md:gap-10 items-center">
        <div>
          <p className="font-display text-magenta text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4">{about?.kicker}</p>
          <h2 className="font-display text-ink leading-[0.95] mb-5 md:mb-6 break-words text-[2rem] sm:text-5xl md:text-6xl">
            {about?.title}
          </h2>
          <p className="text-ink/80 text-base sm:text-lg md:text-xl font-medium mb-6 max-w-xl">
            {about?.body}
          </p>
          <Link
            to={about?.ctaHref || "/about"}
            className="inline-block bg-ink text-cream font-display text-base sm:text-lg px-5 sm:px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            {about?.ctaLabel}
          </Link>
        </div>

        <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-visible pointer-events-none">
          {/* Mobile cat (smaller range) */}
          <motion.img
            src={imgUrl(catDancer)}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            style={{ x: xMobile, y: bob, rotate: rot }}
            className="md:hidden absolute top-0 mt-2 left-0 w-3/4 max-w-[220px] pointer-events-none drop-shadow-[6px_6px_0_hsl(var(--ink))]"
          />
          {/* Desktop cat (wider range, larger) */}
          <motion.img
            src={imgUrl(catDancer)}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            style={{ x: xDesktop, y: bob, rotate: rot }}
            className="hidden md:block absolute top-0 mt-2 left-0 w-2/3 max-w-sm pointer-events-none drop-shadow-[6px_6px_0_hsl(var(--ink))]"
          />
        </div>
      </div>
    </section>
  );
};

export default About;

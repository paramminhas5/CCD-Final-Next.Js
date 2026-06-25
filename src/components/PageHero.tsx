import { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  bg?: string;
  textColor?: string;
  eyebrowColor?: string;
  children?: ReactNode;
  shadow?: boolean;
  shadowColor?: string;
};

const PageHero = ({
  eyebrow,
  title,
  bg = "bg-electric-blue",
  textColor = "text-cream",
  eyebrowColor = "text-acid-yellow",
  children,
  shadow = true,
  shadowColor = "hsl(var(--ink))",
}: Props) => (
  <section className={`relative ${bg} border-b-4 border-ink pt-32 md:pt-40 pb-16 md:pb-24 overflow-x-clip`}>
    <div className="container">
      <p className={`font-display ${eyebrowColor} text-2xl md:text-3xl mb-4`}>/ {eyebrow}</p>
      <h1
        className={`font-display ${textColor} text-[2.5rem] sm:text-6xl md:text-8xl leading-[0.9] max-w-5xl break-words hyphens-auto pr-4`}
        style={shadow ? { filter: `drop-shadow(5px 5px 0 ${shadowColor})` } : undefined}
      >
        {title}
      </h1>
      {children && <div className="mt-8">{children}</div>}
    </div>
  </section>
);

export default PageHero;

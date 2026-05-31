import { useScroll, useTransform, MotionValue } from "framer-motion";
import { RefObject } from "react";

export const useParallax = (
  ref: RefObject<HTMLElement>,
  from: number | string,
  to: number | string,
  axis: "y" | "x" | "rotate" | "scale" = "y"
): MotionValue<number | string> => {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return useTransform(scrollYProgress, [0, 1], [from, to]) as MotionValue<number | string>;
};

export const useSectionScroll = (ref: RefObject<HTMLElement>) => {
  return useScroll({ target: ref, offset: ["start end", "end start"] });
};
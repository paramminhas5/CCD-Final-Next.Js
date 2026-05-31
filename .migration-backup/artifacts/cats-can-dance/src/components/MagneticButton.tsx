import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
};

const MagneticButton = ({ children, href, onClick, className, type = "button" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      {href ? (
        <a href={href} className={className}>{children}</a>
      ) : (
        <button type={type} onClick={onClick} className={className}>{children}</button>
      )}
    </motion.div>
  );
  return inner;
};

export default MagneticButton;
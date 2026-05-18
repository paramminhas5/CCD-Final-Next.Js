import { motion } from "framer-motion";
import { ReactNode } from "react";

const SectionReveal = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ y: 20, scale: 0.98 }}
    whileInView={{ y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ type: "spring", stiffness: 200, damping: 22 }}
    className={className}
  >
    {children}
  </motion.div>
);

export default SectionReveal;

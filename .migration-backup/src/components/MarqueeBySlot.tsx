import Marquee from "@/components/Marquee";
import { useMarquees, type MarqueeSlotId } from "@/hooks/useMarquees";

const MarqueeBySlot = ({ id }: { id: MarqueeSlotId }) => {
  const marquees = useMarquees();
  const m = marquees.find((x) => x.id === id);
  if (!m || !m.enabled) return null;
  return <Marquee bg={m.bg} reverse={m.reverse} size={m.size} items={m.items} />;
};

export default MarqueeBySlot;

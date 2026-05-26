const Divider = ({ color = "text-ink", bg = "bg-cream" }: { color?: string; bg?: string }) => (
  <div className={`${bg} ${color} leading-[0]`}>
    <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-8 md:h-10 block">
      <path
        d="M0 0 L60 30 L120 0 L180 30 L240 0 L300 30 L360 0 L420 30 L480 0 L540 30 L600 0 L660 30 L720 0 L780 30 L840 0 L900 30 L960 0 L1020 30 L1080 0 L1140 30 L1200 0 L1260 30 L1320 0 L1380 30 L1440 0 L1440 40 L0 40 Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

export default Divider;
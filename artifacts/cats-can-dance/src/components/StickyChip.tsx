const StickyChip = ({ label, color = "bg-acid-yellow" }: { label: string; color?: string }) => (
  <div className="hidden lg:block sticky top-24 z-20 -ml-4 mb-6 w-max">
    <span className={`${color} text-ink font-display text-sm px-3 py-1 border-4 border-ink chunk-shadow rotate-[-4deg] inline-block`}>
      {label}
    </span>
  </div>
);

export default StickyChip;
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { THEME_PRESETS } from "@/lib/theme";

const ThemeSwitcher = () => {
  const { config, setPreset, clearOverride, hasLocalOverride, presetIds } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="fixed bottom-2 left-2 z-[60] pointer-events-none"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
    >
      {open && (
        <div className="mb-2 bg-cream border border-ink/40 shadow-lg p-1.5 flex flex-col gap-0.5 min-w-[140px] pointer-events-auto">
          {presetIds.map((id) => {
            const p = THEME_PRESETS[id];
            const active = config.preset === id;
            return (
              <button
                key={id}
                onClick={() => { setPreset(id); setOpen(false); }}
                className={`text-left px-2 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                  active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-ink/5"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block w-3 h-3 border border-ink/40"
                  style={{ background: `hsl(${p.tokens.brand})` }}
                />
                {p.label}
              </button>
            );
          })}
          {hasLocalOverride && (
            <button
              onClick={() => { clearOverride(); setOpen(false); }}
              className="text-left px-2 py-1 text-[10px] text-ink/50 hover:text-ink border-t border-ink/10 mt-1 pt-1.5"
            >
              reset to site theme
            </button>
          )}
          <p className="px-2 pt-1 text-[9px] text-ink/40 leading-tight">⇧ T to cycle</p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme"
        title=""
        className="block w-2.5 h-2.5 rounded-full bg-ink/30 hover:bg-ink/90 pointer-events-auto"
      />
    </div>
  );
};

export default ThemeSwitcher;
